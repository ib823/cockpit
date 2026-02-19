/**
 * Memoized Task Row component for Gantt performance
 */
import React, { memo } from "react";
import { format, differenceInDays } from "date-fns";
import { ArrowRightToLine, MoveUp, MoveDown, ChevronRight, ChevronDown, Users, AlertTriangle } from "lucide-react";
import { Tooltip } from "antd";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import { formatWorkingDays } from "@/lib/gantt-tool/date-utils";
import { withOpacity, GANTT_STATUS_COLORS, GANTT_STATUS_LABELS } from "@/lib/design-system";
import type { GanttTask, GanttPhase, GanttProject } from "@/types/gantt-tool";

interface TaskRowProps {
  task: GanttTask & { renderIndex: number; level: number; isParent?: boolean; collapsed?: boolean };
  phase: GanttPhase;
  currentProject: GanttProject;
  startDate: Date;
  durationDays: number;
  isTaskSelected: boolean;
  isTaskDragging: boolean;
  dropTarget: boolean;
  taskColor: string;
  viewSettings: unknown;
  handlers: {
    autoAlignTask: (id: string, phaseId: string) => void;
    reorderTask: (id: string, phaseId: string, dir: "up" | "down") => void;
    toggleTaskCollapse: (id: string, phaseId: string) => void;
    handleTaskClick: (id: string) => void;
    handleTaskDoubleClick: (id: string) => void;
    handleTaskMouseDown: (e: React.MouseEvent, id: string, phaseId: string, mode: unknown) => void;
    handleResourceDragOver: (e: React.DragEvent, id: string, phaseId: string) => void;
    handleResourceDragLeave: (e: React.DragEvent) => void;
    handleResourceDrop: (e: React.DragEvent, id: string, phaseId: string) => void;
    getResourceById: (id: string) => Record<string, unknown> | undefined;
    calculateItemStatus: (start: string, end: string, progress: number) => string;
  };
}

export const TaskRow = memo(({
  task,
  phase,
  currentProject,
  startDate,
  durationDays,
  isTaskSelected,
  isTaskDragging,
  dropTarget,
  taskColor,
  viewSettings,
  handlers
}: TaskRowProps) => {
  const taskIdx = task.renderIndex;
  const isFirstTask = taskIdx === 0;
  // Simplified for MVP reorder logic in subcomponent
  const isLastTask = false; 

  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);
  const taskOffset = differenceInDays(taskStart, startDate);
  const taskDuration = differenceInDays(taskEnd, taskStart);
  const taskLeft = (taskOffset / durationDays) * 100;
  const taskWidth = (taskDuration / durationDays) * 100;

  const taskWorkingDays = calculateWorkingDaysInclusive(
    task.startDate,
    task.endDate,
    currentProject.holidays
  );

  const phaseStartDate = new Date(phase.startDate);
  const phaseEndDate = new Date(phase.endDate);
  const taskExceedsPhase = taskStart < phaseStartDate || taskEnd > phaseEndDate;

  return (
    <div
      className="flex items-start group/task relative"
      style={{ paddingLeft: `${task.level * 24}px` }}
    >
      {/* Control Column */}
      <div className="w-14 flex flex-col items-center gap-2 pt-1 flex-shrink-0 relative z-10">
        <button
          onClick={(e) => { e.stopPropagation(); handlers.autoAlignTask(task.id, phase.id); }}
          disabled={isFirstTask}
          className={`p-1 rounded-full transition-all shadow-sm ${
            isFirstTask ? "opacity-20 cursor-not-allowed bg-gray-200" : "bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer"
          }`}
          title="Auto-align"
        >
          <ArrowRightToLine className="w-3.5 h-3.5" />
        </button>
        <div className="flex flex-col opacity-0 group-hover/task:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); handlers.reorderTask(task.id, phase.id, "up"); }} className="p-0.5 hover:text-blue-600 cursor-pointer"><MoveUp className="w-3 h-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); handlers.reorderTask(task.id, phase.id, "down"); }} className="p-0.5 hover:text-blue-600 cursor-pointer"><MoveDown className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Hierarchy Button */}
      {task.isParent && (
        <div className="w-8 flex items-center justify-center flex-shrink-0 pt-6">
          <button
            onClick={(e) => { e.stopPropagation(); handlers.toggleTaskCollapse(task.id, phase.id); }}
            className="p-1 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
          >
            {task.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}
      {!task.isParent && task.level > 0 && <div className="w-8 flex-shrink-0" />}

      {/* Timeline Area */}
      <div className="flex-1 relative h-[65px]">
        <div
          className={`absolute top-1 h-8 rounded transition-all cursor-move hover:-translate-y-0.5 hover:shadow-xl
            ${isTaskDragging ? "opacity-60 scale-105 z-10" : ""}
            ${isTaskSelected ? "ring-2 ring-offset-1 ring-blue-400" : ""}
            ${dropTarget ? "ring-4 ring-purple-500 ring-offset-2 scale-110" : ""}
            ${taskExceedsPhase ? "ring-2 ring-red-500 ring-offset-1" : ""}
          `}
          style={{
            left: `${taskLeft}%`,
            width: `${taskWidth}%`,
            background: `linear-gradient(180deg, ${taskColor} 0%, ${withOpacity(taskColor, 0.88)} 100%)`,
            border: taskExceedsPhase ? `2px solid #ef4444` : `2px solid ${withOpacity(taskColor, 0.3)}`,
          }}
          onClick={(e) => { e.stopPropagation(); handlers.handleTaskClick(task.id); }}
          onDoubleClick={() => handlers.handleTaskDoubleClick(task.id)}
          onMouseDown={(e) => handlers.handleTaskMouseDown(e, task.id, phase.id, "move")}
          onDragOver={(e) => handlers.handleResourceDragOver(e, task.id, phase.id)}
          onDragLeave={handlers.handleResourceDragLeave}
          onDrop={(e) => handlers.handleResourceDrop(e, task.id, phase.id)}
        >
          {/* Status/Progress/Owner Icons - Minimal Logic for Performance */}
          <div className="h-full relative overflow-hidden rounded">
             {task.progress > 0 && task.progress < 100 && (
               <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                 <div className="h-full bg-white/90 transition-all duration-300" style={{ width: `${task.progress}%` }} />
               </div>
             )}
          </div>
        </div>

        {/* Task Label */}
        <div 
          className="absolute top-10 flex flex-col pointer-events-none"
          style={{ left: `${taskLeft}%`, width: `${taskWidth}%`, minWidth: '200px' }}
        >
          <span className={`text-xs font-semibold truncate ${taskExceedsPhase ? "text-red-600" : "text-gray-700"}`}>
            {task.name}
          </span>
          <div className="flex items-center gap-2 mt-0.5 opacity-60">
            <span className="text-[10px] font-bold">{formatWorkingDays(taskWorkingDays)}</span>
            {task.resourceAssignments && task.resourceAssignments.length > 0 && (
              <div className="flex items-center gap-1">
                <Users size={10} />
                <span className="text-[10px]">{task.resourceAssignments.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TaskRow.displayName = "TaskRow";
