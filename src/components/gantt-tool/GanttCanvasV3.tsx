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
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
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
import { ChevronDown, ChevronRight, ZoomIn, ZoomOut, Edit2, Calendar, Clock, GripVertical, Flag, Trash2, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VARIANTS, SPRING, STAGGER, DURATION, getAnimationConfig } from "@/lib/design-system/animations";
import type { GanttPhase } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive, calculateCalendarDaysInclusive, formatCalendarDaysAsMonths } from "@/lib/gantt-tool/working-days";
import { getHolidaysInRange } from "@/data/holidays";
import { ResourceIndicator } from "./ResourceIndicator";
import { ResourceDrawer } from "./ResourceDrawer";
import { TaskResourceModal } from "./TaskResourceModal";
import { MilestoneModal } from "./MilestoneModal";
import { EditPhaseModal } from "./EditPhaseModal";
import { EditTaskModal } from "./EditTaskModal";
import { PhaseDeletionImpactModal } from "./PhaseDeletionImpactModal";
import { TaskDeletionImpactModal } from "./TaskDeletionImpactModal";
import { UndoToast } from "@/components/ui/UndoToast";
import { optimizeColumnWidths, waitForFonts } from "@/lib/gantt-tool/column-optimizer";
import { CollapsedPhasePreview } from "./CollapsedPhasePreview";
import { HolidayAwareDatePicker } from "@/components/ui/HolidayAwareDatePicker";

// Constants from spec (Jobs/Ive: Breathing room)
const DEFAULT_SIDEBAR_WIDTH = 750; // Default left sidebar for task details table (optimized for new columns)
const MIN_SIDEBAR_WIDTH = 550; // Minimum sidebar width
const MAX_SIDEBAR_WIDTH = 1200; // Maximum sidebar width
const TASK_NAME_WIDTH = 280; // Width for task name column
const CALENDAR_DURATION_WIDTH = 90; // Width for calendar duration column (in months)
const WORKING_DAYS_WIDTH = 90; // Width for working days column
const START_END_DATE_WIDTH = 180; // Width for start/end date column
const RESOURCES_WIDTH = 110; // Width for resources column
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
  showMilestoneModal?: boolean;
  onShowMilestoneModalChange?: (show: boolean) => void;
}

