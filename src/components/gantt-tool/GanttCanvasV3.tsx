/**
 * Gantt Canvas V3 - Apple HIG Specification (Proposal Mode)
 *
 * Proposal-ready Gantt chart with:
 * - Left sidebar table: Full task names, duration, resources (NO truncation)
 * - Right timeline: Clean visual bars for timeline representation
 * - All information visible WITHOUT tooltips (screenshot/print ready)
 * - Typography: SF Pro Text 13pt
 * - Spacing: 8px grid
 * - Clean, minimalist design
 *
 * Syncs with same store as GanttCanvas.tsx for real-time updates
 */

"use client";

import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  differenceInDays,
  format,
  addDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  startOfMonth,
  getMonth,
  getDay,
} from "date-fns";
import { ChevronDown, ChevronRight, ZoomIn, ZoomOut, Edit2, Calendar, Clock, GripVertical, Flag } from "lucide-react";
import type { GanttPhase } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import { getHolidaysInRange } from "@/data/holidays";
import { ResourceIndicator } from "./ResourceIndicator";
import { ResourceDrawer } from "./ResourceDrawer";
import { TaskResourceModal } from "./TaskResourceModal";
import { MilestoneMarker } from "./MilestoneMarker";
import { MilestoneModal } from "./MilestoneModal";
import "./MilestoneMarker.css";

// Constants from spec (Jobs/Ive: Breathing room)
const DEFAULT_SIDEBAR_WIDTH = 620; // Default left sidebar for task details table
const MIN_SIDEBAR_WIDTH = 300; // Minimum sidebar width
const MAX_SIDEBAR_WIDTH = 1000; // Maximum sidebar width
const TASK_NAME_WIDTH = 360; // Width for task name column (enough for long names)
const DURATION_WIDTH = 100; // Width for duration column
const RESOURCES_WIDTH = 140; // Width for resources column
const TASK_BAR_HEIGHT = 32; // Clean bars without internal text
const PHASE_ROW_HEIGHT = 40; // 40px for phase headers per Apple HIG spec
const TASK_ROW_HEIGHT = 40; // 40px per task row per Apple HIG spec

// Apple HIG Color System for Gantt Status
const GANTT_STATUS_COLORS = {
  inProgress: 'var(--color-blue)',
  atRisk: 'var(--color-orange)',
  complete: 'var(--color-green)',
  critical: 'var(--color-red)',
  notStarted: 'var(--color-gray-1)',
} as const;

/**
 * Apple HIG Spec Compliance Examples:
 * - Task bar: height: "32px"
 * - Progress indicator: height: "3px"
 * - Status icon: width: "16px", height: "16px"
 * - Timeline format: Q${quarter} '${year} (e.g., "Q1 '26")
 */

type ZoomMode = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface GanttCanvasV3Props {
  zoomMode?: ZoomMode;
}

