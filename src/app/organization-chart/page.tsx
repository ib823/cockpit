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
import dynamic from 'next/dynamic';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { Button, Input, Select, Tooltip, App, Modal, Dropdown, Tag, Badge } from 'antd';
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
  DragOutlined,
} from '@ant-design/icons';
import { ChevronDown, ChevronUp, Settings, Command } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useHotkeys } from 'react-hotkeys-hook';
import type { Resource } from '@/types/gantt-tool';
import { CommandPalette } from '@/components/organization/CommandPalette';

// Dynamically import the org chart wrapper to avoid SSR issues with D3
const ReactOrgChartWrapper = dynamic(
  () => import('@/components/organization/ReactOrgChartWrapper').then((mod) => mod.ReactOrgChartWrapper),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-64">Loading org chart...</div> }
);

// Types
interface OrgPosition {
  id: string;
  resourceId?: string; // Reference to project resource
  isLead?: boolean; // Indicates if this resource is the lead for their group/sub-group
}

interface OrgSubGroup {
  id: string;
  name: string;
  positions: OrgPosition[];
  collapsed?: boolean; // Expand/collapse state
}

interface OrgGroup {
  id: string;
  name: string;
  positions: OrgPosition[]; // Positions at group level (no sub-group)
  subGroups?: OrgSubGroup[]; // Optional sub-groups (e.g., Finance, Sales, SCM under Functional)
  isClient?: boolean; // Indicates if this is a client team (vs internal)
  collapsed?: boolean; // Expand/collapse state
}

interface OrgLevel {
  id: string;
  name: string;
  groups: OrgGroup[];
  isClient?: boolean; // Indicates if this level contains client teams
  collapsed?: boolean; // Expand/collapse state
}

interface SimpleOrgChart {
  levels: OrgLevel[];
}

type ViewMode = 'overall' | 'by-phase' | 'by-task';

// Drag and Drop Types
const ItemTypes = {
  RESOURCE: 'resource',
};

interface DragItem {
  type: string;
  positionId: string;
  resourceId: string;
  sourceLevelId: string;
  sourceGroupId: string;
  sourceSubGroupId?: string;
}

interface DropTarget {
  levelId: string;
  groupId: string;
  subGroupId?: string;
}

