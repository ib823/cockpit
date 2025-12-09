/**
 * Resource Allocation Modal
 *
 * Steve Jobs: "Design is not just what it looks like... it's how it works."
 * Jony Ive: "True simplicity is derived from so much more than just the absence of clutter."
 *
 * Revolutionary UX for resource capacity allocation:
 * - TWO MODES: Phase-level (quick) or Task-level (precise)
 * - Progressive disclosure: Select tasks naturally, see results instantly
 * - Visual patterns: Allocation distribution that makes sense
 * - One action, complete results: Apply to all weeks at once
 *
 * The flow is obvious and inevitable - no manual needed.
 */

"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  X,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  ChevronRight,
  ChevronDown,
  Check,
  Layers,
  ListTodo,
  CalendarClock,
} from "lucide-react";
import { format, eachWeekOfInterval, endOfWeek, differenceInBusinessDays } from "date-fns";
import type { Resource, GanttPhase, GanttTask } from "@/types/gantt-tool";

// Allocation patterns
export type AllocationPattern = "STEADY" | "RAMP_UP" | "RAMP_DOWN" | "BELL_CURVE";

// Allocation mode: Phase-level (quick), Task-level (precise), or Recurring (time-based)
export type AllocationMode = "phase" | "task" | "recurring";

// Recurring period types
export type RecurringPeriod = "week" | "month";

interface AllocationPreset {
  label: string;
  value: number;
  description: string;
}

const ALLOCATION_PRESETS: AllocationPreset[] = [
  { label: "Full-time", value: 100, description: "5 days/week" },
  { label: "Half-time", value: 50, description: "2.5 days/week" },
  { label: "Part-time", value: 20, description: "1 day/week" },
];

// Recurring commitment presets - natural language patterns
interface RecurringPreset {
  id: string;
  label: string;
  days: number;
  period: RecurringPeriod;
  description: string;
  percentPerWeek: number; // Calculated: days/period converted to weekly %
}

const RECURRING_PRESETS: RecurringPreset[] = [
  // Weekly patterns
  { id: "1d-week", label: "1 day/week", days: 1, period: "week", description: "Light touch", percentPerWeek: 20 },
  { id: "2d-week", label: "2 days/week", days: 2, period: "week", description: "Part-time", percentPerWeek: 40 },
  { id: "3d-week", label: "3 days/week", days: 3, period: "week", description: "Majority time", percentPerWeek: 60 },
  // Monthly patterns
  { id: "1d-month", label: "1 day/month", days: 1, period: "month", description: "Steering/Review", percentPerWeek: 5 },
  { id: "2d-month", label: "2 days/month", days: 2, period: "month", description: "Advisory", percentPerWeek: 10 },
  { id: "1w-month", label: "1 week/month", days: 5, period: "month", description: "Sprint commitment", percentPerWeek: 25 },
  { id: "2w-month", label: "2 weeks/month", days: 10, period: "month", description: "Half-month", percentPerWeek: 50 },
];

// OPE (Out of Pocket Expenses) configuration
interface OPEConfig {
  includeOPE: boolean;
  onsitePercentage: number; // 0-100
  accommodationPerDay: number;
  mealsPerDay: number;
  transportPerDay: number;
  flightCount: number;
  flightCostPerTrip: number;
}

const DEFAULT_OPE_CONFIG: OPEConfig = {
  includeOPE: false,
  onsitePercentage: 50,
  accommodationPerDay: 150,
  mealsPerDay: 50,
  transportPerDay: 100,
  flightCount: 0,
  flightCostPerTrip: 800,
};

// OPE presets for common scenarios
interface OPEPreset {
  id: string;
  label: string;
  description: string;
  onsitePercentage: number;
  flightCount: number;
}

const OPE_PRESETS: OPEPreset[] = [
  { id: "remote", label: "Fully Remote", description: "No travel", onsitePercentage: 0, flightCount: 0 },
  { id: "hybrid-light", label: "Hybrid (25%)", description: "1 week/month onsite", onsitePercentage: 25, flightCount: 1 },
  { id: "hybrid", label: "Hybrid (50%)", description: "2 weeks/month onsite", onsitePercentage: 50, flightCount: 2 },
  { id: "mostly-onsite", label: "Mostly Onsite", description: "75% onsite", onsitePercentage: 75, flightCount: 2 },
  { id: "onsite", label: "Fully Onsite", description: "100% onsite", onsitePercentage: 100, flightCount: 0 },
];

// Task selection for task mode
interface TaskSelection {
  taskId: string;
  phaseId: string;
  phaseName: string;
  phaseColor: string;
  taskName: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  allocationPercent: number;
}

interface PatternOption {
  id: AllocationPattern;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PATTERN_OPTIONS: PatternOption[] = [
  {
    id: "STEADY",
    label: "Steady",
    description: "Constant allocation throughout",
    icon: <Minus size={16} />,
  },
  {
    id: "RAMP_UP",
    label: "Ramp Up",
    description: "Start low, increase over 4 weeks",
    icon: <TrendingUp size={16} />,
  },
  {
    id: "RAMP_DOWN",
    label: "Ramp Down",
    description: "Start high, decrease over last 4 weeks",
    icon: <TrendingDown size={16} />,
  },
  {
    id: "BELL_CURVE",
    label: "Bell Curve",
    description: "Peak in middle, taper at edges",
    icon: <Activity size={16} />,
  },
];

interface ResourceAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  phases: GanttPhase[];
  projectStartDate: Date;
  projectEndDate: Date;
  onApplyAllocation: (
    resourceId: string,
    allocations: Map<string, number> // weekIdentifier -> percentage
  ) => void;
  // Pre-selected values (optional)
  initialResourceId?: string;
  initialPhaseId?: string;
}