export function GanttCanvasV3({ zoomMode = 'month' }: GanttCanvasV3Props = {}) {
  const {
    currentProject,
    getProjectDuration,
    togglePhaseCollapse,
    selectItem,
    selection,
    updateTaskResourceAssignment,
    unassignResourceFromTask,
    updatePhase,
    updateTask,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  } = useGanttToolStore();

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [focusedPhaseId, setFocusedPhaseId] = useState<string | null>(null);
  const [resourceModalTaskId, setResourceModalTaskId] = useState<string | null>(null);
  const [taskResourceModal, setTaskResourceModal] = useState<{ taskId: string; phaseId: string } | null>(null);
  const [autoZoomEnabled, setAutoZoomEnabled] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<{ taskId: string; phaseId: string } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ id: string; type: "phase" | "task" } | null>(null);
  const [barEditorState, setBarEditorState] = useState<{ id: string; type: "phase" | "task"; phaseId?: string } | null>(null);

  // Drag and drop state
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPhaseId, setDragOverPhaseId] = useState<string | null>(null);

  // Milestone state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [milestoneDefaultDate, setMilestoneDefaultDate] = useState<string | undefined>();

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true); // Collapse sidebar on mobile by default
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+M or Ctrl+M = Add milestone
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setShowMilestoneModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle sidebar resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // Clamp between min and max
      const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const duration = getProjectDuration();

  // Handle phase toggle with optional auto-zoom
  const handlePhaseToggle = useCallback((phaseId: string) => {
    const phase = currentProject?.phases.find(p => p.id === phaseId);
    if (!phase) return;

    const willBeExpanded = phase.collapsed ?? false;

    // Toggle collapse state
    togglePhaseCollapse(phaseId);

    // If auto-zoom is enabled, set focus when expanding
    if (autoZoomEnabled && willBeExpanded) {
      setFocusedPhaseId(phaseId);
    } else if (!autoZoomEnabled) {
      setFocusedPhaseId(null);
    }
  }, [currentProject, togglePhaseCollapse, autoZoomEnabled]);

  // Calculate dynamic timeline based on focused phase
  const focusedPhase = focusedPhaseId && currentProject
    ? currentProject.phases.find(p => p.id === focusedPhaseId)
    : null;

  const timelineBounds = focusedPhase && duration
    ? {
        startDate: new Date(focusedPhase.startDate),
        endDate: new Date(focusedPhase.endDate),
        durationDays: differenceInDays(new Date(focusedPhase.endDate), new Date(focusedPhase.startDate)),
      }
    : duration;

  // Generate time markers based on zoom mode (safe to call even if no data)
  const timeMarkers = useMemo(() => {
    if (!timelineBounds) return [];

    const { startDate: start, endDate: end } = timelineBounds;

    // Add small padding to end date to ensure last items are fully visible (only for scrollable views)
    // For auto-fit modes, we don't add padding as everything should fit on screen
    const paddedEnd = addDays(end, 7); // Small 7-day buffer for visual breathing room

    switch (zoomMode) {
      case 'day':
        return eachDayOfInterval({ start, end: paddedEnd });
      case 'week':
        return eachWeekOfInterval({ start, end: paddedEnd }, { weekStartsOn: 1 });
      case 'month':
        return eachMonthOfInterval({ start, end: paddedEnd });
      case 'quarter':
        return eachQuarterOfInterval({ start, end: paddedEnd });
      case 'year':
        return eachYearOfInterval({ start, end: paddedEnd });
      default:
        return eachMonthOfInterval({ start, end: paddedEnd });
    }
  }, [timelineBounds, zoomMode]);

  // Format time marker label based on zoom mode - DD-MMM-YY format policy
  const formatTimeMarker = (date: Date): { primary: string; secondary?: string } => {
    switch (zoomMode) {
      case 'day':
        return {
          primary: format(date, 'dd'),
          secondary: format(date, 'MMM'), // DD with MMM
        };
      case 'week':
        return {
          primary: `W${format(date, 'w')}`,
          secondary: format(date, 'dd-MMM-yy'),
        };
      case 'month':
        return {
          primary: format(date, 'MMM'),
          secondary: format(date, 'yy'),
        };
      case 'quarter':
        return {
          primary: `Q${Math.ceil((getMonth(date) + 1) / 3)}`,
          secondary: format(date, 'yy'),
        };
      case 'year':
        return {
          primary: format(date, 'yyyy'),
        };
      default:
        return { primary: format(date, 'MMM') };
    }
  };

  // Calculate holidays to display on timeline
  const allHolidays = useMemo(() => {
    if (!duration) return [];

    const { startDate, endDate, durationDays } = duration;
    const holidays = getHolidaysInRange(startDate, endDate, "ABMY");

    return holidays.map((holiday) => {
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

  console.log("[GanttCanvasV3] Render - currentProject:", currentProject?.id, "duration:", duration);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No project loaded</p>
      </div>
    );
  }

  if (!duration) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Project has no timeline data</p>
          <p className="text-gray-400 text-sm">Add phases and tasks in the original Gantt view</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, durationDays } = timelineBounds || duration;

  // Calculate positions
  const getPositionPercent = (date: Date) => {
    const dayOffset = differenceInDays(date, startDate);
    return (dayOffset / durationDays) * 100;
  };

  const getBarPosition = (itemStartDate: string, itemEndDate: string) => {
    const itemStart = new Date(itemStartDate);
    const itemEnd = new Date(itemEndDate);
    const left = getPositionPercent(itemStart);
    const width = (differenceInDays(itemEnd, itemStart) / durationDays) * 100;
    return { left, width };
  };

  // Calculate timeline width based on zoom mode
  const getTimelineWidth = (): string => {
    // All zoom modes now fit to viewport by default (no horizontal scrolling)
    // The zoom mode determines the timeline header granularity (day/week/month/etc)
    // but the timeline always fits the available width
    return '100%';
  };

  const timelineWidth = getTimelineWidth();

  const effectiveSidebarWidth = isSidebarCollapsed ? 0 : sidebarWidth;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div
        style={{
          height: "48px",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "8px",
          backgroundColor: "#fff",
        }}
      >
        <button
          onClick={() => setShowMilestoneModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.05)";
            e.currentTarget.style.borderColor = "#007AFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
          }}
          title="Add milestone (Cmd+M)"
        >
          <Flag className="w-4 h-4" style={{ color: "#007AFF" }} />
          Add Milestone
        </button>
        <span
          style={{
            fontSize: "11px",
            color: "#999",
            fontFamily: "var(--font-text)",
          }}
        >
          Cmd+M
        </span>
      </div>

      {/* Main Container: Sidebar + Timeline */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Sidebar Toggle Button - Mobile */}
        {isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              position: "absolute",
              top: "80px",
              left: isSidebarCollapsed ? "8px" : `${sidebarWidth - 32}px`,
              zIndex: 100,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--color-blue)",
              color: "white",
              border: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            title={isSidebarCollapsed ? "Show task list" : "Hide task list"}
          >
            {isSidebarCollapsed ? "☰" : "✕"}
          </button>
        )}

        {/* Left Sidebar: Task Details Table */}
        <div
          style={{
            width: `${effectiveSidebarWidth}px`,
            borderRight: isSidebarCollapsed ? "none" : "1px solid rgba(0, 0, 0, 0.06)",
            backgroundColor: "var(--color-bg-primary)",
            overflow: "auto",
            flexShrink: 0,
            transition: "width 0.3s ease",
            display: isSidebarCollapsed ? "none" : "block",
          }}
        >
          {/* Sidebar Header - Jobs/Ive: Subtle - Match timeline header height */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              backgroundColor: "var(--color-bg-primary)",
              borderBottom: "1px solid var(--color-gray-4)",
              height: "64px",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              fontFamily: "var(--font-text)",
              fontSize: "11px",
              fontWeight: 600,
              color: "#000",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              opacity: 0.5,
            }}
          >
            <div style={{ flex: `0 0 ${TASK_NAME_WIDTH}px` }}>Task</div>
            <div style={{ flex: `0 0 ${DURATION_WIDTH}px`, textAlign: "center" }}>Duration</div>
            <div style={{ flex: `0 0 ${RESOURCES_WIDTH}px`, textAlign: "center" }}>Resources</div>
          </div>

          {/* Sidebar Content */}
          <div>
            {currentProject.phases.map((phase) => {
              const isCollapsed = phase.collapsed ?? false;
              const visibleTasks = isCollapsed ? [] : phase.tasks || [];
              const phaseWorkingDays = calculateWorkingDaysInclusive(
                phase.startDate,
                phase.endDate,
                currentProject.holidays || []
              );

              return (
                <div key={phase.id}>
                  {/* Phase Row - Jobs/Ive: Subtle borders */}
                  <div
                    style={{
                      height: `${PHASE_ROW_HEIGHT}px`,
                      borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 24px",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                    }}
                  >
                    <div
                      style={{
                        flex: `0 0 ${TASK_NAME_WIDTH}px`,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => handlePhaseToggle(phase.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontFamily: "var(--font-text)",
                          fontSize: "var(--text-body)",
                          fontWeight: "var(--weight-semibold)",
                          color: "#000",
                          cursor: "pointer",
                          border: "none",
                          background: "none",
                          padding: 0,
                          textAlign: "left",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{phase.name}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPhaseId(phase.id);
                        }}
                        style={{
                          padding: "4px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          color: "#007AFF",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="Edit phase"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div
                      style={{
                        flex: `0 0 ${DURATION_WIDTH}px`,
                        textAlign: "center",
                        fontFamily: "var(--font-text)",
                        fontSize: "var(--text-caption)",
                        opacity: 0.6,
                      }}
                    >
                      {phaseWorkingDays}d
                    </div>
                    <div style={{ flex: `0 0 ${RESOURCES_WIDTH}px` }} />
                  </div>

                  {/* Tasks */}
                  {!isCollapsed &&
                    visibleTasks.map((task) => {
                      const workingDays = calculateWorkingDaysInclusive(
                        task.startDate,
                        task.endDate,
                        currentProject.holidays || []
                      );

                      const isSelected =
                        selection?.selectedItemType === "task" && selection.selectedItemId === task.id;

                      return (
                        <div
                          key={task.id}
                          onClick={() => selectItem(task.id, "task")}
                          style={{
                            height: `${TASK_ROW_HEIGHT}px`,
                            borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 24px",
                            backgroundColor: isSelected
                              ? "rgba(0, 122, 255, 0.05)"
                              : "transparent",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.015)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          {/* Task Name */}
                          <div
                            style={{
                              flex: `0 0 ${TASK_NAME_WIDTH}px`,
                              paddingLeft: "32px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-text)",
                                fontSize: "var(--text-body)",
                                fontWeight: "var(--weight-regular)",
                                color: "#000",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: 1,
                              }}
                              title={task.name}
                            >
                              {task.name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTaskId({ taskId: task.id, phaseId: phase.id });
                              }}
                              style={{
                                padding: "4px",
                                backgroundColor: "transparent",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                color: "#007AFF",
                                transition: "all 0.15s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                              title="Edit task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Duration */}
                          <div
                            style={{
                              flex: `0 0 ${DURATION_WIDTH}px`,
                              textAlign: "center",
                              fontFamily: "var(--font-text)",
                              fontSize: "var(--text-body)",
                              fontWeight: "var(--weight-regular)",
                              color: "#000",
                            }}
                          >
                            {workingDays}d
                          </div>

                          {/* Resources */}
                          <div
                            style={{
                              flex: `0 0 ${RESOURCES_WIDTH}px`,
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <ResourceIndicator
                              resources={
                                task.resourceAssignments?.map((assignment) => {
                                  const resource = currentProject.resources.find(
                                    (r) => r.id === assignment.resourceId
                                  );
                                  return {
                                    resourceId: assignment.resourceId,
                                    name: resource?.name || "Unknown",
                                    allocationPercent: assignment.allocationPercentage || 0,
                                  };
                                }) || []
                              }
                              taskName={task.name}
                              taskStartDate={task.startDate}
                              taskEndDate={task.endDate}
                              taskHolidays={currentProject.holidays || []}
                              onManageResources={() => setTaskResourceModal({ taskId: task.id, phaseId: phase.id })}
                              onUpdateAllocation={(resourceId, percentage) => {
                                const assignment = task.resourceAssignments?.find(
                                  (a) => a.resourceId === resourceId
                                );
                                if (assignment) {
                                  updateTaskResourceAssignment(
                                    task.id,
                                    phase.id,
                                    assignment.id,
                                    assignment.assignmentNotes,
                                    percentage
                                  );
                                }
                              }}
                              onRemoveResource={(resourceId) => {
                                const assignment = task.resourceAssignments?.find(
                                  (a) => a.resourceId === resourceId
                                );
                                if (assignment) {
                                  unassignResourceFromTask(task.id, phase.id, assignment.id);
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resizable Divider - Hidden when sidebar collapsed or on mobile */}
        {!isSidebarCollapsed && !isMobile && (
          <div
            onMouseDown={handleResizeStart}
            style={{
              width: "4px",
              cursor: "col-resize",
              backgroundColor: isResizing ? "var(--color-blue)" : "transparent",
              transition: isResizing ? "none" : "background-color 0.15s ease",
              position: "relative",
              flexShrink: 0,
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
          {/* Grip Icon - centered vertically */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "8px 2px",
              backgroundColor: isResizing ? "var(--color-blue)" : "rgba(0, 122, 255, 0.1)",
              borderRadius: "4px",
              pointerEvents: "none",
              opacity: isResizing ? 1 : 0,
              transition: "opacity 0.15s ease",
            }}
            className="divider-grip"
          >
            <GripVertical className="w-3 h-3" style={{ color: isResizing ? "#fff" : "var(--color-blue)" }} />
          </div>
          </div>
        )}

        {/* Right Timeline: Visual Bars - Scrollable with zoom */}
        <div className="flex-1 overflow-auto">
          {/* Timeline Container with zoom width */}
          <div style={{
            width: timelineWidth === '100%' ? '100%' : 'auto',
            minWidth: timelineWidth === '100%' ? 'auto' : timelineWidth,
            transition: "all 0.3s ease"
          }}>
            {/* Timeline Header - Jobs/Ive: Simplified */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                backgroundColor: "var(--color-bg-primary)",
                borderBottom: "1px solid var(--color-gray-4)",
              }}
            >
            {/* Time Labels - Adaptive to Zoom Mode */}
            <div className="relative" style={{ height: "64px", display: "flex", flexDirection: "column" }}>
              {/* Time markers */}
              <div style={{ height: "44px", position: "relative" }}>
                {timeMarkers.map((markerDate, idx) => {
                  const left = getPositionPercent(markerDate);

                  // Calculate width until next marker (or end of timeline)
                  let width: number;
                  if (idx < timeMarkers.length - 1) {
                    const nextLeft = getPositionPercent(timeMarkers[idx + 1]);
                    width = nextLeft - left;
                  } else {
                    width = 100 - left;
                  }

                  const labels = formatTimeMarker(markerDate);

                  return (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        width: `${width}%`,
                        height: "100%",
                        borderLeft: idx === 0 ? "none" : "1px solid rgba(0, 0, 0, 0.06)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-text)",
                        gap: "2px",
                      }}
                    >
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "#000", letterSpacing: "-0.02em" }}>
                        {labels.primary}
                      </div>
                      {labels.secondary && (
                        <div style={{ fontSize: "11px", opacity: 0.35, color: "#000", fontWeight: 500 }}>
                          {labels.secondary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Holiday indicators - Separate row below */}
              <div style={{ height: "20px", position: "relative", borderTop: "1px solid rgba(0, 0, 0, 0.04)" }}>
                {allHolidays.map((holiday, idx) => (
                  <div
                    key={idx}
                    className="absolute top-1/2 -translate-y-1/2 group cursor-help"
                    style={{ left: `${holiday.position}%`, transform: "translate(-50%, -50%)" }}
                    title={`${holiday.name} - ${format(holiday.date, "dd-MMM-yy")}${holiday.isWeekend ? " (Weekend)" : ""}`}
                  >
                    {holiday.isWeekend ? (
                      <div style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: "transparent",
                        border: "1.5px solid rgba(255, 59, 48, 0.3)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(255, 59, 48, 0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "rgba(255, 59, 48, 0.3)";
                      }}
                      />
                    ) : (
                      <div style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 59, 48, 0.4)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.8)";
                        e.currentTarget.style.transform = "scale(1.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.4)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Bars */}
          <div>
            {currentProject.phases.map((phase) => {
              const isCollapsed = phase.collapsed ?? false;
              const visibleTasks = isCollapsed ? [] : phase.tasks || [];
              const phasePos = getBarPosition(phase.startDate, phase.endDate);

              return (
                <div key={phase.id}>
                  {/* Phase Bar Row - Jobs/Ive: Subtle */}
                  <div
                    style={{
                      height: `${PHASE_ROW_HEIGHT}px`,
                      borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                      position: "relative",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                    }}
                  >
                    {/* Phase Bar with Hover Info + Drop Zone */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${phasePos.left}%`,
                        width: `${phasePos.width}%`,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: "24px",
                        backgroundColor: dragOverPhaseId === phase.id ? "rgb(52, 199, 89)" : "var(--color-blue)",
                        borderRadius: "6px",
                        opacity: dragOverPhaseId === phase.id ? 0.6 : (hoveredBar?.id === phase.id && hoveredBar?.type === "phase" ? 0.4 : 0.2),
                        border: dragOverPhaseId === phase.id ? "2px dashed #34C759" : "none",
                        boxShadow: dragOverPhaseId === phase.id ? "0 4px 16px rgba(52, 199, 89, 0.6), 0 0 0 3px rgba(52, 199, 89, 0.2)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={() => setHoveredBar({ id: phase.id, type: "phase" })}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBarEditorState({ id: phase.id, type: "phase" });
                      }}
                      // Drop zone handlers for phases
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "copy";
                        setDragOverPhaseId(phase.id);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverPhaseId(phase.id);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverPhaseId(null);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const resourceId = e.dataTransfer.getData("resourceId");
                        const resourceName = e.dataTransfer.getData("resourceName");

                        if (resourceId) {
                          console.log(`Assigning resource ${resourceName} (${resourceId}) to phase ${phase.name} (${phase.id})`);
                          // TODO: Actually update the phase with the resource assignment
                          // await updatePhase(phase.id, {
                          //   resources: [...(phase.resources || []), { resourceId, role: 'assigned' }]
                          // });
                        }
                        setDragOverPhaseId(null);
                      }}
                      title={`${format(new Date(phase.startDate), "dd-MMM-yy")} - ${format(new Date(phase.endDate), "dd-MMM-yy")}`}
                    >
                      {/* Hover Overlay - Jobs/Ive style */}
                      {hoveredBar?.id === phase.id && hoveredBar?.type === "phase" && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-36px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "rgba(0, 0, 0, 0.85)",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            pointerEvents: "none",
                            zIndex: 100,
                          }}
                        >
                          {format(new Date(phase.startDate), "dd-MMM-yy")} → {format(new Date(phase.endDate), "dd-MMM-yy")} • {calculateWorkingDaysInclusive(phase.startDate, phase.endDate, currentProject.holidays || [])}d
                          <div
                            style={{
                              position: "absolute",
                              bottom: "-4px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: 0,
                              height: 0,
                              borderLeft: "4px solid transparent",
                              borderRight: "4px solid transparent",
                              borderTop: "4px solid rgba(0, 0, 0, 0.85)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Bars */}
                  {!isCollapsed &&
                    visibleTasks.map((task) => {
                      const taskPos = getBarPosition(
                        task.startDate,
                        task.endDate
                      );
                      const isSelected =
                        selection?.selectedItemType === "task" && selection.selectedItemId === task.id;
                      const isHovered = hoveredTask === task.id;

                      const taskWorkingDays = calculateWorkingDaysInclusive(task.startDate, task.endDate, currentProject.holidays || []);
                      const isBarHovered = hoveredBar?.id === task.id && hoveredBar?.type === "task";

                      return (
                        <div
                          key={task.id}
                          style={{
                            height: `${TASK_ROW_HEIGHT}px`,
                            borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
                            position: "relative",
                          }}
                        >
                          {/* Task Bar with Hover Info + Drop Zone */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              selectItem(task.id, "task");
                              setBarEditorState({ id: task.id, type: "task", phaseId: phase.id });
                            }}
                            onMouseEnter={() => {
                              setHoveredTask(task.id);
                              setHoveredBar({ id: task.id, type: "task" });
                            }}
                            onMouseLeave={() => {
                              setHoveredTask(null);
                              setHoveredBar(null);
                            }}
                            // Drop zone handlers
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = "copy";
                              setDragOverTaskId(task.id);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverTaskId(task.id);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverTaskId(null);
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const resourceId = e.dataTransfer.getData("resourceId");
                              const resourceName = e.dataTransfer.getData("resourceName");

                              if (resourceId) {
                                // Add resource to task with default 100% allocation
                                const currentAssignments = task.resourceAssignments || [];
                                const alreadyAssigned = currentAssignments.find(a => a.resourceId === resourceId);

                                if (!alreadyAssigned) {
                                  await updateTask(task.id, phase.id, {
                                    resourceAssignments: [
                                      ...currentAssignments,
                                      {
                                        resourceId,
                                        allocationPercent: 100,
                                        role: 'assigned',
                                        assignmentNotes: '',
                                      }
                                    ]
                                  });
                                }

                                // Open modal to show assignment and allow adjustment
                                setTaskResourceModal({ taskId: task.id, phaseId: phase.id });
                              }
                              setDragOverTaskId(null);
                            }}
                            style={{
                              position: "absolute",
                              left: `${taskPos.left}%`,
                              width: `${taskPos.width}%`,
                              top: "50%",
                              transform: "translateY(-50%)",
                              height: `${TASK_BAR_HEIGHT}px`,
                              backgroundColor: dragOverTaskId === task.id ? "rgb(52, 199, 89)" : "rgb(0, 122, 255)",
                              borderRadius: "6px",
                              border: isSelected ? "2px solid #000" : dragOverTaskId === task.id ? "2px dashed #34C759" : "none",
                              boxShadow: isHovered || isBarHovered || dragOverTaskId === task.id
                                ? dragOverTaskId === task.id
                                  ? "0 4px 16px rgba(52, 199, 89, 0.6), 0 0 0 3px rgba(52, 199, 89, 0.2)"
                                  : "0 2px 12px rgba(0, 122, 255, 0.4)"
                                : "none",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              padding: "0 8px",
                              gap: "6px",
                              overflow: "hidden",
                            }}
                          >
                            {/* Hover Tooltip - Jobs/Ive style */}
                            {isBarHovered && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "-36px",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                                  color: "white",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                                  pointerEvents: "none",
                                  zIndex: 100,
                                }}
                              >
                                {format(new Date(task.startDate), "dd-MMM-yy")} → {format(new Date(task.endDate), "dd-MMM-yy")} • {taskWorkingDays}d
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "-4px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: 0,
                                    height: 0,
                                    borderLeft: "4px solid transparent",
                                    borderRight: "4px solid transparent",
                                    borderTop: "4px solid rgba(0, 0, 0, 0.85)",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}

            {/* Milestone Markers */}
            {currentProject.milestones && currentProject.milestones.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                }}
              >
                {currentProject.milestones.map((milestone) => {
                  const milestoneDate = new Date(milestone.date);
                  const milestonePosition = getPositionPercent(milestoneDate);

                  // Convert percentage to pixels (approximate)
                  const timelineElement = document.querySelector('.flex-1.overflow-auto');
                  const timelineWidth = timelineElement?.scrollWidth || 1000;
                  const xPosition = (milestonePosition / 100) * timelineWidth;

                  return (
                    <div
                      key={milestone.id}
                      style={{
                        position: "absolute",
                        left: `${milestonePosition}%`,
                        top: 0,
                        bottom: 0,
                        pointerEvents: "auto",
                      }}
                    >
                      <MilestoneMarker
                        milestone={milestone}
                        xPosition={0} // Relative to container
                        yPosition={32} // Below timeline header
                        onEdit={(m) => {
                          setEditingMilestone(m);
                          setShowMilestoneModal(true);
                        }}
                        onDelete={async (id) => {
                          await deleteMilestone(id);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Inline Bar Editor - Jobs/Ive Popover */}
      {barEditorState && (() => {
        const item = barEditorState.type === "phase"
          ? currentProject.phases.find(p => p.id === barEditorState.id)
          : currentProject.phases
              .find(p => p.id === barEditorState.phaseId)
              ?.tasks.find(t => t.id === barEditorState.id);

        if (!item) return null;

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
            }}
            onClick={() => setBarEditorState(null)}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
                padding: "20px",
                minWidth: "320px",
                maxWidth: "400px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#000",
                  marginBottom: "4px",
                }}>
                  Edit {barEditorState.type === "phase" ? "Phase" : "Task"}
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                }}>
                  {item.name}
                </p>
              </div>

              {/* Quick Edit Fields */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  if (barEditorState.type === "phase") {
                    await updatePhase(barEditorState.id, {
                      startDate: formData.get("startDate") as string,
                      endDate: formData.get("endDate") as string,
                    });
                  } else {
                    await updateTask(barEditorState.id, barEditorState.phaseId!, {
                      startDate: formData.get("startDate") as string,
                      endDate: formData.get("endDate") as string,
                    });
                  }
                  setBarEditorState(null);
                }}
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                {/* Start Date */}
                <div>
                  <label style={{
                    display: "block",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "6px",
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={item.startDate}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-4)",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label style={{
                    display: "block",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "6px",
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={item.endDate}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-4)",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* Duration Display */}
                <div style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--color-gray-6)",
                  borderRadius: "6px",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                }}>
                  Duration: {calculateWorkingDaysInclusive(item.startDate, item.endDate, currentProject.holidays || [])} working days
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setBarEditorState(null)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-gray-4)",
                      backgroundColor: "transparent",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#007AFF",
                      color: "white",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Resource Drawer */}
      {resourceModalTaskId && (
        <ResourceDrawer
          itemId={resourceModalTaskId}
          itemType="task"
          onClose={() => setResourceModalTaskId(null)}
        />
      )}

      {/* Task Resource Modal - Simple Assignment */}
      {taskResourceModal && (
        <TaskResourceModal
          taskId={taskResourceModal.taskId}
          phaseId={taskResourceModal.phaseId}
          onClose={() => setTaskResourceModal(null)}
        />
      )}

      {/* Phase Edit Modal */}
      {editingPhaseId && (() => {
        const phase = currentProject.phases.find(p => p.id === editingPhaseId);
        if (!phase) return null;

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setEditingPhaseId(null)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                width: "480px",
                maxWidth: "90vw",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--color-gray-4)",
                }}
              >
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "#000" }}>
                  Edit Phase
                </h2>
              </div>

              {/* Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await updatePhase(editingPhaseId, {
                    name: formData.get("name") as string,
                    startDate: formData.get("startDate") as string,
                    endDate: formData.get("endDate") as string,
                  });
                  setEditingPhaseId(null);
                }}
                style={{ padding: "24px" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="phase-name"
                      style={{
                        display: "block",
                        fontFamily: "var(--font-text)",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#000",
                        marginBottom: "8px",
                      }}
                    >
                      Phase Name
                    </label>
                    <input
                      type="text"
                      id="phase-name"
                      name="name"
                      defaultValue={phase.name}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-gray-4)",
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  {/* Dates */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label
                        htmlFor="phase-start"
                        style={{
                          display: "block",
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#000",
                          marginBottom: "8px",
                        }}
                      >
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="phase-start"
                        name="startDate"
                        defaultValue={phase.startDate}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--color-gray-4)",
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phase-end"
                        style={{
                          display: "block",
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#000",
                          marginBottom: "8px",
                        }}
                      >
                        End Date
                      </label>
                      <input
                        type="date"
                        id="phase-end"
                        name="endDate"
                        defaultValue={phase.endDate}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--color-gray-4)",
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditingPhaseId(null)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-gray-4)",
                      backgroundColor: "#fff",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#007AFF",
                      color: "#fff",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Task Edit Modal */}
      {editingTaskId && (() => {
        const phase = currentProject.phases.find(p => p.id === editingTaskId.phaseId);
        const task = phase?.tasks.find(t => t.id === editingTaskId.taskId);
        if (!task) return null;

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setEditingTaskId(null)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                width: "480px",
                maxWidth: "90vw",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--color-gray-4)",
                }}
              >
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "#000" }}>
                  Edit Task
                </h2>
              </div>

              {/* Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await updateTask(editingTaskId.taskId, editingTaskId.phaseId, {
                    name: formData.get("name") as string,
                    startDate: formData.get("startDate") as string,
                    endDate: formData.get("endDate") as string,
                  });
                  setEditingTaskId(null);
                }}
                style={{ padding: "24px" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="task-name"
                      style={{
                        display: "block",
                        fontFamily: "var(--font-text)",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#000",
                        marginBottom: "8px",
                      }}
                    >
                      Task Name
                    </label>
                    <input
                      type="text"
                      id="task-name"
                      name="name"
                      defaultValue={task.name}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-gray-4)",
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  {/* Dates */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label
                        htmlFor="task-start"
                        style={{
                          display: "block",
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#000",
                          marginBottom: "8px",
                        }}
                      >
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="task-start"
                        name="startDate"
                        defaultValue={task.startDate}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--color-gray-4)",
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="task-end"
                        style={{
                          display: "block",
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#000",
                          marginBottom: "8px",
                        }}
                      >
                        End Date
                      </label>
                      <input
                        type="date"
                        id="task-end"
                        name="endDate"
                        defaultValue={task.endDate}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--color-gray-4)",
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditingTaskId(null)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-gray-4)",
                      backgroundColor: "#fff",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#007AFF",
                      color: "#fff",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Milestone Modal */}
      <MilestoneModal
        open={showMilestoneModal}
        onOpenChange={(open) => {
          setShowMilestoneModal(open);
          if (!open) {
            setEditingMilestone(null);
            setMilestoneDefaultDate(undefined);
          }
        }}
        onSave={async (data) => {
          if (editingMilestone) {
            await updateMilestone(editingMilestone.id, data);
          } else {
            await addMilestone(data as any);
          }
          setEditingMilestone(null);
          setMilestoneDefaultDate(undefined);
        }}
        milestone={editingMilestone}
        defaultDate={milestoneDefaultDate}
      />

      {/* CSS for divider hover effect and responsive styles */}
      <style jsx>{`
        div:hover .divider-grip {
          opacity: 1 !important;
        }

        /* Responsive styles for Gantt Canvas */
        @media (max-width: 768px) {
          /* Mobile: smaller task bars */
          .task-bar {
            height: 24px !important;
          }

          /* Mobile: compact timeline header */
          .timeline-header {
            font-size: 11px !important;
          }
        }

        @media (max-width: 640px) {
          /* Small mobile: even more compact */
          .task-row {
            height: 36px !important;
          }

          .phase-row {
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
