/**
 * Gantt Tool - Canvas Component
 *
 * SVG-based Gantt chart visualization with drag-and-drop support.
 * Features: Phases, Tasks, Milestones, Holidays, Interactive editing
 */

'use client';

import { useGanttToolStoreV2 as useGanttToolStore } from '@/stores/gantt-tool-store-v2';
import { useMemo, useRef, useState, useCallback } from 'react';
import { differenceInDays, format, addDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval, eachYearOfInterval, startOfWeek, startOfMonth, startOfQuarter, startOfYear, getDay, getMonth, getQuarter } from 'date-fns';
import { ChevronDown, ChevronRight, Flag, Users, ChevronUp, MoveUp, MoveDown, ArrowRightToLine, Maximize2 } from 'lucide-react';
import type { GanttPhase } from '@/types/gantt-tool';
import { getHolidaysInRange } from '@/data/holidays';
import { formatGanttDate, formatDuration, formatDurationCompact, formatWorkingDays, formatCalendarDuration } from '@/lib/gantt-tool/date-utils';
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS, canAssignToPhase } from '@/types/gantt-tool';
import { calculateWorkingDaysInclusive } from '@/lib/gantt-tool/working-days';
import { PhaseTaskResourceAllocationModal } from './PhaseTaskResourceAllocationModal';
import { GanttMinimap } from './GanttMinimap';
import { Tooltip } from 'antd';
import { getTaskColor as getTaskColorFromDesignSystem, withOpacity, getElevationShadow } from '@/lib/design-system';

// Get consistent color for a task based on its index within the phase
// Now using professional colors from the centralized design system
const getTaskColor = (taskIndex: number): string => {
  return getTaskColorFromDesignSystem(taskIndex);
};

