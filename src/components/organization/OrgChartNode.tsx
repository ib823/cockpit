/**
 * Organization Chart Node Component
 *
 * Custom ReactFlow node for displaying resource information in the org chart.
 * Shows resource details, category badge, and direct reports count.
 */

"use client";

import { memo, useMemo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Users, Mail, MapPin, Briefcase, Calendar, CheckSquare } from "lucide-react";
import { Badge, Tag, Tooltip } from "antd";
import { TeamOutlined, CalendarOutlined, CheckSquareOutlined } from "@ant-design/icons";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";
import type { OrgChartNode } from "@/lib/organization/layout-calculator";
import { useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { withOpacity, getElevationShadow } from "@/lib/design-system";

export const OrgChartNodeComponent = memo(({ data, selected }: NodeProps<OrgChartNode["data"]>) => {
  const categoryInfo = RESOURCE_CATEGORIES[data.category];
  const designationLabel = RESOURCE_DESIGNATIONS[data.designation];
  const currentProject = useGanttToolStore((state) => state.currentProject);

  // Calculate phase and task assignments for this resource
  const assignments = useMemo(() => {
    if (!currentProject) return { phases: [], tasks: [], primaryPhase: null };

    const phaseAssignments: Array<{ phaseId: string; phaseName: string; phaseColor: string }> = [];
    const taskAssignments: Array<{ taskId: string; taskName: string; phaseId: string }> = [];

    currentProject.phases.forEach((phase) => {
      // Check phase-level assignments (PM resources)
      if (phase.phaseResourceAssignments?.some((a) => a.resourceId === data.resource.id)) {
        phaseAssignments.push({
          phaseId: phase.id,
          phaseName: phase.name,
          phaseColor: phase.color || "#94a3b8",
        });
      }

      // Check task-level assignments
      phase.tasks.forEach((task) => {
        if (task.resourceAssignments?.some((a) => a.resourceId === data.resource.id)) {
          taskAssignments.push({
            taskId: task.id,
            taskName: task.name,
            phaseId: phase.id,
          });
        }
      });
    });

    // Determine primary phase (first phase assignment or phase with most tasks)
    let primaryPhase = phaseAssignments[0] || null;
    if (!primaryPhase && taskAssignments.length > 0) {
      // Group tasks by phase
      const tasksByPhase = new Map<string, number>();
      taskAssignments.forEach((t) => {
        tasksByPhase.set(t.phaseId, (tasksByPhase.get(t.phaseId) || 0) + 1);
      });
      // Find phase with most tasks
      const [primaryPhaseId] =
        Array.from(tasksByPhase.entries()).sort((a, b) => b[1] - a[1])[0] || [];
      if (primaryPhaseId) {
        const phase = currentProject.phases.find((p) => p.id === primaryPhaseId);
        if (phase) {
          primaryPhase = {
            phaseId: phase.id,
            phaseName: phase.name,
            phaseColor: phase.color || "#94a3b8",
          };
        }
      }
    }

    return { phases: phaseAssignments, tasks: taskAssignments, primaryPhase };
  }, [currentProject, data.resource.id]);

  // Determine if resource is actively working (has phase or task assignments)
  const isActivelyWorking = assignments.phases.length > 0 || assignments.tasks.length > 0;
  const totalWorkload = assignments.phases.length + assignments.tasks.length;

  return (
    <div
      className={`
        bg-white rounded-xl border-2 transition-all duration-200 hover:scale-102
        ${selected ? "border-blue-500 scale-105" : isActivelyWorking ? "border-green-400 hover:border-green-500" : "border-gray-200 hover:border-gray-300"}
        w-[240px] relative overflow-hidden
      `}
      style={{
        borderLeftWidth: assignments.primaryPhase ? "6px" : "2px",
        borderLeftColor: assignments.primaryPhase?.phaseColor || undefined,
        boxShadow: selected
          ? `${getElevationShadow(4)}, 0 0 0 4px ${withOpacity("#3B82F6", 0.1)}`
          : isActivelyWorking
            ? `${getElevationShadow(3)}, 0 0 0 2px ${withOpacity("#10B981", 0.05)}`
            : getElevationShadow(2),
      }}
    >
      {/* Manager Connection Handle (Top) - Hidden by default */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white !opacity-0 hover:!opacity-100 transition-opacity"
      />

      {/* Compact Header */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{categoryInfo.icon}</span>
            <span className="text-xs font-medium text-gray-500 uppercase">
              {categoryInfo.label.split(" ")[0]}
            </span>
          </div>
          {data.directReportsCount > 0 && (
            <Badge
              count={data.directReportsCount}
              showZero={false}
              style={{ backgroundColor: "#52c41a" }}
              className="text-xs"
              overflowCount={99}
            />
          )}
        </div>

        {/* Name - Primary Focus */}
        <div className="mb-1">
          <div className="font-bold text-gray-900 text-base leading-tight mb-0.5">{data.label}</div>
          <div className="text-xs text-gray-500">{designationLabel}</div>
        </div>

        {/* Project Role if present */}
        {data.projectRole && (
          <div className="text-xs text-gray-600 italic mb-2 truncate">{data.projectRole}</div>
        )}
      </div>

      {/* Work Status - Jobs/Ive: "Show what matters, hide what doesn't" */}
      {isActivelyWorking ? (
        <div
          className="px-3 py-2 border-t border-gray-100"
          style={{
            backgroundColor: assignments.primaryPhase?.phaseColor
              ? `${assignments.primaryPhase.phaseColor}10`
              : "#f0fdf4",
          }}
        >
          {/* Primary Phase Tag */}
          {assignments.primaryPhase && (
            <div className="mb-1.5">
              <Tag
                style={{
                  margin: 0,
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: assignments.primaryPhase.phaseColor,
                  color: "white",
                  border: "none",
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
                    <div className="font-semibold mb-1">
                      Managing {assignments.phases.length} Phase
                      {assignments.phases.length > 1 ? "s" : ""}:
                    </div>
                    {assignments.phases.map((p) => (
                      <div key={p.phaseId} className="text-xs">
                        • {p.phaseName}
                      </div>
                    ))}
                  </div>
                }
              >
                <div className="flex items-center gap-1 text-xs">
                  <CalendarOutlined className="text-xs" style={{ color: "#1890ff" }} />
                  <span className="font-semibold text-blue-600">{assignments.phases.length}</span>
                </div>
              </Tooltip>
            )}

            {assignments.tasks.length > 0 && (
              <Tooltip
                title={
                  <div>
                    <div className="font-semibold mb-1">
                      {assignments.tasks.length} Assigned Task
                      {assignments.tasks.length > 1 ? "s" : ""}:
                    </div>
                    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                      {assignments.tasks.slice(0, 10).map((t) => (
                        <div key={t.taskId} className="text-xs">
                          • {t.taskName}
                        </div>
                      ))}
                      {assignments.tasks.length > 10 && (
                        <div className="text-xs text-gray-400 mt-1">
                          + {assignments.tasks.length - 10} more...
                        </div>
                      )}
                    </div>
                  </div>
                }
              >
                <div className="flex items-center gap-1 text-xs">
                  <CheckSquareOutlined className="text-xs" style={{ color: "#722ed1" }} />
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

      {/* Direct Reports Connection Handle (Bottom) - Hidden by default */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white !opacity-0 hover:!opacity-100 transition-opacity"
      />

      {/* Active Work Indicator Badge */}
      {isActivelyWorking && (
        <div
          className="absolute -top-2 -right-2 bg-gradient-to-br from-green-400 to-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse border-2 border-white"
          style={{
            boxShadow: `${getElevationShadow(3)}, 0 0 12px ${withOpacity("#10B981", 0.5)}`,
          }}
        >
          {totalWorkload}
        </div>
      )}
    </div>
  );
});

OrgChartNodeComponent.displayName = "OrgChartNode";
