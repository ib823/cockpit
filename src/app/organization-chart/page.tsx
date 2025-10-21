/**
 * Simple Organization Chart - Resource Edition
 *
 * Jobs/Ive Design Philosophy:
 * "Simplicity is the ultimate sophistication"
 * "Design is not just what it looks like and feels like. Design is how it works."
 *
 * Features:
 * - 4-level hierarchy mapped to resource categories (Executive → Governance → Delivery → Support)
 * - Assign existing project resources to org positions
 * - See task/phase assignments for each person
 * - View by: Overall Project, Phase, Task
 * - Export to PNG/PDF
 */

'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { AppShell } from '@/ui/layout/AppShell';
import { getMenuItems, getBreadcrumbItems } from '@/config/menu';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { Button, Input, Select, Tooltip, App, Modal, Dropdown, Tag, Badge, ColorPicker } from 'antd';
import {
  LeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  SaveOutlined,
  TeamOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  UserOutlined,
  CloseOutlined,
  FundViewOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Resource } from '@/types/gantt-tool';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  closestCorners,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// Types
interface OrgPosition {
  id: string;
  resourceId?: string; // Reference to project resource
}

interface OrgGroup {
  id: string;
  name: string;
  positions: OrgPosition[];
  leadPositionId?: string; // ID of the position that leads this group
  isCounterpart?: boolean; // Flag to mark client/counterpart teams
  counterpartCount?: number; // Manual count for counterpart teams (no actual resource assignment)
  counterpartColor?: string; // Brand color for counterpart teams (hex color)
}

interface OrgLevel {
  id: string;
  name: string;
  groups: OrgGroup[];
}

interface SimpleOrgChart {
  levels: OrgLevel[];
}

type ViewMode = 'overall' | 'by-phase' | 'by-task';

