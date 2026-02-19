/**
 * Dependency Arrows Component
 *
 * Renders SVG arrows showing task dependencies on the Gantt chart.
 * Supports Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF), and Start-to-Finish (SF) relationships.
 */

"use client";

import { useMemo } from "react";
import type { GanttPhase } from "@/types/gantt-tool";
import { differenceInDays } from "date-fns";

interface TaskPosition {
  id: string;
  x: number; // Left edge position (%)
  y: number; // Top position (px)
  width: number; // Width (%)
  height: number; // Height (px)
  phaseId: string;
}

interface DependencyArrowsProps {
  phases: GanttPhase[];
  startDate: Date;
  endDate: Date;
  durationDays: number;
  containerWidth: number;
  containerHeight: number;
  viewportTop?: number;
}

type DependencyType = "FS" | "SS" | "FF" | "SF";

interface Dependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: DependencyType;
  sourceTask: TaskPosition;
  targetTask: TaskPosition;
}

export function DependencyArrows({
  phases,
  startDate,
  endDate,
  durationDays,
  containerWidth,
  containerHeight,
  viewportTop: _viewportTop = 0,
}: DependencyArrowsProps) {
  // Calculate all task positions
  const taskPositions = useMemo(() => {
    const positions: Map<string, TaskPosition> = new Map();
    let currentY = 100; // Start after header

    phases.forEach((phase) => {
      const phaseStartDate = new Date(phase.startDate);
      const phaseEndDate = new Date(phase.endDate);
      const phaseOffsetDays = differenceInDays(phaseStartDate, startDate);
      const phaseDurationDays = differenceInDays(phaseEndDate, phaseStartDate);

      const _phaseLeft = (phaseOffsetDays / durationDays) * 100;
      const _phaseWidth = (phaseDurationDays / durationDays) * 100;

      // Phase row height
      const phaseHeight = phase.collapsed ? 100 : 120; // Approximate

      if (!phase.collapsed && phase.tasks.length > 0) {
        // Tasks are visible
        phase.tasks.forEach((task, taskIdx) => {
          const taskStartDate = new Date(task.startDate);
          const taskEndDate = new Date(task.endDate);
          const taskOffsetDays = differenceInDays(taskStartDate, startDate);
          const taskDurationDays = differenceInDays(taskEndDate, taskStartDate);

          const taskLeft = (taskOffsetDays / durationDays) * 100;
          const taskWidth = (taskDurationDays / durationDays) * 100;

          // Calculate Y position (approximate)
          const taskY = currentY + phaseHeight + taskIdx * 70; // ~70px per task row

          positions.set(task.id, {
            id: task.id,
            x: taskLeft,
            y: taskY,
            width: taskWidth,
            height: 32, // Task bar height
            phaseId: phase.id,
          });
        });

        currentY += phaseHeight + phase.tasks.length * 70;
      } else {
        currentY += phaseHeight;
      }
    });

    return positions;
  }, [phases, startDate, durationDays]);

  // Extract all dependencies
  const dependencies = useMemo(() => {
    const deps: Dependency[] = [];

    phases.forEach((phase) => {
      if (!phase.collapsed) {
        phase.tasks.forEach((task) => {
          if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach((depId) => {
              const sourcePos = taskPositions.get(depId);
              const targetPos = taskPositions.get(task.id);

              if (sourcePos && targetPos) {
                // Default to Finish-to-Start dependency
                deps.push({
                  id: `${depId}-${task.id}`,
                  sourceTaskId: depId,
                  targetTaskId: task.id,
                  type: "FS",
                  sourceTask: sourcePos,
                  targetTask: targetPos,
                });
              }
            });
          }
        });
      }
    });

    return deps;
  }, [phases, taskPositions]);

  // Generate SVG path for arrow
  const generateArrowPath = (dep: Dependency): string => {
    const { sourceTask, targetTask, type } = dep;

    // Convert percentages to pixels
    const sourceX = (sourceTask.x * containerWidth) / 100;
    const sourceWidth = (sourceTask.width * containerWidth) / 100;
    const targetX = (targetTask.x * containerWidth) / 100;
    const targetWidth = (targetTask.width * containerWidth) / 100;

    let startX: number, startY: number, endX: number, endY: number;

    // Determine start and end points based on dependency type
    switch (type) {
      case "FS": // Finish-to-Start (default)
        startX = sourceX + sourceWidth; // Right edge of source
        startY = sourceTask.y + sourceTask.height / 2;
        endX = targetX; // Left edge of target
        endY = targetTask.y + targetTask.height / 2;
        break;

      case "SS": // Start-to-Start
        startX = sourceX; // Left edge of source
        startY = sourceTask.y + sourceTask.height / 2;
        endX = targetX; // Left edge of target
        endY = targetTask.y + targetTask.height / 2;
        break;

      case "FF": // Finish-to-Finish
        startX = sourceX + sourceWidth; // Right edge of source
        startY = sourceTask.y + sourceTask.height / 2;
        endX = targetX + targetWidth; // Right edge of target
        endY = targetTask.y + targetTask.height / 2;
        break;

      case "SF": // Start-to-Finish (rare)
        startX = sourceX; // Left edge of source
        startY = sourceTask.y + sourceTask.height / 2;
        endX = targetX + targetWidth; // Right edge of target
        endY = targetTask.y + targetTask.height / 2;
        break;

      default:
        startX = sourceX + sourceWidth;
        startY = sourceTask.y + sourceTask.height / 2;
        endX = targetX;
        endY = targetTask.y + targetTask.height / 2;
    }

    // Create curved path (Bezier curve for smooth look)
    const midX = (startX + endX) / 2;

    // Use quadratic Bezier curve
    return `M ${startX},${startY} Q ${midX},${startY} ${midX},${(startY + endY) / 2} Q ${midX},${endY} ${endX},${endY}`;
  };

  // Arrow color based on dependency type
  const getArrowColor = (type: DependencyType): string => {
    switch (type) {
      case "FS":
        return "#3B82F6"; // Blue (most common)
      case "SS":
        return "#10B981"; // Green
      case "FF":
        return "#F59E0B"; // Amber
      case "SF":
        return "#8B5CF6"; // Purple (rare)
      default:
        return "#3B82F6";
    }
  };

  // Get dependency type label
  const getDependencyLabel = (type: DependencyType): string => {
    switch (type) {
      case "FS":
        return "Finish-to-Start";
      case "SS":
        return "Start-to-Start";
      case "FF":
        return "Finish-to-Finish";
      case "SF":
        return "Start-to-Finish";
      default:
        return "Finish-to-Start";
    }
  };

  if (dependencies.length === 0) {
    return null; // No dependencies to render
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: containerWidth,
        height: containerHeight,
        zIndex: 5, // Above grid but below tasks
      }}
    >
      {/* Arrow marker definitions */}
      <defs>
        {["FS", "SS", "FF", "SF"].map((type) => (
          <marker
            key={`arrowhead-${type}`}
            id={`arrowhead-${type}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3, 0 6" fill={getArrowColor(type as DependencyType)} />
          </marker>
        ))}
      </defs>

      {/* Render all dependency arrows */}
      {dependencies.map((dep) => {
        const path = generateArrowPath(dep);
        const color = getArrowColor(dep.type);
        const label = getDependencyLabel(dep.type);

        return (
          <g key={dep.id} className="dependency-arrow group">
            {/* Invisible wider path for easier hovering */}
            <path
              d={path}
              stroke="transparent"
              strokeWidth="12"
              fill="none"
              className="pointer-events-auto cursor-help"
            >
              <title>
                Dependency: {label}
                {"\n"}From: Task {dep.sourceTaskId.slice(-6)}
                {"\n"}To: Task {dep.targetTaskId.slice(-6)}
              </title>
            </path>

            {/* Visible arrow path */}
            <path
              d={path}
              stroke={color}
              strokeWidth="2"
              fill="none"
              markerEnd={`url(#arrowhead-${dep.type})`}
              className="transition-all duration-200 group-hover:stroke-[3px] pointer-events-none"
              strokeDasharray={dep.type === "FS" ? "none" : "4,4"} // Dashed for non-FS types
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Usage Example:
 *
 * <div className="relative">
 *   <DependencyArrows
 *     phases={currentProject.phases}
 *     startDate={projectStartDate}
 *     endDate={projectEndDate}
 *     durationDays={totalDays}
 *     containerWidth={1200}
 *     containerHeight={2000}
 *   />
 *   <GanttCanvas />
 * </div>
 */
