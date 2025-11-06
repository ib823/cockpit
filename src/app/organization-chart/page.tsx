/**
 * Organization Chart - Professional Edition
 *
 * Purpose: Create polished org charts with avatars for client proposals
 * Features: Avatar uploads, client resources, designation toggle, professional layout
 */

'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { Button, Dropdown, Tooltip, App, Input, ColorPicker, Switch, Upload, Avatar, message as antdMessage } from 'antd';
import type { Color } from 'antd/es/color-picker';
import type { UploadProps } from 'antd';
import {
  LeftOutlined,
  DownloadOutlined,
  PlusOutlined,
  CloseOutlined,
  UserAddOutlined,
  ThunderboltOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  TeamOutlined,
  EditOutlined,
  BgColorsOutlined,
  SaveOutlined,
  UserOutlined,
  CameraOutlined,
  ShopOutlined,
  UsergroupAddOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Resource } from '@/types/gantt-tool';

// Company logo definition
interface CompanyLogo {
  id: string;
  name: string; // e.g., "Client", "My Company", "SAP"
  url: string;
}

// Extended resource with avatar and company affiliation
interface OrgResource {
  id: string;
  resourceId?: string;
  isClient?: boolean; // Indicates if this is a client resource
  avatarUrl?: string; // Custom avatar URL
  customName?: string; // For client resources without resourceId
  customRole?: string; // For client resources
  companyLogoId?: string; // Reference to company logo
  order?: number; // Manual ordering within level
  groupId?: string; // Group membership for hierarchical grouping
  isGroupLead?: boolean; // Is this person a group lead?
}

// Group definition for organizing resources
interface OrgGroup {
  id: string;
  name: string;
  leadResourceId: string; // The group lead (must be one of the resources in this group)
  collapsed?: boolean; // Whether the group is collapsed to show only lead + count
}

// Org level with customization options
interface OrgLevel {
  id: string;
  name: string;
  icon: string;
  color: string;
  resources: OrgResource[]; // Changed from resourceIds to resources array
  collapsed?: boolean;
  reportsToText?: string; // Custom reporting relationship text (can be blank)
  groups?: OrgGroup[]; // Groups within this level
}

// Default org levels with neutral colors
const DEFAULT_LEVELS: OrgLevel[] = [
  {
    id: 'executive',
    name: 'Executive Leadership',
    icon: '',
    color: '#ced2df',
    resources: [],
  },
  {
    id: 'management',
    name: 'Project Management',
    icon: '',
    color: '#ced2df',
    resources: [],
  },
  {
    id: 'delivery',
    name: 'Delivery Team',
    icon: '',
    color: '#ced2df',
    resources: [],
  },
  {
    id: 'support',
    name: 'Support & Infrastructure',
    icon: '',
    color: '#ced2df',
    resources: [],
  },
];

// Category mapping for auto-populate
const CATEGORY_TO_LEVEL_MAP: Record<string, string> = {
  leadership: 'executive',
  pm: 'management',
  change: 'management',
  functional: 'delivery',
  technical: 'delivery',
  qa: 'delivery',
  basis: 'support',
  security: 'support',
  other: 'support',
};

