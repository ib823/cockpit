/**
 * React Org Chart Integration - ReactFlow Edition
 *
 * Modern org chart using ReactFlow with custom node rendering
 * while preserving all existing project data and functionality
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  ConnectionLineType,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from '@/types/gantt-tool';
import type { Resource } from '@/types/gantt-tool';
import { Tag, Tooltip } from 'antd';
import { CalendarOutlined, CheckSquareOutlined } from '@ant-design/icons';

// Types for org chart data
export interface OrgChartTreeNode {
  id: string;
  person: {
    id: string;
    name: string;
    designation?: string;
    category?: string;
    projectRole?: string;
    department?: string;
    resource?: Resource;
    assignments?: {
      phases: Array<{ phaseId: string; phaseName: string; phaseColor: string }>;
      tasks: Array<{ taskId: string; taskName: string; phaseId: string }>;
      primaryPhase: { phaseId: string; phaseName: string; phaseColor: string } | null;
    };
  };
  children?: OrgChartTreeNode[];
  hasParent?: boolean;
}

interface ReactOrgChartWrapperProps {
  orgChart: SimpleOrgChart;
  viewMode?: 'overall' | 'by-phase' | 'by-task';
  selectedPhaseId?: string | null;
  selectedTaskId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  spotlightResourceId?: string | null;
}

// Import types from page
interface OrgPosition {
  id: string;
  resourceId?: string;
}

interface OrgSubGroup {
  id: string;
  name: string;
  positions: OrgPosition[];
}

interface OrgGroup {
  id: string;
  name: string;
  positions: OrgPosition[];
  subGroups?: OrgSubGroup[];
}

interface OrgLevel {
  id: string;
  name: string;
  groups: OrgGroup[];
}

interface SimpleOrgChart {
  levels: OrgLevel[];
}

// Custom node components
function ProjectNode({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg border-2 border-blue-400 p-4 w-[280px] h-[100px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-1">{data.label}</div>
        <div className="text-sm opacity-90">Project Organization</div>
      </div>
    </div>
  );
}

function GroupNode({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg shadow-md border-2 border-gray-300 p-3 w-[280px] h-[80px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-bold text-gray-800">{data.label}</div>
        <div className="text-xs text-gray-600 mt-1">{data.designation}</div>
      </div>
    </div>
  );
}

function SubGroupNode({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg shadow-md border-2 border-indigo-300 p-3 w-[240px] h-[70px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-base font-semibold text-indigo-900">{data.label}</div>
        <div className="text-xs text-indigo-600 mt-1">{data.parentGroup}</div>
      </div>
    </div>
  );
}

function ResourceNode({ data }: { data: any }) {
  const { person, isSpotlighted, isDimmed } = data;
  const resource = person.resource;
  const assignments = person.assignments;

  if (!resource) return null;

  const categoryInfo = RESOURCE_CATEGORIES[resource.category as keyof typeof RESOURCE_CATEGORIES];
  const isActivelyWorking = assignments && (assignments.phases.length > 0 || assignments.tasks.length > 0);
  const totalWorkload = assignments ? assignments.phases.length + assignments.tasks.length : 0;

  return (
    <div
      data-resource-id={resource.id}
      className={`
        bg-white rounded-lg shadow-md border-2 transition-all duration-300
        ${isActivelyWorking ? 'border-green-400 hover:border-green-500' : 'border-gray-200 hover:border-gray-300'}
        ${isSpotlighted ? 'ring-4 ring-blue-400 ring-offset-2 scale-105 shadow-2xl z-50' : ''}
        ${isDimmed ? 'opacity-30' : 'opacity-100'}
        w-[280px] h-[160px] relative cursor-pointer hover:shadow-lg
      `}
      style={{
        borderLeftWidth: assignments?.primaryPhase ? '6px' : '2px',
        borderLeftColor: assignments?.primaryPhase?.phaseColor || undefined,
        transform: isSpotlighted ? 'scale(1.05)' : undefined,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{categoryInfo.icon}</span>
            <span className="text-xs font-medium text-gray-500 uppercase">
              {categoryInfo.label.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Name - Primary Focus */}
        <div className="mb-1">
          <div className="font-bold text-gray-900 text-base leading-tight mb-0.5">
            {person.name}
          </div>
          <div className="text-xs text-gray-500">{person.designation}</div>
        </div>

        {/* Project Role if present */}
        {person.projectRole && (
          <div className="text-xs text-gray-600 italic mb-2 truncate">
            {person.projectRole}
          </div>
        )}
      </div>

      {/* Work Status */}
      {isActivelyWorking && assignments ? (
        <div
          className="px-3 py-2 border-t border-gray-100"
          style={{
            backgroundColor: assignments.primaryPhase?.phaseColor ? `${assignments.primaryPhase.phaseColor}10` : '#f0fdf4',
          }}
        >
          {/* Primary Phase Tag */}
          {assignments.primaryPhase && (
            <div className="mb-1.5">
              <Tag
                style={{
                  margin: 0,
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: assignments.primaryPhase.phaseColor,
                  color: 'white',
                  border: 'none',
                }}
              >
                {assignments.primaryPhase.phaseName}
              </Tag>
            </div>
          )}

          {/* Work Indicators */}
          <div className="flex items-center gap-2">
            {assignments.phases.length > 0 && (
              <Tooltip
                title={
                  <div>
                    <div className="font-semibold mb-1">Managing {assignments.phases.length} Phase{assignments.phases.length > 1 ? 's' : ''}:</div>
                    {assignments.phases.map((p: any) => (
                      <div key={p.phaseId} className="text-xs">• {p.phaseName}</div>
                    ))}
                  </div>
                }
              >
                <div className="flex items-center gap-1 text-xs">
                  <CalendarOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                  <span className="font-semibold text-blue-600">{assignments.phases.length}</span>
                </div>
              </Tooltip>
            )}

            {assignments.tasks.length > 0 && (
              <Tooltip
                title={
                  <div>
                    <div className="font-semibold mb-1">{assignments.tasks.length} Assigned Task{assignments.tasks.length > 1 ? 's' : ''}:</div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {assignments.tasks.slice(0, 10).map((t: any) => (
                        <div key={t.taskId} className="text-xs">• {t.taskName}</div>
                      ))}
                      {assignments.tasks.length > 10 && (
                        <div className="text-xs text-gray-400 mt-1">+ {assignments.tasks.length - 10} more...</div>
                      )}
                    </div>
                  </div>
                }
              >
                <div className="flex items-center gap-1 text-xs">
                  <CheckSquareOutlined style={{ color: '#722ed1', fontSize: '12px' }} />
                  <span className="font-semibold text-purple-600">{assignments.tasks.length}</span>
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-400 italic">Available</div>
        </div>
      )}

      {/* Active Work Indicator Badge */}
      {isActivelyWorking && totalWorkload > 0 && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
          {totalWorkload}
        </div>
      )}
    </div>
  );
}