export function GanttCanvas() {
  const {
    currentProject,
    getProjectDuration,
    togglePhaseCollapse,
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
  } = useGanttToolStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    itemId: string | null;
    itemType: 'phase' | 'task' | null;
    phaseId?: string | null;
    mode: 'move' | 'resize-start' | 'resize-end' | null;
    startX: number;
    initialStartDate: string;
    initialEndDate: string;
    hasMoved: boolean;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ taskId: string; phaseId: string } | null>(null);
  const [phaseDropTarget, setPhaseDropTarget] = useState<string | null>(null);
  const [resourceModalState, setResourceModalState] = useState<{ itemId: string; itemType: 'phase' | 'task' } | null>(null);

  // Get duration before any early returns to maintain hook order
  // RTS Focus Mode: Override duration to show only focused phase
  let baseDuration = getProjectDuration();
  const viewSettings = currentProject?.viewSettings;

  // If in focus mode, calculate duration for focused phase only
  const duration = useMemo(() => {
    if (!baseDuration || !focusedPhaseId || !currentProject) return baseDuration;

    const focusedPhase = currentProject.phases.find(p => p.id === focusedPhaseId);
    if (!focusedPhase) return baseDuration;

    const startDate = new Date(focusedPhase.startDate);
    const endDate = new Date(focusedPhase.endDate);
    const durationDays = differenceInDays(endDate, startDate);

    return { startDate, endDate, durationDays };
  }, [baseDuration, focusedPhaseId, currentProject]);

  // Generate timeline markers based on zoom level
  // This hook must be called on every render, so we handle null cases inside
  const timelineMarkers = useMemo(() => {
    if (!duration || !viewSettings) return [];

    const { startDate, endDate, durationDays } = duration;
    const markers: Array<{ date: Date; label: string; position: number }> = [];

    switch (viewSettings.zoomLevel) {
      case 'day':
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        days.forEach((day) => {
          const offset = differenceInDays(day, startDate);
          const position = (offset / durationDays) * 100;
          markers.push({
            date: day,
            label: format(day, 'd'),
            position,
          });
        });
        break;

      case 'week':
        const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
        weeks.forEach((week) => {
          const offset = differenceInDays(week, startDate);
          const position = (offset / durationDays) * 100;
          markers.push({
            date: week,
            label: format(week, 'dd MMM'),
            position,
          });
        });
        break;

      case 'month':
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        months.forEach((month) => {
          const offset = differenceInDays(month, startDate);
          const position = (offset / durationDays) * 100;
          markers.push({
            date: month,
            label: format(month, 'MMM yyyy'),
            position,
          });
        });
        break;

      case 'quarter':
        const quarters = eachQuarterOfInterval({ start: startDate, end: endDate });
        quarters.forEach((quarter) => {
          const offset = differenceInDays(quarter, startDate);
          const position = (offset / durationDays) * 100;
          const quarterNum = getQuarter(quarter);
          markers.push({
            date: quarter,
            label: `Q${quarterNum} ${format(quarter, 'yyyy')}`,
            position,
          });
        });
        break;

      case 'half-year':
        // Generate half-yearly markers (Jan and Jul of each year)
        const years = eachYearOfInterval({ start: startDate, end: endDate });
        years.forEach((year) => {
          // First half (January)
          const h1 = new Date(year.getFullYear(), 0, 1);
          if (h1 >= startDate && h1 <= endDate) {
            const offset = differenceInDays(h1, startDate);
            const position = (offset / durationDays) * 100;
            markers.push({
              date: h1,
              label: `H1 ${format(h1, 'yyyy')}`,
              position,
            });
          }

          // Second half (July)
          const h2 = new Date(year.getFullYear(), 6, 1);
          if (h2 >= startDate && h2 <= endDate) {
            const offset = differenceInDays(h2, startDate);
            const position = (offset / durationDays) * 100;
            markers.push({
              date: h2,
              label: `H2 ${format(h2, 'yyyy')}`,
              position,
            });
          }
        });

        // Add final year if project extends beyond the years we generated
        const finalYear = endDate.getFullYear();
        const lastGeneratedYear = years[years.length - 1]?.getFullYear() || 0;
        if (finalYear > lastGeneratedYear) {
          const h1 = new Date(finalYear, 0, 1);
          const h2 = new Date(finalYear, 6, 1);

          if (h1 >= startDate && h1 <= endDate) {
            const offset = differenceInDays(h1, startDate);
            const position = (offset / durationDays) * 100;
            markers.push({
              date: h1,
              label: `H1 ${format(h1, 'yyyy')}`,
              position,
            });
          }

          if (h2 >= startDate && h2 <= endDate) {
            const offset = differenceInDays(h2, startDate);
            const position = (offset / durationDays) * 100;
            markers.push({
              date: h2,
              label: `H2 ${format(h2, 'yyyy')}`,
              position,
            });
          }
        }
        break;

      case 'year':
        const yearMarkers = eachYearOfInterval({ start: startDate, end: endDate });
        yearMarkers.forEach((year) => {
          const offset = differenceInDays(year, startDate);
          const position = (offset / durationDays) * 100;
          markers.push({
            date: year,
            label: format(year, 'yyyy'),
            position,
          });
        });
        break;
    }

    return markers;
  }, [duration, viewSettings]);

  // Calculate all holidays (including weekends) to display on timeline
  const allHolidays = useMemo(() => {
    if (!duration) return [];

    const { startDate, endDate, durationDays } = duration;
    const holidays = getHolidaysInRange(startDate, endDate, 'ABMY');

    // Include all holidays, even those on weekends
    return holidays.map(holiday => {
      const holidayDate = new Date(holiday.date);
      const dayOfWeek = getDay(holidayDate);
      const offset = differenceInDays(holidayDate, startDate);
      const position = (offset / durationDays) * 100;

      return {
        date: holidayDate,
        name: holiday.name,
        position,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      };
    });
  }, [duration]);

  // Drag handlers - must be defined before any early returns
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !canvasRef.current || !duration) return;

      const deltaX = e.clientX - dragState.startX;
      const canvasWidth = canvasRef.current.offsetWidth;
      const pixelsPerDay = canvasWidth / duration.durationDays;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      // Mark as moved if there's any significant drag (more than 5 pixels)
      if (Math.abs(deltaX) > 5 && !dragState.hasMoved) {
        setDragState({ ...dragState, hasMoved: true });
      }

      if (deltaDays === 0) return;

      const initialStart = new Date(dragState.initialStartDate);
      const initialEnd = new Date(dragState.initialEndDate);

      let newStartDate: Date;
      let newEndDate: Date;

      switch (dragState.mode) {
        case 'move':
          newStartDate = addDays(initialStart, deltaDays);
          newEndDate = addDays(initialEnd, deltaDays);
          break;

        case 'resize-start':
          newStartDate = addDays(initialStart, deltaDays);
          newEndDate = initialEnd;
          // Prevent start from going past end
          if (newStartDate >= newEndDate) {
            newStartDate = addDays(newEndDate, -1);
          }
          break;

        case 'resize-end':
          newStartDate = initialStart;
          newEndDate = addDays(initialEnd, deltaDays);
          // Prevent end from going before start
          if (newEndDate <= newStartDate) {
            newEndDate = addDays(newStartDate, 1);
          }
          break;

        default:
          return;
      }

      if (dragState.itemType === 'phase' && dragState.itemId) {
        movePhase(dragState.itemId, newStartDate.toISOString(), newEndDate.toISOString());
      } else if (dragState.itemType === 'task' && dragState.phaseId && dragState.itemId) {
        // Validate task stays within phase boundaries
        const phase = currentProject?.phases.find(p => p.id === dragState.phaseId);
        if (phase) {
          const phaseStart = new Date(phase.startDate);
          const phaseEnd = new Date(phase.endDate);

          // Clamp task dates to phase boundaries
          if (newStartDate < phaseStart) {
            const diff = differenceInDays(newEndDate, newStartDate);
            newStartDate = phaseStart;
            newEndDate = addDays(newStartDate, diff);
          }
          if (newEndDate > phaseEnd) {
            const diff = differenceInDays(newEndDate, newStartDate);
            newEndDate = phaseEnd;
            newStartDate = addDays(newEndDate, -diff);
            if (newStartDate < phaseStart) {
              newStartDate = phaseStart;
            }
          }

          moveTask(dragState.itemId, dragState.phaseId, newStartDate.toISOString(), newEndDate.toISOString());
        }
      }
    },
    [dragState, duration, movePhase, moveTask, currentProject]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Now we can safely do early returns after all hooks are called
  if (!currentProject) return null;

  if (!duration) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="mb-2">No phases yet</p>
          <button
            onClick={() => openSidePanel('add', 'phase')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Phase
          </button>
        </div>
      </div>
    );
  }

  const { startDate, endDate, durationDays } = duration;

  // Calculate phase position and width
  const getPhaseMetrics = (phase: GanttPhase) => {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    const offsetDays = differenceInDays(phaseStart, startDate);
    const phaseDuration = differenceInDays(phaseEnd, phaseStart); // Calendar days for positioning

    // Calculate working days for display
    const workingDays = calculateWorkingDaysInclusive(
      phase.startDate,
      phase.endDate,
      currentProject.holidays
    );

    return {
      left: (offsetDays / durationDays) * 100,
      width: (phaseDuration / durationDays) * 100,
      duration: phaseDuration, // Calendar days (for positioning)
      workingDays, // Working days (for display)
    };
  };

  // Drag handler for phases
  const handleMouseDown = (e: React.MouseEvent, phaseId: string, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();

    const phase = currentProject.phases.find((p) => p.id === phaseId);
    if (!phase) return;

    setDragState({
      itemId: phaseId,
      itemType: 'phase',
      mode,
      startX: e.clientX,
      initialStartDate: phase.startDate,
      initialEndDate: phase.endDate,
      hasMoved: false,
    });
  };

  // Drag handler for tasks
  const handleTaskMouseDown = (e: React.MouseEvent, taskId: string, phaseId: string, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();

    const phase = currentProject.phases.find((p) => p.id === phaseId);
    if (!phase) return;

    const task = phase.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setDragState({
      itemId: taskId,
      itemType: 'task',
      phaseId: phaseId,
      mode,
      startX: e.clientX,
      initialStartDate: task.startDate,
      initialEndDate: task.endDate,
      hasMoved: false,
    });
  };

  // Handle click to open edit panel (only if not dragging)
  const handlePhaseClick = (phaseId: string) => {
    if (dragState?.hasMoved) return; // Don't open panel if we were dragging
    selectItem(phaseId, 'phase');
    openSidePanel('edit', 'phase', phaseId);
  };

  const handleTaskClick = (taskId: string) => {
    if (dragState?.hasMoved) return; // Don't open panel if we were dragging
    selectItem(taskId, 'task');
    openSidePanel('edit', 'task', taskId);
  };

  // Handle focus mode activation (RTS-style zoom)
  const handlePhaseDoubleClick = (phaseId: string) => {
    if (dragState?.hasMoved) return;
    focusPhase(phaseId);
  };

  const handleTaskDoubleClick = (taskId: string) => {
    if (dragState?.hasMoved) return;
    setResourceModalState({ itemId: taskId, itemType: 'task' });
  };

  // Resource drag-and-drop handlers
  const handleResourceDragOver = (e: React.DragEvent, taskId: string, phaseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget({ taskId, phaseId });
  };

  const handleResourceDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const handleResourceDrop = (e: React.DragEvent, taskId: string, phaseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.type === 'resource' && data.resourceId) {
        // Find task to generate smart assignment notes
        const phase = currentProject?.phases.find(p => p.id === phaseId);
        const task = phase?.tasks.find(t => t.id === taskId);
        const resource = currentProject?.resources?.find(r => r.id === data.resourceId);

        if (task && resource) {
          // Check if resource is already assigned
          const alreadyAssigned = task.resourceAssignments?.some(a => a.resourceId === data.resourceId);

          if (alreadyAssigned) {
            alert(`${resource.name} is already assigned to this task. Edit the assignment in the task details.`);
            return;
          }

          // Generate smart default notes
          const designation = RESOURCE_DESIGNATIONS[resource.designation];
          const category = RESOURCE_CATEGORIES[resource.category];
          const smartNotes = `${designation} assigned to ${task.name}`;

          // Smart default allocation: 80% (allows for parallel work)
          const defaultAllocation = 80;

          assignResourceToTask(taskId, phaseId, data.resourceId, smartNotes, defaultAllocation);

          // Success feedback - brief console log for debugging
          console.log(`✅ ${data.resourceName} → ${task.name} (${defaultAllocation}%)`);
        }
      }
    } catch (error) {
      console.error('Failed to assign resource:', error);
      alert('Failed to assign resource. Please try again.');
    }
  };

  // Phase resource drag-and-drop handlers (PM only)
  const handlePhaseResourceDragOver = (e: React.DragEvent, phaseId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'resource' && data.resourceId) {
        const resource = getResourceById(data.resourceId);
        // Only allow resources configured for phase-level assignment
        if (resource && canAssignToPhase(resource)) {
          setPhaseDropTarget(phaseId);
        }
      }
    } catch (error) {
      // Ignore parse errors during drag over
    }
  };

  const handlePhaseResourceDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setPhaseDropTarget(null);
  };

  const handlePhaseResourceDrop = (e: React.DragEvent, phaseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPhaseDropTarget(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.type === 'resource' && data.resourceId) {
        const phase = currentProject?.phases.find(p => p.id === phaseId);
        const resource = getResourceById(data.resourceId);

        if (phase && resource) {
          // Validate assignment level
          if (!canAssignToPhase(resource)) {
            alert(`This resource cannot be assigned at the phase level.\n\n${resource.name} is configured for ${resource.assignmentLevel === 'task' ? 'task-level assignments only' : 'assignments'}.\n\nTo enable phase-level assignment, edit the resource and change its "Assignment Level" setting to "Phase" or "Both".`);
            return;
          }

          // Check if resource is already assigned to this phase
          const alreadyAssigned = phase.phaseResourceAssignments?.some(a => a.resourceId === data.resourceId);

          if (alreadyAssigned) {
            alert(`${resource.name} is already assigned to this phase. Edit the assignment in the phase details.`);
            return;
          }

          // Smart allocation logic: Base 20% + 5% per task, capped at 100%
          const taskCount = phase.tasks.length;
          const smartAllocation = Math.min(20 + (taskCount * 5), 100);

          // Generate smart default notes
          const designation = RESOURCE_DESIGNATIONS[resource.designation];
          const smartNotes = `${designation} overseeing ${phase.name}${taskCount > 0 ? ` (${taskCount} task${taskCount > 1 ? 's' : ''})` : ''}`;

          assignResourceToPhase(phaseId, data.resourceId, smartNotes, smartAllocation);

          // Success feedback
          console.log(`✅ ${data.resourceName} → ${phase.name} (${smartAllocation}% allocation)`);
        }
      }
    } catch (error) {
      console.error('Failed to assign resource to phase:', error);
      alert('Failed to assign resource. Please try again.');
    }
  };

  return (
    <div
      ref={canvasRef}
      className="h-full bg-white p-4 overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      id="gantt-canvas"
    >
      {/* Project Header */}
      <div className="mb-3">
        <h2 className="text-2xl font-bold text-gray-900">{currentProject.name}</h2>
        {currentProject.description && (
          <p className="text-sm text-gray-600 mt-1">{currentProject.description}</p>
        )}
        <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-700">
          <span>
            <strong>Start:</strong> {formatGanttDate(startDate)}
          </span>
          <span>
            <strong>End:</strong> {formatGanttDate(endDate)}
          </span>
          <span>
            <strong>Duration:</strong> {formatDuration(durationDays)} ({durationDays} CD)
          </span>
          <span>
            <strong>Phases:</strong> {currentProject.phases.length}
          </span>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative min-w-[800px]">
        {/* Jobs/Ive: Three-Lane Timeline - Clear hierarchy, no overlap */}
        <div className="flex border-b-2 border-gray-300 mb-6">
          <div className="w-16 flex flex-col justify-center py-2 transition-all duration-300">
            {/* Minimal left column - just a subtle label */}
            <div className="text-xs text-gray-400 font-medium text-center">
              Controls
            </div>
          </div>

          {/* Three-lane header: Dates (top) → Milestones (middle) → Holidays (bottom) */}
          <div className="flex-1 relative bg-gradient-to-b from-gray-50 to-white" style={{ height: '64px' }}>

            {/* LANE 1 (TOP): Date Markers - The foundation */}
            <div className="absolute top-0 left-0 right-0 h-5 flex items-center px-2 bg-white/50 z-20">
              <div className="relative w-full h-full">
                {timelineMarkers.map((marker, idx) => (
                  <div
                    key={idx}
                    className="absolute flex items-center z-30"
                    style={{ left: `${marker.position}%`, top: '2px' }}
                  >
                    {/* Date Label - Jobs/Ive: Always on top, never obscured */}
                    <span className="text-sm font-bold text-gray-800 bg-white px-2 py-1 rounded shadow-md border border-gray-300 relative z-30">
                      {marker.label}
                    </span>

                    {/* Vertical Grid Line - extends down through all lanes */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-px h-[calc(100vh-80px)] bg-gray-200 opacity-30 z-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* LANE 2 (MIDDLE): Milestones - Key project markers */}
            {viewSettings?.showMilestones && currentProject.milestones.length > 0 && (
              <div className="absolute top-5 left-0 right-0 h-7 border-y border-gray-100 bg-purple-50/30 z-10">
                <div className="relative w-full h-full">
                  {currentProject.milestones.map((milestone) => {
                    const milestoneDate = new Date(milestone.date);
                    const offset = differenceInDays(milestoneDate, startDate);
                    const position = (offset / durationDays) * 100;

                    return (
                      <div
                        key={milestone.id}
                        className="absolute top-1/2 -translate-y-1/2 group cursor-pointer z-20"
                        style={{ left: `${position}%` }}
                        onClick={() => {
                          selectItem(milestone.id, 'milestone');
                          openSidePanel('edit', 'milestone', milestone.id);
                        }}
                      >
                        {/* Vertical Milestone Line - positioned first, exactly at position% */}
                        <div
                          className="absolute top-full left-0 w-px h-[calc(100vh-130px)] opacity-20  transition-opacity z-10"
                          style={{ backgroundColor: milestone.color }}
                        />

                        {/* Milestone marker with flag and tooltip */}
                        <div className="absolute left-0 top-0 -translate-x-[2px] z-20">
                          <Tooltip
                            title={
                              <div>
                                <div className="font-semibold">{milestone.name}</div>
                                <div className="text-[10px] opacity-90 mt-0.5">
                                  {format(milestoneDate, 'dd MMM yy')} ({format(milestoneDate, 'EEE')})
                                </div>
                              </div>
                            }
                          >
                            <Flag
                              className="w-4 h-4 fill-current drop-shadow-sm transition-transform hover:scale-125"
                              style={{ color: milestone.color }}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LANE 3 (BOTTOM): Holidays - All public holidays including weekends */}
            <div className="absolute bottom-0 left-0 right-0 h-5 border-t border-gray-100 bg-red-50/20 z-0">
              <div className="relative w-full h-full">
                {allHolidays.map((holiday, idx) => (
                  <div
                    key={idx}
                    className="absolute top-1/2 -translate-y-1/2 group cursor-help z-0"
                    style={{ left: `${holiday.position}%` }}
                  >
                    {/* Holiday indicator - solid dot for weekdays, outlined for weekends */}
                    <div className="-translate-x-1/2">
                      {holiday.isWeekend ? (
                        // Weekend holiday - outlined dot (already non-working day)
                        <div className="w-2 h-2 rounded-full bg-white border-2 border-red-600 hover:bg-red-100 transition-colors shadow-sm" />
                      ) : (
                        // Weekday holiday - solid red dot (actual non-working day)
                        <div className="w-2 h-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors shadow-sm" />
                      )}
                    </div>

                    {/* Tooltip with full name - Jobs: "Always visible when needed, never obscured" */}
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[9999]">
                      <div className="bg-red-600 text-white text-xs px-2.5 py-1.5 rounded-md shadow-xl border-2 border-white/20">
                        <div className="font-semibold">{holiday.name}</div>
                        <div className="text-[10px] opacity-90 mt-0.5">
                          {formatGanttDate(holiday.date)}
                          {holiday.isWeekend && <span className="ml-1.5 opacity-75">(Weekend)</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Phases and Tasks */}
        <div className={focusedPhaseId ? "space-y-2" : "space-y-4"}>
          {/* RTS Focus Mode: Filter to show only focused phase */}
          {(focusedPhaseId
            ? currentProject.phases.filter(p => p.id === focusedPhaseId)
            : currentProject.phases
          ).map((phase, phaseIndex) => {
            const metrics = getPhaseMetrics(phase);
            const isSelected = selection.selectedItemId === phase.id && selection.selectedItemType === 'phase';
            const isDragging = dragState?.itemId === phase.id;
            const isFirstPhase = phaseIndex === 0;
            const isLastPhase = phaseIndex === currentProject.phases.length - 1;

            return (
              <div key={phase.id} className="relative">
                {/* Phase Row */}
                <div className="flex items-start group">
                  {/* Jobs/Ive: Minimal control column - essential buttons only */}
                  <div className="w-16 flex flex-col items-center gap-1 pt-6 flex-shrink-0" style={{ position: 'relative', zIndex: 999, pointerEvents: 'auto' }}>
                    {/* Collapse/Expand Button */}
                    {phase.tasks.length > 0 && (
                      <button
                        onClick={() => togglePhaseCollapse(phase.id)}
                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000 }}
                        title={phase.collapsed ? "Expand tasks" : "Collapse tasks"}
                      >
                        {phase.collapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Auto-Align Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        autoAlignPhase(phase.id);
                      }}
                      disabled={isFirstPhase}
                      className={`p-1 rounded-full transition-all shadow-sm ${
                        isFirstPhase
                          ? 'opacity-20 cursor-not-allowed bg-gray-200'
                          : 'bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 hover:shadow-md hover:scale-110 cursor-pointer'
                      }`}
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000 }}
                      title="Auto-align: Schedule +1 WD after previous phase"
                    >
                      <ArrowRightToLine className="w-3.5 h-3.5" />
                    </button>

                    {/* Reorder Buttons - Show on hover */}
                    <div className="flex flex-col   transition-opacity" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderPhase(phase.id, 'up');
                        }}
                        disabled={isFirstPhase}
                        className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
                          isFirstPhase ? 'opacity-30 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 cursor-pointer'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                        title="Move phase up"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderPhase(phase.id, 'down');
                        }}
                        disabled={isLastPhase}
                        className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
                          isLastPhase ? 'opacity-30 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 cursor-pointer'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                        title="Move phase down"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Timeline Area with Title Above */}
                  <div className="flex-1 relative" style={{ minHeight: '110px' }}>
                    {/* Jobs/Ive: Phase Title Above Bar - Clean, centered, full text */}
                    {(viewSettings?.showTitles ?? true) && (
                      <div
                        className="absolute top-0 z-20  flex justify-center"
                        style={{
                          left: `${metrics.left}%`,
                          width: `${metrics.width}%`,
                        }}
                      >
                        <div className="relative group/phaselabel">
                          <div className="text-sm font-bold text-gray-900 whitespace-nowrap px-2 cursor-help pointer-events-auto text-center">
                            {phase.name}
                          </div>

                          {/* Hover Tooltip for Full Phase Info */}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover/phaselabel:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap">
                            <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-md shadow-2xl max-w-md whitespace-normal">
                              <div className="font-semibold mb-1">{phase.name}</div>
                              {phase.description && (
                                <div className="text-gray-300 text-xs mt-1.5 leading-relaxed">
                                  {phase.description}
                                </div>
                              )}
                              <div className="text-gray-400 text-xs mt-2 border-t border-gray-700 pt-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span>{format(new Date(phase.startDate), 'dd MMM yy')} → {format(new Date(phase.endDate), 'dd MMM yy')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px]">
                                  <span className="text-blue-400 font-semibold">{formatWorkingDays(metrics.workingDays)}</span>
                                  <span>·</span>
                                  <span>{formatCalendarDuration(metrics.duration)}</span>
                                  <span>·</span>
                                  <span>{phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Phase Bar */}
                    <div
                      className={`absolute top-8 h-14 rounded-lg transition-all cursor-move ${
                        isDragging ? 'opacity-70 scale-105' : ''
                      } ${isSelected ? 'ring-4 ring-blue-400' : ''}
                      ${phaseDropTarget === phase.id ? 'ring-4 ring-purple-500 ring-offset-2 scale-105' : ''}`}
                      style={{
                        left: `${metrics.left}%`,
                        width: `${metrics.width}%`,
                        background: `linear-gradient(180deg, ${phase.color} 0%, ${withOpacity(phase.color, 0.85)} 100%)`,
                        boxShadow: isDragging
                          ? `0 12px 32px ${withOpacity(phase.color, 0.4)}`
                          : `0 4px 12px ${withOpacity(phase.color, 0.25)}, inset 0 1px 0 ${withOpacity('#ffffff', 0.2)}`,
                        border: `1px solid ${withOpacity('#ffffff', 0.15)}`,
                      }}
                      onClick={() => handlePhaseClick(phase.id)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePhaseDoubleClick(phase.id);
                      }}
                      onMouseDown={(e) => handleMouseDown(e, phase.id, 'move')}
                      onDragOver={(e) => handlePhaseResourceDragOver(e, phase.id)}
                      onDragLeave={handlePhaseResourceDragLeave}
                      onDrop={(e) => handlePhaseResourceDrop(e, phase.id)}
                    >
                      {/* Resize Handles */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30  "
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, phase.id, 'resize-start');
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30  "
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, phase.id, 'resize-end');
                        }}
                      />

                      {/* Phase Content - Jobs/Ive: Ruthless simplicity */}
                      <div className="p-2 h-full flex items-center justify-center text-white relative">
                        {/* RTS Focus Button - Appears on hover */}
                        {!focusedPhaseId && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePhaseDoubleClick(phase.id);
                            }}
                            className="absolute top-1 right-1   transition-opacity bg-yellow-400 hover:bg-yellow-500 text-gray-900 p-1 rounded shadow-lg z-20"
                            title="Focus on this phase (RTS zoom)"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* PM Resource Drop Zone Indicator */}
                        {phaseDropTarget === phase.id && (
                          <div className="absolute inset-0 bg-purple-500/30 backdrop-blur-[1px] rounded-lg flex items-center justify-center border-2 border-purple-400 border-dashed animate-pulse z-10">
                            <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span>Drop PM to Assign</span>
                            </div>
                          </div>
                        )}

                        {/* Jobs: "Clear layering - most important information on top, literally." */}

                        {/* BOTTOM LAYER: Task Distribution - The composition (when collapsed) */}
                        {phase.collapsed && phase.tasks.length > 0 && metrics.width > 8 && (
                          <div className="absolute bottom-2 left-2 right-2 z-0">
                            <div className="flex items-center gap-2">
                              {/* Task count */}
                              {metrics.width > 15 && (
                                <span className="text-xs font-bold text-white bg-black/30 px-2 py-0.5 rounded flex-shrink-0">
                                  {phase.tasks.length}
                                </span>
                              )}

                              {/* Color-coded task segments - Jobs: "Make each task visually distinct" */}
                              <div className="flex-1 flex h-4 rounded-sm overflow-hidden shadow-inner border border-white/20 bg-black/10">
                                {phase.tasks.map((task, taskIdx) => {
                                  const taskStart = new Date(task.startDate);
                                  const taskEnd = new Date(task.endDate);
                                  const phaseStart = new Date(phase.startDate);
                                  const phaseEnd = new Date(phase.endDate);

                                  const phaseDuration = differenceInDays(phaseEnd, phaseStart);
                                  const taskOffset = differenceInDays(taskStart, phaseStart);
                                  const taskDuration = differenceInDays(taskEnd, taskStart);

                                  const taskLeft = (taskOffset / phaseDuration) * 100;
                                  const taskWidth = Math.max((taskDuration / phaseDuration) * 100, 2);

                                  // Jobs/Ive: Use consistent color palette - same task = same color always
                                  const taskColor = getTaskColor(taskIdx);

                                  const taskWorkingDays = calculateWorkingDaysInclusive(
                                    task.startDate,
                                    task.endDate,
                                    currentProject.holidays
                                  );

                                  return (
                                    <div
                                      key={task.id}
                                      className="absolute top-0 h-full border-r border-white/40 group/minitask cursor-help transition-all hover:z-10 hover:scale-105"
                                      style={{
                                        left: `${taskLeft}%`,
                                        width: `${taskWidth}%`,
                                        background: `linear-gradient(180deg, ${taskColor} 0%, ${withOpacity(taskColor, 0.85)} 100%)`,
                                        boxShadow: `inset 0 1px 0 ${withOpacity('#ffffff', 0.2)}`,
                                      }}
                                      title={task.name}
                                    >
                                      {/* Hover tooltip */}
                                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/minitask:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                                        <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded shadow-2xl border-2" style={{ borderColor: taskColor }}>
                                          <div className="font-semibold text-[11px]">{task.name}</div>
                                          <div className="text-[10px] text-gray-300 mt-0.5">
                                            {formatWorkingDays(taskWorkingDays)} · {format(taskStart, 'dd MMM yy')} → {format(taskEnd, 'dd MMM yy')}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Floating Badges Above Phase Bar - Consistent with task badges */}
                        {(viewSettings?.barDurationDisplay ?? 'all') !== 'clean' && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 flex items-center justify-center text-white z-20 whitespace-nowrap">
                            {/* All badges in a clean horizontal row */}
                            <div className="flex items-center gap-2">
                              {/* WD Mode */}
                              {(viewSettings?.barDurationDisplay ?? 'all') === 'wd' && (
                                <span className="text-sm font-bold bg-black/40 px-2.5 py-1.5 rounded-sm shadow-md border border-white/20">
                                  {formatWorkingDays(metrics.workingDays)}
                                </span>
                              )}

                              {/* CD Mode */}
                              {(viewSettings?.barDurationDisplay ?? 'all') === 'cd' && (
                                <span className="text-sm font-bold bg-black/40 px-2.5 py-1.5 rounded-sm shadow-md border border-white/20">
                                  {formatCalendarDuration(metrics.duration)}
                                </span>
                              )}

                              {/* Resource Mode */}
                              {(viewSettings?.barDurationDisplay ?? 'all') === 'resource' && phase.phaseResourceAssignments && phase.phaseResourceAssignments.length > 0 && (
                                <div className="relative group/pmbadge">
                                  <div className="flex items-center gap-1.5 bg-orange-500 px-2.5 py-1.5 rounded-sm shadow-md border border-white/20 pointer-events-auto cursor-help">
                                    <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    <span className="text-sm font-bold">{phase.phaseResourceAssignments.length}</span>
                                  </div>
                                  {/* PM Tooltip */}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover/pmbadge:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap">
                                    <div className="bg-orange-600 text-white text-xs px-3 py-2 rounded-md shadow-2xl max-w-xs">
                                      <div className="font-semibold mb-1.5 text-[10px] text-orange-100">Phase Management:</div>
                                      <div className="space-y-1">
                                        {phase.phaseResourceAssignments.map((assignment) => {
                                          const resource = currentProject.resources?.find(r => r.id === assignment.resourceId);
                                          if (!resource) return null;
                                          return (
                                            <div key={assignment.id} className="flex items-start gap-1.5">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-1.5">
                                                  <div className="font-medium text-[11px]">{resource.name}</div>
                                                  <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-white/20 rounded">
                                                    {assignment.allocationPercentage}%
                                                  </span>
                                                </div>
                                                <div className="text-[9px] text-orange-100">
                                                  {RESOURCE_DESIGNATIONS[resource.designation]}
                                                </div>
                                                {assignment.assignmentNotes && (
                                                  <div className="text-[9px] text-orange-100 mt-0.5 italic opacity-90">
                                                    {assignment.assignmentNotes}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Dates Mode */}
                              {(viewSettings?.barDurationDisplay ?? 'all') === 'dates' && (
                                <span className="text-sm font-bold bg-black/40 px-2.5 py-1.5 rounded-sm shadow-md border border-white/20">
                                  {format(new Date(phase.startDate), 'dd MMM yy')} → {format(new Date(phase.endDate), 'dd MMM yy')}
                                </span>
                              )}

                              {/* All Mode - Show all info */}
                              {(viewSettings?.barDurationDisplay ?? 'all') === 'all' && (
                                <>
                                  {/* Dates badge */}
                                  <span className="text-sm font-semibold bg-blue-600/90 px-2.5 py-1.5 rounded-sm shadow-md border border-white/20">
                                    {format(new Date(phase.startDate), 'dd MMM yy')} → {format(new Date(phase.endDate), 'dd MMM yy')}
                                  </span>

                                  {/* Duration badge (WD + CD) */}
                                  <span className="text-sm font-bold bg-black/40 px-2.5 py-1.5 rounded-sm shadow-md border border-white/20">
                                    {formatWorkingDays(metrics.workingDays)}
                                    <span className="mx-1.5 opacity-50">•</span>
                                    {formatCalendarDuration(metrics.duration)}
                                  </span>

                                  {/* PM Resource badge */}
                                  {phase.phaseResourceAssignments && phase.phaseResourceAssignments.length > 0 && (
                                    <div className="relative group/pmbadge">
                                      <div className="flex items-center gap-1.5 bg-orange-500 px-2.5 py-1.5 rounded-sm shadow-md border border-white/20 pointer-events-auto cursor-help">
                                        <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        <span className="text-sm font-bold">{phase.phaseResourceAssignments.length}</span>
                                      </div>
                                      {/* PM Tooltip */}
                                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover/pmbadge:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap">
                                        <div className="bg-orange-600 text-white text-xs px-3 py-2 rounded-md shadow-2xl max-w-xs">
                                          <div className="font-semibold mb-1.5 text-[10px] text-orange-100">Phase Management:</div>
                                          <div className="space-y-1">
                                            {phase.phaseResourceAssignments.map((assignment) => {
                                              const resource = currentProject.resources?.find(r => r.id === assignment.resourceId);
                                              if (!resource) return null;
                                              return (
                                                <div key={assignment.id} className="flex items-start gap-1.5">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                      <div className="font-medium text-[11px]">{resource.name}</div>
                                                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-white/20 rounded">
                                                        {assignment.allocationPercentage}%
                                                      </span>
                                                    </div>
                                                    <div className="text-[9px] text-orange-100">
                                                      {RESOURCE_DESIGNATIONS[resource.designation]}
                                                    </div>
                                                    {assignment.assignmentNotes && (
                                                      <div className="text-[9px] text-orange-100 mt-0.5 italic opacity-90">
                                                        {assignment.assignmentNotes}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks (when expanded) - Jobs/Ive: Clean, focused design */}
                {!phase.collapsed && phase.tasks.length > 0 && (
                  <div className={`ml-2 mt-2 relative ${focusedPhaseId ? 'space-y-7' : 'space-y-8'}`}>
                    {phase.tasks.map((task, taskIdx) => {
                      const isFirstTask = taskIdx === 0;
                      const isLastTask = taskIdx === phase.tasks.length - 1;
                      const taskStart = new Date(task.startDate);
                      const taskEnd = new Date(task.endDate);
                      const taskOffset = differenceInDays(taskStart, startDate);
                      const taskDuration = differenceInDays(taskEnd, taskStart); // Calendar days for positioning
                      const taskLeft = (taskOffset / durationDays) * 100;
                      const taskWidth = (taskDuration / durationDays) * 100;

                      // Calculate working days for display
                      const taskWorkingDays = calculateWorkingDaysInclusive(
                        task.startDate,
                        task.endDate,
                        currentProject.holidays
                      );

                      const isTaskSelected = selection.selectedItemId === task.id && selection.selectedItemType === 'task';
                      const isTaskDragging = dragState?.itemId === task.id && dragState?.itemType === 'task';

                      // Jobs/Ive: Use consistent color palette - matches collapsed mini-segments
                      const taskColor = getTaskColor(taskIdx);

                      return (
                        <div key={task.id} className="flex items-start group/task relative">
                          {/* Jobs/Ive: Minimal control column for tasks */}
                          <div className="w-14 flex flex-col items-center gap-1 pt-1 flex-shrink-0" style={{ position: 'relative', zIndex: 999, pointerEvents: 'auto' }}>
                            {/* Auto-Align Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                autoAlignTask(task.id, phase.id);
                              }}
                              disabled={isFirstTask}
                              className={`p-1 rounded-full transition-all shadow-sm ${
                                isFirstTask
                                  ? 'opacity-20 cursor-not-allowed bg-gray-200'
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 hover:shadow-md hover:scale-110 cursor-pointer'
                              }`}
                              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000 }}
                              title="Auto-align: Schedule +1 WD after previous task"
                            >
                              <ArrowRightToLine className="w-3.5 h-3.5" />
                            </button>

                            {/* Reorder Buttons - Show on hover */}
                            <div className="flex flex-col opacity-0 group-hover/task:opacity-100 transition-opacity" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderTask(task.id, phase.id, 'up');
                                }}
                                disabled={isFirstTask}
                                className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
                                  isFirstTask ? 'opacity-30 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 cursor-pointer'
                                }`}
                                style={{ pointerEvents: 'auto' }}
                                title="Move task up"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderTask(task.id, phase.id, 'down');
                                }}
                                disabled={isLastTask}
                                className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
                                  isLastTask ? 'opacity-30 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 cursor-pointer'
                                }`}
                                style={{ pointerEvents: 'auto' }}
                                title="Move task down"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Task Timeline Area with Title Below */}
                          <div className="flex-1 relative" style={{ minHeight: '65px' }}>
                            {/* Task Bar */}
                            <div
                              className={`absolute top-1 h-8 rounded-md transition-all cursor-move
                                ${isTaskDragging ? 'opacity-60 scale-105 z-10' : ''}
                                ${isTaskSelected ? 'ring-2 ring-offset-1 ring-blue-400' : ''}
                                ${dropTarget?.taskId === task.id ? 'ring-4 ring-purple-500 ring-offset-2 scale-110' : ''}
                              `}
                              style={{
                                left: `${taskLeft}%`,
                                width: `${taskWidth}%`,
                                background: `linear-gradient(180deg, ${taskColor} 0%, ${withOpacity(taskColor, 0.88)} 100%)`,
                                border: `2px solid ${withOpacity(taskColor, 0.3)}`,
                                boxShadow: isTaskDragging
                                  ? `0 8px 24px ${withOpacity(taskColor, 0.4)}`
                                  : `0 2px 8px ${withOpacity(taskColor, 0.2)}, inset 0 1px 0 ${withOpacity('#ffffff', 0.25)}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task.id);
                              }}
                              onDoubleClick={() => handleTaskDoubleClick(task.id)}
                              onMouseDown={(e) => handleTaskMouseDown(e, task.id, phase.id, 'move')}
                              onDragOver={(e) => handleResourceDragOver(e, task.id, phase.id)}
                              onDragLeave={handleResourceDragLeave}
                              onDrop={(e) => handleResourceDrop(e, task.id, phase.id)}
                            >
                              {/* Resize Handles */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-white/40 opacity-0 group-hover/task:opacity-100 transition-opacity"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleTaskMouseDown(e, task.id, phase.id, 'resize-start');
                                }}
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-white/40 opacity-0 group-hover/task:opacity-100 transition-opacity"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleTaskMouseDown(e, task.id, phase.id, 'resize-end');
                                }}
                              />

                              {/* Task Content */}
                              <div className="h-full relative">
                                {/* Drop Zone Indicator */}
                                {dropTarget?.taskId === task.id && (
                                  <div className="absolute inset-0 bg-purple-500/30 backdrop-blur-[1px] rounded-md flex items-center justify-center border-2 border-purple-400 border-dashed animate-pulse z-50">
                                    <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span>Drop to Assign</span>
                                    </div>
                                  </div>
                                )}

                                {/* Floating Badges - Always appear horizontally above bars */}
                                {(viewSettings?.barDurationDisplay ?? 'all') !== 'clean' && (
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 flex items-center justify-center text-white z-20  whitespace-nowrap">
                                    {/* All badges in a clean horizontal row */}
                                    <div className="flex items-center gap-2">
                                      {/* WD Mode */}
                                      {(viewSettings?.barDurationDisplay ?? 'all') === 'wd' && (
                                        <span className="text-xs font-bold bg-black/40 px-2 py-1 rounded-sm shadow-md border border-white/20">
                                          {formatWorkingDays(taskWorkingDays)}
                                        </span>
                                      )}

                                      {/* CD Mode */}
                                      {(viewSettings?.barDurationDisplay ?? 'all') === 'cd' && (
                                        <span className="text-xs font-bold bg-black/40 px-2 py-1 rounded-sm shadow-md border border-white/20">
                                          {formatCalendarDuration(taskDuration)}
                                        </span>
                                      )}

                                      {/* Resource Mode */}
                                      {(viewSettings?.barDurationDisplay ?? 'all') === 'resource' && task.resourceAssignments && task.resourceAssignments.length > 0 && (
                                        <div className="relative group/resourcebadge">
                                          <div className="flex items-center gap-1 bg-purple-600 px-2 py-1 rounded-sm shadow-md border border-white/20 pointer-events-auto cursor-help">
                                            <Users className="w-3 h-3" strokeWidth={2.5} />
                                            <span className="text-xs font-bold">{task.resourceAssignments.length}</span>
                                          </div>
                                          {/* Tooltip */}
                                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover/resourcebadge:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap">
                                            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-2xl max-w-xs">
                                              <div className="font-semibold mb-1.5 text-[10px] text-gray-300">Assigned Resources:</div>
                                              <div className="space-y-1">
                                                {task.resourceAssignments.map((assignment) => {
                                                  const resource = (currentProject.resources || []).find(r => r.id === assignment.resourceId);
                                                  if (!resource) return null;
                                                  const category = RESOURCE_CATEGORIES[resource.category];
                                                  return (
                                                    <div key={assignment.id} className="flex items-start gap-1.5">
                                                      <span className="text-sm flex-shrink-0">{category.icon}</span>
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                          <div className="font-medium text-[11px]">{resource.name}</div>
                                                          <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-500 text-white rounded">
                                                            {assignment.allocationPercentage}%
                                                          </span>
                                                        </div>
                                                        <div className="text-[9px] text-gray-400">
                                                          {RESOURCE_DESIGNATIONS[resource.designation]}
                                                        </div>
                                                        {assignment.assignmentNotes && (
                                                          <div className="text-[9px] text-gray-300 mt-0.5 italic">
                                                            {assignment.assignmentNotes}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Dates Mode */}
                                      {(viewSettings?.barDurationDisplay ?? 'all') === 'dates' && (
                                        <span className="text-xs font-bold bg-black/40 px-2 py-1 rounded-sm shadow-md border border-white/20">
                                          {format(taskStart, 'dd MMM yy')} → {format(taskEnd, 'dd MMM yy')}
                                        </span>
                                      )}

                                      {/* All Mode */}
                                      {(viewSettings?.barDurationDisplay ?? 'all') === 'all' && (
                                        <>
                                          {/* Dates badge */}
                                          <span className="text-xs font-semibold bg-blue-600/90 px-2 py-1 rounded-sm shadow-md border border-white/20">
                                            {format(taskStart, 'dd MMM yy')} → {format(taskEnd, 'dd MMM yy')}
                                          </span>

                                          {/* Duration badge */}
                                          <span className="text-xs font-bold bg-black/40 px-2 py-1 rounded-sm shadow-md border border-white/20">
                                            {taskWidth >= 15 ? (
                                              <>
                                                {formatWorkingDays(taskWorkingDays)}
                                                <span className="mx-1 opacity-50">•</span>
                                                {formatCalendarDuration(taskDuration)}
                                              </>
                                            ) : (
                                              `${taskWorkingDays}d • ${taskDuration}d`
                                            )}
                                          </span>

                                          {/* Resource badge */}
                                          {task.resourceAssignments && task.resourceAssignments.length > 0 && (
                                            <div className="relative group/resourcebadge">
                                              <div className="flex items-center gap-1 bg-purple-600 px-2 py-1 rounded-sm shadow-md border border-white/20 pointer-events-auto cursor-help">
                                                <Users className="w-3 h-3" strokeWidth={2.5} />
                                                <span className="text-xs font-bold">{task.resourceAssignments.length}</span>
                                              </div>
                                              {/* Tooltip */}
                                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover/resourcebadge:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap">
                                                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-2xl max-w-xs">
                                                  <div className="font-semibold mb-1.5 text-[10px] text-gray-300">Assigned Resources:</div>
                                                  <div className="space-y-1">
                                                    {task.resourceAssignments.map((assignment) => {
                                                      const resource = (currentProject.resources || []).find(r => r.id === assignment.resourceId);
                                                      if (!resource) return null;
                                                      const category = RESOURCE_CATEGORIES[resource.category];
                                                      return (
                                                        <div key={assignment.id} className="flex items-start gap-1.5">
                                                          <span className="text-sm flex-shrink-0">{category.icon}</span>
                                                          <div className="flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                              <div className="font-medium text-[11px]">{resource.name}</div>
                                                              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-500 text-white rounded">
                                                                {assignment.allocationPercentage}%
                                                              </span>
                                                            </div>
                                                            <div className="text-[9px] text-gray-400">
                                                              {RESOURCE_DESIGNATIONS[resource.designation]}
                                                            </div>
                                                            {assignment.assignmentNotes && (
                                                              <div className="text-[9px] text-gray-300 mt-0.5 italic">
                                                                {assignment.assignmentNotes}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Jobs/Ive: Task Title Below Bar - Clean, centered, full text */}
                            {(viewSettings?.showTitles ?? true) && (
                              <div
                                className="absolute top-10 z-20  flex justify-center"
                                style={{
                                  left: `${taskLeft}%`,
                                  width: `${taskWidth}%`,
                                }}
                              >
                                <div className="relative group/tasklabel">
                                  <div className="text-xs font-semibold text-gray-700 whitespace-nowrap px-2 cursor-help pointer-events-auto text-center">
                                    {task.name}
                                  </div>

                                  {/* Hover Tooltip for Full Task Info */}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover/tasklabel:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap">
                                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-2xl max-w-sm whitespace-normal">
                                      <div className="font-semibold mb-1">{task.name}</div>
                                      {task.description && (
                                        <div className="text-gray-300 text-[11px] mt-1 leading-relaxed">
                                          {task.description}
                                        </div>
                                      )}
                                      <div className="text-gray-400 text-[10px] mt-2 border-t border-gray-700 pt-1.5">
                                        <div className="mb-1">{format(taskStart, 'dd MMM yy')} → {format(taskEnd, 'dd MMM yy')}</div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-purple-400 font-semibold">{formatWorkingDays(taskWorkingDays)}</span>
                                          <span>·</span>
                                          <span>{formatCalendarDuration(taskDuration)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
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
        </div>

        {/* Empty State */}
        {currentProject.phases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No phases yet. Add your first phase to get started.</p>
            <button
              onClick={() => openSidePanel('add', 'phase')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Phase
            </button>
          </div>
        )}
      </div>

      {/* RTS Minimap - Shows full timeline when focused on a phase */}
      <GanttMinimap />

      {/* Resource Allocation Modal - Triggered by double-click on task bars */}
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