export function ResourceAllocationModal({
  isOpen,
  onClose,
  resources,
  phases,
  projectStartDate,
  projectEndDate,
  onApplyAllocation,
  initialResourceId,
  initialPhaseId,
}: ResourceAllocationModalProps) {
  // Mode state
  const [mode, setMode] = useState<AllocationMode>("phase");

  // Common state
  const [selectedResourceId, setSelectedResourceId] = useState<string>(initialResourceId || "");
  const [allocationPercent, setAllocationPercent] = useState<number>(100);
  const [pattern, setPattern] = useState<AllocationPattern>("STEADY");
  const [rampWeeks, setRampWeeks] = useState<number>(4);

  // Phase mode state
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(initialPhaseId || "");

  // Task mode state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Map<string, TaskSelection>>(new Map());
  // Per-phase allocation intensity (phaseId -> percentage)
  const [phaseAllocations, setPhaseAllocations] = useState<Map<string, number>>(new Map());

  // Recurring mode state
  const [selectedRecurringPreset, setSelectedRecurringPreset] = useState<string>("1d-week");
  const [customRecurringDays, setCustomRecurringDays] = useState<number>(1);
  const [customRecurringPeriod, setCustomRecurringPeriod] = useState<RecurringPeriod>("week");

  // OPE (Out of Pocket Expenses) state
  const [opeConfig, setOpeConfig] = useState<OPEConfig>(DEFAULT_OPE_CONFIG);
  const [selectedOPEPreset, setSelectedOPEPreset] = useState<string>("remote");

  // Get selected phase details
  const selectedPhase = useMemo(() => {
    return phases.find((p) => p.id === selectedPhaseId);
  }, [phases, selectedPhaseId]);

  // Calculate weeks in selected phase
  const phaseWeeks = useMemo(() => {
    if (!selectedPhase?.startDate || !selectedPhase?.endDate) return [];

    const start = new Date(selectedPhase.startDate);
    const end = new Date(selectedPhase.endDate);

    const weekStarts = eachWeekOfInterval(
      { start, end },
      { weekStartsOn: 1 }
    );

    return weekStarts.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      return {
        weekNumber: index + 1,
        weekIdentifier: `W${String(index + 1).padStart(2, "0")}`,
        startDate: weekStart,
        endDate: weekEnd,
      };
    });
  }, [selectedPhase]);

  // ============================================================================
  // TASK MODE: Helper functions for task-level allocation
  // ============================================================================

  // Get all tasks with their phase info
  const allTasksWithPhaseInfo = useMemo(() => {
    const tasks: Array<{
      task: GanttTask;
      phase: GanttPhase;
      workingDays: number;
    }> = [];

    phases.forEach((phase) => {
      phase.tasks?.forEach((task) => {
        if (task.startDate && task.endDate) {
          const start = new Date(task.startDate);
          const end = new Date(task.endDate);
          const workingDays = Math.max(1, differenceInBusinessDays(end, start) + 1);
          tasks.push({ task, phase, workingDays });
        }
      });
    });

    return tasks;
  }, [phases]);

  // Toggle phase expansion in task mode
  const togglePhaseExpanded = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  // Toggle task selection
  const toggleTaskSelection = useCallback(
    (task: GanttTask, phase: GanttPhase, workingDays: number) => {
      setSelectedTasks((prev) => {
        const next = new Map(prev);
        if (next.has(task.id)) {
          next.delete(task.id);
        } else {
          // Use phase-specific allocation intensity
          const phaseAlloc = phaseAllocations.get(phase.id) ?? 100;
          next.set(task.id, {
            taskId: task.id,
            phaseId: phase.id,
            phaseName: phase.name,
            phaseColor: phase.color || "#007AFF",
            taskName: task.name,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
            workingDays,
            allocationPercent: phaseAlloc,
          });
        }
        return next;
      });
    },
    [phaseAllocations]
  );

  // Select all tasks in a phase
  const selectAllTasksInPhase = useCallback(
    (phase: GanttPhase) => {
      const phaseTasks = allTasksWithPhaseInfo.filter((t) => t.phase.id === phase.id);
      const allSelected = phaseTasks.every((t) => selectedTasks.has(t.task.id));
      // Use phase-specific allocation intensity
      const phaseAlloc = phaseAllocations.get(phase.id) ?? 100;

      setSelectedTasks((prev) => {
        const next = new Map(prev);
        if (allSelected) {
          // Deselect all
          phaseTasks.forEach((t) => next.delete(t.task.id));
        } else {
          // Select all
          phaseTasks.forEach((t) => {
            next.set(t.task.id, {
              taskId: t.task.id,
              phaseId: phase.id,
              phaseName: phase.name,
              phaseColor: phase.color || "#007AFF",
              taskName: t.task.name,
              startDate: new Date(t.task.startDate),
              endDate: new Date(t.task.endDate),
              workingDays: t.workingDays,
              allocationPercent: phaseAlloc,
            });
          });
        }
        return next;
      });
    },
    [allTasksWithPhaseInfo, selectedTasks, phaseAllocations]
  );

  // Update allocation for a specific task
  const updateTaskAllocation = useCallback((taskId: string, percent: number) => {
    setSelectedTasks((prev) => {
      const next = new Map(prev);
      const task = next.get(taskId);
      if (task) {
        next.set(taskId, { ...task, allocationPercent: percent });
      }
      return next;
    });
  }, []);

  // Get allocation intensity for a phase (defaults to 100%)
  const getPhaseAllocation = useCallback((phaseId: string): number => {
    return phaseAllocations.get(phaseId) ?? 100;
  }, [phaseAllocations]);

  // Set allocation intensity for a phase and update all selected tasks in that phase
  const setPhaseAllocation = useCallback((phaseId: string, percent: number) => {
    setPhaseAllocations((prev) => {
      const next = new Map(prev);
      next.set(phaseId, percent);
      return next;
    });
    // Update all selected tasks in this phase to the new allocation
    setSelectedTasks((prev) => {
      const next = new Map(prev);
      next.forEach((task, taskId) => {
        if (task.phaseId === phaseId) {
          next.set(taskId, { ...task, allocationPercent: percent });
        }
      });
      return next;
    });
  }, []);

  // Apply allocation percent to all selected tasks
  // Takes explicit value to avoid stale closure issues with React state
  const applyAllocationToAllSelected = useCallback((explicitValue?: number) => {
    setSelectedTasks((prev) => {
      const next = new Map(prev);
      const valueToApply = explicitValue ?? allocationPercent;
      next.forEach((task, taskId) => {
        next.set(taskId, { ...task, allocationPercent: valueToApply });
      });
      return next;
    });
  }, [allocationPercent]);

  // ============================================================================
  // PHASE MODE: Calculate allocation for each week based on pattern
  // ============================================================================

  const calculatePatternAllocations = useCallback((): Map<string, number> => {
    const allocations = new Map<string, number>();
    const totalWeeks = phaseWeeks.length;

    if (totalWeeks === 0) return allocations;

    phaseWeeks.forEach((week, index) => {
      let weekAllocation = allocationPercent;

      switch (pattern) {
        case "STEADY":
          weekAllocation = allocationPercent;
          break;

        case "RAMP_UP": {
          const rampPeriod = Math.min(rampWeeks, totalWeeks);
          if (index < rampPeriod) {
            const progress = (index + 1) / rampPeriod;
            weekAllocation = Math.round(allocationPercent * progress);
          }
          break;
        }

        case "RAMP_DOWN": {
          const rampPeriod = Math.min(rampWeeks, totalWeeks);
          const rampStart = totalWeeks - rampPeriod;
          if (index >= rampStart) {
            const progress = (totalWeeks - index) / rampPeriod;
            weekAllocation = Math.round(allocationPercent * progress);
          }
          break;
        }

        case "BELL_CURVE": {
          const midpoint = (totalWeeks - 1) / 2;
          const spread = totalWeeks / 4;
          const distance = Math.abs(index - midpoint);
          const factor = Math.exp(-(distance * distance) / (2 * spread * spread));
          weekAllocation = Math.round(allocationPercent * factor);
          break;
        }
      }

      allocations.set(week.weekIdentifier, Math.max(0, Math.min(200, weekAllocation)));
    });

    return allocations;
  }, [phaseWeeks, allocationPercent, pattern, rampWeeks]);

  // ============================================================================
  // TASK MODE: Calculate weekly allocations from selected tasks
  // ============================================================================

  const calculateTaskModeAllocations = useCallback((): Map<string, number> => {
    const weeklyTotals = new Map<string, number>();

    // Get project weeks for consistent week identifiers
    const projectWeeks = eachWeekOfInterval(
      { start: projectStartDate, end: projectEndDate },
      { weekStartsOn: 1 }
    );
    const weekIdentifiers = projectWeeks.map((weekStart, index) => ({
      weekStart,
      weekEnd: endOfWeek(weekStart, { weekStartsOn: 1 }),
      identifier: `W${String(index + 1).padStart(2, "0")}`,
    }));

    // For each selected task, distribute allocation across its weeks
    selectedTasks.forEach((selection) => {
      const taskStart = selection.startDate;
      const taskEnd = selection.endDate;

      // Find which project weeks this task spans
      weekIdentifiers.forEach(({ weekStart, weekEnd, identifier }) => {
        // Check if task overlaps with this week
        if (taskEnd < weekStart || taskStart > weekEnd) return;

        // Calculate overlap proportion
        const overlapStart = taskStart > weekStart ? taskStart : weekStart;
        const overlapEnd = taskEnd < weekEnd ? taskEnd : weekEnd;

        // Count working days in overlap
        let workingDays = 0;
        const current = new Date(overlapStart);
        while (current <= overlapEnd) {
          const day = current.getDay();
          if (day !== 0 && day !== 6) workingDays++;
          current.setDate(current.getDate() + 1);
        }

        if (workingDays > 0) {
          // Allocation for this week = task allocation * (overlap days / 5)
          const weekAllocation = selection.allocationPercent * (workingDays / 5);
          const existing = weeklyTotals.get(identifier) || 0;
          weeklyTotals.set(identifier, existing + weekAllocation);
        }
      });
    });

    return weeklyTotals;
  }, [selectedTasks, projectStartDate, projectEndDate]);

  // ============================================================================
  // RECURRING MODE: Calculate weekly allocations from recurring commitment
  // ============================================================================

  const calculateRecurringAllocations = useCallback((): Map<string, number> => {
    const weeklyTotals = new Map<string, number>();

    // Get the selected preset or use custom values
    const preset = RECURRING_PRESETS.find((p) => p.id === selectedRecurringPreset);
    let percentPerWeek: number;

    if (preset) {
      percentPerWeek = preset.percentPerWeek;
    } else {
      // Custom calculation: convert days/period to weekly percentage
      if (customRecurringPeriod === "week") {
        percentPerWeek = (customRecurringDays / 5) * 100;
      } else {
        // Monthly: ~4.33 weeks per month, so days/month / 4.33 / 5 * 100
        percentPerWeek = (customRecurringDays / 4.33 / 5) * 100;
      }
    }

    // Apply to all project weeks
    const projectWeeks = eachWeekOfInterval(
      { start: projectStartDate, end: projectEndDate },
      { weekStartsOn: 1 }
    );

    projectWeeks.forEach((weekStart, index) => {
      const identifier = `W${String(index + 1).padStart(2, "0")}`;
      weeklyTotals.set(identifier, percentPerWeek);
    });

    return weeklyTotals;
  }, [selectedRecurringPreset, customRecurringDays, customRecurringPeriod, projectStartDate, projectEndDate]);

  // Get recurring summary for display
  const recurringSummary = useMemo(() => {
    const preset = RECURRING_PRESETS.find((p) => p.id === selectedRecurringPreset);
    let days: number;
    let period: RecurringPeriod;
    let percentPerWeek: number;

    if (preset) {
      days = preset.days;
      period = preset.period;
      percentPerWeek = preset.percentPerWeek;
    } else {
      days = customRecurringDays;
      period = customRecurringPeriod;
      if (period === "week") {
        percentPerWeek = (days / 5) * 100;
      } else {
        percentPerWeek = (days / 4.33 / 5) * 100;
      }
    }

    // Calculate project totals
    const projectWeeks = eachWeekOfInterval(
      { start: projectStartDate, end: projectEndDate },
      { weekStartsOn: 1 }
    );
    const totalWeeks = projectWeeks.length;
    const totalDays = period === "week"
      ? days * totalWeeks
      : days * (totalWeeks / 4.33);

    return {
      days,
      period,
      percentPerWeek,
      totalWeeks,
      totalDays: Math.round(totalDays * 10) / 10,
      label: preset?.label || `${days} day${days !== 1 ? "s" : ""}/${period}`,
    };
  }, [selectedRecurringPreset, customRecurringDays, customRecurringPeriod, projectStartDate, projectEndDate]);

  // ============================================================================
  // Preview allocations (mode-aware)
  // ============================================================================

  const previewAllocations = useMemo(() => {
    if (mode === "phase") {
      return calculatePatternAllocations();
    } else if (mode === "task") {
      return calculateTaskModeAllocations();
    } else {
      return calculateRecurringAllocations();
    }
  }, [mode, calculatePatternAllocations, calculateTaskModeAllocations, calculateRecurringAllocations]);

  // Summary stats for task mode - comprehensive metrics
  const taskModeSummary = useMemo(() => {
    const selectedCount = selectedTasks.size;

    // Calculate total mandays from selected tasks (working days * allocation %)
    let totalMandays = 0;
    let totalWorkingDays = 0;
    selectedTasks.forEach((task) => {
      const taskDays = task.workingDays * (task.allocationPercent / 100);
      totalMandays += taskDays;
      totalWorkingDays += task.workingDays;
    });

    // Weekly stats from preview
    const weeklyAllocations = Array.from(previewAllocations.values());
    const totalWeeks = previewAllocations.size;
    const avgAllocation =
      totalWeeks > 0
        ? weeklyAllocations.reduce((a, b) => a + b, 0) / totalWeeks
        : 0;
    const overallocatedWeeks = weeklyAllocations.filter((p) => p > 100).length;

    // Calculate FTE (Full-Time Equivalent) - total mandays / total working days * 100
    const ftePercent = totalWorkingDays > 0 ? (totalMandays / totalWorkingDays) * 100 : 0;

    return {
      selectedCount,
      totalMandays,
      totalWorkingDays,
      totalWeeks,
      avgAllocation,
      overallocatedWeeks,
      ftePercent,
    };
  }, [selectedTasks, previewAllocations]);

  // ============================================================================
  // OPE (Out of Pocket Expenses) calculation
  // ============================================================================

  const opeCalculation = useMemo(() => {
    if (!opeConfig.includeOPE) {
      return { totalOPE: 0, onsiteDays: 0, breakdown: [] };
    }

    // Get total mandays from current mode
    let totalDays = 0;
    if (mode === "phase" && phaseWeeks.length > 0) {
      totalDays = phaseWeeks.length * 5 * (allocationPercent / 100);
    } else if (mode === "task") {
      totalDays = taskModeSummary.totalMandays;
    } else if (mode === "recurring") {
      totalDays = recurringSummary.totalDays;
    }

    const onsiteDays = Math.round(totalDays * (opeConfig.onsitePercentage / 100));

    const breakdown = [
      {
        label: "Accommodation",
        rate: opeConfig.accommodationPerDay,
        days: onsiteDays,
        total: opeConfig.accommodationPerDay * onsiteDays,
      },
      {
        label: "Meals",
        rate: opeConfig.mealsPerDay,
        days: onsiteDays,
        total: opeConfig.mealsPerDay * onsiteDays,
      },
      {
        label: "Transport",
        rate: opeConfig.transportPerDay,
        days: onsiteDays,
        total: opeConfig.transportPerDay * onsiteDays,
      },
      {
        label: "Flights",
        rate: opeConfig.flightCostPerTrip,
        days: opeConfig.flightCount,
        total: opeConfig.flightCostPerTrip * opeConfig.flightCount,
      },
    ];

    const totalOPE = breakdown.reduce((sum, item) => sum + item.total, 0);

    return {
      totalOPE,
      onsiteDays,
      totalDays,
      breakdown,
    };
  }, [opeConfig, mode, phaseWeeks, allocationPercent, taskModeSummary.totalMandays, recurringSummary.totalDays]);

  // ============================================================================
  // Handle apply (mode-aware)
  // ============================================================================

  const handleApply = useCallback(() => {
    if (!selectedResourceId) return;

    if (mode === "phase") {
      if (!selectedPhaseId) return;
      const allocations = calculatePatternAllocations();
      onApplyAllocation(selectedResourceId, allocations);
    } else if (mode === "task") {
      if (selectedTasks.size === 0) return;
      const allocations = calculateTaskModeAllocations();
      onApplyAllocation(selectedResourceId, allocations);
    } else {
      // Recurring mode - always valid if resource is selected
      const allocations = calculateRecurringAllocations();
      onApplyAllocation(selectedResourceId, allocations);
    }
    onClose();
  }, [
    mode,
    selectedResourceId,
    selectedPhaseId,
    selectedTasks,
    calculatePatternAllocations,
    calculateTaskModeAllocations,
    calculateRecurringAllocations,
    onApplyAllocation,
    onClose,
  ]);

  // Get resource by ID
  const getResource = (id: string) => resources.find((r) => r.id === id);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "5vh 5vw",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-primary, #fff)",
          borderRadius: "16px",
          width: "90vw",
          height: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--color-blue, #007AFF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mode === "phase" ? (
                <Layers size={24} color="#fff" />
              ) : (
                <ListTodo size={24} color="#fff" />
              )}
            </div>
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Allocate Resource Capacity
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-tertiary)",
                  margin: 0,
                }}
              >
                {mode === "phase"
                  ? "Fill weeks for an entire phase"
                  : mode === "task"
                    ? "Select specific tasks to allocate"
                    : "Fixed time commitment across project"}
              </p>
            </div>
          </div>

          {/* Mode Toggle in header */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(0, 0, 0, 0.06)",
                borderRadius: "10px",
                padding: "3px",
              }}
            >
              <button
                onClick={() => setMode("phase")}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: mode === "phase" ? "#fff" : "transparent",
                  color:
                    mode === "phase"
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    mode === "phase" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "36px",
                }}
              >
                <Layers size={14} />
                Phase
              </button>
              <button
                onClick={() => setMode("task")}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: mode === "task" ? "#fff" : "transparent",
                  color:
                    mode === "task"
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    mode === "task" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "36px",
                }}
              >
                <ListTodo size={14} />
                Task
              </button>
              <button
                onClick={() => setMode("recurring")}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: mode === "recurring" ? "#fff" : "transparent",
                  color:
                    mode === "recurring"
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    mode === "recurring" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "36px",
                }}
              >
                <CalendarClock size={14} />
                Recurring
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={22} color="var(--color-text-tertiary)" />
            </button>
          </div>
        </div>

        {/* Two-Column Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* LEFT COLUMN - Configuration & Selection */}
          <div
            style={{
              width: "45%",
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Resource Selection */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                backgroundColor: "rgba(0, 0, 0, 0.02)",
                flexShrink: 0,
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Resource
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Users size={18} color="var(--color-text-tertiary)" />
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  style={{
                    flex: 1,
                    height: "44px",
                    padding: "0 16px",
                    fontSize: "15px",
                    fontWeight: 500,
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    borderRadius: "10px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select resource...</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} - {resource.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: "auto" }}>

          {/* PHASE MODE: Phase selection and pattern */}
          {mode === "phase" && (
            <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
              {/* Phase Selection */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Phase
                </label>
                <select
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 12px",
                    fontSize: "15px",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-bg-primary, #fff)",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select a phase...</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                      {phase.startDate && phase.endDate &&
                        ` (${format(new Date(phase.startDate), "dd-MMM-yy")} → ${format(new Date(phase.endDate), "dd-MMM-yy")})`}
                    </option>
                  ))}
                </select>
                {selectedPhase && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-tertiary)",
                      marginTop: "4px",
                    }}
                  >
                    {phaseWeeks.length} weeks in this phase
                  </p>
                )}
              </div>

              {/* Allocation Percentage */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  Allocation
                </label>

                {/* Preset buttons */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {ALLOCATION_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setAllocationPercent(preset.value)}
                      style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: 500,
                        border: allocationPercent === preset.value
                          ? "2px solid var(--color-blue, #007AFF)"
                          : "1px solid rgba(0, 0, 0, 0.12)",
                        borderRadius: "8px",
                        backgroundColor: allocationPercent === preset.value
                          ? "rgba(0, 122, 255, 0.08)"
                          : "var(--color-bg-primary, #fff)",
                        color: allocationPercent === preset.value
                          ? "var(--color-blue, #007AFF)"
                          : "var(--color-text-primary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      title={preset.description}
                    >
                      {preset.label} ({preset.value}%)
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    Custom:
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={allocationPercent}
                    onChange={(e) => setAllocationPercent(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
                    style={{
                      width: "80px",
                      height: "36px",
                      padding: "0 12px",
                      fontSize: "15px",
                      fontWeight: 600,
                      textAlign: "center",
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      borderRadius: "8px",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>%</span>
                </div>
              </div>

              {/* Distribution Pattern */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  Distribution Pattern
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {PATTERN_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setPattern(option.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        border: pattern === option.id
                          ? "2px solid var(--color-blue, #007AFF)"
                          : "1px solid rgba(0, 0, 0, 0.08)",
                        borderRadius: "10px",
                        backgroundColor: pattern === option.id
                          ? "rgba(0, 122, 255, 0.04)"
                          : "var(--color-bg-primary, #fff)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: pattern === option.id
                            ? "var(--color-blue, #007AFF)"
                            : "rgba(0, 0, 0, 0.04)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: pattern === option.id ? "#fff" : "var(--color-text-tertiary)",
                        }}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {option.label}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {option.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ramp duration (for ramp patterns) */}
              {(pattern === "RAMP_UP" || pattern === "RAMP_DOWN") && (
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--color-text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    Ramp Duration
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="range"
                      min={1}
                      max={Math.max(8, phaseWeeks.length)}
                      value={rampWeeks}
                      onChange={(e) => setRampWeeks(parseInt(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        minWidth: "60px",
                      }}
                    >
                      {rampWeeks} weeks
                    </span>
                  </div>
                </div>
              )}

              {/* Preview */}
              {selectedResourceId && selectedPhaseId && phaseWeeks.length > 0 && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "rgba(0, 0, 0, 0.02)",
                    borderRadius: "10px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Preview
                  </div>

                  {/* Visual bar chart preview */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "2px",
                      height: "60px",
                      marginBottom: "8px",
                    }}
                  >
                    {phaseWeeks.slice(0, 20).map((week) => {
                      const allocation = previewAllocations.get(week.weekIdentifier) || 0;
                      const height = (allocation / 100) * 60;
                      return (
                        <div
                          key={week.weekIdentifier}
                          style={{
                            flex: 1,
                            height: `${Math.min(height, 60)}px`,
                            backgroundColor: allocation > 100
                              ? "#FF3B30"
                              : allocation > 80
                                ? "#FF9500"
                                : "#34C759",
                            borderRadius: "2px 2px 0 0",
                            minWidth: "4px",
                            transition: "height 0.2s ease",
                          }}
                          title={`${week.weekIdentifier}: ${allocation}%`}
                        />
                      );
                    })}
                    {phaseWeeks.length > 20 && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-tertiary)",
                          alignSelf: "center",
                          marginLeft: "4px",
                        }}
                      >
                        +{phaseWeeks.length - 20} more
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "13px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <span>
                      Total: <strong>{phaseWeeks.length} weeks</strong>
                    </span>
                    <span>
                      Avg: <strong>
                        {Math.round(
                          Array.from(previewAllocations.values()).reduce((a, b) => a + b, 0) /
                          Math.max(1, previewAllocations.size)
                        )}%
                      </strong>
                    </span>
                    <span>
                      Days: <strong>
                        {(
                          Array.from(previewAllocations.values()).reduce((a, b) => a + b, 0) /
                          100 * 5
                        ).toFixed(1)}d
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TASK MODE: Expandable phase/task list */}
          {mode === "task" && selectedResourceId && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {/* Phase/Task list with per-phase allocation intensity */}
              {phases.map((phase) => {
                const phaseTasks = allTasksWithPhaseInfo.filter(
                  (t) => t.phase.id === phase.id
                );
                const isExpanded = expandedPhases.has(phase.id);
                const selectedInPhase = phaseTasks.filter((t) =>
                  selectedTasks.has(t.task.id)
                ).length;
                const allSelected =
                  phaseTasks.length > 0 && selectedInPhase === phaseTasks.length;
                const currentPhaseAlloc = getPhaseAllocation(phase.id);
                const someSelected =
                  selectedInPhase > 0 && selectedInPhase < phaseTasks.length;

                if (phaseTasks.length === 0) return null;

                return (
                  <div key={phase.id} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.08)" }}>
                    {/* Phase Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 20px",
                        cursor: "pointer",
                        backgroundColor: isExpanded
                          ? "rgba(0, 0, 0, 0.02)"
                          : "transparent",
                        transition: "background-color 0.15s ease",
                        minHeight: "56px",
                      }}
                      onClick={() => togglePhaseExpanded(phase.id)}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown
                            size={20}
                            color="var(--color-text-tertiary)"
                          />
                        ) : (
                          <ChevronRight
                            size={20}
                            color="var(--color-text-tertiary)"
                          />
                        )}
                      </div>

                      <div
                        style={{
                          width: "8px",
                          height: "32px",
                          borderRadius: "4px",
                          backgroundColor: phase.color || "#007AFF",
                          marginRight: "12px",
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {phase.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {phaseTasks.length} tasks
                          {selectedInPhase > 0 && (
                            <span
                              style={{
                                color: "var(--color-blue)",
                                fontWeight: 500,
                              }}
                            >
                              {" "}
                              ({selectedInPhase} selected)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Phase allocation intensity indicator */}
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          backgroundColor:
                            currentPhaseAlloc > 100
                              ? "rgba(255, 59, 48, 0.1)"
                              : currentPhaseAlloc > 80
                                ? "rgba(255, 149, 0, 0.1)"
                                : "rgba(52, 199, 89, 0.1)",
                          marginRight: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color:
                              currentPhaseAlloc > 100
                                ? "#FF3B30"
                                : currentPhaseAlloc > 80
                                  ? "#FF9500"
                                  : "#34C759",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {currentPhaseAlloc}%
                        </span>
                      </div>

                      {/* Select all checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllTasksInPhase(phase);
                        }}
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: allSelected
                            ? "var(--color-blue, #007AFF)"
                            : someSelected
                              ? "rgba(0, 122, 255, 0.2)"
                              : "rgba(0, 0, 0, 0.04)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        title={allSelected ? "Deselect all" : "Select all tasks"}
                      >
                        {allSelected && <Check size={18} color="#fff" />}
                        {someSelected && (
                          <div
                            style={{
                              width: "12px",
                              height: "3px",
                              backgroundColor: "var(--color-blue)",
                              borderRadius: "2px",
                            }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Per-phase allocation intensity presets */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: "12px 20px 12px 68px",
                          backgroundColor: "rgba(0, 0, 0, 0.02)",
                          borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--color-text-secondary)",
                            marginRight: "4px",
                          }}
                        >
                          Allocation:
                        </span>
                        {ALLOCATION_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhaseAllocation(phase.id, preset.value);
                            }}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 500,
                              border:
                                currentPhaseAlloc === preset.value
                                  ? "2px solid var(--color-blue, #007AFF)"
                                  : "1px solid rgba(0, 0, 0, 0.12)",
                              borderRadius: "6px",
                              backgroundColor:
                                currentPhaseAlloc === preset.value
                                  ? "rgba(0, 122, 255, 0.08)"
                                  : "#fff",
                              color:
                                currentPhaseAlloc === preset.value
                                  ? "var(--color-blue, #007AFF)"
                                  : "var(--color-text-primary)",
                              cursor: "pointer",
                              minHeight: "32px",
                              transition: "all 0.15s ease",
                            }}
                            title={preset.description}
                          >
                            {preset.label}
                          </button>
                        ))}
                        {/* Custom input */}
                        <input
                          type="number"
                          min={0}
                          max={200}
                          value={currentPhaseAlloc}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(200, parseInt(e.target.value) || 0));
                            setPhaseAllocation(phase.id, val);
                          }}
                          style={{
                            width: "60px",
                            height: "32px",
                            padding: "0 8px",
                            fontSize: "13px",
                            fontWeight: 600,
                            textAlign: "center",
                            border: "1px solid rgba(0, 0, 0, 0.12)",
                            borderRadius: "6px",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>%</span>
                      </div>
                    )}

                    {/* Tasks */}
                    {isExpanded && (
                      <div style={{ paddingLeft: "32px" }}>
                        {phaseTasks.map(({ task, workingDays }) => {
                          const selection = selectedTasks.get(task.id);
                          const isSelected = !!selection;
                          const taskAllocation =
                            selection?.allocationPercent ?? currentPhaseAlloc;

                          return (
                            <div
                              key={task.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "10px 20px 10px 12px",
                                borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                                backgroundColor: isSelected
                                  ? "rgba(0, 122, 255, 0.04)"
                                  : "transparent",
                                transition: "background-color 0.15s ease",
                                minHeight: "52px",
                              }}
                            >
                              {/* Checkbox */}
                              <button
                                onClick={() =>
                                  toggleTaskSelection(task, phase, workingDays)
                                }
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "8px",
                                  border: isSelected
                                    ? "none"
                                    : "2px solid rgba(0, 0, 0, 0.12)",
                                  backgroundColor: isSelected
                                    ? "var(--color-blue, #007AFF)"
                                    : "transparent",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginRight: "12px",
                                  transition: "all 0.15s ease",
                                  flexShrink: 0,
                                }}
                              >
                                {isSelected && <Check size={18} color="#fff" />}
                              </button>

                              {/* Task info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "var(--color-text-primary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {task.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--color-text-tertiary)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <span>
                                    {format(new Date(task.startDate), "dd MMM")}{" "}
                                    -{" "}
                                    {format(new Date(task.endDate), "dd MMM")}
                                  </span>
                                  <span>&middot;</span>
                                  <span>{workingDays}wd</span>
                                </div>
                              </div>

                              {/* Per-task allocation (when selected) - keyboard input */}
                              {isSelected && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginLeft: "12px",
                                  }}
                                >
                                  <input
                                    type="number"
                                    min={0}
                                    max={200}
                                    value={taskAllocation}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(200, parseInt(e.target.value) || 0));
                                      updateTaskAllocation(task.id, val);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      width: "56px",
                                      height: "36px",
                                      padding: "0 8px",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      textAlign: "center",
                                      border: "1px solid rgba(0, 0, 0, 0.12)",
                                      borderRadius: "6px",
                                      fontVariantNumeric: "tabular-nums",
                                      color:
                                        taskAllocation > 100
                                          ? "#FF3B30"
                                          : taskAllocation > 80
                                            ? "#FF9500"
                                            : "var(--color-text-primary)",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      color: "var(--color-text-tertiary)",
                                    }}
                                  >
                                    %
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Task mode empty state */}
          {mode === "task" && !selectedResourceId && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                color: "var(--color-text-tertiary)",
              }}
            >
              <Users size={48} strokeWidth={1.5} />
              <p style={{ marginTop: "12px", fontSize: "14px" }}>
                Select a resource to continue
              </p>
            </div>
          )}

          {/* RECURRING MODE: Time-based allocation */}
          {mode === "recurring" && selectedResourceId && (
            <div style={{ padding: "20px" }}>
              {/* Explanation */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(0, 122, 255, 0.06)",
                  borderRadius: "12px",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Set a fixed time commitment that applies uniformly across the entire project timeline,
                  regardless of specific tasks or phases.
                </p>
              </div>

              {/* Preset Grid */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "12px",
                  }}
                >
                  Common Patterns
                </div>

                {/* Weekly patterns */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-tertiary)",
                      marginBottom: "8px",
                    }}
                  >
                    Weekly
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {RECURRING_PRESETS.filter((p) => p.period === "week").map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedRecurringPreset(preset.id)}
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          fontWeight: 500,
                          border:
                            selectedRecurringPreset === preset.id
                              ? "2px solid var(--color-blue, #007AFF)"
                              : "1px solid rgba(0, 0, 0, 0.12)",
                          borderRadius: "10px",
                          backgroundColor:
                            selectedRecurringPreset === preset.id
                              ? "rgba(0, 122, 255, 0.08)"
                              : "#fff",
                          color:
                            selectedRecurringPreset === preset.id
                              ? "var(--color-blue, #007AFF)"
                              : "var(--color-text-primary)",
                          cursor: "pointer",
                          minHeight: "44px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "2px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{preset.label}</span>
                        <span style={{ fontSize: "11px", opacity: 0.7 }}>
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly patterns */}
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-tertiary)",
                      marginBottom: "8px",
                    }}
                  >
                    Monthly
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {RECURRING_PRESETS.filter((p) => p.period === "month").map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedRecurringPreset(preset.id)}
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          fontWeight: 500,
                          border:
                            selectedRecurringPreset === preset.id
                              ? "2px solid var(--color-blue, #007AFF)"
                              : "1px solid rgba(0, 0, 0, 0.12)",
                          borderRadius: "10px",
                          backgroundColor:
                            selectedRecurringPreset === preset.id
                              ? "rgba(0, 122, 255, 0.08)"
                              : "#fff",
                          color:
                            selectedRecurringPreset === preset.id
                              ? "var(--color-blue, #007AFF)"
                              : "var(--color-text-primary)",
                          cursor: "pointer",
                          minHeight: "44px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "2px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{preset.label}</span>
                        <span style={{ fontSize: "11px", opacity: 0.7 }}>
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom input */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "12px",
                  }}
                >
                  Custom
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="number"
                    min={0.5}
                    max={25}
                    step={0.5}
                    value={customRecurringDays}
                    onChange={(e) => {
                      const val = Math.max(0.5, Math.min(25, parseFloat(e.target.value) || 1));
                      setCustomRecurringDays(val);
                      setSelectedRecurringPreset("custom");
                    }}
                    style={{
                      width: "70px",
                      height: "44px",
                      padding: "0 12px",
                      fontSize: "16px",
                      fontWeight: 600,
                      textAlign: "center",
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      borderRadius: "8px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                    day{customRecurringDays !== 1 ? "s" : ""} per
                  </span>
                  <select
                    value={customRecurringPeriod}
                    onChange={(e) => {
                      setCustomRecurringPeriod(e.target.value as RecurringPeriod);
                      setSelectedRecurringPreset("custom");
                    }}
                    style={{
                      height: "44px",
                      padding: "0 12px",
                      fontSize: "15px",
                      fontWeight: 500,
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Recurring mode empty state */}
          {mode === "recurring" && !selectedResourceId && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                color: "var(--color-text-tertiary)",
              }}
            >
              <Users size={48} strokeWidth={1.5} />
              <p style={{ marginTop: "12px", fontSize: "14px" }}>
                Select a resource to continue
              </p>
            </div>
          )}
            </div>
          </div>

          {/* RIGHT COLUMN - Preview & Impact */}
          <div
            style={{
              width: "55%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              overflow: "hidden",
            }}
          >
            {/* Preview Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                flexShrink: 0,
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Preview & Impact
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-tertiary)",
                  margin: "4px 0 0 0",
                }}
              >
                {mode === "phase"
                  ? selectedPhase
                    ? `${phaseWeeks.length} weeks in ${selectedPhase.name}`
                    : "Select a phase to see preview"
                  : mode === "task"
                    ? taskModeSummary.selectedCount > 0
                      ? `${taskModeSummary.selectedCount} tasks selected`
                      : "Select tasks to see preview"
                    : `${recurringSummary.label} across ${recurringSummary.totalWeeks} weeks`}
              </p>
            </div>

            {/* Preview Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Phase Mode Preview */}
              {mode === "phase" && selectedPhase && phaseWeeks.length > 0 && (
                <div>
                  {/* Phase info card */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "3px",
                          backgroundColor: selectedPhase.color || "#6B7280",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {selectedPhase.name}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>
                          Duration
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {phaseWeeks.length} weeks
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>
                          Allocation
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-blue, #007AFF)" }}>
                          {allocationPercent}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>
                          Total Days
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {(phaseWeeks.length * 5 * (allocationPercent / 100)).toFixed(1)}d
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly allocation preview */}
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        marginBottom: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Weekly Allocation Pattern
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "2px",
                        height: "80px",
                        padding: "8px",
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      {phaseWeeks.map((week, idx) => {
                        const weekAllocation = (() => {
                          if (pattern === "STEADY") return allocationPercent;
                          if (pattern === "RAMP_UP") {
                            const rampIdx = Math.min(idx, rampWeeks - 1);
                            return (allocationPercent * (rampIdx + 1)) / rampWeeks;
                          }
                          if (pattern === "RAMP_DOWN") {
                            const weeksFromEnd = phaseWeeks.length - 1 - idx;
                            if (weeksFromEnd < rampWeeks) {
                              return (allocationPercent * (weeksFromEnd + 1)) / rampWeeks;
                            }
                            return allocationPercent;
                          }
                          if (pattern === "BELL_CURVE") {
                            const mid = (phaseWeeks.length - 1) / 2;
                            const dist = Math.abs(idx - mid) / mid;
                            return allocationPercent * (1 - dist * 0.5);
                          }
                          return allocationPercent;
                        })();
                        const height = Math.min((weekAllocation / 100) * 64, 64);
                        return (
                          <div
                            key={week.weekIdentifier}
                            style={{
                              flex: 1,
                              height: `${height}px`,
                              backgroundColor:
                                weekAllocation > 100
                                  ? "#FF3B30"
                                  : weekAllocation > 80
                                    ? "#FF9500"
                                    : "#34C759",
                              borderRadius: "2px 2px 0 0",
                              minWidth: "4px",
                            }}
                            title={`Week ${idx + 1}: ${Math.round(weekAllocation)}%`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Task Mode Preview */}
              {mode === "task" && selectedResourceId && taskModeSummary.selectedCount > 0 && (
                <div>
                  {/* Summary Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Tasks
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {taskModeSummary.selectedCount}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Avg Allocation
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color:
                            taskModeSummary.avgAllocation > 100
                              ? "#FF3B30"
                              : taskModeSummary.avgAllocation > 80
                                ? "#FF9500"
                                : "#34C759",
                        }}
                      >
                        {Math.round(taskModeSummary.avgAllocation)}%
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Total Days
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {taskModeSummary.totalMandays.toFixed(1)}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: taskModeSummary.overallocatedWeeks > 0 ? "rgba(255, 59, 48, 0.08)" : "#fff",
                        borderRadius: "10px",
                        border: taskModeSummary.overallocatedWeeks > 0 ? "1px solid rgba(255, 59, 48, 0.2)" : "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: taskModeSummary.overallocatedWeeks > 0 ? "#FF3B30" : "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Overallocated
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: taskModeSummary.overallocatedWeeks > 0 ? "#FF3B30" : "var(--color-text-primary)" }}>
                        {taskModeSummary.overallocatedWeeks} wks
                      </div>
                    </div>
                  </div>

                  {/* Task Timeline Section */}
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Task Timeline
                  </div>

                  {/* Individual task timeline bars */}
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#fff",
                      borderRadius: "10px",
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                      marginBottom: "20px",
                    }}
                  >
                    {(() => {
                      const selectedTasksArray = Array.from(selectedTasks.values());
                      if (selectedTasksArray.length === 0) return null;

                      const allDates = selectedTasksArray.flatMap((t) => [
                        t.startDate.getTime(),
                        t.endDate.getTime(),
                      ]);
                      const minDate = Math.min(...allDates);
                      const maxDate = Math.max(...allDates);
                      const totalRange = maxDate - minDate || 1;

                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {selectedTasksArray.map((task) => {
                            const taskStart = task.startDate.getTime();
                            const taskEnd = task.endDate.getTime();
                            const leftPercent = ((taskStart - minDate) / totalRange) * 100;
                            const widthPercent = ((taskEnd - taskStart) / totalRange) * 100;
                            const mandays = task.workingDays * (task.allocationPercent / 100);

                            return (
                              <div
                                key={task.taskId}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "140px",
                                    flexShrink: 0,
                                    fontSize: "12px",
                                    color: "var(--color-text-secondary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={task.taskName}
                                >
                                  {task.taskName}
                                </div>

                                <div
                                  style={{
                                    flex: 1,
                                    height: "24px",
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    borderRadius: "6px",
                                    position: "relative",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: `${leftPercent}%`,
                                      width: `${Math.max(widthPercent, 2)}%`,
                                      top: "3px",
                                      bottom: "3px",
                                      backgroundColor: task.phaseColor,
                                      borderRadius: "4px",
                                      opacity: task.allocationPercent > 100 ? 1 : 0.85,
                                      boxShadow: task.allocationPercent > 100 ? "0 0 0 2px #FF3B30" : "none",
                                    }}
                                    title={`${task.taskName}: ${format(task.startDate, "dd MMM")} - ${format(task.endDate, "dd MMM")}`}
                                  />
                                </div>

                                <div
                                  style={{
                                    width: "90px",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      color:
                                        task.allocationPercent > 100
                                          ? "#FF3B30"
                                          : task.allocationPercent > 80
                                            ? "#FF9500"
                                            : "#34C759",
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {task.allocationPercent}%
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "var(--color-text-tertiary)",
                                    }}
                                  >
                                    ({mandays.toFixed(1)}d)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Combined Weekly Load */}
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Combined Weekly Load
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#fff",
                      borderRadius: "10px",
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "1px",
                        height: "60px",
                      }}
                    >
                      {Array.from(previewAllocations.entries()).map(([weekId, percent]) => {
                        const height = Math.min((percent / 100) * 60, 60);
                        return (
                          <div
                            key={weekId}
                            style={{
                              flex: 1,
                              height: `${height}px`,
                              backgroundColor:
                                percent > 100
                                  ? "#FF3B30"
                                  : percent > 80
                                    ? "#FF9500"
                                    : "#34C759",
                              borderRadius: "2px 2px 0 0",
                              minWidth: "2px",
                              transition: "height 0.2s ease",
                            }}
                            title={`${weekId}: ${Math.round(percent)}%`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Recurring Mode Preview */}
              {mode === "recurring" && selectedResourceId && (
                <div>
                  {/* Summary Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Commitment
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue, #007AFF)" }}>
                        {recurringSummary.label}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Weekly %
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color:
                            recurringSummary.percentPerWeek > 100
                              ? "#FF3B30"
                              : recurringSummary.percentPerWeek > 80
                                ? "#FF9500"
                                : "#34C759",
                        }}
                      >
                        {Math.round(recurringSummary.percentPerWeek)}%
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Duration
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {recurringSummary.totalWeeks} wks
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Total Days
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {recurringSummary.totalDays}
                      </div>
                    </div>
                  </div>

                  {/* Uniform Allocation Visualization */}
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Weekly Allocation Pattern
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#fff",
                      borderRadius: "10px",
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    {/* Steady line visualization */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "1px",
                        height: "60px",
                        marginBottom: "12px",
                      }}
                    >
                      {Array.from(previewAllocations.entries()).map(([weekId, percent]) => {
                        const height = Math.min((percent / 100) * 60, 60);
                        return (
                          <div
                            key={weekId}
                            style={{
                              flex: 1,
                              height: `${height}px`,
                              backgroundColor:
                                percent > 100
                                  ? "#FF3B30"
                                  : percent > 80
                                    ? "#FF9500"
                                    : "#34C759",
                              borderRadius: "2px 2px 0 0",
                              minWidth: "2px",
                            }}
                            title={`${weekId}: ${Math.round(percent)}%`}
                          />
                        );
                      })}
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text-secondary)",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      Uniform {Math.round(recurringSummary.percentPerWeek)}% allocation every week
                    </p>
                  </div>
                </div>
              )}

              {/* OPE (Expenses) Section - shown when resource is selected */}
              {selectedResourceId && (
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Expenses (OPE)
                    </span>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        Include
                      </span>
                      <input
                        type="checkbox"
                        checked={opeConfig.includeOPE}
                        onChange={(e) => setOpeConfig(prev => ({ ...prev, includeOPE: e.target.checked }))}
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                    </label>
                  </div>

                  {opeConfig.includeOPE && (
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      {/* OPE Presets */}
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
                          Work Location
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {OPE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setSelectedOPEPreset(preset.id);
                                setOpeConfig(prev => ({
                                  ...prev,
                                  onsitePercentage: preset.onsitePercentage,
                                  flightCount: preset.flightCount,
                                }));
                              }}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: 500,
                                border: selectedOPEPreset === preset.id
                                  ? "2px solid var(--color-blue, #007AFF)"
                                  : "1px solid rgba(0, 0, 0, 0.12)",
                                borderRadius: "6px",
                                backgroundColor: selectedOPEPreset === preset.id
                                  ? "rgba(0, 122, 255, 0.08)"
                                  : "#fff",
                                color: selectedOPEPreset === preset.id
                                  ? "var(--color-blue, #007AFF)"
                                  : "var(--color-text-primary)",
                                cursor: "pointer",
                              }}
                              title={preset.description}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom OPE inputs */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                            Onsite %
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={opeConfig.onsitePercentage}
                            onChange={(e) => {
                              setOpeConfig(prev => ({ ...prev, onsitePercentage: parseInt(e.target.value) || 0 }));
                              setSelectedOPEPreset("custom");
                            }}
                            style={{
                              width: "100%",
                              height: "36px",
                              padding: "0 10px",
                              fontSize: "14px",
                              border: "1px solid rgba(0, 0, 0, 0.12)",
                              borderRadius: "6px",
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                            Flight Trips
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={opeConfig.flightCount}
                            onChange={(e) => {
                              setOpeConfig(prev => ({ ...prev, flightCount: parseInt(e.target.value) || 0 }));
                              setSelectedOPEPreset("custom");
                            }}
                            style={{
                              width: "100%",
                              height: "36px",
                              padding: "0 10px",
                              fontSize: "14px",
                              border: "1px solid rgba(0, 0, 0, 0.12)",
                              borderRadius: "6px",
                            }}
                          />
                        </div>
                      </div>

                      {/* OPE Summary */}
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "rgba(0, 0, 0, 0.02)",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                            {opeCalculation.onsiteDays} onsite days
                          </span>
                        </div>
                        {opeCalculation.breakdown.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              color: "var(--color-text-secondary)",
                              marginBottom: "4px",
                            }}
                          >
                            <span>{item.label}</span>
                            <span style={{ fontVariantNumeric: "tabular-nums" }}>
                              RM {item.total.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <span>Total OPE</span>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>
                            RM {opeCalculation.totalOPE.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state for preview */}
              {((mode === "phase" && !selectedPhase) || (mode === "task" && taskModeSummary.selectedCount === 0)) && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-tertiary)",
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  <Activity size={48} strokeWidth={1.5} style={{ marginBottom: "12px", opacity: 0.5 }} />
                  <p style={{ fontSize: "14px", margin: 0 }}>
                    {mode === "phase"
                      ? "Select a phase to see the allocation preview"
                      : "Select tasks to see the allocation preview"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 500,
              border: "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: "10px",
              backgroundColor: "#fff",
              color: "var(--color-text-primary)",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={
              mode === "phase"
                ? !selectedResourceId || !selectedPhaseId || phaseWeeks.length === 0
                : mode === "task"
                  ? !selectedResourceId || selectedTasks.size === 0
                  : !selectedResourceId
            }
            style={{
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: 600,
              border: "none",
              borderRadius: "10px",
              backgroundColor:
                (mode === "phase"
                  ? !selectedResourceId || !selectedPhaseId || phaseWeeks.length === 0
                  : mode === "task"
                    ? !selectedResourceId || selectedTasks.size === 0
                    : !selectedResourceId)
                  ? "rgba(0, 0, 0, 0.08)"
                  : "var(--color-blue, #007AFF)",
              color:
                (mode === "phase"
                  ? !selectedResourceId || !selectedPhaseId || phaseWeeks.length === 0
                  : mode === "task"
                    ? !selectedResourceId || selectedTasks.size === 0
                    : !selectedResourceId)
                  ? "var(--color-text-tertiary)"
                  : "#fff",
              cursor:
                (mode === "phase"
                  ? !selectedResourceId || !selectedPhaseId || phaseWeeks.length === 0
                  : mode === "task"
                    ? !selectedResourceId || selectedTasks.size === 0
                    : !selectedResourceId)
                  ? "not-allowed"
                  : "pointer",
              minHeight: "44px",
            }}
          >
            {mode === "phase"
              ? `Apply to ${phaseWeeks.length} Weeks`
              : mode === "task"
                ? `Apply to ${taskModeSummary.selectedCount} Tasks`
                : `Apply ${recurringSummary.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
