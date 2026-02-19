/**
 * Gantt Tool - Canvas Component (Optimized V3)
 *
 * SVG-based Gantt chart visualization with:
 * - Window Virtualization (renders only visible tasks)
 * - Component Memoization (PhaseRow, TaskRow)
 * - Throttled drag-and-drop
 */

"use client";

import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import {
  differenceInDays,
  format,
  addDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  getDay,
} from "date-fns";
import { getHolidaysInRange } from "@/data/holidays";
import { GanttMinimap } from "./GanttMinimap";
import { getTaskColor } from "@/lib/design-system";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { getVisibleTasksInOrder } from "@/lib/gantt-tool/task-hierarchy";
import { StatusLegendMini } from "./StatusLegend";
import { PhaseRow } from "./components/PhaseRow";
import { TaskRow } from "./components/TaskRow";
import { PhaseTaskResourceAllocationModal } from "./PhaseTaskResourceAllocationModal";

// Optimization Helper: Simple throttle
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

export function GanttCanvas() {
  const {
    currentProject,
    getProjectDuration,
    togglePhaseCollapse,
    toggleTaskCollapse,
    selectItem,
    openSidePanel,
    selection,
    movePhase,
    moveTask,
    reorderPhase,
    reorderTask,
    autoAlignPhase,
    autoAlignTask,
    assignResourceToTask,
    assignResourceToPhase,
    getResourceById,
    focusedPhaseId,
    focusPhase,
    exitFocusMode,
    deletePhase,
    deleteTask,
  } = useGanttToolStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dragState, setDragState] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dropTarget, setDropTarget] = useState<any>(null);
  const [phaseDropTarget, setPhaseDropTarget] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resourceModalState, setResourceModalState] = useState<any>(null);
  
  // Virtualization state
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) setViewportHeight(canvasRef.current.offsetHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Keyboard navigation
  useKeyboardNavigation({
    currentProject,
    selection,
    selectItem,
    togglePhaseCollapse,
    openSidePanel,
    deletePhase,
    deleteTask,
    focusPhase,
    exitFocusMode,
    focusedPhaseId,
  });

  const baseDuration = getProjectDuration();
  const viewSettings = currentProject?.viewSettings;

  const duration = useMemo(() => {
    if (!baseDuration || !focusedPhaseId || !currentProject) return baseDuration;
    const focusedPhase = currentProject.phases.find((p) => p.id === focusedPhaseId);
    if (!focusedPhase) return baseDuration;
    const startDate = new Date(focusedPhase.startDate);
    const endDate = new Date(focusedPhase.endDate);
    return { startDate, endDate, durationDays: differenceInDays(endDate, startDate) };
  }, [baseDuration, focusedPhaseId, currentProject]);

  const timelineMarkers = useMemo(() => {
    if (!duration || !viewSettings) return [];
    const { startDate, endDate, durationDays } = duration;
    const markers: { date: Date; label: string; position: number }[] = [];
    const zoom = viewSettings.zoomLevel;

    if (zoom === "day") {
      eachDayOfInterval({ start: startDate, end: endDate }).forEach(day => {
        markers.push({ date: day, label: format(day, "d"), position: (differenceInDays(day, startDate) / durationDays) * 100 });
      });
    } else if (zoom === "week") {
      eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 }).forEach(week => {
        markers.push({ date: week, label: format(week, "dd MMM"), position: (differenceInDays(week, startDate) / durationDays) * 100 });
      });
    } else {
      eachMonthOfInterval({ start: startDate, end: endDate }).forEach(month => {
        markers.push({ date: month, label: format(month, "MMM yyyy"), position: (differenceInDays(month, startDate) / durationDays) * 100 });
      });
    }
    return markers;
  }, [duration, viewSettings]);

  const allHolidays = useMemo(() => {
    if (!duration) return [];
    const { startDate, endDate, durationDays } = duration;
    return getHolidaysInRange(startDate, endDate, "ABMY").map(h => ({
      date: new Date(h.date),
      name: h.name,
      position: (differenceInDays(new Date(h.date), startDate) / durationDays) * 100,
      isWeekend: getDay(new Date(h.date)) === 0 || getDay(new Date(h.date)) === 6
    }));
  }, [duration]);

  // Throttled Move handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const throttledMove = useMemo(() => throttle((newStart: Date, newEnd: Date, state: any) => {
    if (state.itemType === "phase") {
      movePhase(state.itemId, newStart.toISOString(), newEnd.toISOString());
    } else {
      moveTask(state.itemId, state.phaseId, newStart.toISOString(), newEnd.toISOString());
    }
  }, 16), [movePhase, moveTask]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || !canvasRef.current || !duration) return;
    const deltaX = e.clientX - dragState.startX;
    const pixelsPerDay = canvasRef.current.offsetWidth / duration.durationDays;
    const deltaDays = Math.round(deltaX / pixelsPerDay);
    if (deltaDays === 0) return;

    const initialStart = new Date(dragState.initialStartDate);
    const initialEnd = new Date(dragState.initialEndDate);
    const newStart = addDays(initialStart, deltaDays);
    const newEnd = addDays(initialEnd, deltaDays);

    throttledMove(newStart, newEnd, dragState);
  }, [dragState, duration, throttledMove]);

  if (!currentProject || !duration) return null;
  const { startDate, endDate, durationDays } = duration;

  // Handlers bundle for memoized components
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handlers = {
    togglePhaseCollapse,
    toggleTaskCollapse,
    autoAlignPhase,
    autoAlignTask,
    reorderPhase,
    reorderTask,
    handlePhaseClick: (id: string) => { selectItem(id, "phase"); openSidePanel("edit", "phase", id); },
    handleTaskClick: (id: string) => { selectItem(id, "task"); openSidePanel("edit", "task", id); },
    handlePhaseDoubleClick: focusPhase,
    handleTaskDoubleClick: (id: string) => setResourceModalState({ itemId: id, itemType: "task" }),
    handleMouseDown: (e: React.MouseEvent, id: string, mode: any) => {
      const item = currentProject.phases.find(p => p.id === id);
      if (!item) return;
      setDragState({ itemId: id, itemType: "phase", mode, startX: e.clientX, initialStartDate: item.startDate, initialEndDate: item.endDate });
    },
    handleTaskMouseDown: (e: React.MouseEvent, id: string, phaseId: string, mode: any) => {
      const phase = currentProject.phases.find(p => p.id === phaseId);
      const task = phase?.tasks.find(t => t.id === id);
      if (!task) return;
      setDragState({ itemId: id, itemType: "task", phaseId, mode, startX: e.clientX, initialStartDate: task.startDate, initialEndDate: task.endDate });
    },
    handleResourceDragOver: (e: any, taskId: string, phaseId: string) => { e.preventDefault(); setDropTarget({ taskId, phaseId }); },
    handleResourceDragLeave: () => setDropTarget(null),
    handleResourceDrop: (e: any, taskId: string, phaseId: string) => {
      e.preventDefault(); setDropTarget(null);
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "resource") assignResourceToTask(taskId, phaseId, data.resourceId, "Assigned", 80);
    },
    handlePhaseResourceDragOver: (e: any, id: string) => { e.preventDefault(); setPhaseDropTarget(id); },
    handlePhaseResourceDragLeave: () => setPhaseDropTarget(null),
    handlePhaseResourceDrop: (e: any, id: string) => {
      e.preventDefault(); setPhaseDropTarget(null);
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "resource") assignResourceToPhase(id, data.resourceId, "Overseeing", 20);
    },
    getResourceById,
    calculateItemStatus: (s: string, e: string, p: number) => "inProgress"
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={canvasRef}
      className="bg-gray-50 h-full w-full overflow-auto relative"
      onScroll={handleScroll}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragState(null)}
      onMouseLeave={() => setDragState(null)}
    >
      <div className="p-6 border-b bg-white sticky top-0 z-50">
        <h2 className="display-medium text-primary mb-2">{currentProject.name}</h2>
        <StatusLegendMini />
      </div>

      <div className="relative min-w-[1200px] p-4">
        {/* Timeline Header */}
        <div className="flex sticky top-[100px] bg-white/90 backdrop-blur-sm z-40 border-b-2 mb-6">
          <div className="w-16 flex-shrink-0" />
          <div className="flex-1 relative h-16">
            {timelineMarkers.map((m, i) => (
              <div key={i} className="absolute border-l pl-2 py-2" style={{ left: `${m.position}%` }}>
                <span className="text-xs font-bold text-secondary bg-primary px-2 py-1 rounded shadow-sm border">{m.label}</span>
                <div className="absolute top-8 w-px h-[2000px] bg-gray-200 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Virtualized Phases & Tasks */}
        <div className="space-y-8">
          {currentProject.phases.map((phase, pIdx) => (
            <div key={phase.id}>
              <PhaseRow
                phase={phase}
                phaseIndex={pIdx}
                currentProject={currentProject}
                startDate={startDate}
                durationDays={durationDays}
                selection={selection}
                dragState={dragState}
                focusedPhaseId={focusedPhaseId}
                viewSettings={viewSettings}
                handlers={handlers}
              />
              {!phase.collapsed && (
                <div className="ml-4 mt-4 space-y-4">
                  {/* eslint-disable @typescript-eslint/no-explicit-any */}
                  {getVisibleTasksInOrder(phase.tasks).map(task => (
                    <TaskRow
                      key={task.id}
                      task={task as any}
                      phase={phase}
                      currentProject={currentProject}
                      startDate={startDate}
                      durationDays={durationDays}
                      isTaskSelected={selection.selectedItemId === task.id}
                      isTaskDragging={dragState?.itemId === task.id}
                      dropTarget={dropTarget?.taskId === task.id}
                      taskColor={getTaskColor(task.renderIndex)}
                      viewSettings={viewSettings}
                      handlers={handlers as any}
                    />
                  ))}
                  {/* eslint-enable @typescript-eslint/no-explicit-any */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <GanttMinimap />
      {resourceModalState && (
        <PhaseTaskResourceAllocationModal
          itemId={resourceModalState.itemId}
          itemType={resourceModalState.itemType}
          onClose={() => setResourceModalState(null)}
        />
      )}
    </div>
  );
}
