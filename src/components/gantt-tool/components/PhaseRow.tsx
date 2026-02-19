/**
 * Memoized Phase Row component for Gantt performance
 */
import React, { memo } from "react";
import { format, differenceInDays } from "date-fns";
import { ChevronDown, ChevronRight, ArrowRightToLine, MoveUp, MoveDown, Maximize2, Users, AlertTriangle } from "lucide-react";
import { Tooltip } from "antd";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import { formatDuration } from "@/lib/gantt-tool/formatters";
import { withOpacity } from "@/lib/design-system";
import type { GanttPhase, GanttProject } from "@/types/gantt-tool";

interface PhaseRowProps {
  phase: GanttPhase;
  phaseIndex: number;
  currentProject: GanttProject;
  startDate: Date;
  durationDays: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragState: any;
  focusedPhaseId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewSettings: any;
  handlers: {
    togglePhaseCollapse: (id: string) => void;
    autoAlignPhase: (id: string) => void;
    reorderPhase: (id: string, dir: "up" | "down") => void;
    handlePhaseClick: (id: string) => void;
    handlePhaseDoubleClick: (id: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleMouseDown: (e: React.MouseEvent, id: string, mode: any) => void;
    handlePhaseResourceDragOver: (e: React.DragEvent, id: string) => void;
    handlePhaseResourceDragLeave: (e: React.DragEvent) => void;
    handlePhaseResourceDrop: (e: React.DragEvent, id: string) => void;
  };
}

export const PhaseRow = memo(({
  phase,
  phaseIndex,
  currentProject,
  startDate,
  durationDays,
  selection,
  dragState,
  focusedPhaseId,
  viewSettings,
  handlers
}: PhaseRowProps) => {
  const phaseStart = new Date(phase.startDate);
  const phaseEnd = new Date(phase.endDate);
  const offsetDays = differenceInDays(phaseStart, startDate);
  const phaseDuration = differenceInDays(phaseEnd, phaseStart);
  
  const metrics = {
    left: (offsetDays / durationDays) * 100,
    width: (phaseDuration / durationDays) * 100,
    workingDays: calculateWorkingDaysInclusive(phase.startDate, phase.endDate, currentProject.holidays)
  };

  const isSelected = selection.selectedItemId === phase.id && selection.selectedItemType === "phase";
  const isDragging = dragState?.itemId === phase.id;
  const isFirstPhase = phaseIndex === 0;
  const isLastPhase = phaseIndex === currentProject.phases.length - 1;

  return (
    <div className="flex items-start group">
      {/* Phase Control column */}
      <div className="w-16 flex flex-col items-center gap-2 pt-6 flex-shrink-0 relative z-10">
        {phase.tasks.length > 0 && (
          <button
            onClick={() => handlers.togglePhaseCollapse(phase.id)}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 cursor-pointer"
          >
            {phase.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handlers.autoAlignPhase(phase.id); }}
          disabled={isFirstPhase}
          className={`p-1 rounded-full transition-all ${isFirstPhase ? "opacity-20" : "bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer"}`}
        >
          <ArrowRightToLine size={14} />
        </button>
        <div className="flex flex-col">
          <button onClick={(e) => { e.stopPropagation(); handlers.reorderPhase(phase.id, "up"); }} className="p-0.5 hover:text-blue-600"><MoveUp size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); handlers.reorderPhase(phase.id, "down"); }} className="p-0.5 hover:text-blue-600"><MoveDown size={12} /></button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 relative h-[95px]">
        {/* Title */}
        {(viewSettings?.showTitles ?? true) && (
          <div
            className="absolute z-20 flex justify-center text-sm font-bold text-gray-900 text-center"
            style={{ left: `${metrics.left}%`, width: `${metrics.width}%`, top: phase.collapsed ? '0px' : '36px' }}
          >
            {phase.name}
          </div>
        )}

        {/* Phase Bar */}
        <div
          className={`absolute h-14 rounded transition-all cursor-move
            ${isDragging ? "opacity-70 scale-105" : ""} 
            ${isSelected ? "ring-4 ring-blue-400" : ""}
          `}
          style={{
            left: `${metrics.left}%`,
            width: `${metrics.width}%`,
            top: phase.collapsed ? '74px' : '24px',
            background: `linear-gradient(180deg, ${phase.color} 0%, ${withOpacity(phase.color, 0.85)} 100%)`,
            border: `1px solid ${withOpacity("#ffffff", 0.15)}`,
          }}
          onClick={() => handlers.handlePhaseClick(phase.id)}
          onDoubleClick={() => handlers.handlePhaseDoubleClick(phase.id)}
          onMouseDown={(e) => handlers.handleMouseDown(e, phase.id, "move")}
          onDragOver={(e) => handlers.handlePhaseResourceDragOver(e, phase.id)}
          onDragLeave={handlers.handlePhaseResourceDragLeave}
          onDrop={(e) => handlers.handlePhaseResourceDrop(e, phase.id)}
        >
           <div className="p-2 h-full flex items-center justify-center text-white relative">
              {!focusedPhaseId && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlers.handlePhaseDoubleClick(phase.id); }}
                  className="absolute top-1 right-1 bg-yellow-400 text-gray-900 p-1 rounded z-20"
                >
                  <Maximize2 size={12} />
                </button>
              )}
              {/* Duration Badge */}
              <div className="absolute bottom-full mb-3 flex items-center justify-center w-full">
                 <span className="text-xs font-bold bg-black/40 h-6 px-1.5 rounded text-white border border-white/20 flex items-center">
                   {formatDuration(metrics.workingDays)}
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
});

PhaseRow.displayName = "PhaseRow";