// Helper to get text color based on background
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Lightweight avatar component - replaces Ant Design Avatar for performance
function SimpleAvatar({
  src,
  size = 80,
  borderColor,
  onClick,
  showHover = false
}: {
  src?: string;
  size?: number;
  borderColor?: string;
  onClick?: () => void;
  showHover?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid ${borderColor || '#ccc'}`,
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <UserOutlined style={{ fontSize: size * 0.4, color: '#999' }} />
      )}
    </div>
  );
}

export default function OrganizationChartProfessional() {
  const router = useRouter();
  const chartRef = useRef<HTMLDivElement>(null);

  // Subscribe to currentProject only (not entire store) to get updates on refresh
  const [currentProject, setCurrentProject] = useState<any>(null);

  useEffect(() => {
    // Get initial value
    const project = useGanttToolStoreV2.getState().currentProject;
    setCurrentProject(project);

    // Subscribe to currentProject changes only
    const unsubscribe = useGanttToolStoreV2.subscribe(
      (state) => state.currentProject,
      (newProject) => {
        setCurrentProject(newProject);
      }
    );

    return unsubscribe;
  }, []);

  // State
  const [levels, setLevels] = useState<OrgLevel[]>(DEFAULT_LEVELS);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Company logos management
  const [companyLogos, setCompanyLogos] = useState<CompanyLogo[]>([
    { id: 'my-company', name: 'My Company', url: '/logo-keystone.svg' },
    { id: 'client', name: 'Client Company', url: '/logo-keystone.svg' },
    { id: 'sap', name: 'SAP', url: '/logo-keystone.svg' },
  ]);

  // Logo management modal
  const [showLogoManager, setShowLogoManager] = useState(false);
  const [editingLogoFor, setEditingLogoFor] = useState<{ levelId: string; orgResourceId: string } | null>(null);

  // Load saved org chart data when project is available
  useEffect(() => {
    if (currentProject && !dataLoaded && currentProject.orgChartPro) {
      console.log('[OrgChart] Loading saved data:', currentProject.orgChartPro);

      if (currentProject.orgChartPro.levels) {
        setLevels(currentProject.orgChartPro.levels);
      }

      if (currentProject.orgChartPro.showDesignations !== undefined) {
        setShowDesignations(currentProject.orgChartPro.showDesignations);
      }

      if (currentProject.orgChartPro.companyLogoUrl) {
        setCompanyLogoUrl(currentProject.orgChartPro.companyLogoUrl);
      }

      if (currentProject.orgChartPro.companyLogos) {
        setCompanyLogos(currentProject.orgChartPro.companyLogos);
      }

      setDataLoaded(true);
      console.log('[OrgChart] Data loaded successfully');
    }
  }, [currentProject, dataLoaded]);

  // Log when levels change and measure paint time
  useEffect(() => {
    const resourceCount = levels.reduce((sum, l) => sum + l.resources.length, 0);
    console.log('[Render] Levels updated, resource count:', resourceCount);

    // Measure how long the browser takes to paint
    const paintStart = performance.now();
    requestAnimationFrame(() => {
      const paintEnd = performance.now();
      console.log(`[Paint] Browser paint took ${(paintEnd - paintStart).toFixed(2)}ms`);

      if (paintEnd - paintStart > 100) {
        console.warn(`[Paint] SLOW PAINT DETECTED: ${(paintEnd - paintStart).toFixed(2)}ms`);
      }

      // Monitor what happens AFTER paint
      requestAnimationFrame(() => {
        const afterPaint = performance.now();
        console.log(`[AfterPaint] Time after paint: ${(afterPaint - paintEnd).toFixed(2)}ms`);

        // Check if main thread is blocked
        setTimeout(() => {
          console.log('[MainThread] Main thread is responsive');
        }, 0);
      });
    });
  }, [levels]);
  const [showDesignations, setShowDesignations] = useState(true);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('/logo-keystone.svg'); // Default company logo
  const [isExporting, setIsExporting] = useState(false);
  const [selectingResourceFor, setSelectingResourceFor] = useState<{ levelId: string; isClient: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editingLevelName, setEditingLevelName] = useState('');
  const [editingAvatarFor, setEditingAvatarFor] = useState<{ levelId: string; orgResourceId: string } | null>(null);
  const [editingReportsTo, setEditingReportsTo] = useState<string | null>(null);
  const [editingReportsToText, setEditingReportsToText] = useState('');

  // Client resource modal
  const [addingClientResource, setAddingClientResource] = useState<string | null>(null);
  const [clientResourceName, setClientResourceName] = useState('');
  const [clientResourceRole, setClientResourceRole] = useState('');

  // Auto-populate confirmation modal
  const [showAutoPopulateConfirm, setShowAutoPopulateConfirm] = useState(false);

  // Group management
  const [managingGroupsFor, setManagingGroupsFor] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupLeadId, setGroupLeadId] = useState('');

  // Stable handler for modal OK button
  const handleClientResourceModalOk = useCallback(() => {
    console.log('[Modal] OK clicked - START');

    if (!addingClientResource) {
      console.log('[Modal] No level selected, returning');
      return;
    }

    const levelId = addingClientResource;
    const name = clientResourceName;
    const role = clientResourceRole;
    console.log('[Modal] Data:', { levelId, name, role });

    if (!name.trim() || !role.trim()) {
      console.log('[Modal] Validation failed');
      return; // Don't show error message, just prevent submit
    }

    console.log('[Modal] Updating state...');
    const startTime = performance.now();

    // Update state FIRST (synchronously)
    setLevels(prev => {
      console.log('[Modal] setLevels callback executing...');
      const newLevels = prev.map(level =>
        level.id === levelId
          ? {
              ...level,
              resources: [
                ...level.resources,
                {
                  id: `client-${Date.now()}-${Math.random()}`,
                  isClient: true,
                  customName: name.trim(),
                  customRole: role.trim(),
                }
              ]
            }
          : level
      );
      console.log('[Modal] setLevels callback done');
      return newLevels;
    });

    const endTime = performance.now();
    console.log(`[Modal] State update took ${(endTime - startTime).toFixed(2)}ms`);

    // Close modal AFTER state update (synchronously)
    console.log('[Modal] Closing modal...');
    setAddingClientResource(null);
    setClientResourceName('');
    setClientResourceRole('');

    console.log('[Modal] OK clicked - COMPLETE');
  }, [addingClientResource, clientResourceName, clientResourceRole]);

  // Get assigned resource IDs (only for internal resources)
  const assignedResourceIds = useMemo(() => {
    const ids = new Set<string>();
    levels.forEach(level => {
      level.resources.forEach(res => {
        if (res.resourceId && !res.isClient) {
          ids.add(res.resourceId);
        }
      });
    });
    return ids;
  }, [levels]);

  // Get available resources (not yet assigned)
  const availableResources = useMemo(() => {
    if (!currentProject) return [];
    return currentProject.resources.filter(r => !assignedResourceIds.has(r.id));
  }, [currentProject, assignedResourceIds]);

  // Get resource by ID
  const getResource = useCallback((resourceId: string): Resource | undefined => {
    return currentProject?.resources.find(r => r.id === resourceId);
  }, [currentProject]);

  // Auto-populate all resources (internal only)
  const autoPopulate = useCallback(() => {
    if (!currentProject || availableResources.length === 0) {
      return;
    }
    setShowAutoPopulateConfirm(true);
  }, [currentProject, availableResources]);

  // Handle auto-populate confirmation
  const handleAutoPopulateConfirm = useCallback(() => {
    setLevels(prevLevels => {
      const newLevels = prevLevels.map(level => ({
        ...level,
        resources: [...level.resources]
      }));

      availableResources.forEach(resource => {
        const targetLevelId = CATEGORY_TO_LEVEL_MAP[resource.category] || 'support';
        const levelIndex = newLevels.findIndex(l => l.id === targetLevelId);
        if (levelIndex !== -1) {
          newLevels[levelIndex].resources.push({
            id: `res-${Date.now()}-${Math.random()}`,
            resourceId: resource.id,
            isClient: false,
          });
        }
      });

      return newLevels;
    });

    setShowAutoPopulateConfirm(false);
  }, [availableResources]);

  // Add internal resource to level
  const addResourceToLevel = useCallback((levelId: string, resourceId: string) => {
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? {
            ...level,
            resources: [
              ...level.resources,
              {
                id: `res-${Date.now()}-${Math.random()}`,
                resourceId,
                isClient: false,
              }
            ]
          }
        : level
    ));
    setSelectingResourceFor(null);
    antdMessage.success('Resource added');
  }, []);

  // Remove resource from level
  const removeResource = useCallback((levelId: string, orgResourceId: string) => {
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? {
            ...level,
            resources: level.resources.filter(res => res.id !== orgResourceId)
          }
        : level
    ));
    antdMessage.success('Resource removed');
  }, []);

  // Update avatar for a resource
  const updateAvatar = useCallback((levelId: string, orgResourceId: string, avatarUrl: string) => {
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? {
            ...level,
            resources: level.resources.map(res =>
              res.id === orgResourceId ? { ...res, avatarUrl } : res
            )
          }
        : level
    ));
    setEditingAvatarFor(null);
  }, []);

  // Update company logo for a resource
  const updateResourceLogo = useCallback((levelId: string, orgResourceId: string, companyLogoId: string) => {
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? {
            ...level,
            resources: level.resources.map(res =>
              res.id === orgResourceId ? { ...res, companyLogoId } : res
            )
          }
        : level
    ));
    setEditingLogoFor(null);
  }, []);

  // Move resource up/down in order
  const moveResource = useCallback((levelId: string, orgResourceId: string, direction: 'up' | 'down') => {
    setLevels(prev => prev.map(level => {
      if (level.id !== levelId) return level;

      const index = level.resources.findIndex(r => r.id === orgResourceId);
      if (index === -1) return level;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= level.resources.length) return level;

      const newResources = [...level.resources];
      [newResources[index], newResources[newIndex]] = [newResources[newIndex], newResources[index]];

      return { ...level, resources: newResources };
    }));
  }, []);

  // Toggle level collapse
  const toggleLevelCollapse = useCallback((levelId: string) => {
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? { ...level, collapsed: !level.collapsed }
        : level
    ));
  }, []);

  // Update level name
  const updateLevelName = useCallback((levelId: string, newName: string) => {
    if (!newName.trim()) {
      antdMessage.error('Level name cannot be empty');
      return;
    }
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? { ...level, name: newName.trim() }
        : level
    ));
    setEditingLevelId(null);
    antdMessage.success('Level name updated');
  }, []);

  // Update reports-to text
  const updateReportsToText = useCallback((levelId: string, newText: string) => {
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? { ...level, reportsToText: newText.trim() }
        : level
    ));
    setEditingReportsTo(null);
  }, []);

  // Update level color
  const updateLevelColor = useCallback((levelId: string, color: string) => {
    setLevels(prev => prev.map(level =>
      level.id === levelId
        ? { ...level, color }
        : level
    ));
  }, []);

  // Start editing level name
  const startEditingLevel = useCallback((level: OrgLevel) => {
    setEditingLevelId(level.id);
    setEditingLevelName(level.name);
  }, []);

  // Cancel editing
  const cancelEditingLevel = useCallback(() => {
    setEditingLevelId(null);
    setEditingLevelName('');
  }, []);

  // Group management functions
  const createGroup = useCallback((levelId: string, name: string, leadResourceId: string) => {
    if (!name.trim() || !leadResourceId) {
      antdMessage.error('Group name and lead are required');
      return;
    }

    setLevels(prev => prev.map(level => {
      if (level.id !== levelId) return level;

      const groups = level.groups || [];
      const newGroup: OrgGroup = {
        id: `group-${Date.now()}-${Math.random()}`,
        name: name.trim(),
        leadResourceId,
        collapsed: false,
      };

      // Assign all selected resources to this group
      const updatedResources = level.resources.map(res =>
        res.id === leadResourceId
          ? { ...res, groupId: newGroup.id, isGroupLead: true }
          : res
      );

      return {
        ...level,
        groups: [...groups, newGroup],
        resources: updatedResources,
      };
    }));

    antdMessage.success('Group created');
  }, []);

  const toggleGroupCollapse = useCallback((levelId: string, groupId: string) => {
    setLevels(prev => prev.map(level => {
      if (level.id !== levelId) return level;

      return {
        ...level,
        groups: level.groups?.map(g =>
          g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
        ),
      };
    }));
  }, []);

  const assignResourceToGroup = useCallback((levelId: string, resourceId: string, groupId: string) => {
    setLevels(prev => prev.map(level => {
      if (level.id !== levelId) return level;

      return {
        ...level,
        resources: level.resources.map(res =>
          res.id === resourceId ? { ...res, groupId, isGroupLead: false } : res
        ),
      };
    }));
    antdMessage.success('Resource assigned to group');
  }, []);

  const removeResourceFromGroup = useCallback((levelId: string, resourceId: string) => {
    setLevels(prev => prev.map(level => {
      if (level.id !== levelId) return level;

      return {
        ...level,
        resources: level.resources.map(res =>
          res.id === resourceId ? { ...res, groupId: undefined, isGroupLead: false } : res
        ),
      };
    }));
    antdMessage.success('Resource removed from group');
  }, []);

  const deleteGroup = useCallback((levelId: string, groupId: string) => {
    setLevels(prev => prev.map(level => {
      if (level.id !== levelId) return level;

      return {
        ...level,
        groups: level.groups?.filter(g => g.id !== groupId),
        resources: level.resources.map(res =>
          res.groupId === groupId ? { ...res, groupId: undefined, isGroupLead: false } : res
        ),
      };
    }));
    antdMessage.success('Group deleted');
  }, []);

  // Save to database
  const saveOrgChart = useCallback(async () => {
    if (!currentProject) return;

    setIsSaving(true);
    try {
      const orgChartData = {
        levels,
        showDesignations,
        companyLogoUrl,
        companyLogos, // Save company logos
      };

      const response = await fetch(`/api/gantt-tool/projects/${currentProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgChartPro: orgChartData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save org chart');
      }

      // Update Zustand store so refresh will load correct data
      useGanttToolStoreV2.setState((state) => {
        if (state.currentProject) {
          state.currentProject.orgChartPro = orgChartData;

          // Also update in projects array
          const index = state.projects.findIndex(p => p.id === currentProject.id);
          if (index !== -1) {
            state.projects[index].orgChartPro = orgChartData;
          }
        }
      });

      antdMessage.success('Organization chart saved');
    } catch (error) {
      antdMessage.error('Failed to save organization chart');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, levels, showDesignations, companyLogoUrl, companyLogos]);

  // Export to PNG
  const exportToPNG = useCallback(async () => {
    if (!chartRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${currentProject?.name || 'org-chart'}-organization-chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      antdMessage.success('Exported to PNG');
    } catch (error) {
      console.error('Export failed:', error);
      antdMessage.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [currentProject]);

  // Export to PDF
  const exportToPDF = useCallback(async () => {
    if (!chartRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
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

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
      pdf.save(`${currentProject?.name || 'org-chart'}-organization-chart.pdf`);

      antdMessage.success('Exported to PDF');
    } catch (error) {
      console.error('Export failed:', error);
      antdMessage.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [currentProject]);

  // Get resource count for a level - memoized to avoid repeated filtering
  const getLevelCount = useCallback((level: OrgLevel) => {
    return {
      total: level.resources.length,
      internal: level.resources.filter(r => !r.isClient).length,
      client: level.resources.filter(r => r.isClient).length,
    };
  }, []);

  // Get company logo by ID
  const getCompanyLogo = useCallback((logoId?: string): CompanyLogo | undefined => {
    if (!logoId) return undefined;
    return companyLogos.find(logo => logo.id === logoId);
  }, [companyLogos]);

  // Simple inline filtering - no memoization to avoid reference issues
  const getLevelData = (level: OrgLevel) => ({
    allResources: level.resources, // No longer separated by type
    count: {
      total: level.resources.length,
      internal: level.resources.filter(r => !r.isClient).length,
      client: level.resources.filter(r => r.isClient).length,
    }
  });

  // Avatar upload handler
  const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;

    try {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (editingAvatarFor) {
          updateAvatar(editingAvatarFor.levelId, editingAvatarFor.orgResourceId, base64);
        }
        onSuccess?.(base64);
      };
      reader.onerror = () => {
        onError?.(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file as File);
    } catch (error) {
      onError?.(error as Error);
    }
  };

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Navigation */}
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => router.push('/gantt-tool')}
              size="large"
            />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Organization Chart</h1>
              <p className="text-sm text-gray-500">{currentProject.name}</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-gray-600">Show Designations:</span>
              <Switch checked={showDesignations} onChange={setShowDesignations} />
            </div>
            <Button
              icon={<ShopOutlined />}
              onClick={() => setShowLogoManager(true)}
              size="large"
            >
              Manage Logos
            </Button>
            {availableResources.length > 0 && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={autoPopulate}
                size="large"
              >
                Auto-Populate
              </Button>
            )}
            <Button
              icon={<SaveOutlined />}
              onClick={saveOrgChart}
              loading={isSaving}
              size="large"
            >
              Save
            </Button>
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
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                loading={isExporting}
              >
                Export
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* Quick Info Banner */}
        {availableResources.length > 0 && (
          <div className="bg-blue-50 border-t border-blue-100 px-6 py-3">
            <p className="text-sm text-blue-900">
              <strong>{availableResources.length} unassigned resource(s)</strong> - Click "Auto-Populate" or add manually.
              <span className="ml-2 text-blue-700">Tip: Click avatar to upload picture, add client team members separately</span>
            </p>
          </div>
        )}
      </div>

      {/* Organization Chart Content */}
      <div className="flex-1 overflow-auto p-8">
        <div ref={chartRef} className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Project Header */}
          <div className="text-center mb-12 pb-6 border-b-2 border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentProject.name}</h2>
            <p className="text-lg text-gray-600">Organizational Structure & Reporting Lines</p>
          </div>

          {/* Hierarchical Levels */}
          <div className="space-y-0">
            {levels.map((level, levelIndex) => {
              const { count, allResources } = getLevelData(level);
              const isCollapsed = level.collapsed;
              const isEditing = editingLevelId === level.id;
              const textColor = getContrastColor(level.color);
              const showConnector = levelIndex < levels.length - 1;

              return (
                <div key={level.id} className="relative">
                  {/* Level Container */}
                  <div className="relative z-10">
                    {/* Level Header */}
                    <div
                      className="mx-auto rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl"
                      style={{
                        maxWidth: `${Math.min(100, 40 + levelIndex * 15)}%`,
                      }}
                    >
                      <div
                        className="px-6 py-4 flex items-center justify-between cursor-pointer"
                        style={{ backgroundColor: level.color, color: textColor }}
                        onClick={() => !isEditing && toggleLevelCollapse(level.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            className="rounded p-1 transition-colors"
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLevelCollapse(level.id);
                            }}
                          >
                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                          </button>
                          {level.icon && <span className="text-2xl">{level.icon}</span>}

                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingLevelName}
                                onChange={(e) => setEditingLevelName(e.target.value)}
                                onPressEnter={() => updateLevelName(level.id, editingLevelName)}
                                onBlur={() => updateLevelName(level.id, editingLevelName)}
                                className="flex-1 text-lg font-semibold"
                                autoFocus
                              />
                              <Button
                                size="small"
                                type="text"
                                onClick={cancelEditingLevel}
                                style={{ color: textColor }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold">{level.name}</h3>
                              <div className="flex items-center gap-2">
                                <p className="text-sm opacity-90">
                                  {count.internal} internal · {count.client} client
                                  {levelIndex > 0 && level.reportsToText !== undefined && level.reportsToText !== '' && ` · ${level.reportsToText}`}
                                  {levelIndex > 0 && level.reportsToText === undefined && ` · Reports to ${levels[levelIndex - 1].name}`}
                                </p>
                                {levelIndex > 0 && editingReportsTo !== level.id && (
                                  <Tooltip title="Edit reporting relationship">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingReportsTo(level.id);
                                        setEditingReportsToText(level.reportsToText !== undefined ? level.reportsToText : `Reports to ${levels[levelIndex - 1].name}`);
                                      }}
                                      style={{ color: textColor, opacity: 0.7 }}
                                    />
                                  </Tooltip>
                                )}
                                {editingReportsTo === level.id && (
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Input
                                      value={editingReportsToText}
                                      onChange={(e) => setEditingReportsToText(e.target.value)}
                                      onPressEnter={() => updateReportsToText(level.id, editingReportsToText)}
                                      onBlur={() => updateReportsToText(level.id, editingReportsToText)}
                                      placeholder="Leave blank to hide"
                                      size="small"
                                      style={{ width: '200px' }}
                                      autoFocus
                                    />
                                    <Button
                                      size="small"
                                      type="text"
                                      onClick={() => setEditingReportsTo(null)}
                                      style={{ color: textColor }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Edit level name">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => startEditingLevel(level)}
                              style={{ color: textColor }}
                            />
                          </Tooltip>
                          <Tooltip title="Change level color">
                            <ColorPicker
                              value={level.color}
                              onChange={(color: Color) => updateLevelColor(level.id, color.toHexString())}
                              showText={false}
                              presets={[
                                {
                                  label: 'Professional',
                                  colors: [
                                    '#ced2df', '#8b92a8', '#6b7280', '#4b5563',
                                    '#1e40af', '#7c3aed', '#059669', '#dc2626',
                                  ],
                                },
                              ]}
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<BgColorsOutlined />}
                                style={{ color: textColor }}
                              />
                            </ColorPicker>
                          </Tooltip>
                          <Tooltip title="Manage groups">
                            <Button
                              type="text"
                              size="small"
                              icon={<UsergroupAddOutlined />}
                              onClick={() => setManagingGroupsFor(level.id)}
                              style={{ color: textColor }}
                            />
                          </Tooltip>
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'internal',
                                  label: 'Add Internal Team Member',
                                  icon: <UserOutlined />,
                                  onClick: () => setSelectingResourceFor({ levelId: level.id, isClient: false }),
                                },
                                {
                                  key: 'client',
                                  label: 'Add Client Team Member',
                                  icon: <ShopOutlined />,
                                  onClick: () => setAddingClientResource(level.id),
                                },
                              ],
                            }}
                            trigger={['click']}
                          >
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              size="large"
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                color: level.color,
                                borderColor: 'transparent'
                              }}
                            >
                              Add Person
                            </Button>
                          </Dropdown>
                        </div>
                      </div>

                      {/* Level Content */}
                      {!isCollapsed && (
                        <div className="p-6" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                          {count.total === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                              <TeamOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                              <p className="text-lg">No team members assigned yet</p>
                              <p className="text-sm mt-2">Click "Add Person" to get started</p>
                            </div>
                          ) : (
                            <div className="space-y-8">
                              {/* Groups */}
                              {(level.groups || []).map(group => {
                                const groupResources = allResources.filter(r => r.groupId === group.id);
                                if (groupResources.length === 0) return null;

                                const leadResource = groupResources.find(r => r.id === group.leadResourceId);
                                const leadObj = leadResource?.resourceId ? getResource(leadResource.resourceId) : null;

                                return (
                                  <div key={group.id} style={{ marginBottom: '24px' }}>
                                    {/* Group Header */}
                                    <div
                                      className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                                      onClick={() => toggleGroupCollapse(level.id, group.id)}
                                    >
                                      {group.collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <UsergroupAddOutlined /> {group.name}
                                        <span className="text-xs font-normal text-gray-500">
                                          ({groupResources.length} member{groupResources.length !== 1 ? 's' : ''})
                                        </span>
                                      </h4>
                                    </div>

                                    {/* Group Content */}
                                    {group.collapsed ? (
                                      /* Collapsed: Show only lead with member count */
                                      leadResource && (
                                        <div className="flex gap-6 justify-start pl-8">
                                          <div
                                            className="flex flex-col items-center group"
                                            style={{ width: '120px' }}
                                          >
                                            <div className="relative mb-3">
                                              <SimpleAvatar
                                                size={80}
                                                src={leadResource.avatarUrl}
                                                borderColor={level.color}
                                                onClick={() => setEditingAvatarFor({ levelId: level.id, orgResourceId: leadResource.id })}
                                              />
                                              {/* Member Count Badge */}
                                              <div
                                                className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg font-bold text-sm"
                                                title={`${groupResources.length} members`}
                                              >
                                                {groupResources.length}
                                              </div>
                                              {/* Company Logo Badge */}
                                              <Tooltip title="Change company logo">
                                                <div
                                                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                                  style={{ border: `2px solid ${level.color}` }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingLogoFor({ levelId: level.id, orgResourceId: leadResource.id });
                                                  }}
                                                >
                                                  <img
                                                    src={leadResource.companyLogoId ? getCompanyLogo(leadResource.companyLogoId)?.url || companyLogos[0]?.url : companyLogos[0]?.url}
                                                    alt="Company"
                                                    className="w-5 h-5 object-contain pointer-events-none"
                                                  />
                                                </div>
                                              </Tooltip>
                                            </div>
                                            <div className="text-center">
                                              <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                                {leadResource.customName || leadObj?.name || 'Group Lead'}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {group.name} Lead
                                              </p>
                                              <p className="text-xs text-blue-600 font-medium mt-1">
                                                Click to expand group
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    ) : (
                                      /* Expanded: Show all members */
                                      <div className="flex flex-wrap gap-6 justify-start pl-8">
                                        {groupResources.map(orgRes => {
                                          const resource = orgRes.resourceId ? getResource(orgRes.resourceId) : null;
                                          if (!resource && !orgRes.isClient) return null;

                                          return (
                                            <div
                                              key={orgRes.id}
                                              className="flex flex-col items-center group"
                                              style={{ width: '120px' }}
                                            >
                                              <div className="relative mb-3">
                                                <SimpleAvatar
                                                  size={80}
                                                  src={orgRes.avatarUrl}
                                                  borderColor={level.color}
                                                  onClick={() => setEditingAvatarFor({ levelId: level.id, orgResourceId: orgRes.id })}
                                                />
                                                {/* Group Lead Badge */}
                                                {orgRes.id === group.leadResourceId && (
                                                  <div
                                                    className="absolute -top-2 -left-2 px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-bold shadow"
                                                    title="Group Lead"
                                                  >
                                                    LEAD
                                                  </div>
                                                )}
                                                {/* Company Logo Badge */}
                                                <Tooltip title="Change company logo">
                                                  <div
                                                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                                    style={{ border: `2px solid ${level.color}` }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingLogoFor({ levelId: level.id, orgResourceId: orgRes.id });
                                                    }}
                                                  >
                                                    <img
                                                      src={orgRes.companyLogoId ? getCompanyLogo(orgRes.companyLogoId)?.url || companyLogos[0]?.url : companyLogos[0]?.url}
                                                      alt="Company"
                                                      className="w-5 h-5 object-contain pointer-events-none"
                                                    />
                                                  </div>
                                                </Tooltip>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <div
                                                    className="absolute inset-0 bg-black bg-opacity-40 rounded-full cursor-pointer"
                                                    onClick={() => setEditingAvatarFor({ levelId: level.id, orgResourceId: orgRes.id })}
                                                  />
                                                  <CameraOutlined className="relative z-10 text-white text-xl pointer-events-none" />
                                                </div>
                                                <Tooltip title="Remove">
                                                  <button
                                                    onClick={() => removeResource(level.id, orgRes.id)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                  >
                                                    <CloseOutlined style={{ fontSize: 12 }} />
                                                  </button>
                                                </Tooltip>
                                              </div>
                                              <div className="text-center">
                                                <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                                  {orgRes.customName || resource?.name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                  {resource?.category.replace(/_/g, ' ') || orgRes.customRole}
                                                </p>
                                                {showDesignations && resource?.designation && (
                                                  <p className="text-xs font-medium mt-1" style={{ color: level.color }}>
                                                    {resource.designation}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Ungrouped Internal Team */}
                              {allResources.filter(r => !r.isClient && !r.groupId).length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
                                    <UserOutlined /> Internal Team ({allResources.filter(r => !r.isClient && !r.groupId).length})
                                  </h4>
                                  <div className="flex flex-wrap gap-6 justify-start">
                                    {allResources.filter(r => !r.isClient && !r.groupId).map(orgRes => {
                                      const resource = orgRes.resourceId ? getResource(orgRes.resourceId) : null;
                                      if (!resource) return null;

                                      return (
                                        <div
                                          key={orgRes.id}
                                          className="flex flex-col items-center group"
                                          style={{ width: '120px' }}
                                        >
                                          {/* Avatar with Company Logo */}
                                          <div className="relative mb-3">
                                            <SimpleAvatar
                                              size={80}
                                              src={orgRes.avatarUrl}
                                              borderColor={level.color}
                                              onClick={() => setEditingAvatarFor({ levelId: level.id, orgResourceId: orgRes.id })}
                                            />
                                            {/* Company Logo Badge - Clickable */}
                                            <Tooltip title="Change company logo">
                                              <div
                                                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                                style={{ border: `2px solid ${level.color}` }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingLogoFor({ levelId: level.id, orgResourceId: orgRes.id });
                                                }}
                                              >
                                                <img
                                                  src={orgRes.companyLogoId ? getCompanyLogo(orgRes.companyLogoId)?.url || companyLogos[0]?.url : companyLogos[0]?.url}
                                                  alt="Company"
                                                  className="w-5 h-5 object-contain pointer-events-none"
                                                />
                                              </div>
                                            </Tooltip>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <div
                                                className="absolute inset-0 bg-black bg-opacity-40 rounded-full cursor-pointer"
                                                onClick={() => setEditingAvatarFor({ levelId: level.id, orgResourceId: orgRes.id })}
                                              />
                                              <CameraOutlined className="relative z-10 text-white text-xl pointer-events-none" />
                                            </div>
                                            <Tooltip title="Remove">
                                              <button
                                                onClick={() => removeResource(level.id, orgRes.id)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                              >
                                                <CloseOutlined style={{ fontSize: 12 }} />
                                              </button>
                                            </Tooltip>
                                          </div>
                                          {/* Name and Role */}
                                          <div className="text-center">
                                            <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                              {resource.name}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">
                                              {resource.category.replace(/_/g, ' ')}
                                            </p>
                                            {showDesignations && resource.designation && (
                                              <p className="text-xs font-medium mt-1" style={{ color: level.color }}>
                                                {resource.designation}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Ungrouped Client Team */}
                              {allResources.filter(r => r.isClient && !r.groupId).length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
                                    <Building2 size={16} /> Client Team ({allResources.filter(r => r.isClient && !r.groupId).length})
                                  </h4>
                                  <div className="flex flex-wrap gap-6 justify-start">
                                    {allResources.filter(r => r.isClient && !r.groupId).map(orgRes => (
                                      <div
                                        key={orgRes.id}
                                        className="flex flex-col items-center group"
                                        style={{ width: '120px' }}
                                      >
                                        {/* Avatar with client badge */}
                                        <div className="relative mb-3">
                                          <SimpleAvatar
                                            size={80}
                                            src={orgRes.avatarUrl}
                                            borderColor={level.color}
                                            onClick={() => setEditingAvatarFor({ levelId: level.id, orgResourceId: orgRes.id })}
                                          />
                                          {/* Company Logo Badge - Clickable */}
                                          <Tooltip title="Change company logo">
                                            <div
                                              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                              style={{ border: `2px solid ${level.color}` }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingLogoFor({ levelId: level.id, orgResourceId: orgRes.id });
                                              }}
                                            >
                                              <img
                                                src={orgRes.companyLogoId ? getCompanyLogo(orgRes.companyLogoId)?.url || companyLogoUrl : companyLogoUrl}
                                                alt="Company"
                                                className="w-5 h-5 object-contain pointer-events-none"
                                              />
                                            </div>
                                          </Tooltip>
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div
                                              className="absolute inset-0 bg-black bg-opacity-40 rounded-full cursor-pointer"
                                              onClick={() => setEditingAvatarFor({ levelId: level.id, orgResourceId: orgRes.id })}
                                            />
                                            <CameraOutlined className="relative z-10 text-white text-xl pointer-events-none" />
                                          </div>
                                          <Tooltip title="Remove">
                                            <button
                                              onClick={() => removeResource(level.id, orgRes.id)}
                                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                              <CloseOutlined style={{ fontSize: 12 }} />
                                            </button>
                                          </Tooltip>
                                        </div>
                                        {/* Name and Role */}
                                        <div className="text-center">
                                          <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                            {orgRes.customName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {orgRes.customRole}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hierarchical Connector */}
                  {showConnector && !isCollapsed && (
                    <div className="flex justify-center my-6 relative z-0">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-1 h-12"
                          style={{ backgroundColor: levels[levelIndex + 1]?.color || '#9ca3af' }}
                        />
                        <div
                          className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
                          style={{ borderTopColor: levels[levelIndex + 1]?.color || '#9ca3af' }}
                        />
                        {(levels[levelIndex + 1]?.reportsToText !== '') && (
                          <div className="mt-2 text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                            {levels[levelIndex + 1]?.reportsToText || 'Reports to'} ↑
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Generated with Keystone Project Management System</p>
            <p className="text-xs mt-1 text-gray-400">Organizational hierarchy with internal and client teams</p>
          </div>
        </div>
      </div>

      {/* Internal Resource Selection Modal - Simple Custom Modal */}
      {selectingResourceFor && !selectingResourceFor.isClient && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectingResourceFor(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              Add Internal Team Member
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Select a resource from your project:
            </p>
            {availableResources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                <UserAddOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>All resources are already assigned.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableResources.map(resource => (
                  <button
                    key={resource.id}
                    onClick={() => addResourceToLevel(selectingResourceFor.levelId, resource.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#60a5fa';
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <SimpleAvatar size={48} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>{resource.name}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>
                        {resource.category.replace(/_/g, ' ')}
                        {resource.designation && ` · ${resource.designation}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Client Resource Modal - Simple Custom Modal */}
      {!!addingClientResource && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setAddingClientResource(null);
            setClientResourceName('');
            setClientResourceRole('');
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              Add Client Team Member
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Name
              </label>
              <Input
                placeholder="Enter name"
                value={clientResourceName}
                onChange={(e) => setClientResourceName(e.target.value)}
                size="large"
                onPressEnter={handleClientResourceModalOk}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Role
              </label>
              <Input
                placeholder="Enter role (e.g., Project Sponsor, Business Owner)"
                value={clientResourceRole}
                onChange={(e) => setClientResourceRole(e.target.value)}
                size="large"
                onPressEnter={handleClientResourceModalOk}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                onClick={() => {
                  setAddingClientResource(null);
                  setClientResourceName('');
                  setClientResourceRole('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleClientResourceModalOk}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal - Simple Custom Modal */}
      {!!editingAvatarFor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditingAvatarFor(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              Update Avatar
            </h3>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Upload
                customRequest={handleAvatarUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<CameraOutlined />} size="large" type="primary">
                  Choose Picture
                </Button>
              </Upload>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '16px' }}>
                Upload a square image for best results (recommended: 200x200px)
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditingAvatarFor(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Populate Confirmation Modal - Simple Custom Modal */}
      {showAutoPopulateConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAutoPopulateConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '450px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff', marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  Auto-Populate Organization Chart?
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  This will automatically assign {availableResources.length} internal resource(s) to appropriate levels.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <Button onClick={() => setShowAutoPopulateConfirm(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleAutoPopulateConfirm}>
                Auto-Populate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logo Selection Modal - Choose logo for a resource */}
      {!!editingLogoFor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditingLogoFor(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              Select Company Logo
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {companyLogos.map(logo => (
                <button
                  key={logo.id}
                  onClick={() => updateResourceLogo(editingLogoFor.levelId, editingLogoFor.orgResourceId, logo.id)}
                  style={{
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#60a5fa';
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {logo.url ? (
                    <img src={logo.url} alt={logo.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShopOutlined style={{ fontSize: '24px', color: '#9ca3af' }} />
                    </div>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', textAlign: 'center' }}>{logo.name}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditingLogoFor(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Logo Management Modal - Manage all company logos */}
      {showLogoManager && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowLogoManager(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              Manage Company Logos
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Manage logos for different companies involved in this project (Client, Your Company, SAP, Salesforce, etc.)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {companyLogos.map((logo, index) => (
                <div
                  key={logo.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                    {logo.url ? (
                      <img src={logo.url} alt={logo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShopOutlined style={{ fontSize: '24px', color: '#9ca3af' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      value={logo.name}
                      onChange={(e) => {
                        const newLogos = [...companyLogos];
                        newLogos[index].name = e.target.value;
                        setCompanyLogos(newLogos);
                      }}
                      placeholder="Company name"
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Input
                        value={logo.url}
                        onChange={(e) => {
                          const newLogos = [...companyLogos];
                          newLogos[index].url = e.target.value;
                          setCompanyLogos(newLogos);
                        }}
                        placeholder="Logo URL"
                        style={{ flex: 1 }}
                      />
                      <Upload
                        customRequest={async (options) => {
                          const { file, onSuccess, onError } = options;
                          try {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const base64 = e.target?.result as string;
                              const newLogos = [...companyLogos];
                              newLogos[index].url = base64;
                              setCompanyLogos(newLogos);
                              onSuccess?.(base64);
                            };
                            reader.onerror = () => {
                              onError?.(new Error('Failed to read file'));
                            };
                            reader.readAsDataURL(file as File);
                          } catch (error) {
                            onError?.(error as Error);
                          }
                        }}
                        showUploadList={false}
                        accept="image/*"
                      >
                        <Button icon={<FileImageOutlined />} size="small">
                          Upload
                        </Button>
                      </Upload>
                    </div>
                  </div>
                  <Button
                    danger
                    size="small"
                    onClick={() => setCompanyLogos(companyLogos.filter(l => l.id !== logo.id))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setCompanyLogos([...companyLogos, { id: `logo-${Date.now()}`, name: 'New Company', url: '/logo-keystone.svg' }])}
              >
                Add Logo
              </Button>
              <Button type="primary" onClick={() => setShowLogoManager(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {!!managingGroupsFor && (() => {
        const level = levels.find(l => l.id === managingGroupsFor);
        if (!level) return null;

        const groups = level.groups || [];
        const ungroupedResources = level.resources.filter(r => !r.groupId);

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => {
              setManagingGroupsFor(null);
              setGroupName('');
              setGroupLeadId('');
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                Manage Groups: {level.name}
              </h3>

              {/* Create New Group */}
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  Create New Group
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <Input
                    placeholder="Group name (e.g., Development Team, QA Team)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    size="large"
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <select
                    value={groupLeadId}
                    onChange={(e) => setGroupLeadId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  >
                    <option value="">Select Group Lead...</option>
                    {level.resources.map(res => {
                      const resource = res.resourceId ? getResource(res.resourceId) : null;
                      const name = res.customName || resource?.name || 'Unknown';
                      return (
                        <option key={res.id} value={res.id}>{name}</option>
                      );
                    })}
                  </select>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (groupName && groupLeadId) {
                      createGroup(level.id, groupName, groupLeadId);
                      setGroupName('');
                      setGroupLeadId('');
                    }
                  }}
                  disabled={!groupName || !groupLeadId}
                >
                  Create Group
                </Button>
              </div>

              {/* Existing Groups */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  Existing Groups ({groups.length})
                </h4>
                {groups.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    No groups yet. Create one above to organize resources.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {groups.map(group => {
                      const groupResources = level.resources.filter(r => r.groupId === group.id);
                      const leadResource = groupResources.find(r => r.id === group.leadResourceId);
                      const resource = leadResource?.resourceId ? getResource(leadResource.resourceId) : null;
                      const leadName = leadResource?.customName || resource?.name || 'Unknown';

                      return (
                        <div
                          key={group.id}
                          style={{
                            padding: '16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827' }}>{group.name}</div>
                              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                Lead: {leadName} · {groupResources.length} member(s)
                              </div>
                            </div>
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => deleteGroup(level.id, group.id)}
                            >
                              Delete
                            </Button>
                          </div>

                          {/* Assign ungrouped resources to this group */}
                          {ungroupedResources.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                                Add members:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {ungroupedResources.map(res => {
                                  const resource = res.resourceId ? getResource(res.resourceId) : null;
                                  const name = res.customName || resource?.name || 'Unknown';
                                  return (
                                    <Button
                                      key={res.id}
                                      size="small"
                                      onClick={() => assignResourceToGroup(level.id, res.id, group.id)}
                                    >
                                      + {name}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Group members */}
                          {groupResources.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                                Members:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {groupResources.map(res => {
                                  const resource = res.resourceId ? getResource(res.resourceId) : null;
                                  const name = res.customName || resource?.name || 'Unknown';
                                  const isLead = res.id === group.leadResourceId;
                                  return (
                                    <div
                                      key={res.id}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: isLead ? '#dbeafe' : '#f3f4f6',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      {name} {isLead && <span style={{ fontWeight: '600', color: '#1e40af' }}>(Lead)</span>}
                                      {!isLead && (
                                        <CloseOutlined
                                          style={{ fontSize: '10px', cursor: 'pointer', color: '#9ca3af' }}
                                          onClick={() => removeResourceFromGroup(level.id, res.id)}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  onClick={() => {
                    setManagingGroupsFor(null);
                    setGroupName('');
                    setGroupLeadId('');
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