// Register custom node types
const nodeTypes = {
  projectNode: ProjectNode,
  groupNode: GroupNode,
  subGroupNode: SubGroupNode,
  resourceNode: ResourceNode,
};

function OrgChartFlow({
  orgChart,
  viewMode = 'overall',
  selectedPhaseId,
  selectedTaskId,
  onNodeClick,
  spotlightResourceId,
}: ReactOrgChartWrapperProps) {
  const currentProject = useGanttToolStoreV2((state) => state.currentProject);

  // Transform org chart to ReactFlow nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!currentProject) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const resourceMap = new Map(currentProject.resources.map(r => [r.id, r]));

    // Calculate assignments for each resource
    const getResourceAssignments = (resource: Resource) => {
      const phases: Array<{ phaseId: string; phaseName: string; phaseColor: string }> = [];
      const tasks: Array<{ taskId: string; taskName: string; phaseId: string }> = [];

      currentProject.phases.forEach((phase) => {
        // Check phase-level assignments
        if (phase.phaseResourceAssignments?.some((a) => a.resourceId === resource.id)) {
          phases.push({
            phaseId: phase.id,
            phaseName: phase.name,
            phaseColor: phase.color || '#94a3b8',
          });
        }

        // Check task-level assignments
        phase.tasks.forEach((task) => {
          if (task.resourceAssignments?.some((a) => a.resourceId === resource.id)) {
            tasks.push({
              taskId: task.id,
              taskName: task.name,
              phaseId: phase.id,
            });
          }
        });
      });

      // Determine primary phase
      let primaryPhase = phases[0] || null;
      if (!primaryPhase && tasks.length > 0) {
        const tasksByPhase = new Map<string, number>();
        tasks.forEach(t => {
          tasksByPhase.set(t.phaseId, (tasksByPhase.get(t.phaseId) || 0) + 1);
        });
        const [primaryPhaseId] = Array.from(tasksByPhase.entries()).sort((a, b) => b[1] - a[1])[0] || [];
        if (primaryPhaseId) {
          const phase = currentProject.phases.find(p => p.id === primaryPhaseId);
          if (phase) {
            primaryPhase = {
              phaseId: phase.id,
              phaseName: phase.name,
              phaseColor: phase.color || '#94a3b8',
            };
          }
        }
      }

      return { phases, tasks, primaryPhase };
    };

    // Create root project node
    nodes.push({
      id: 'root',
      type: 'projectNode',
      position: { x: 0, y: 0 },
      data: { label: currentProject.name || 'Project Organization' },
    });

    let yOffset = 150;
    const nodeWidth = 280;
    const nodeSpacing = 50;
    const levelSpacing = 100;

    // Process levels
    orgChart.levels.forEach((level, levelIndex) => {
      const levelGroups: any[] = [];

      level.groups.forEach((group) => {
        const groupResources: any[] = [];
        const groupSubGroups: any[] = [];

        // Process positions (resources) at group level (no sub-group)
        group.positions.forEach((position) => {
          if (position.resourceId) {
            const resource = resourceMap.get(position.resourceId);
            if (resource) {
              const assignments = getResourceAssignments(resource);

              // Filter by view mode
              let shouldShow = true;
              if (viewMode === 'by-phase' && selectedPhaseId) {
                shouldShow = assignments.phases.some(p => p.phaseId === selectedPhaseId) ||
                  assignments.tasks.some(t => t.phaseId === selectedPhaseId);
              } else if (viewMode === 'by-task' && selectedTaskId) {
                shouldShow = assignments.tasks.some(t => t.taskId === selectedTaskId);
              }

              if (shouldShow) {
                groupResources.push({
                  id: position.id,
                  resource,
                  assignments,
                });
              }
            }
          }
        });

        // Process sub-groups
        if (group.subGroups && group.subGroups.length > 0) {
          group.subGroups.forEach((subGroup) => {
            const subGroupResources: any[] = [];

            subGroup.positions.forEach((position) => {
              if (position.resourceId) {
                const resource = resourceMap.get(position.resourceId);
                if (resource) {
                  const assignments = getResourceAssignments(resource);

                  // Filter by view mode
                  let shouldShow = true;
                  if (viewMode === 'by-phase' && selectedPhaseId) {
                    shouldShow = assignments.phases.some(p => p.phaseId === selectedPhaseId) ||
                      assignments.tasks.some(t => t.phaseId === selectedPhaseId);
                  } else if (viewMode === 'by-task' && selectedTaskId) {
                    shouldShow = assignments.tasks.some(t => t.taskId === selectedTaskId);
                  }

                  if (shouldShow) {
                    subGroupResources.push({
                      id: position.id,
                      resource,
                      assignments,
                    });
                  }
                }
              }
            });

            // Only add sub-group if it has resources
            if (subGroupResources.length > 0) {
              groupSubGroups.push({
                subGroupId: subGroup.id,
                subGroupName: subGroup.name,
                resources: subGroupResources,
              });
            }
          });
        }

        // Only add group if it has resources at group level, sub-groups, or is level 0
        const hasContent = groupResources.length > 0 || groupSubGroups.length > 0 || levelIndex === 0;
        if (hasContent) {
          levelGroups.push({
            groupId: group.id,
            groupName: group.name,
            levelName: level.name,
            resources: groupResources,
            subGroups: groupSubGroups,
          });
        }
      });

      // Calculate positions for this level
      if (levelGroups.length > 0) {
        // Calculate total width needed for this level
        const totalWidth = levelGroups.reduce((sum, lg) => {
          // If group has sub-groups, calculate based on sub-groups
          if (lg.subGroups && lg.subGroups.length > 0) {
            const subGroupsWidth = lg.subGroups.reduce((sgSum: number, sg: any) => {
              return sgSum + (sg.resources.length * (nodeWidth + nodeSpacing));
            }, 0);
            return sum + subGroupsWidth + 200; // Extra spacing for sub-groups
          }
          // Otherwise calculate based on group-level resources
          return sum + (lg.resources.length * (nodeWidth + nodeSpacing)) + 100;
        }, 0);

        let xOffset = -totalWidth / 2;

        levelGroups.forEach((lg) => {
          // Add group node
          const groupNodeId = `group-${lg.groupId}`;

          // Calculate group center based on whether it has sub-groups or resources
          let groupWidth = 0;
          if (lg.subGroups && lg.subGroups.length > 0) {
            groupWidth = lg.subGroups.reduce((sgSum: number, sg: any) => {
              return sgSum + (sg.resources.length * (nodeWidth + nodeSpacing));
            }, 0);
          } else {
            groupWidth = lg.resources.length * (nodeWidth + nodeSpacing);
          }
          const groupX = xOffset + groupWidth / 2;

          nodes.push({
            id: groupNodeId,
            type: 'groupNode',
            position: { x: groupX, y: yOffset },
            data: {
              label: lg.groupName,
              designation: lg.levelName,
            },
          });

          // Connect group to root
          edges.push({
            id: `e-root-${groupNodeId}`,
            source: 'root',
            target: groupNodeId,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          });

          // Check if group has sub-groups
          if (lg.subGroups && lg.subGroups.length > 0) {
            // Render sub-groups
            let subGroupXOffset = xOffset;

            lg.subGroups.forEach((sg: any) => {
              const subGroupNodeId = `subgroup-${sg.subGroupId}`;
              const subGroupWidth = sg.resources.length * (nodeWidth + nodeSpacing);
              const subGroupX = subGroupXOffset + subGroupWidth / 2;

              // Add sub-group node
              nodes.push({
                id: subGroupNodeId,
                type: 'subGroupNode',
                position: { x: subGroupX, y: yOffset + levelSpacing },
                data: {
                  label: sg.subGroupName,
                  parentGroup: lg.groupName,
                },
              });

              // Connect sub-group to group
              edges.push({
                id: `e-${groupNodeId}-${subGroupNodeId}`,
                source: groupNodeId,
                target: subGroupNodeId,
                type: ConnectionLineType.SmoothStep,
                animated: false,
                style: { stroke: '#a5b4fc', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#a5b4fc' },
              });

              // Add resource nodes under this sub-group
              sg.resources.forEach((resData: any, idx: number) => {
                const resourceNodeId = resData.id;
                const resourceX = subGroupXOffset + idx * (nodeWidth + nodeSpacing);

                // Spotlight mode: highlight selected resource, dim others
                const isSpotlighted = spotlightResourceId && resData.resource.id === spotlightResourceId;
                const isDimmed = spotlightResourceId && resData.resource.id !== spotlightResourceId;

                nodes.push({
                  id: resourceNodeId,
                  type: 'resourceNode',
                  position: { x: resourceX, y: yOffset + (levelSpacing * 2) },
                  data: {
                    person: {
                      id: resData.resource.id,
                      name: resData.resource.name,
                      designation: RESOURCE_DESIGNATIONS[resData.resource.designation],
                      category: resData.resource.category,
                      projectRole: resData.resource.projectRole,
                      department: resData.resource.department,
                      resource: resData.resource,
                      assignments: resData.assignments,
                    },
                    isSpotlighted,
                    isDimmed,
                  },
                });

                // Connect resource to sub-group
                edges.push({
                  id: `e-${subGroupNodeId}-${resourceNodeId}`,
                  source: subGroupNodeId,
                  target: resourceNodeId,
                  type: ConnectionLineType.SmoothStep,
                  animated: false,
                  style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1' },
                });
              });

              subGroupXOffset += subGroupWidth;
            });

            xOffset += groupWidth + 200;
          } else {
            // No sub-groups, render resources directly under group (existing behavior)
            lg.resources.forEach((resData: any, idx: number) => {
              const resourceNodeId = resData.id;
              const resourceX = xOffset + idx * (nodeWidth + nodeSpacing);

              // Spotlight mode: highlight selected resource, dim others
              const isSpotlighted = spotlightResourceId && resData.resource.id === spotlightResourceId;
              const isDimmed = spotlightResourceId && resData.resource.id !== spotlightResourceId;

              nodes.push({
                id: resourceNodeId,
                type: 'resourceNode',
                position: { x: resourceX, y: yOffset + levelSpacing },
                data: {
                  person: {
                    id: resData.resource.id,
                    name: resData.resource.name,
                    designation: RESOURCE_DESIGNATIONS[resData.resource.designation],
                    category: resData.resource.category,
                    projectRole: resData.resource.projectRole,
                    department: resData.resource.department,
                    resource: resData.resource,
                    assignments: resData.assignments,
                  },
                  isSpotlighted,
                  isDimmed,
                },
              });

              // Connect resource to group
              edges.push({
                id: `e-${groupNodeId}-${resourceNodeId}`,
                source: groupNodeId,
                target: resourceNodeId,
                type: ConnectionLineType.SmoothStep,
                animated: false,
                style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1' },
              });
            });

            xOffset += lg.resources.length * (nodeWidth + nodeSpacing) + 100;
          }
        });

        yOffset += 400; // Increased spacing for sub-groups
      }
    });

    return { nodes, edges };
  }, [orgChart, currentProject, viewMode, selectedPhaseId, selectedTaskId]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No project data available
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function ReactOrgChartWrapper(props: ReactOrgChartWrapperProps) {
  return (
    <ReactFlowProvider>
      <OrgChartFlow {...props} />
    </ReactFlowProvider>
  );
}