// Draggable Resource Component
function DraggableResource({
  position,
  resource,
  levelId,
  groupId,
  subGroupId,
  onRemove,
}: {
  position: OrgPosition;
  resource: Resource | undefined;
  levelId: string;
  groupId: string;
  subGroupId?: string;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.RESOURCE,
    item: {
      type: ItemTypes.RESOURCE,
      positionId: position.id,
      resourceId: position.resourceId,
      sourceLevelId: levelId,
      sourceGroupId: groupId,
      sourceSubGroupId: subGroupId,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [position.id, position.resourceId, levelId, groupId, subGroupId]);

  return (
    <div
      ref={drag as any}
      className={`flex items-center justify-between text-xs px-2 py-1 rounded cursor-move ${
        isDragging ? 'opacity-50 bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      style={{ cursor: 'move' }}
    >
      <div className="flex items-center gap-1">
        <DragOutlined style={{ fontSize: 10, color: '#9ca3af' }} />
        <span className="text-gray-700">{resource?.name || 'Unknown'}</span>
      </div>
      <Button
        size="small"
        type="text"
        danger
        icon={<CloseOutlined style={{ fontSize: 10 }} />}
        onClick={onRemove}
      />
    </div>
  );
}

// Drop Zone Component
function DropZone({
  levelId,
  groupId,
  subGroupId,
  onDrop,
  children,
  className = '',
}: {
  levelId: string;
  groupId: string;
  subGroupId?: string;
  onDrop: (item: DragItem, target: DropTarget) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.RESOURCE,
    drop: (item: DragItem) => {
      // Don't drop if source and target are the same
      if (
        item.sourceLevelId === levelId &&
        item.sourceGroupId === groupId &&
        item.sourceSubGroupId === subGroupId
      ) {
        return;
      }
      onDrop(item, { levelId, groupId, subGroupId });
    },
    canDrop: (item: DragItem) => {
      // Can only drop within the same level
      return item.sourceLevelId === levelId;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [levelId, groupId, subGroupId, onDrop]);

  const dropZoneStyle = canDrop
    ? isOver
      ? 'border-2 border-green-400 bg-green-50'
      : 'border-2 border-blue-300 border-dashed'
    : '';

  return (
    <div ref={drop as any} className={`${className} ${dropZoneStyle}`}>
      {children}
    </div>
  );
}

export default function OrganizationChartPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { currentProject } = useGanttToolStoreV2();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('overall');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [spotlightResourceId, setSpotlightResourceId] = useState<string | null>(null);
  const [collapsedLevels, setCollapsedLevels] = useState<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true); // Track initial load to prevent saving default state

  // Keyboard shortcuts - Command Palette
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setIsCommandPaletteOpen(true);
  }, { enableOnFormTags: true });

  useHotkeys('/', (e) => {
    // Only trigger if not in an input field
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      setIsCommandPaletteOpen(true);
    }
  });

  // Keyboard shortcuts - ESC to exit spotlight
  useHotkeys('esc', () => {
    if (spotlightResourceId) {
      setSpotlightResourceId(null);
    }
  });

  // Keyboard shortcuts - Quick level jumps
  useHotkeys('1,2,3,4', (e) => {
    const level = parseInt(e.key);
    const levelElement = document.querySelector(`[data-level-id="${level}"]`);
    if (levelElement) {
      levelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

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
            subGroups: [
              {
                id: '3-1-sg-1',
                name: 'Finance',
                positions: [],
              },
              {
                id: '3-1-sg-2',
                name: 'Sales',
                positions: [],
              },
              {
                id: '3-1-sg-3',
                name: 'SCM',
                positions: [],
              },
            ],
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
        ],
      },
    ],
  });

  // Load org chart from project on mount
  useEffect(() => {
    // @ts-expect-error - orgChart field may not exist in schema yet
    if (currentProject?.orgChart) {
      try {
        // @ts-expect-error - orgChart field may not exist in schema yet
        const savedOrgChart = JSON.parse(JSON.stringify(currentProject.orgChart));
        setOrgChart(savedOrgChart);
        console.log('[OrgChart] Loaded saved org chart from database');
      } catch (error) {
        console.error('[OrgChart] Failed to load org chart:', error);
      }
    }
    // Mark initial load as complete after a short delay
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 500);
  }, [currentProject?.id]); // Only reload when project changes

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
  const [editingSubGroup, setEditingSubGroup] = useState<{ levelId: string; groupId: string; subGroup: OrgSubGroup } | null>(null);
  const [selectingResource, setSelectingResource] = useState<{ levelId: string; groupId: string; subGroupId?: string; positionId?: string } | null>(null);

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
        // Group-level positions
        group.positions.forEach(pos => {
          if (pos.resourceId) ids.add(pos.resourceId);
        });
        // Sub-group positions
        group.subGroups?.forEach(subGroup => {
          subGroup.positions.forEach(pos => {
            if (pos.resourceId) ids.add(pos.resourceId);
          });
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

  // Sub-Group operations
  const addSubGroup = useCallback((levelId: string, groupId: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? {
                      ...group,
                      subGroups: [
                        ...(group.subGroups || []),
                        {
                          id: `${Date.now()}`,
                          name: 'New Sub-Group',
                          positions: [],
                        },
                      ],
                    }
                  : group
              ),
            }
          : level
      ),
    }));
    message.success('Sub-group added');
  }, [message]);

  const updateSubGroup = useCallback((levelId: string, groupId: string, subGroupId: string, newName: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? {
                      ...group,
                      subGroups: group.subGroups?.map(subGroup =>
                        subGroup.id === subGroupId ? { ...subGroup, name: newName } : subGroup
                      ),
                    }
                  : group
              ),
            }
          : level
      ),
    }));
    setEditingSubGroup(null);
    message.success('Sub-group updated');
  }, [message]);

  const deleteSubGroup = useCallback((levelId: string, groupId: string, subGroupId: string) => {
    modal.confirm({
      title: 'Delete Sub-Group?',
      content: 'This will remove all positions in this sub-group.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setOrgChart(prev => ({
          levels: prev.levels.map(level =>
            level.id === levelId
              ? {
                  ...level,
                  groups: level.groups.map(group =>
                    group.id === groupId
                      ? {
                          ...group,
                          subGroups: group.subGroups?.filter(subGroup => subGroup.id !== subGroupId),
                        }
                      : group
                  ),
                }
              : level
          ),
        }));
        message.success('Sub-group deleted');
      },
    });
  }, [message, modal]);

  // Position/Resource operations
  const addPosition = useCallback((e: React.MouseEvent, levelId: string, groupId: string, subGroupId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectingResource({ levelId, groupId, subGroupId });
  }, []);

  const assignResourceToPosition = useCallback((levelId: string, groupId: string, resourceId: string, subGroupId?: string, positionId?: string) => {
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? subGroupId
                    ? {
                        // Assign to sub-group
                        ...group,
                        subGroups: group.subGroups?.map(subGroup =>
                          subGroup.id === subGroupId
                            ? {
                                ...subGroup,
                                positions: positionId
                                  ? subGroup.positions.map(p => (p.id === positionId ? { ...p, resourceId } : p))
                                  : [...subGroup.positions, { id: Date.now().toString(), resourceId }],
                              }
                            : subGroup
                        ),
                      }
                    : {
                        // Assign to group (no sub-group)
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

  const removePosition = useCallback((e: React.MouseEvent, levelId: string, groupId: string, positionId: string, subGroupId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOrgChart(prev => ({
      levels: prev.levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map(group =>
                group.id === groupId
                  ? subGroupId
                    ? {
                        // Remove from sub-group
                        ...group,
                        subGroups: group.subGroups?.map(subGroup =>
                          subGroup.id === subGroupId
                            ? {
                                ...subGroup,
                                positions: subGroup.positions.filter(p => p.id !== positionId),
                              }
                            : subGroup
                        ),
                      }
                    : {
                        // Remove from group
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

  // Move resource between groups/sub-groups (drag and drop)
  const moveResource = useCallback((dragItem: DragItem, dropTarget: DropTarget) => {
    setOrgChart(prev => {
      const newLevels = JSON.parse(JSON.stringify(prev.levels)); // Deep clone

      // Find the resource to move
      let resourceToMove: OrgPosition | null = null;

      // Remove from source
      newLevels.forEach((level: OrgLevel) => {
        if (level.id === dragItem.sourceLevelId) {
          level.groups.forEach((group: OrgGroup) => {
            if (group.id === dragItem.sourceGroupId) {
              if (dragItem.sourceSubGroupId) {
                // Remove from sub-group
                const subGroup = group.subGroups?.find((sg: OrgSubGroup) => sg.id === dragItem.sourceSubGroupId);
                if (subGroup) {
                  const posIndex = subGroup.positions.findIndex((p: OrgPosition) => p.id === dragItem.positionId);
                  if (posIndex > -1) {
                    resourceToMove = subGroup.positions[posIndex];
                    subGroup.positions.splice(posIndex, 1);
                  }
                }
              } else {
                // Remove from group
                const posIndex = group.positions.findIndex((p: OrgPosition) => p.id === dragItem.positionId);
                if (posIndex > -1) {
                  resourceToMove = group.positions[posIndex];
                  group.positions.splice(posIndex, 1);
                }
              }
            }
          });
        }
      });

      // Add to target
      if (resourceToMove) {
        newLevels.forEach((level: OrgLevel) => {
          if (level.id === dropTarget.levelId) {
            level.groups.forEach((group: OrgGroup) => {
              if (group.id === dropTarget.groupId) {
                if (dropTarget.subGroupId) {
                  // Add to sub-group
                  const subGroup = group.subGroups?.find((sg: OrgSubGroup) => sg.id === dropTarget.subGroupId);
                  if (subGroup) {
                    subGroup.positions.push(resourceToMove!);
                  }
                } else {
                  // Add to group
                  group.positions.push(resourceToMove!);
                }
              }
            });
          }
        });
      }

      return { levels: newLevels };
    });

    message.success('Resource moved successfully');
  }, [message]);

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

  // Command Palette handlers
  const handleSelectResource = useCallback((resourceId: string) => {
    // Enter spotlight mode for this resource
    setSpotlightResourceId(resourceId);

    // Scroll to the resource in the chart
    setTimeout(() => {
      const resourceElement = document.querySelector(`[data-resource-id="${resourceId}"]`);
      if (resourceElement) {
        resourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  const handleSelectPhase = useCallback((phaseId: string) => {
    setViewMode('by-phase');
    setSelectedPhaseId(phaseId);
    setSelectedTaskId(null);
    message.info(`Filtering by phase: ${currentProject?.phases.find(p => p.id === phaseId)?.name}`);
  }, [currentProject, message]);

  const handleSelectTask = useCallback((phaseId: string, taskId: string) => {
    setViewMode('by-task');
    setSelectedPhaseId(phaseId);
    setSelectedTaskId(taskId);
    const phase = currentProject?.phases.find(p => p.id === phaseId);
    const task = phase?.tasks.find(t => t.id === taskId);
    message.info(`Filtering by task: ${task?.name}`);
  }, [currentProject, message]);

  const handleJumpToLevel = useCallback((level: number) => {
    const levelElement = document.querySelector(`[data-level-id="${level}"]`);
    if (levelElement) {
      levelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      message.success(`Jumped to Level ${level}`);
    }
  }, [message]);

  const handleToggleFilters = useCallback(() => {
    setShowManagementPanel(prev => !prev);
  }, []);

  // Smart Collapse handlers
  const toggleLevelCollapse = useCallback((levelId: string) => {
    setCollapsedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(levelId)) {
        newSet.delete(levelId);
      } else {
        newSet.add(levelId);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedLevels(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedLevels(new Set(['1', '2', '3', '4']));
  }, []);

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
            // Skip if already assigned (check both group and sub-group positions)
            const isAssigned = newLevels.some(level =>
              level.groups.some(group =>
                group.positions.some(pos => pos.resourceId === resource.id) ||
                group.subGroups?.some(subGroup =>
                  subGroup.positions.some(pos => pos.resourceId === resource.id)
                )
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

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <TeamOutlined style={{ fontSize: 64, color: '#d1d5db', marginBottom: 16 }} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
          <p className="text-gray-600 mb-4">Please select or create a project first.</p>
          <Button type="primary" size="large" onClick={() => router.push('/gantt-tool')}>
            Go to Gantt Tool
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Clean Header with Grouped Toolbar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          {/* Top Bar - Navigation, Search, Save */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            {/* Left: Navigation */}
            <div className="flex items-center gap-4 min-w-[300px]">
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => router.push('/gantt-tool')}
                size="large"
                className="hover:bg-gray-100"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Organization Chart</h1>
                <p className="text-xs text-gray-500">{currentProject.name}</p>
              </div>
            </div>

            {/* Center: Search (Prominent) */}
            <div className="flex-1 max-w-xl mx-8">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all"
              >
                <Command className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-left">Search people, teams, or phases...</span>
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 rounded">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right: Save Status & Button */}
            <div className="flex items-center gap-3 min-w-[200px] justify-end">
              {lastSaved && (
                <span className="text-xs text-gray-500 hidden lg:block">
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              <Button
                type="primary"
                icon={isSaving ? null : <SaveOutlined />}
                onClick={saveOrgChart}
                loading={isSaving}
                size="large"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Toolbar - Grouped Controls */}
          <div className="flex items-center gap-4 px-6 py-2.5 overflow-x-auto">
            {/* Layout Group */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-1">Layout</span>
              <Button
                size="small"
                icon={<ChevronUp size={14} />}
                onClick={expandAll}
                className="text-xs"
              >
                Expand All
              </Button>
              <Button
                size="small"
                icon={<ChevronDown size={14} />}
                onClick={collapseAll}
                className="text-xs"
              >
                Collapse All
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* View Group */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-1">View</span>
              <Select
                value={viewMode}
                onChange={setViewMode}
                size="middle"
                style={{ width: 160 }}
                options={[
                  { value: 'overall', label: '🏢 Overall' },
                  { value: 'by-phase', label: '📊 By Phase' },
                  { value: 'by-task', label: '✓ By Task' },
                ]}
              />
              {viewMode === 'by-phase' && (
                <Select
                  placeholder="Select phase"
                  value={selectedPhaseId}
                  onChange={setSelectedPhaseId}
                  size="middle"
                  style={{ width: 180 }}
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
                  size="middle"
                  style={{ width: 180 }}
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
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* People Group */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-1">People</span>
              <Badge count={availableResources.length} showZero style={{ backgroundColor: '#52c41a' }} size="small">
                <Button type="dashed" icon={<UserOutlined />} size="middle">
                  Available ({availableResources.length})
                </Button>
              </Badge>
              <Button
                icon={<TeamOutlined />}
                onClick={autoPopulateResources}
                size="middle"
                disabled={!currentProject.resources || currentProject.resources.length === 0}
              >
                Auto-Populate
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* Structure Group */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-1">Structure</span>
              <Button
                icon={<Settings size={16} />}
                onClick={() => setShowManagementPanel(!showManagementPanel)}
                size="middle"
              >
                {showManagementPanel ? 'Hide' : 'Manage'}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addLevel}
                size="middle"
              >
                Add Level
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* Export Group */}
            <div className="flex items-center gap-2">
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
                  size="middle"
                  loading={isExporting}
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
            <strong>Assign resources from your project:</strong> Click &quot;+ Assign Resource&quot; to add team members from available resources.
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
          </p>
        </div>
      </div>

      {/* Organization Chart - Jobs/Ive: "Clarity over cleverness" */}
      <div className="flex-1 flex overflow-hidden">
        {/* Management Panel */}
        {showManagementPanel && (
          <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Organization Structure</h3>

            {/* Drag & Drop Help Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <DragOutlined />
                <span className="font-medium">Drag & Drop Enabled</span>
              </div>
              <p className="text-blue-700 mt-1">
                Drag resources to move them between groups and sub-groups within the same level.
              </p>
            </div>

            <div className="space-y-4">
              {orgChart.levels.map((level, levelIndex) => (
                <div key={level.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {/* Level Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{level.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="small" icon={<EditOutlined />} onClick={() => setEditingLevel(level)} />
                      {levelIndex > 0 && <Button size="small" icon={<ChevronUp size={14} />} onClick={() => moveLevelUp(level.id)} />}
                      {levelIndex < orgChart.levels.length - 1 && <Button size="small" icon={<ChevronDown size={14} />} onClick={() => moveLevelDown(level.id)} />}
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteLevel(level.id)} />
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="space-y-3 ml-4">
                    {level.groups.map((group) => (
                      <div key={group.id} className="border border-blue-200 rounded-lg p-2 bg-white">
                        {/* Group Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-900">{group.name}</span>
                          <div className="flex items-center gap-1">
                            <Button size="small" icon={<EditOutlined />} onClick={() => setEditingGroup({ level, group })} />
                            <Button
                              size="small"
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => addSubGroup(level.id, group.id)}
                              title="Add Sub-Group"
                            >
                              Sub-Group
                            </Button>
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={(e) => addPosition(e, level.id, group.id)}
                              title="Add Resource"
                            />
                            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteGroup(level.id, group.id)} />
                          </div>
                        </div>

                        {/* Group-level Resources - with Drag & Drop */}
                        <DropZone
                          levelId={level.id}
                          groupId={group.id}
                          onDrop={moveResource}
                          className="ml-2 mb-2 space-y-1 min-h-[20px] p-1 rounded transition-all"
                        >
                          {group.positions.length > 0 ? (
                            group.positions.map((position) => {
                              const resource = currentProject?.resources.find(r => r.id === position.resourceId);
                              return (
                                <DraggableResource
                                  key={position.id}
                                  position={position}
                                  resource={resource}
                                  levelId={level.id}
                                  groupId={group.id}
                                  onRemove={(e) => removePosition(e, level.id, group.id, position.id)}
                                />
                              );
                            })
                          ) : (
                            <div className="text-xs text-gray-400 italic p-2">Drop resources here</div>
                          )}
                        </DropZone>

                        {/* Sub-Groups */}
                        {group.subGroups && group.subGroups.length > 0 && (
                          <div className="ml-4 space-y-2 mt-2">
                            {group.subGroups.map((subGroup) => (
                              <div key={subGroup.id} className="border border-indigo-200 rounded p-2 bg-indigo-50">
                                {/* Sub-Group Header */}
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-indigo-900">{subGroup.name}</span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => setEditingSubGroup({ levelId: level.id, groupId: group.id, subGroup })}
                                    />
                                    <Button
                                      size="small"
                                      icon={<PlusOutlined />}
                                      onClick={(e) => addPosition(e, level.id, group.id, subGroup.id)}
                                      title="Add Resource"
                                    />
                                    <Button
                                      size="small"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => deleteSubGroup(level.id, group.id, subGroup.id)}
                                    />
                                  </div>
                                </div>

                                {/* Sub-Group Resources - with Drag & Drop */}
                                <DropZone
                                  levelId={level.id}
                                  groupId={group.id}
                                  subGroupId={subGroup.id}
                                  onDrop={moveResource}
                                  className="ml-2 space-y-1 min-h-[20px] p-1 rounded transition-all"
                                >
                                  {subGroup.positions.length > 0 ? (
                                    subGroup.positions.map((position) => {
                                      const resource = currentProject?.resources.find(r => r.id === position.resourceId);
                                      return (
                                        <DraggableResource
                                          key={position.id}
                                          position={position}
                                          resource={resource}
                                          levelId={level.id}
                                          groupId={group.id}
                                          subGroupId={subGroup.id}
                                          onRemove={(e) => removePosition(e, level.id, group.id, position.id, subGroup.id)}
                                        />
                                      );
                                    })
                                  ) : (
                                    <div className="text-xs text-gray-400 italic p-2">Drop resources here</div>
                                  )}
                                </DropZone>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Group Button */}
                    <Button
                      size="small"
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addGroup(level.id)}
                      className="w-full"
                    >
                      Add Group to {level.name}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart Visualization */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50" ref={chartRef}>
          <ReactOrgChartWrapper
            orgChart={orgChart}
            viewMode={viewMode}
            selectedPhaseId={selectedPhaseId}
            selectedTaskId={selectedTaskId}
            spotlightResourceId={spotlightResourceId}
            collapsedLevels={collapsedLevels}
            onToggleLevelCollapse={toggleLevelCollapse}
          />
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
                    Only showing resources that match &quot;{selectedGroup?.name}&quot; group
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
                            selectingResource.subGroupId,
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

      {/* Edit Sub-Group Modal */}
      <Modal
        title="Edit Sub-Group"
        open={!!editingSubGroup}
        onOk={() => {
          const newName = (document.getElementById('subgroup-name-input') as HTMLInputElement)?.value;
          if (newName && editingSubGroup) {
            updateSubGroup(editingSubGroup.levelId, editingSubGroup.groupId, editingSubGroup.subGroup.id, newName);
          }
        }}
        onCancel={() => setEditingSubGroup(null)}
        okText="Update"
      >
        {editingSubGroup && (
          <div>
            <label htmlFor="subgroup-name-input" className="block text-sm font-medium text-gray-700 mb-2">
              Sub-Group Name
            </label>
            <Input
              id="subgroup-name-input"
              defaultValue={editingSubGroup.subGroup.name}
              placeholder="Enter sub-group name"
              onPressEnter={() => {
                const newName = (document.getElementById('subgroup-name-input') as HTMLInputElement)?.value;
                if (newName) {
                  updateSubGroup(editingSubGroup.levelId, editingSubGroup.groupId, editingSubGroup.subGroup.id, newName);
                }
              }}
            />
          </div>
        )}
      </Modal>

      {/* Command Palette - Revolutionary Search */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        resources={currentProject?.resources || []}
        phases={currentProject?.phases || []}
        onSelectResource={handleSelectResource}
        onSelectPhase={handleSelectPhase}
        onSelectTask={handleSelectTask}
        onJumpToLevel={handleJumpToLevel}
        onToggleFilters={handleToggleFilters}
      />
      </div>
    </DndProvider>
  );
}
