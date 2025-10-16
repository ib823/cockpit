/**
 * Simple Organization Chart - Resource Edition
 *
 * Jobs/Ive Design Philosophy:
 * "Simplicity is the ultimate sophistication"
 * "Design is not just what it looks like and feels like. Design is how it works."
 *
 * Features:
 * - Fixed hierarchy with editable levels
 * - Assign existing project resources to org positions
 * - See task/phase assignments for each person
 * - View by: Overall Project, Phase, Task
 */

'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGanttToolStore } from '@/stores/gantt-tool-store';
import { Button, Input, Select, Tooltip, App, Modal, Dropdown, Tag, Badge } from 'antd';
import {
  LeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  TeamOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  UserOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Resource } from '@/types/gantt-tool';

// Types
interface OrgPosition {
  id: string;
  resourceId?: string; // Reference to project resource
}

interface OrgGroup {
  id: string;
  name: string;
  positions: OrgPosition[];
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
  const { message, modal } = App.useApp();
  const currentProject = useGanttToolStore((state) => state.currentProject);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('overall');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [orgChart, setOrgChart] = useState<SimpleOrgChart>({
    levels: [
      {
        id: '1',
        name: 'Executive Level',
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
        name: 'Management Level',
        groups: [
          {
            id: '2-1',
            name: 'Project Management',
            positions: [],
          },
        ],
      },
      {
        id: '3',
        name: 'Team Level',
        groups: [
          {
            id: '3-1',
            name: 'Development',
            positions: [],
          },
        ],
      },
    ],
  });

  // Modals
  const [editingLevel, setEditingLevel] = useState<OrgLevel | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ level: OrgLevel; group: OrgGroup } | null>(null);
  const [selectingResource, setSelectingResource] = useState<{ levelId: string; groupId: string; positionId?: string } | null>(null);

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
      {/* Header - Jobs/Ive: "Beautiful simplicity" */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
            {/* Available Resources Badge */}
            <Badge count={availableResources.length} showZero style={{ backgroundColor: '#52c41a' }}>
              <Button type="dashed" icon={<UserOutlined />} size="large">
                Available Resources
              </Button>
            </Badge>

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
          </p>
        </div>
      </div>

      {/* Organization Chart - Jobs/Ive: "Clarity over cleverness" */}
      <div className="flex-1 overflow-auto p-8" ref={chartRef}>
        <div className="max-w-6xl mx-auto space-y-6">
          {orgChart.levels.map((level, levelIndex) => (
            <div key={level.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Level Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {editingLevel?.id === level.id ? (
                    <Input
                      autoFocus
                      defaultValue={level.name}
                      onBlur={(e) => updateLevelName(level.id, e.target.value)}
                      onPressEnter={(e) => updateLevelName(level.id, e.currentTarget.value)}
                      className="font-semibold text-lg"
                      style={{ width: 250 }}
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-gray-900">{level.name}</h2>
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
              <div className="grid grid-cols-3 gap-4">
                {level.groups.map((group) => {
                  const visiblePositions = group.positions.filter(shouldShowPosition);

                  return (
                    <div
                      key={group.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between mb-3">
                        {editingGroup?.group.id === group.id ? (
                          <Input
                            autoFocus
                            defaultValue={group.name}
                            onBlur={(e) => updateGroup(level.id, group.id, e.target.value)}
                            onPressEnter={(e) =>
                              updateGroup(level.id, group.id, e.currentTarget.value)
                            }
                            className="font-medium"
                            size="small"
                          />
                        ) : (
                          <h3 className="font-medium text-gray-900 text-sm">{group.name}</h3>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            type="default"
                            icon={<EditOutlined />}
                            onClick={() => setEditingGroup({ level, group })}
                            size="small"
                          />
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteGroup(level.id, group.id)}
                            size="small"
                          />
                        </div>
                      </div>

                      {/* Resource Cards - Jobs/Ive: "Every detail matters" */}
                      <div className="space-y-2">
                        {visiblePositions.map((position) => {
                          const info = position.resourceId ? getResourceInfo(position.resourceId) : null;

                          return (
                            <div
                              key={position.id}
                              className="bg-white rounded border border-gray-200 p-3 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm truncate">
                                    {info?.resource.name || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-0.5">
                                    {info?.resource.category || 'No category'}
                                  </div>

                                  {/* Phase assignments */}
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

                                  {/* Task count */}
                                  {info && info.tasks.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {info.tasks.length} task{info.tasks.length !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>

                                <Button
                                  danger
                                  icon={<CloseOutlined />}
                                  size="small"
                                  className="ml-2"
                                  onClick={(e) => removePosition(e, level.id, group.id, position.id)}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Show count when filtered */}
                        {viewMode !== 'overall' && visiblePositions.length < group.positions.length && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            Showing {visiblePositions.length} of {group.positions.length}
                          </div>
                        )}

                        {/* Assign Resource Button */}
                        <Button
                          block
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={(e) => addPosition(e, level.id, group.id)}
                          className="!border-2 always-visible"
                        >
                          Assign Resource
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
        footer={null}
        width={600}
        afterClose={() => setSelectingResource(null)}
      >
        {selectingResource && (
          <div className="space-y-3">
            {availableResources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>All resources are already assigned.</p>
                <p className="text-sm mt-2">Create more resources in the Gantt Tool first.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Select a resource from your project to assign to this position:
                </p>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {availableResources.map((resource) => {
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
        )}
      </Modal>
    </div>
  );
}