export default function OrganizationChartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { message, modal } = App.useApp();
  const { currentProject } = useGanttToolStoreV2();

  const userRole = session?.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const menuItems = getMenuItems(userRole);
  const breadcrumbItems = getBreadcrumbItems('/organization-chart');

  const user = session?.user
    ? {
        name: session.user.name || session.user.email || 'User',
        email: session.user.email || '',
        role: session.user.role || 'USER',
      }
    : undefined;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('overall');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true); // Track initial load to prevent saving default state

  // Drag and Drop State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<{ levelId: string; groupId: string; positionId: string; resourceId: string } | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    })
  );

  /**
   * Default Organization Chart Structure
   *
   * Mapping Resource Categories to Org Chart Levels:
   *
   * Level 1 - Executive Oversight
   *   └── Leadership 🎯 (Strategic sponsors, C-suite, steering committee)
   *
   * Level 2 - Project Leadership & Governance
   *   ├── Project Management 📊 (Project Directors, Program Managers, PMO)
   *   └── Change Management 🔄 (Change Leads, Organizational change oversight)
   *
   * Level 3 - Core Delivery Teams
   *   ├── Functional 📘 (Business Process Experts, Functional Consultants)
   *   ├── Technical 🔧 (Solution Architects, Developers, Technical Leads)
   *   └── Quality Assurance ✅ (QA Managers, Test Leads, Testing Teams)
   *
   * Level 4 - Specialized Support & Infrastructure
   *   ├── Basis/Infrastructure 🏗️ (Basis Consultants, Infrastructure Team)
   *   ├── Security & Authorization 🔒 (Security Specialists, Authorization Consultants)
   *   └── Other/General 👤 (Support staff, Subcontractors, Administrative roles)
   */
  const [orgChart, setOrgChart] = useState<SimpleOrgChart>({
    levels: [
      {
        id: '1',
        name: 'Level 1 - Executive Oversight',
        groups: [
          {
            id: '1-1',
            name: 'Leadership',
            positions: [],
          },
          {
            id: '1-counterpart',
            name: 'Client Executive Sponsor',
            positions: [],
            isCounterpart: true,
            counterpartCount: 0,
          },
        ],
      },
      {
        id: '2',
        name: 'Level 2 - Project Leadership & Governance',
        groups: [
          {
            id: '2-1',
            name: 'Project Management',
            positions: [],
          },
          {
            id: '2-2',
            name: 'Change Management',
            positions: [],
          },
          {
            id: '2-counterpart',
            name: 'Client Project Management',
            positions: [],
            isCounterpart: true,
            counterpartCount: 0,
          },
        ],
      },
      {
        id: '3',
        name: 'Level 3 - Core Delivery Teams',
        groups: [
          {
            id: '3-1',
            name: 'Functional',
            positions: [],
          },
          {
            id: '3-2',
            name: 'Technical',
            positions: [],
          },
          {
            id: '3-3',
            name: 'Quality Assurance',
            positions: [],
          },
          {
            id: '3-counterpart',
            name: 'Client Business Team',
            positions: [],
            isCounterpart: true,
            counterpartCount: 0,
          },
        ],
      },
      {
        id: '4',
        name: 'Level 4 - Specialized Support & Infrastructure',
        groups: [
          {
            id: '4-1',
            name: 'Basis/Infrastructure',
            positions: [],
          },
          {
            id: '4-2',
            name: 'Security & Authorization',
            positions: [],
          },
          {
            id: '4-3',
            name: 'Other/General',
            positions: [],
          },
          {
            id: '4-counterpart',
            name: 'Client IT Support',
            positions: [],
            isCounterpart: true,
            counterpartCount: 0,
          },
        ],
      },
    ],
  });

  // Migration: Add default counterpart groups if they don't exist
  const migrateOrgChart = useCallback((chart: SimpleOrgChart): SimpleOrgChart => {
    const counterpartDefaults: Record<string, { name: string; id: string }> = {
      '1': { id: '1-counterpart', name: 'Client Executive Sponsor' },
      '2': { id: '2-counterpart', name: 'Client Project Management' },
      '3': { id: '3-counterpart', name: 'Client Business Team' },
      '4': { id: '4-counterpart', name: 'Client IT Support' },
    };

    return {
      ...chart,
      levels: chart.levels.map(level => {
        const counterpartDef = counterpartDefaults[level.id];
        if (!counterpartDef) return level;

        // Check if counterpart group already exists
        const hasCounterpart = level.groups.some(g => g.id === counterpartDef.id);
        if (hasCounterpart) return level;

        // Add default counterpart group
        return {
          ...level,
          groups: [
            ...level.groups,
            {
              id: counterpartDef.id,
              name: counterpartDef.name,
              positions: [],
              isCounterpart: true,
              counterpartCount: 0,
            },
          ],
        };
      }),
    };
  }, []);

  // Load org chart from project on mount
  useEffect(() => {
    if (currentProject?.orgChart) {
      try {
        const originalOrgChart = JSON.parse(JSON.stringify(currentProject.orgChart));
        // Migrate to add counterpart groups if missing
        const migratedOrgChart = migrateOrgChart(originalOrgChart);
        setOrgChart(migratedOrgChart);
        console.log('[OrgChart] Loaded saved org chart from database');

        // If migration added new groups, trigger a save after initial load completes
        if (JSON.stringify(originalOrgChart) !== JSON.stringify(migratedOrgChart)) {
          console.log('[OrgChart] Migration added counterpart groups, will auto-save...');
          // Save will happen via auto-save effect after initial load delay
        }
      } catch (error) {
        console.error('[OrgChart] Failed to load org chart:', error);
      }
    }
    // Mark initial load as complete after a short delay
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 500);
  }, [currentProject?.id, migrateOrgChart]); // Only reload when project changes

  // Manual save function
  const saveOrgChart = useCallback(async () => {
    if (!currentProject) {
      message.error('No project loaded');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[OrgChart] Saving org chart to database...');
      const response = await fetch(`/api/gantt-tool/projects/${currentProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgChart: orgChart,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save org chart');
      }

      const data = await response.json();
      console.log('[OrgChart] ✅ Org chart saved successfully');
      setLastSaved(new Date());
      message.success('Organization chart saved');
    } catch (error) {
      console.error('[OrgChart] ❌ Failed to save org chart:', error);
      message.error(error instanceof Error ? error.message : 'Failed to save organization chart');
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, orgChart, message]);

  // Auto-save org chart to database when it changes (debounced)
  useEffect(() => {
    if (!currentProject) return;

    // Skip auto-save during initial load
    if (isInitialLoad.current) {
      console.log('[OrgChart] Skipping auto-save (initial load)');
      return;
    }

    const saveTimer = setTimeout(() => {
      console.log('[OrgChart] Auto-save triggered...');
      saveOrgChart();
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(saveTimer);
  }, [orgChart, currentProject?.id, saveOrgChart]);

  // Modals
  const [editingLevel, setEditingLevel] = useState<OrgLevel | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ level: OrgLevel; group: OrgGroup } | null>(null);
  const [selectingResource, setSelectingResource] = useState<{ levelId: string; groupId: string; positionId?: string } | null>(null);

  // Mapping from groupId to resource category
  const groupToCategoryMap: Record<string, string> = {
    '1-1': 'leadership',      // Leadership
    '2-1': 'pm',              // Project Management
    '2-2': 'change',          // Change Management
    '3-1': 'functional',      // Functional
    '3-2': 'technical',       // Technical
    '3-3': 'qa',              // Quality Assurance
    '4-1': 'basis',           // Basis/Infrastructure
    '4-2': 'security',        // Security & Authorization
    '4-3': 'other',           // Other/General
  };

  // Get available resources not yet assigned in org chart
  const assignedResourceIds = useMemo(() => {
    const ids = new Set<string>();
    orgChart.levels.forEach(level => {
      level.groups.forEach(group => {
        group.positions.forEach(pos => {
          if (pos.resourceId) ids.add(pos.resourceId);
        });
      });
    });
    return ids;
  }, [orgChart]);

  const availableResources = useMemo(() => {
    if (!currentProject) return [];
    return currentProject.resources.filter(r => !assignedResourceIds.has(r.id));
  }, [currentProject, assignedResourceIds]);

  // Get filtered resources for a specific group (by category)
  const getFilteredResourcesForGroup = useCallback((groupId: string) => {
    const expectedCategory = groupToCategoryMap[groupId];
    if (!expectedCategory) {
      // If no mapping found, show all available resources (fallback)
      return availableResources;
    }
    return availableResources.filter(r => r.category === expectedCategory);
  }, [availableResources]);

  // Get resource assignments info
  const getResourceInfo = useCallback((resourceId: string) => {
    if (!currentProject) return null;
    const resource = currentProject.resources.find(r => r.id === resourceId);
    if (!resource) return null;

    // Get phases and tasks
    const phases: string[] = [];
    const tasks: string[] = [];

    currentProject.phases.forEach(phase => {
      // Check phase assignments
      if (phase.phaseResourceAssignments?.some(a => a.resourceId === resourceId)) {
        phases.push(phase.name);
      }

      // Check task assignments
      phase.tasks.forEach(task => {
        if (task.resourceAssignments?.some(a => a.resourceId === resourceId)) {
          tasks.push(task.name);
        }
      });
    });

    return { resource, phases, tasks };
  }, [currentProject]);

  // Level operations
  const addLevel = useCallback(() => {
    const newLevel: OrgLevel = {
      id: Date.now().toString(),
      name: 'New Level',
      groups: [
        {
          id: `${Date.now()}-1`,
          name: 'New Group',
          positions: [],
        },
      ],
    };
    setOrgChart(prev => ({
      levels: [...prev.levels, newLevel],
    }));
    message.success('Level added');
  }, [message]);

  const updateLevelName = useCallback((levelId: string, newName: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId ? { ...level, name: newName } : level
      ),
    }));
    setEditingLevel(null);
    message.success('Level updated');
  }, [message]);

  const deleteLevel = useCallback((levelId: string) => {
    modal.confirm({
      title: 'Delete Level?',
      content: 'This will delete all groups and positions in this level.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setOrgChart(prev => ({
          levels: prev.levels.filter(level => level.id !== levelId),
        }));
        message.success('Level deleted');
      },
    });
  }, [message, modal]);

  const moveLevelUp = useCallback((levelId: string) => {
    setOrgChart(prev => {
      const index = prev.levels.findIndex(l => l.id === levelId);
      if (index <= 0) return prev;
      const newLevels = [...prev.levels];
      [newLevels[index - 1], newLevels[index]] = [newLevels[index], newLevels[index - 1]];
      return { levels: newLevels };
    });
  }, []);

  const moveLevelDown = useCallback((levelId: string) => {
    setOrgChart(prev => {
      const index = prev.levels.findIndex(l => l.id === levelId);
      if (index < 0 || index >= prev.levels.length - 1) return prev;
      const newLevels = [...prev.levels];
      [newLevels[index], newLevels[index + 1]] = [newLevels[index + 1], newLevels[index]];
      return { levels: newLevels };
    });
  }, []);

  // Group operations
  const addGroup = useCallback((levelId: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: [
                ...level.groups,
                {
                  id: `${Date.now()}`,
                  name: 'New Group',
                  positions: [],
                },
              ],
            }
          : level
      ),
    }));
    message.success('Group added');
  }, [message]);

  const updateGroup = useCallback((levelId: string, groupId: string, newName: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId ? { ...group, name: newName } : group
              ),
            }
          : level
      ),
    }));
    setEditingGroup(null);
    message.success('Group updated');
  }, [message]);

  const toggleCounterpart = useCallback((levelId: string, groupId: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? { ...group, isCounterpart: !group.isCounterpart }
                  : group
              ),
            }
          : level
      ),
    }));
    message.success('Group updated');
  }, [message]);

  const setGroupLead = useCallback((levelId: string, groupId: string, positionId: string | null) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? { ...group, leadPositionId: positionId || undefined }
                  : group
              ),
            }
          : level
      ),
    }));
    message.success(positionId ? 'Group lead set' : 'Group lead removed');
  }, [message]);

  const updateCounterpartCount = useCallback((levelId: string, groupId: string, count: number) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? { ...group, counterpartCount: Math.max(0, count) }
                  : group
              ),
            }
          : level
      ),
    }));
  }, []);

  const updateCounterpartColor = useCallback((levelId: string, groupId: string, color: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? { ...group, counterpartColor: color }
                  : group
              ),
            }
          : level
      ),
    }));
    message.success('Brand color updated');
  }, [message]);

  const deleteGroup = useCallback((levelId: string, groupId: string) => {
    modal.confirm({
      title: 'Delete Group?',
      content: 'This will remove all positions in this group.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setOrgChart(prev => ({
          levels: prev.levels.map(level =>
            level.id === levelId
              ? {
                  ...level,
                  groups: level.groups.filter(group => group.id !== groupId),
                }
              : level
          ),
        }));
        message.success('Group deleted');
      },
    });
  }, [message, modal]);

  // Position/Resource operations
  const addPosition = useCallback((e: React.MouseEvent, levelId: string, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectingResource({ levelId, groupId });
  }, []);

  const assignResourceToPosition = useCallback((levelId: string, groupId: string, resourceId: string, positionId?: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? {
                      ...group,
                      positions: positionId
                        ? group.positions.map(p => (p.id === positionId ? { ...p, resourceId } : p))
                        : [...group.positions, { id: Date.now().toString(), resourceId }],
                    }
                  : group
              ),
            }
          : level
      ),
    }));
    setSelectingResource(null);
    message.success('Resource assigned');
  }, [message]);

  const removePosition = useCallback((e: React.MouseEvent, levelId: string, groupId: string, positionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? {
                      ...group,
                      positions: group.positions.filter(p => p.id !== positionId),
                    }
                  : group
              ),
            }
          : level
      ),
    }));
    message.success('Position removed');
  }, [message]);

  // Drag and Drop Handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current as { levelId: string; groupId: string; positionId: string; resourceId: string };
    setActiveId(active.id as string);
    setActiveDragItem(dragData);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveDragItem(null);
      return;
    }

    // Get drag data - use the state we stored on drag start as fallback
    const dragData = (active.data.current || activeDragItem) as { levelId: string; groupId: string; positionId: string; resourceId: string } | null;
    const dropData = over.data.current as { levelId: string; groupId: string } | undefined;

    // Clear drag state
    setActiveId(null);
    setActiveDragItem(null);

    if (!dragData || !dropData) {
      console.warn('Missing drag or drop data', { dragData, dropData });
      return;
    }

    console.log('🔍 Drag end debug:', {
      dragLevelId: dragData.levelId,
      dragLevelIdType: typeof dragData.levelId,
      dropLevelId: dropData.levelId,
      dropLevelIdType: typeof dropData.levelId,
      dragGroupId: dragData.groupId,
      dropGroupId: dropData.groupId,
      stringMatch: String(dragData.levelId) === String(dropData.levelId),
      directMatch: dragData.levelId === dropData.levelId,
      dragDataFull: dragData,
      dropDataFull: dropData,
    });

    // Validate: can only drop within the same level
    if (String(dragData.levelId) !== String(dropData.levelId)) {
      message.warning('Resources can only be moved within the same level');
      return;
    }

    // If dropped on the same group, do nothing
    if (dragData.groupId === dropData.groupId) {
      return;
    }

    // Move the resource from one group to another within the same level
    setOrgChart(prev => ({
      levels: prev.levels.map(level => {
        if (level.id !== dragData.levelId) return level;

        return {
          ...level,
          groups: level.groups.map(group => {
            // Remove from source group
            if (group.id === dragData.groupId) {
              return {
                ...group,
                positions: group.positions.filter(p => p.id !== dragData.positionId),
              };
            }
            // Add to target group
            if (group.id === dropData.groupId) {
              return {
                ...group,
                positions: [...group.positions, {
                  id: Date.now().toString(),
                  resourceId: dragData.resourceId,
                }],
              };
            }
            return group;
          }),
        };
      }),
    }));

    message.success('Resource moved successfully');
  }, [message, activeDragItem]);

  // Filter positions based on view mode
  const shouldShowPosition = useCallback((position: OrgPosition) => {
    if (!currentProject || !position.resourceId) return true;

    // Overall view - show all
    if (viewMode === 'overall') return true;

    const resource = currentProject.resources.find(r => r.id === position.resourceId);
    if (!resource) return false;

    // By phase
    if (viewMode === 'by-phase' && selectedPhaseId) {
      const phase = currentProject.phases.find(p => p.id === selectedPhaseId);
      if (!phase) return false;

      const hasPhaseAssignment = phase.phaseResourceAssignments?.some(
        a => a.resourceId === resource.id
      );
      const hasTaskAssignment = phase.tasks.some(task =>
        task.resourceAssignments?.some(a => a.resourceId === resource.id)
      );

      return hasPhaseAssignment || hasTaskAssignment;
    }

    // By task
    if (viewMode === 'by-task' && selectedPhaseId && selectedTaskId) {
      const phase = currentProject.phases.find(p => p.id === selectedPhaseId);
      const task = phase?.tasks.find(t => t.id === selectedTaskId);
      if (!task) return false;

      return task.resourceAssignments?.some(a => a.resourceId === resource.id) || false;
    }

    return true;
  }, [currentProject, viewMode, selectedPhaseId, selectedTaskId]);

  // Export functions
  const exportToPNG = useCallback(async () => {
    if (!chartRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#f9fafb',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${currentProject?.name || 'org-chart'}-organization-chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      message.success('Exported to PNG');
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [currentProject, message]);

  const exportToPDF = useCallback(async () => {
    if (!chartRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#f9fafb',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 10;

      pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, Math.min(imgHeight, pageHeight - 20));
      pdf.save(`${currentProject?.name || 'org-chart'}-organization-chart.pdf`);

      message.success('Exported to PDF');
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [currentProject, message]);

  // Auto-populate resources based on their categories
  const autoPopulateResources = useCallback(() => {
    if (!currentProject || !currentProject.resources || currentProject.resources.length === 0) {
      message.warning('No resources available to assign');
      return;
    }

    // Category to group mapping based on our organizational structure
    const categoryToGroupMap: Record<string, { levelId: string; groupId: string; groupName: string }> = {
      leadership: { levelId: '1', groupId: '1-1', groupName: 'Leadership' },
      pm: { levelId: '2', groupId: '2-1', groupName: 'Project Management' },
      change: { levelId: '2', groupId: '2-2', groupName: 'Change Management' },
      functional: { levelId: '3', groupId: '3-1', groupName: 'Functional' },
      technical: { levelId: '3', groupId: '3-2', groupName: 'Technical' },
      qa: { levelId: '3', groupId: '3-3', groupName: 'Quality Assurance' },
      basis: { levelId: '4', groupId: '4-1', groupName: 'Basis/Infrastructure' },
      security: { levelId: '4', groupId: '4-2', groupName: 'Security & Authorization' },
      other: { levelId: '4', groupId: '4-3', groupName: 'Other/General' },
    };

    modal.confirm({
      title: 'Auto-Populate Organization Chart?',
      content: 'This will automatically assign all project resources to appropriate levels based on their categories. Existing assignments will be preserved.',
      okText: 'Auto-Populate',
      onOk: () => {
        let assignedCount = 0;

        setOrgChart(prev => {
          // Deep clone the entire structure to avoid mutations
          const newLevels = prev.levels.map(level => ({
            ...level,
            groups: level.groups.map(group => ({
              ...group,
              positions: [...group.positions], // Clone positions array
            })),
          }));

          // Assign each resource to the appropriate group
          currentProject.resources.forEach(resource => {
            // Skip if already assigned
            const isAssigned = newLevels.some(level =>
              level.groups.some(group =>
                group.positions.some(pos => pos.resourceId === resource.id)
              )
            );

            if (isAssigned) return;

            // Find the target group based on resource category
            const mapping = categoryToGroupMap[resource.category];
            if (!mapping) {
              console.warn(`No mapping found for category: ${resource.category}, resource: ${resource.name}`);
              return;
            }

            // Find the level and group
            const levelIndex = newLevels.findIndex(l => l.id === mapping.levelId);
            if (levelIndex === -1) {
              console.warn(`Level not found: ${mapping.levelId}`);
              return;
            }

            const groupIndex = newLevels[levelIndex].groups.findIndex(g => g.id === mapping.groupId);
            if (groupIndex === -1) {
              console.warn(`Group not found: ${mapping.groupId}`);
              return;
            }

            // Add position to the group
            newLevels[levelIndex].groups[groupIndex].positions.push({
              id: `auto-${Date.now()}-${assignedCount}-${resource.id}`,
              resourceId: resource.id,
            });

            assignedCount++;
          });

          return { levels: newLevels };
        });

        // Show message AFTER state update (outside of setState)
        setTimeout(() => {
          if (assignedCount > 0) {
            message.success(`Successfully assigned ${assignedCount} resource(s) to the organization chart`);
          } else {
            message.info('All resources are already assigned');
          }
        }, 100);
      },
    });
  }, [currentProject, message, modal]);

  // Draggable Resource Card Component
  const DraggableResourceCard = ({ position, level, group }: { position: OrgPosition; level: OrgLevel; group: OrgGroup }) => {
    const info = position.resourceId ? getResourceInfo(position.resourceId) : null;
    const dragId = `drag-${level.id}-${group.id}-${position.id}`;
    const isLead = group.leadPositionId === position.id;

    const dragData = {
      levelId: level.id,
      groupId: group.id,
      positionId: position.id,
      resourceId: position.resourceId,
    };

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: dragId,
      data: dragData,
    });

    // Debug: Log what data this draggable has
    if (isDragging) {
      console.log('Dragging from:', dragData);
    }

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'grab',
    } : { cursor: 'grab' };

    const handleToggleLead = (e: React.MouseEvent) => {
      e.stopPropagation();
      setGroupLead(level.id, group.id, isLead ? null : position.id);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all duration-150 relative ${
          isLead ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-white' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        {isLead && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1">
            <CrownOutlined style={{ fontSize: 12 }} />
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium text-gray-900 text-sm truncate">
                {info?.resource.name || 'Unknown'}
              </div>
              {isLead && (
                <Tag color="gold" className="text-xs !text-[9px] !py-0 !leading-tight">
                  LEAD
                </Tag>
              )}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              {info?.resource.category || 'No category'}
            </div>

            {info && info.phases.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {info.phases.slice(0, 2).map((phase, idx) => (
                  <Tag key={idx} color="blue" className="text-xs !text-[10px] !py-0">
                    {phase}
                  </Tag>
                ))}
                {info.phases.length > 2 && (
                  <Tag className="text-xs !text-[10px] !py-0">
                    +{info.phases.length - 2}
                  </Tag>
                )}
              </div>
            )}

            {info && info.tasks.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {info.tasks.length} task{info.tasks.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 ml-2">
            <Tooltip title={isLead ? 'Remove as lead' : 'Set as lead'}>
              <Button
                type={isLead ? 'primary' : 'default'}
                icon={<CrownOutlined />}
                size="small"
                onClick={handleToggleLead}
                style={isLead ? { backgroundColor: '#f59e0b', borderColor: '#f59e0b' } : {}}
              />
            </Tooltip>
            <Button
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={(e) => removePosition(e, level.id, group.id, position.id)}
            />
          </div>
        </div>
      </div>
    );
  };

  // Droppable Group Component
  const DroppableGroupContainer = ({ level, group, children }: { level: OrgLevel; group: OrgGroup; children: React.ReactNode }) => {
    const dropId = `drop-${level.id}-${group.id}`;

    const dropData = {
      levelId: level.id,
      groupId: group.id,
    };

    const { setNodeRef, isOver } = useDroppable({
      id: dropId,
      data: dropData,
    });

    // Check if this is a valid drop target
    const isValidDropTarget = activeDragItem && activeDragItem.levelId === level.id;
    const isInvalidDropTarget = activeDragItem && activeDragItem.levelId !== level.id;

    // Debug: Log when hovering over this droppable
    if (isOver) {
      console.log(`🎯 Hovering over "${group.name}" - Level: ${level.id} | Group: ${group.id} | Valid: ${isValidDropTarget} | isOver: ${isOver}`);
    }

    // Debug: Log when this component renders during drag
    if (activeId && group.name === 'Finance') {
      console.log(`💰 Finance group state: isOver=${isOver}, isValidDropTarget=${isValidDropTarget}, activeDragItem=`, activeDragItem);
    }

    // Determine background style based on counterpart color
    const bgStyle = group.isCounterpart && group.counterpartColor
      ? {
          background: `linear-gradient(to bottom right, ${group.counterpartColor}10, ${group.counterpartColor}05, #f9fafb80)`,
        }
      : {};

    return (
      <div className={`transition-all duration-200 w-96 flex-shrink-0`}>
        <div
          ref={setNodeRef}
          style={bgStyle}
          className={`${!group.isCounterpart ? 'bg-gradient-to-br from-blue-50/30 via-white to-gray-50/50' : ''} rounded-xl border-2 p-5 min-h-[220px] flex flex-col relative ${
            isOver && isValidDropTarget
              ? 'border-green-500 bg-green-50 shadow-xl ring-4 ring-green-200'
              : isOver && isInvalidDropTarget
              ? 'border-red-500 bg-red-50 shadow-xl ring-4 ring-red-200'
              : isValidDropTarget && activeId
              ? 'border-blue-500 hover:border-blue-600 shadow-md'
              : 'border-gray-300 hover:border-blue-400 hover:shadow-lg'
          }`}
        >
          {/* Hover Indicator */}
          {isOver && (
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50 whitespace-nowrap ${
              isValidDropTarget
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {isValidDropTarget ? '✓ DROP HERE' : '✗ WRONG LEVEL'}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  };

  if (!currentProject) {
    return (
      <AppShell
        user={user}
        menuItems={menuItems}
        breadcrumbItems={breadcrumbItems}
        onLogout={() => signOut({ callbackUrl: '/login' })}
      >
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <TeamOutlined style={{ fontSize: 64, color: '#d1d5db', marginBottom: 16 }} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
            <p className="text-gray-600 mb-4">Please select or create a project first.</p>
            <Button type="primary" size="large" onClick={() => router.push('/gantt-tool')}>
              Go to Gantt Tool
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      menuItems={menuItems}
      breadcrumbItems={breadcrumbItems}
      onLogout={() => signOut({ callbackUrl: '/login' })}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col">
          {/* Header - Jobs/Ive: "Beautiful simplicity" */}
          <div className="bg-white border-b border-gray-200 px-6 py-4" style={{ marginLeft: '-24px', marginRight: '-24px', marginTop: '-24px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => router.push('/gantt-tool')}
                size="large"
              />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Organization Chart</h1>
                <p className="text-sm text-gray-600">{currentProject.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Overview/Presentation Button */}
              <Button
                type="default"
                icon={<FundViewOutlined />}
                onClick={() => router.push('/organization-chart/overview')}
                size="large"
              >
                Presentation View
              </Button>
            {/* Save Status */}
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}

            {/* Manual Save Button */}
            <Button
              type="primary"
              icon={isSaving ? null : <SaveOutlined />}
              onClick={saveOrgChart}
              loading={isSaving}
              size="large"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            {/* Available Resources Badge */}
            <Badge count={availableResources.length} showZero style={{ backgroundColor: '#52c41a' }}>
              <Button type="dashed" icon={<UserOutlined />} size="large">
                Available Resources
              </Button>
            </Badge>

            {/* Auto-Populate Button */}
            <Button
              type="default"
              icon={<TeamOutlined />}
              onClick={autoPopulateResources}
              size="large"
              disabled={!currentProject.resources || currentProject.resources.length === 0}
            >
              Auto-Populate
            </Button>

            {/* View Mode Selector */}
            <Select
              value={viewMode}
              onChange={setViewMode}
              size="large"
              style={{ width: 180 }}
              options={[
                { value: 'overall', label: '🏢 Overall Project' },
                { value: 'by-phase', label: '📊 By Phase' },
                { value: 'by-task', label: '✓ By Task' },
              ]}
            />

            {/* Phase/Task Selector */}
            {viewMode === 'by-phase' && (
              <Select
                placeholder="Select phase"
                value={selectedPhaseId}
                onChange={setSelectedPhaseId}
                size="large"
                style={{ width: 200 }}
                options={currentProject.phases.map(phase => ({
                  value: phase.id,
                  label: phase.name,
                }))}
              />
            )}

            {viewMode === 'by-task' && selectedPhaseId && (
              <Select
                placeholder="Select task"
                value={selectedTaskId}
                onChange={setSelectedTaskId}
                size="large"
                style={{ width: 200 }}
                options={
                  currentProject.phases
                    .find(p => p.id === selectedPhaseId)
                    ?.tasks.map(task => ({
                      value: task.id,
                      label: task.name,
                    })) || []
                }
              />
            )}

            {/* Add Level */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addLevel}
              size="large"
              className="always-visible"
            >
              Add Level
            </Button>

            {/* Export */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'png',
                    label: 'Export as PNG',
                    icon: <FileImageOutlined />,
                    onClick: exportToPNG,
                  },
                  {
                    key: 'pdf',
                    label: 'Export as PDF',
                    icon: <FilePdfOutlined />,
                    onClick: exportToPDF,
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button
                icon={<DownloadOutlined />}
                size="large"
                loading={isExporting}
                className="always-visible"
              >
                Export
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Instruction Banner - Jobs/Ive: "Make it obvious" */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-blue-900">
          <EyeOutlined />
          <p>
            <strong>Assign resources from your project:</strong> Click "+ Assign Resource" to add team members from available resources.
            {viewMode === 'by-phase' && selectedPhaseId && (
              <span className="ml-2 text-blue-700">
                • Filtered to show only team assigned to selected phase
              </span>
            )}
            {viewMode === 'by-task' && selectedTaskId && (
              <span className="ml-2 text-blue-700">
                • Filtered to show only team assigned to selected task
              </span>
            )}
            {activeId && (
              <span className="ml-2 text-purple-700 font-bold">
                • 🎯 Drag in progress: Blue borders = valid drop zones | Red borders = invalid
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Organization Chart - Jobs/Ive: "Clarity over cleverness" */}
      <div className="flex-1 overflow-auto p-8" ref={chartRef}>
        <div className="max-w-[1600px] mx-auto space-y-12">
          {orgChart.levels.map((level, levelIndex) => (
            <div key={level.id} className="relative">
              {/* Enhanced Connecting Line to Previous Level */}
              {levelIndex > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-200 rounded-full" />
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow">
              {/* Level Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-300">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg">
                    L{levelIndex + 1}
                  </div>
                  {editingLevel?.id === level.id ? (
                    <Input
                      autoFocus
                      defaultValue={level.name}
                      onBlur={(e) => updateLevelName(level.id, e.target.value)}
                      onPressEnter={(e) => updateLevelName(level.id, e.currentTarget.value)}
                      className="font-semibold text-lg"
                      style={{ width: 350 }}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">{level.name}</h2>
                      <Tag color="blue" className="text-sm">{level.groups.length} group{level.groups.length !== 1 ? 's' : ''}</Tag>
                    </div>
                  )}
                  <Button
                    type="default"
                    icon={<EditOutlined />}
                    onClick={() => setEditingLevel(level)}
                    size="small"
                    className="always-visible"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Move Up/Down */}
                  {levelIndex > 0 && (
                    <Tooltip title="Move level up">
                      <Button
                        type="default"
                        icon={<ChevronUp className="w-4 h-4" />}
                        onClick={() => moveLevelUp(level.id)}
                        size="small"
                      />
                    </Tooltip>
                  )}
                  {levelIndex < orgChart.levels.length - 1 && (
                    <Tooltip title="Move level down">
                      <Button
                        type="default"
                        icon={<ChevronDown className="w-4 h-4" />}
                        onClick={() => moveLevelDown(level.id)}
                        size="small"
                      />
                    </Tooltip>
                  )}

                  {/* Add Group */}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => addGroup(level.id)}
                    size="small"
                    className="always-visible"
                  >
                    Add Group
                  </Button>

                  {/* Delete Level */}
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteLevel(level.id)}
                    size="small"
                    className="always-visible"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Groups Grid - Jobs/Ive: "Generous spacing, clear separation" */}
              <div className="flex flex-wrap justify-center gap-6 mt-4">
                {level.groups.map((group) => {
                  const visiblePositions = group.positions.filter(shouldShowPosition);

                  return (
                    <DroppableGroupContainer key={group.id} level={level} group={group}>
                      {/* Group Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-300">
                        {editingGroup?.group.id === group.id ? (
                          <Input
                            autoFocus
                            defaultValue={group.name}
                            onBlur={(e) => updateGroup(level.id, group.id, e.target.value)}
                            onPressEnter={(e) =>
                              updateGroup(level.id, group.id, e.currentTarget.value)
                            }
                            className="font-semibold"
                            size="small"
                          />
                        ) : (
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 text-base">{group.name}</h3>
                              <Badge
                                count={group.isCounterpart ? (group.counterpartCount || 0) : visiblePositions.length}
                                showZero
                                style={{
                                  backgroundColor: group.isCounterpart
                                    ? (group.counterpartCount || 0) > 0 ? '#9333ea' : '#d9d9d9'
                                    : visiblePositions.length > 0 ? '#52c41a' : '#d9d9d9',
                                  fontWeight: 'bold'
                                }}
                              />
                              {group.isCounterpart && (
                                <Tag color="purple" className="text-xs">Counterpart</Tag>
                              )}
                            </div>
                            {/* DEBUG: Show level and group IDs */}
                            <div className="text-xs text-gray-400 font-mono">
                              Level: {level.id} | Group: {group.id}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'counterpart',
                                  label: group.isCounterpart ? 'Mark as Internal Team' : 'Mark as Counterpart',
                                  icon: <TeamOutlined />,
                                  onClick: () => toggleCounterpart(level.id, group.id),
                                },
                                {
                                  type: 'divider',
                                },
                                {
                                  key: 'edit',
                                  label: 'Rename',
                                  icon: <EditOutlined />,
                                  onClick: () => setEditingGroup({ level, group }),
                                },
                                {
                                  key: 'delete',
                                  label: 'Delete',
                                  icon: <DeleteOutlined />,
                                  danger: true,
                                  onClick: () => deleteGroup(level.id, group.id),
                                },
                              ],
                            }}
                          >
                            <Button
                              type="default"
                              size="small"
                              icon={<EditOutlined />}
                            />
                          </Dropdown>
                        </div>
                      </div>

                      {/* Resource Cards - Jobs/Ive: "Every detail matters" */}
                      <div className="space-y-3 flex-1">
                        {visiblePositions.map((position) => (
                          <DraggableResourceCard
                            key={position.id}
                            position={position}
                            level={level}
                            group={group}
                          />
                        ))}

                        {/* Show count when filtered */}
                        {viewMode !== 'overall' && visiblePositions.length < group.positions.length && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            Showing {visiblePositions.length} of {group.positions.length}
                          </div>
                        )}

                        {/* Counterpart: Number Input / Internal: Assign Resource Button */}
                        {group.isCounterpart ? (
                          <div className="mt-auto pt-3 border-t-2 border-purple-200">
                            <div className="text-xs text-purple-700 font-semibold mb-2 text-center uppercase">
                              Client/Counterpart Team Size
                            </div>
                            <Input
                              type="number"
                              min={0}
                              value={group.counterpartCount || 0}
                              onChange={(e) => updateCounterpartCount(level.id, group.id, parseInt(e.target.value) || 0)}
                              size="large"
                              className="text-center font-bold text-lg"
                              style={{ borderColor: '#a855f7', borderWidth: '2px' }}
                              suffix={
                                <span className="text-xs text-gray-500">
                                  {(group.counterpartCount || 0) === 1 ? 'person' : 'people'}
                                </span>
                              }
                            />
                            <div className="text-xs text-gray-500 text-center mt-2">
                              Enter estimated team size
                            </div>

                            {/* Brand Color Picker */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <div className="text-xs text-purple-700 font-semibold mb-2 text-center uppercase">
                                Brand Color
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <ColorPicker
                                  value={group.counterpartColor || '#9333ea'}
                                  onChange={(color) => updateCounterpartColor(level.id, group.id, color.toHexString())}
                                  showText
                                  size="large"
                                />
                              </div>
                              <div className="text-xs text-gray-500 text-center mt-2">
                                Choose client brand color
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            block
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={(e) => addPosition(e, level.id, group.id)}
                            className="!border-2 !border-blue-300 !text-blue-600 hover:!bg-blue-50 hover:!border-blue-400 always-visible mt-auto font-medium"
                            size="large"
                          >
                            Assign Resource
                          </Button>
                        )}
                      </div>
                    </DroppableGroupContainer>
                  );
                })}
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Selection Modal - Jobs/Ive: "Clear choices" */}
      <Modal
        title="Assign Resource"
        open={!!selectingResource}
        onCancel={() => setSelectingResource(null)}
        afterClose={() => {
          // PERMANENT FIX: Force cleanup of modal side effects
          if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
          if (document.body.style.paddingRight) document.body.style.paddingRight = '';
          document.body.style.pointerEvents = '';
          setSelectingResource(null);
        }}
        destroyOnHidden={true}
        footer={null}
        width={600}
      >
        {selectingResource && (() => {
          const filteredResources = getFilteredResourcesForGroup(selectingResource.groupId);
          const selectedGroup = orgChart.levels
            .flatMap(l => l.groups)
            .find(g => g.id === selectingResource.groupId);
          const expectedCategory = groupToCategoryMap[selectingResource.groupId];

          return (
            <div className="space-y-3">
              {/* Show category filter info */}
              {expectedCategory && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>Filtering by category:</strong> {expectedCategory.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Only showing resources that match "{selectedGroup?.name}" group
                  </p>
                </div>
              )}

              {filteredResources.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <p>No {expectedCategory} resources available.</p>
                  <p className="text-sm mt-2">
                    {availableResources.length > 0
                      ? `There are ${availableResources.length} resources in other categories, but none match "${selectedGroup?.name}".`
                      : 'All resources are already assigned.'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Select a resource from your project to assign to this position:
                  </p>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredResources.map((resource) => {
                    const info = getResourceInfo(resource.id);

                    return (
                      <div
                        key={resource.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          assignResourceToPosition(
                            selectingResource.levelId,
                            selectingResource.groupId,
                            resource.id,
                            selectingResource.positionId
                          );
                        }}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">{resource.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{resource.category}</div>

                        {info && info.phases.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {info.phases.map((phase, idx) => (
                              <Tag key={idx} color="blue" className="text-xs">
                                {phase}
                              </Tag>
                            ))}
                          </div>
                        )}

                        {info && info.tasks.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Assigned to {info.tasks.length} task{info.tasks.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </Modal>
        </div>
      </DndContext>
    </AppShell>
  );
}