export function GanttCanvasV3({
  zoomMode = 'month',
  showMilestoneModal: externalShowMilestoneModal,
  onShowMilestoneModalChange,
}: GanttCanvasV3Props = {}) {
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
    deletePhase,
    deleteTask,
    undo,
    canUndo,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reorderTask,
  } = useGanttToolStore();

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [hoveredCollapsedPhase, setHoveredCollapsedPhase] = useState<{ phaseId: string; element: HTMLElement } | null>(null);
  const [focusedPhaseId, setFocusedPhaseId] = useState<string | null>(null);
  const [resourceModalTaskId, setResourceModalTaskId] = useState<string | null>(null);
  const [taskResourceModal, setTaskResourceModal] = useState<{ taskId: string; phaseId: string } | null>(null);
  const [autoZoomEnabled, setAutoZoomEnabled] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<{ taskId: string; phaseId: string } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ id: string; type: "phase" | "task" } | null>(null);
  const [barEditorState, setBarEditorState] = useState<{ id: string; type: "phase" | "task"; phaseId?: string } | null>(null);
  const [barEditorStartDate, setBarEditorStartDate] = useState<string>("");
  const [barEditorEndDate, setBarEditorEndDate] = useState<string>("");

  // Deletion modals state
  const [deletingPhase, setDeletingPhase] = useState<{
    phase: GanttPhase;
    phaseId: string;
  } | null>(null);

  const [deletingTask, setDeletingTask] = useState<{
    task: any;
    taskId: string;
    phaseId: string;
  } | null>(null);

  // Undo toast state
  const [undoToast, setUndoToast] = useState<{
    isOpen: boolean;
    message: string;
    action: () => void;
  } | null>(null);

  // Drag and drop state
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPhaseId, setDragOverPhaseId] = useState<string | null>(null);

  // Milestone state
  const [internalShowMilestoneModal, setInternalShowMilestoneModal] = useState(false);
  const showMilestoneModal = externalShowMilestoneModal !== undefined ? externalShowMilestoneModal : internalShowMilestoneModal;
  const setShowMilestoneModal = onShowMilestoneModalChange || setInternalShowMilestoneModal;

  const [milestoneDefaultDate, setMilestoneDefaultDate] = useState<string | undefined>();

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Column widths state
  const [taskNameWidth, setTaskNameWidth] = useState(TASK_NAME_WIDTH);
  const [calendarDurationWidth, setCalendarDurationWidth] = useState(CALENDAR_DURATION_WIDTH);
  const [workingDaysWidth, setWorkingDaysWidth] = useState(WORKING_DAYS_WIDTH);
  const [startEndDateWidth, setStartEndDateWidth] = useState(START_END_DATE_WIDTH);
  const [resourcesWidth, setResourcesWidth] = useState(RESOURCES_WIDTH);

  // Column resizing state
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Auto-optimize column widths on project load/change
  // Jobs/Ive: Intelligent, non-intrusive, ensures all content visible
  useEffect(() => {
    if (!currentProject) return;

    const autoOptimize = async () => {
      // Wait for fonts to load for accurate measurement
      await waitForFonts();

      // Calculate optimal widths based on actual content
      const optimized = optimizeColumnWidths(currentProject);

      // Apply optimized widths (users can still manually resize after)
      setTaskNameWidth(optimized.taskName);
      setCalendarDurationWidth(optimized.calendarDuration);
      setWorkingDaysWidth(optimized.workingDays);
      setStartEndDateWidth(optimized.startEndDate);
      setResourcesWidth(optimized.resources);
    };

    autoOptimize();
  }, [currentProject?.id]); // Re-run when project changes

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

  // Keyboard shortcuts and navigation - WCAG 2.1 AA Compliance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key - Close any open modals (WCAG 2.1 2.1.2 - No Keyboard Trap)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (barEditorState) {
          setBarEditorState(null);
        } else if (editingPhaseId) {
          setEditingPhaseId(null);
        } else if (editingTaskId) {
          setEditingTaskId(null);
        } else if (showMilestoneModal) {
          setShowMilestoneModal(false);
        } else if (taskResourceModal) {
          setTaskResourceModal(null);
        }
        return;
      }

      // Arrow key navigation for tasks/phases (only when no modal is open)
      if (!barEditorState && !editingPhaseId && !editingTaskId && !showMilestoneModal && !taskResourceModal && currentProject) {
        const allItems: Array<{ id: string; type: 'phase' | 'task'; phaseId?: string }> = [];

        // Build flat list of all navigable items
        currentProject.phases.forEach((phase) => {
          allItems.push({ id: phase.id, type: 'phase' });
          // Note: collapsedPhases not implemented yet, show all tasks for now
          phase.tasks.forEach((task) => {
            allItems.push({ id: task.id, type: 'task', phaseId: phase.id });
          });
        });

        const currentIndex = allItems.findIndex(
          (item) => item.id === selection?.selectedItemId && item.type === selection?.selectedItemType
        );

        // Task reordering with Cmd/Ctrl + Arrow Up/Down
        if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          if (selection?.selectedItemType === 'task' && selection.selectedItemId) {
            const phase = currentProject.phases.find((p) =>
              p.tasks.some((t) => t.id === selection.selectedItemId)
            );
            if (phase) {
              const direction = e.key === 'ArrowUp' ? 'up' : 'down';
              reorderTask(selection.selectedItemId, phase.id, direction);
            }
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0;
          const nextItem = allItems[nextIndex];
          if (nextItem) {
            selectItem(nextItem.id, nextItem.type);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1;
          const prevItem = allItems[prevIndex];
          if (prevItem) {
            selectItem(prevItem.id, prevItem.type);
          }
        } else if (e.key === 'Enter' && selection) {
          // Open edit modal for selected item
          e.preventDefault();
          if (selection.selectedItemType === 'phase') {
            setEditingPhaseId(selection.selectedItemId);
          } else if (selection.selectedItemType === 'task' && selection.selectedItemId) {
            const phase = currentProject.phases.find((p) =>
              p.tasks.some((t) => t.id === selection.selectedItemId)
            );
            if (phase) {
              setEditingTaskId({ taskId: selection.selectedItemId, phaseId: phase.id });
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barEditorState, editingPhaseId, editingTaskId, showMilestoneModal, taskResourceModal, selection, currentProject, selectItem]);

  // Sync bar editor dates when opening editor
  useEffect(() => {
    if (barEditorState && currentProject) {
      let item: GanttPhase | GanttTask | undefined;

      if (barEditorState.type === "phase") {
        item = currentProject.phases.find(p => p.id === barEditorState.id);
      } else if (barEditorState.phaseId) {
        const phase = currentProject.phases.find(p => p.id === barEditorState.phaseId);
        item = phase?.tasks.find(t => t.id === barEditorState.id);
      }

      if (item) {
        setBarEditorStartDate(item.startDate);
        setBarEditorEndDate(item.endDate);
      }
    }
  }, [barEditorState, currentProject]);

  // Deletion handlers
  const handlePhaseDelete = (phase: GanttPhase) => {
    setDeletingPhase({ phase, phaseId: phase.id });
  };

  const confirmPhaseDelete = async () => {
    if (!deletingPhase) return;

    const phaseName = deletingPhase.phase.name;
    await deletePhase(deletingPhase.phaseId);

    setDeletingPhase(null);

    // Show undo toast
    setUndoToast({
      isOpen: true,
      message: `Deleted phase "${phaseName}"`,
      action: () => {
        undo();
        setUndoToast(null);
      },
    });
  };

  const handleTaskDelete = (task: any, phaseId: string) => {
    setDeletingTask({ task, taskId: task.id, phaseId });
  };

  const confirmTaskDelete = async () => {
    if (!deletingTask) return;

    const taskName = deletingTask.task.name;
    await deleteTask(deletingTask.taskId, deletingTask.phaseId);

    setDeletingTask(null);

    // Show undo toast
    setUndoToast({
      isOpen: true,
      message: `Deleted task "${taskName}"`,
      action: () => {
        undo();
        setUndoToast(null);
      },
    });
  };

  // Handle sidebar resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle column resize start
  const handleColumnResizeStart = useCallback((e: React.MouseEvent, columnName: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnName);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  }, []);

  // Update sidebar width dynamically based on column widths
  useEffect(() => {
    const totalWidth = taskNameWidth + calendarDurationWidth + workingDaysWidth + startEndDateWidth + resourcesWidth + 48; // 48px for padding
    setSidebarWidth(totalWidth);
  }, [taskNameWidth, calendarDurationWidth, workingDaysWidth, startEndDateWidth, resourcesWidth]);

  useEffect(() => {
    if (!isResizing && !resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
        setSidebarWidth(clampedWidth);
      }

      if (resizingColumn) {
        const delta = e.clientX - resizeStartX;
        const newWidth = resizeStartWidth + delta;

        // Set minimum widths based on content
        const minWidths: Record<string, number> = {
          taskName: 120,
          calendarDuration: 80,
          workingDays: 80,
          startEndDate: 150,
          resources: 80,
        };

        const clampedWidth = Math.max(minWidths[resizingColumn] || 60, newWidth);

        switch (resizingColumn) {
          case 'taskName':
            setTaskNameWidth(clampedWidth);
            break;
          case 'calendarDuration':
            setCalendarDurationWidth(clampedWidth);
            break;
          case 'workingDays':
            setWorkingDaysWidth(clampedWidth);
            break;
          case 'startEndDate':
            setStartEndDateWidth(clampedWidth);
            break;
          case 'resources':
            setResourcesWidth(clampedWidth);
            break;
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizingColumn, resizeStartX, resizeStartWidth]);

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
      {/* Main Container: Sidebar + Timeline */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Sidebar Toggle Button - Mobile */}
        {isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? "Show task list sidebar" : "Hide task list sidebar"}
            aria-pressed={!isSidebarCollapsed}
            title={isSidebarCollapsed ? "Show task list" : "Hide task list"}
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
          >
            <span aria-hidden="true">{isSidebarCollapsed ? "☰" : "✕"}</span>
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
            <div style={{ width: `${taskNameWidth}px`, position: "relative" }}>
              Phase/Task
              <div
                onMouseDown={(e) => handleColumnResizeStart(e, 'taskName', taskNameWidth)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "-12px",
                  bottom: "-12px",
                  width: "8px",
                  cursor: "col-resize",
                  backgroundColor: resizingColumn === 'taskName' ? "var(--color-blue)" : "transparent",
                  transition: "background-color 0.15s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
            </div>
            <div style={{ width: `${calendarDurationWidth}px`, textAlign: "center", position: "relative" }}>
              Duration
              <div
                onMouseDown={(e) => handleColumnResizeStart(e, 'calendarDuration', calendarDurationWidth)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "-12px",
                  bottom: "-12px",
                  width: "8px",
                  cursor: "col-resize",
                  backgroundColor: resizingColumn === 'calendarDuration' ? "var(--color-blue)" : "transparent",
                  transition: "background-color 0.15s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
            </div>
            <div style={{ width: `${workingDaysWidth}px`, textAlign: "center", position: "relative" }}>
              Work Days
              <div
                onMouseDown={(e) => handleColumnResizeStart(e, 'workingDays', workingDaysWidth)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "-12px",
                  bottom: "-12px",
                  width: "8px",
                  cursor: "col-resize",
                  backgroundColor: resizingColumn === 'workingDays' ? "var(--color-blue)" : "transparent",
                  transition: "background-color 0.15s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
            </div>
            <div style={{ width: `${startEndDateWidth}px`, textAlign: "center", position: "relative" }}>
              Start-End
              <div
                onMouseDown={(e) => handleColumnResizeStart(e, 'startEndDate', startEndDateWidth)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "-12px",
                  bottom: "-12px",
                  width: "8px",
                  cursor: "col-resize",
                  backgroundColor: resizingColumn === 'startEndDate' ? "var(--color-blue)" : "transparent",
                  transition: "background-color 0.15s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!resizingColumn) e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
            </div>
            <div style={{ width: `${resourcesWidth}px`, textAlign: "center", position: "relative" }}>
              RES
            </div>
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
              const phaseCalendarDays = calculateCalendarDaysInclusive(
                phase.startDate,
                phase.endDate
              );
              const phaseCalendarDuration = formatCalendarDaysAsMonths(phaseCalendarDays);

              return (
                <div key={phase.id}>
                  {/* Phase Row - Jobs/Ive: Enhanced visual hierarchy */}
                  <div
                    style={{
                      height: `${PHASE_ROW_HEIGHT}px`,
                      borderBottom: "2px solid rgba(0, 0, 0, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 24px",
                      backgroundColor: "rgba(0, 122, 255, 0.04)",
                      borderLeft: "4px solid rgba(0, 122, 255, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      setHoveredPhase(phase.id);
                      if (isCollapsed) {
                        setHoveredCollapsedPhase({ phaseId: phase.id, element: e.currentTarget });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredPhase(null);
                      setHoveredCollapsedPhase(null);
                    }}
                  >
                    <div
                      style={{
                        width: `${taskNameWidth}px`,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={() => handlePhaseToggle(phase.id)}
                        aria-label={isCollapsed ? `Expand ${phase.name} phase` : `Collapse ${phase.name} phase`}
                        aria-expanded={!isCollapsed}
                        title={isCollapsed ? "Expand phase" : "Collapse phase"}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontFamily: "var(--font-text)",
                          fontSize: "var(--text-body)",
                          fontWeight: "var(--weight-semibold)",
                          color: "#1d1d1f",
                          cursor: "pointer",
                          border: "none",
                          background: "none",
                          padding: 0,
                          textAlign: "left",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <motion.div
                          animate={{ rotate: isCollapsed ? 0 : 90 }}
                          transition={getAnimationConfig(SPRING.snappy)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        </motion.div>
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                          }}
                        >
                          {phase.name}
                        </span>
                      </button>
                      {/* Delete Button - appears on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhaseDelete(phase);
                        }}
                        title="Delete phase"
                        aria-label={`Delete phase ${phase.name}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "28px",
                          height: "28px",
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#FF3B30",
                          opacity: hoveredPhase === phase.id ? 1 : 0,
                          transition: "all 0.15s ease",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Calendar Duration */}
                    <div
                      style={{
                        width: `${calendarDurationWidth}px`,
                        textAlign: "center",
                        fontFamily: "var(--font-text)",
                        fontSize: "var(--text-caption)",
                        opacity: 0.6,
                      }}
                    >
                      {phaseCalendarDuration}
                    </div>
                    {/* Working Days */}
                    <div
                      style={{
                        width: `${workingDaysWidth}px`,
                        textAlign: "center",
                        fontFamily: "var(--font-text)",
                        fontSize: "var(--text-caption)",
                        opacity: 0.6,
                      }}
                    >
                      {phaseWorkingDays} d
                    </div>
                    {/* Start/End Date */}
                    <div
                      style={{
                        width: `${startEndDateWidth}px`,
                        textAlign: "center",
                        fontFamily: "var(--font-text)",
                        fontSize: "var(--text-caption)",
                        opacity: 0.6,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {format(new Date(phase.startDate), "dd-MMM-yy (EEE)")} - {format(new Date(phase.endDate), "dd-MMM-yy (EEE)")}
                    </div>
                    <div style={{ width: `${resourcesWidth}px` }} />
                  </div>

                  {/* Tasks */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        key={`phase-tasks-${phase.id}`}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={VARIANTS.staggerContainer}
                        transition={getAnimationConfig(SPRING.gentle)}
                        style={{ overflow: "hidden" }}
                      >
                        {visibleTasks.map((task, taskIndex) => {
                          const workingDays = calculateWorkingDaysInclusive(
                            task.startDate,
                            task.endDate,
                            currentProject.holidays || []
                          );
                          const taskCalendarDays = calculateCalendarDaysInclusive(
                            task.startDate,
                            task.endDate
                          );
                          const taskCalendarDuration = formatCalendarDaysAsMonths(taskCalendarDays);

                          const isSelected =
                            selection?.selectedItemType === "task" && selection.selectedItemId === task.id;

                          const isFirstTask = taskIndex === 0;
                          const isLastTask = taskIndex === visibleTasks.length - 1;

                          return (
                            <motion.div
                              key={task.id}
                              layout
                              custom={taskIndex}
                              variants={{
                                initial: { opacity: 0, y: -10, height: 0, scale: 0.98 },
                                animate: {
                                  opacity: 1,
                                  y: 0,
                                  height: "auto",
                                  scale: 1,
                                  transition: getAnimationConfig({
                                    ...SPRING.gentle,
                                    delay: taskIndex * STAGGER.normal,
                                  }),
                                },
                                exit: {
                                  opacity: 0,
                                  y: -10,
                                  height: 0,
                                  scale: 0.98,
                                  transition: getAnimationConfig({
                                    duration: DURATION.fast,
                                    delay: (visibleTasks.length - taskIndex - 1) * STAGGER.fast,
                                  }),
                                },
                              }}
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
                                setHoveredTask(task.id);
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.015)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                setHoveredTask(null);
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }
                              }}
                            >
                          {/* Task Name */}
                          <div
                            style={{
                              width: `${taskNameWidth}px`,
                              paddingLeft: "48px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              position: "relative",
                            }}
                          >
                            {/* Indentation indicator */}
                            <div style={{
                              position: "absolute",
                              left: "32px",
                              top: "0",
                              bottom: "0",
                              width: "2px",
                              backgroundColor: "rgba(0, 0, 0, 0.06)",
                            }} />
                            <span
                              style={{
                                fontFamily: "var(--font-text)",
                                fontSize: "var(--text-body)",
                                fontWeight: "var(--weight-regular)",
                                color: "#1d1d1f",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                flex: 1,
                              }}
                              title={task.name}
                            >
                              {task.name}
                            </span>
                            {/* Reorder Controls - Apple HIG: Minimalist, appear on hover */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                opacity: hoveredTask === task.id ? 1 : 0,
                                transition: "opacity 0.15s ease",
                                flexShrink: 0,
                              }}
                            >
                              {/* Move Up Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderTask(task.id, phase.id, "up");
                                }}
                                disabled={isFirstTask}
                                title={isFirstTask ? "Already first task" : "Move task up (⌘↑)"}
                                aria-label={`Move task ${task.name} up`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "16px",
                                  height: "16px",
                                  padding: "2px",
                                  borderRadius: "4px",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  cursor: isFirstTask ? "not-allowed" : "pointer",
                                  color: isFirstTask ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.5)",
                                  transition: "all 0.15s ease",
                                  flexShrink: 0,
                                }}
                                onMouseEnter={(e) => {
                                  if (!isFirstTask) {
                                    e.currentTarget.style.color = "#000";
                                    e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.06)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isFirstTask) {
                                    e.currentTarget.style.color = "rgba(0, 0, 0, 0.5)";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                  }
                                }}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>

                              {/* Move Down Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderTask(task.id, phase.id, "down");
                                }}
                                disabled={isLastTask}
                                title={isLastTask ? "Already last task" : "Move task down (⌘↓)"}
                                aria-label={`Move task ${task.name} down`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "16px",
                                  height: "16px",
                                  padding: "2px",
                                  borderRadius: "4px",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  cursor: isLastTask ? "not-allowed" : "pointer",
                                  color: isLastTask ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.5)",
                                  transition: "all 0.15s ease",
                                  flexShrink: 0,
                                }}
                                onMouseEnter={(e) => {
                                  if (!isLastTask) {
                                    e.currentTarget.style.color = "#000";
                                    e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.06)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isLastTask) {
                                    e.currentTarget.style.color = "rgba(0, 0, 0, 0.5)";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                  }
                                }}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Delete Button - appears on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskDelete(task, phase.id);
                              }}
                              title="Delete task"
                              aria-label={`Delete task ${task.name}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "28px",
                                height: "28px",
                                padding: "6px",
                                borderRadius: "6px",
                                backgroundColor: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#FF3B30",
                                opacity: hoveredTask === task.id ? 1 : 0,
                                transition: "all 0.15s ease",
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Calendar Duration */}
                          <div
                            style={{
                              width: `${calendarDurationWidth}px`,
                              textAlign: "center",
                              fontFamily: "var(--font-text)",
                              fontSize: "var(--text-body)",
                              fontWeight: "var(--weight-regular)",
                              color: "#000",
                            }}
                          >
                            {taskCalendarDuration}
                          </div>

                          {/* Working Days */}
                          <div
                            style={{
                              width: `${workingDaysWidth}px`,
                              textAlign: "center",
                              fontFamily: "var(--font-text)",
                              fontSize: "var(--text-body)",
                              fontWeight: "var(--weight-regular)",
                              color: "#000",
                            }}
                          >
                            {workingDays} d
                          </div>

                          {/* Start/End Date */}
                          <div
                            style={{
                              width: `${startEndDateWidth}px`,
                              textAlign: "center",
                              fontFamily: "var(--font-text)",
                              fontSize: "var(--text-body)",
                              fontWeight: "var(--weight-regular)",
                              color: "#000",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                            }}
                          >
                            {format(new Date(task.startDate), "dd-MMM-yy (EEE)")} - {format(new Date(task.endDate), "dd-MMM-yy (EEE)")}
                          </div>

                          {/* Resources */}
                          <div
                            style={{
                              width: `${resourcesWidth}px`,
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
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
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

                  // Calculate if this cell has enough width to show full labels
                  // Apple HIG: Minimum 11px font size ALWAYS
                  // If width < 4%, hide secondary text entirely
                  const isNarrow = width < 4;

                  return (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        width: `${width}%`,
                        height: "100%",
                        borderLeft: idx === 0 ? "none" : "2px solid rgba(0, 0, 0, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-text)",
                        gap: "2px",
                        backgroundColor: idx % 2 === 0 ? "rgba(0, 0, 0, 0.015)" : "transparent",
                        padding: isNarrow ? "0 2px" : "0 8px",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{
                        fontSize: isNarrow ? "13px" : "16px", // Apple HIG: min 11px, using 13px for narrow
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        letterSpacing: "var(--tracking-tight)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}>
                        {labels.primary}
                      </div>
                      {labels.secondary && !isNarrow && (
                        <div style={{
                          fontSize: "11px", // Apple HIG: absolute minimum
                          opacity: 0.5,
                          color: "var(--color-text-primary)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                        }}>
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
                    title={`${holiday.name} - ${format(holiday.date, "dd-MMM-yy (EEE)")}${holiday.isWeekend ? " (Weekend)" : ""}`}
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
                      title={`${format(new Date(phase.startDate), "dd-MMM-yy (EEE)")} - ${format(new Date(phase.endDate), "dd-MMM-yy (EEE)")}`}
                    >
                      {/* Hover Overlay - Jobs/Ive style with enhanced details */}
                      {hoveredBar?.id === phase.id && hoveredBar?.type === "phase" && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-84px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "rgba(0, 0, 0, 0.92)",
                            color: "white",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 500,
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                            pointerEvents: "none",
                            zIndex: 100,
                            minWidth: "240px",
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "#fff" }}>
                            {phase.name}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.85, marginBottom: "4px" }}>
                            {format(new Date(phase.startDate), "dd-MMM-yy (EEE)")} → {format(new Date(phase.endDate), "dd-MMM-yy (EEE)")}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.85 }}>
                            Duration: {calculateWorkingDaysInclusive(phase.startDate, phase.endDate, currentProject.holidays || [])} working days
                          </div>
                          {phase.tasks && phase.tasks.length > 0 && (
                            <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "4px" }}>
                              {phase.tasks.length} task{phase.tasks.length > 1 ? 's' : ''}
                            </div>
                          )}
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
                              borderTop: "4px solid rgba(0, 0, 0, 0.92)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Bars */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        key={`phase-timeline-${phase.id}`}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={VARIANTS.staggerContainer}
                        transition={getAnimationConfig(SPRING.gentle)}
                        style={{ overflow: "hidden" }}
                      >
                        {visibleTasks.map((task, taskIndex) => {
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
                            <motion.div
                              key={task.id}
                              custom={taskIndex}
                              variants={{
                                initial: { opacity: 0, y: -10, height: 0, scale: 0.98 },
                                animate: {
                                  opacity: 1,
                                  y: 0,
                                  height: "auto",
                                  scale: 1,
                                  transition: getAnimationConfig({
                                    ...SPRING.gentle,
                                    delay: taskIndex * STAGGER.normal,
                                  }),
                                },
                                exit: {
                                  opacity: 0,
                                  y: -10,
                                  height: 0,
                                  scale: 0.98,
                                  transition: getAnimationConfig({
                                    duration: DURATION.fast,
                                    delay: (visibleTasks.length - taskIndex - 1) * STAGGER.fast,
                                  }),
                                },
                              }}
                              style={{
                                borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
                                position: "relative",
                                overflow: "hidden",
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
                                        id: nanoid(),
                                        resourceId,
                                        allocationPercentage: 100,
                                        assignmentNotes: '',
                                        assignedAt: new Date().toISOString(),
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
                              backgroundColor: dragOverTaskId === task.id
                                ? "rgb(52, 199, 89)"
                                : task.isAMS
                                  ? "rgb(142, 142, 147)" // Gray for AMS tasks
                                  : "rgb(0, 122, 255)",
                              borderRadius: "6px",
                              border: isSelected
                                ? "2px solid #000"
                                : dragOverTaskId === task.id
                                  ? "2px dashed #34C759"
                                  : task.isAMS
                                    ? "2px dashed rgba(142, 142, 147, 0.8)" // Dashed border for AMS
                                    : "none",
                              boxShadow: isHovered || isBarHovered || dragOverTaskId === task.id
                                ? dragOverTaskId === task.id
                                  ? "0 4px 16px rgba(52, 199, 89, 0.6), 0 0 0 3px rgba(52, 199, 89, 0.2)"
                                  : task.isAMS
                                    ? "0 2px 12px rgba(142, 142, 147, 0.4)"
                                    : "0 2px 12px rgba(0, 122, 255, 0.4)"
                                : "none",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              padding: "0 8px",
                              gap: "6px",
                              overflow: "hidden",
                              backgroundImage: task.isAMS
                                ? "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255, 255, 255, 0.15) 4px, rgba(255, 255, 255, 0.15) 8px)"
                                : "none", // Diagonal stripe pattern for AMS
                            }}
                          >
                            {/* AMS Badge on Task Bar */}
                            {task.isAMS && (
                              <span
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  letterSpacing: "0.5px",
                                  textTransform: "uppercase",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                AMS
                              </span>
                            )}

                            {/* Hover Tooltip - Jobs/Ive style with enhanced details */}
                            {isBarHovered && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: task.isAMS ? "-120px" : "-84px", // More space for AMS info
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  backgroundColor: "rgba(0, 0, 0, 0.92)",
                                  color: "white",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                                  pointerEvents: "none",
                                  zIndex: 100,
                                  minWidth: "240px",
                                }}
                              >
                                <div style={{ fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                                  {task.name}
                                  {task.isAMS && (
                                    <span style={{
                                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      letterSpacing: "0.5px",
                                    }}>
                                      AMS
                                    </span>
                                  )}
                                </div>
                                {task.isAMS && task.amsConfig ? (
                                  <>
                                    <div style={{ fontSize: "11px", opacity: 0.85, marginBottom: "4px", color: "#ffd60a" }}>
                                      Ongoing Support • {task.amsConfig.rateType === "daily" ? "Per Day" : "Manda"} Rate: {task.amsConfig.fixedRate.toFixed(2)}
                                    </div>
                                    {task.amsConfig.minimumDuration && (
                                      <div style={{ fontSize: "11px", opacity: 0.85, marginBottom: "4px" }}>
                                        Min Duration: {task.amsConfig.minimumDuration} months
                                      </div>
                                    )}
                                    <div style={{ fontSize: "11px", opacity: 0.85, marginBottom: "4px" }}>
                                      {format(new Date(task.startDate), "dd-MMM-yy (EEE)")} → Ongoing
                                    </div>
                                    {task.amsConfig.notes && (
                                      <div style={{ fontSize: "10px", opacity: 0.75, marginTop: "4px", fontStyle: "italic" }}>
                                        {task.amsConfig.notes}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div style={{ fontSize: "11px", opacity: 0.85, marginBottom: "4px" }}>
                                      {format(new Date(task.startDate), "dd-MMM-yy (EEE)")} → {format(new Date(task.endDate), "dd-MMM-yy (EEE)")}
                                    </div>
                                    <div style={{ fontSize: "11px", opacity: 0.85 }}>
                                      Duration: {taskWorkingDays} working days
                                    </div>
                                  </>
                                )}
                                {!task.isAMS && task.resourceAssignments && task.resourceAssignments.length > 0 && (
                                  <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "4px" }}>
                                    {task.resourceAssignments.length} resource{task.resourceAssignments.length > 1 ? 's' : ''} assigned
                                  </div>
                                )}
                                {task.isAMS && (
                                  <div style={{ fontSize: "10px", opacity: 0.75, marginTop: "6px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "4px" }}>
                                    Managed by Shared Services
                                  </div>
                                )}
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
                                    borderTop: "4px solid rgba(0, 0, 0, 0.92)",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
                </div>
              );
            })}

            {/* Milestone Markers */}
            {currentProject.milestones && currentProject.milestones.length > 0 && (
              <>
                {currentProject.milestones.map((milestone) => {
                  const milestoneDate = new Date(milestone.date);
                  const milestonePosition = getPositionPercent(milestoneDate);

                  // Check if milestone is within the current timeline bounds
                  if (milestonePosition < 0 || milestonePosition > 100) {
                    return null;
                  }

                  return (
                    <div
                      key={milestone.id}
                      style={{
                        position: "absolute",
                        left: `${milestonePosition}%`,
                        top: 0,
                        bottom: 0,
                        width: "2px",
                        backgroundColor: milestone.color || "#FF3B30",
                        opacity: 0.5,
                        pointerEvents: "none",
                        zIndex: 50,
                      }}
                    >
                      {/* Milestone marker - clickable area with diamond shape */}
                      <div
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "24px",
                          height: "24px",
                          cursor: "pointer",
                          pointerEvents: "auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 51,
                        }}
                        title={`${milestone.icon || ''} ${milestone.name} - ${format(milestoneDate, 'MMM d, yyyy')}\n\nClick to edit`}
                        onClick={(e) => {
                          try {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowMilestoneModal(true);
                          } catch (err) {
                            console.error('Error opening milestone modal:', err);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateX(-50%) scale(1.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateX(-50%) scale(1)";
                        }}
                      >
                        {/* Diamond shape */}
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            backgroundColor: milestone.color || "#FF3B30",
                            transform: "rotate(45deg)",
                            border: "2px solid white",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                            transition: "all 0.15s ease",
                          }}
                        />
                      </div>
                      {/* Label - clickable to edit */}
                      <div
                        style={{
                          position: "absolute",
                          top: "36px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          whiteSpace: "nowrap",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: milestone.color || "#FF3B30",
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: `1px solid ${milestone.color || "#FF3B30"}`,
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                          pointerEvents: "auto",
                          cursor: "pointer",
                          maxWidth: "120px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          zIndex: 51,
                        }}
                        title={`${milestone.icon || ''} ${milestone.name} - ${format(milestoneDate, 'MMM d, yyyy')}\n\nClick to edit`}
                        onClick={(e) => {
                          try {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowMilestoneModal(true);
                          } catch (err) {
                            console.error('Error opening milestone modal:', err);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = milestone.color || "#FF3B30";
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
                          e.currentTarget.style.color = milestone.color || "#FF3B30";
                        }}
                      >
                        {milestone.icon} {milestone.name}
                      </div>
                    </div>
                  );
                })}
              </>
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
                  if (barEditorState.type === "phase") {
                    await updatePhase(barEditorState.id, {
                      startDate: barEditorStartDate,
                      endDate: barEditorEndDate,
                    });
                  } else {
                    await updateTask(barEditorState.id, barEditorState.phaseId!, {
                      startDate: barEditorStartDate,
                      endDate: barEditorEndDate,
                    });
                  }
                  setBarEditorState(null);
                }}
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                {/* Start Date */}
                <div>
                  <HolidayAwareDatePicker
                    label="Start Date"
                    value={barEditorStartDate}
                    onChange={setBarEditorStartDate}
                    region={currentProject?.orgChartPro?.location || "ABMY"}
                    required={true}
                    size="medium"
                  />
                </div>

                {/* End Date */}
                <div>
                  <HolidayAwareDatePicker
                    label="End Date"
                    value={barEditorEndDate}
                    onChange={setBarEditorEndDate}
                    region={currentProject?.orgChartPro?.location || "ABMY"}
                    required={true}
                    size="medium"
                    minDate={barEditorStartDate}
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
                  Duration: {barEditorStartDate && barEditorEndDate ? calculateWorkingDaysInclusive(barEditorStartDate, barEditorEndDate, currentProject.holidays || []) : 0} working days
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setBarEditorState(null)}
                    aria-label="Cancel editing and close dialog"
                    title="Cancel"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      backgroundColor: "#fff",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
                      e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff";
                      e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.12)";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#007AFF",
                      color: "white",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0051D5";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 122, 255, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#007AFF";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
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
          isOpen={true}
          taskId={taskResourceModal.taskId}
          phaseId={taskResourceModal.phaseId}
          onClose={() => setTaskResourceModal(null)}
        />
      )}

      {/* Phase Edit Modal - Apple HIG Compliant */}
      {editingPhaseId && (() => {
        const phase = currentProject.phases.find(p => p.id === editingPhaseId);
        if (!phase) return null;

        return (
          <EditPhaseModal
            isOpen={!!editingPhaseId}
            onClose={() => setEditingPhaseId(null)}
            phase={phase}
            phaseId={editingPhaseId}
          />
        );
      })()}

      {/* Task Edit Modal - Apple HIG Compliant */}
      {editingTaskId && (() => {
        const phase = currentProject.phases.find(p => p.id === editingTaskId.phaseId);
        const task = phase?.tasks.find(t => t.id === editingTaskId.taskId);
        if (!task) return null;

        return (
          <EditTaskModal
            isOpen={!!editingTaskId}
            onClose={() => setEditingTaskId(null)}
            task={task}
            taskId={editingTaskId.taskId}
            phaseId={editingTaskId.phaseId}
          />
        );
      })()}

      {/* Milestone Modal */}
      <MilestoneModal
        open={showMilestoneModal}
        onOpenChange={(open) => {
          setShowMilestoneModal(open);
          if (!open) {
            setMilestoneDefaultDate(undefined);
          }
        }}
        onSave={async (data) => {
          try {
            if (data.id) {
              await updateMilestone(data.id, data);
            } else {
              await addMilestone(data as any);
            }
            setMilestoneDefaultDate(undefined);
          } catch (error) {
            console.error('Error saving milestone:', error);
            alert('Failed to save milestone. Please try again.');
          }
        }}
        onDelete={async (id) => {
          try {
            await deleteMilestone(id);
          } catch (error) {
            console.error('Error deleting milestone:', error);
            alert('Failed to delete milestone. Please try again.');
          }
        }}
        milestones={currentProject.milestones || []}
        defaultDate={milestoneDefaultDate}
      />

      {/* Phase Deletion Impact Modal */}
      {deletingPhase && (
        <PhaseDeletionImpactModal
          phase={deletingPhase.phase}
          allPhases={currentProject.phases}
          allResources={currentProject.resources || []}
          onConfirm={confirmPhaseDelete}
          onCancel={() => setDeletingPhase(null)}
          holidays={currentProject.holidays || []}
        />
      )}

      {/* Task Deletion Impact Modal */}
      {deletingTask && (() => {
        const phase = currentProject.phases.find(p => p.id === deletingTask.phaseId);
        const allTasks = currentProject.phases.flatMap(p => p.tasks || []);

        return phase ? (
          <TaskDeletionImpactModal
            task={deletingTask.task}
            phase={phase}
            allTasks={allTasks}
            allResources={currentProject.resources || []}
            onConfirm={confirmTaskDelete}
            onCancel={() => setDeletingTask(null)}
            holidays={currentProject.holidays || []}
          />
        ) : null;
      })()}

      {/* Undo Toast */}
      {undoToast && (
        <UndoToast
          isOpen={undoToast.isOpen}
          message={undoToast.message}
          onUndo={undoToast.action}
          onClose={() => setUndoToast(null)}
          duration={5000}
          variant="destructive"
        />
      )}

      {/* Collapsed Phase Preview Tooltip */}
      {hoveredCollapsedPhase && (() => {
        const phase = currentProject.phases.find(p => p.id === hoveredCollapsedPhase.phaseId);
        return phase ? (
          <CollapsedPhasePreview
            phase={phase}
            anchorElement={hoveredCollapsedPhase.element}
          />
        ) : null;
      })()}

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
