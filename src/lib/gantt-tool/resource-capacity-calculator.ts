/**
 * Resource Capacity Calculator
 *
 * Intelligently calculates weekly resource allocations from task assignments
 * and displays availability (inverse of allocation).
 *
 * Features:
 * - Auto-derives weekly allocations from task/phase assignments
 * - Shows availability per week (what's left after assignments)
 * - Supports manual overrides that persist
 * - Aggregates across all tasks for total weekly load
 */

import {
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  format,
  parseISO,
  isWithinInterval,
  differenceInDays,
  max,
  min,
} from "date-fns";
import type { GanttPhase, Resource, TaskResourceAssignment, PhaseResourceAssignment } from "@/types/gantt-tool";

// ============================================================================
// Types
// ============================================================================

export interface WeekInfo {
  weekIdentifier: string; // "W01", "W02", etc. (project-relative)
  weekStartDate: Date;
  weekEndDate: Date;
  weekNumber: number; // 1-based week number from project start
}

export interface ResourceWeekAllocation {
  resourceId: string;
  weekIdentifier: string;
  weekStartDate: Date;
  weekEndDate: Date;

  // Calculated from task assignments
  allocatedPercent: number; // 0-100+ (can exceed 100 if overallocated)
  allocatedDays: number; // 0-5+

  // Availability (inverse)
  availablePercent: number; // Max 100, min 0
  availableDays: number; // Max 5, min 0

  // Breakdown by source
  taskAllocations: {
    taskId: string;
    taskName: string;
    phaseId: string;
    phaseName: string;
    phaseColor: string;
    allocationPercent: number;
    overlapDays: number; // Working days this task overlaps with this week
  }[];

  // Status
  isOverallocated: boolean; // >100%
  isAtRisk: boolean; // >80% but <=100%
  isManualOverride: boolean;
  manualOverrideValue?: number; // If manually set
}

export interface ResourceCapacityResult {
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  weeks: ResourceWeekAllocation[];
  summary: {
    totalAllocatedDays: number;
    totalAvailableDays: number;
    averageUtilization: number; // 0-100%
    overallocatedWeeks: number;
    atRiskWeeks: number;
  };
}

export interface CapacityCalculatorInput {
  phases: GanttPhase[];
  resources: Resource[];
  projectStartDate: Date;
  projectEndDate: Date;
  manualOverrides?: Map<string, number>; // key: `${resourceId}_${weekIdentifier}`, value: percent
}

// ============================================================================
// Main Calculator
// ============================================================================

/**
 * Pre-compute task overlaps with weeks to avoid repeated calculations
 * This is the key optimization - compute once, reuse for all resources
 */
function precomputeTaskWeekOverlaps(
  phases: GanttPhase[],
  weeks: WeekInfo[]
): Map<string, Map<string, { taskId: string; taskName: string; phaseId: string; phaseName: string; phaseColor: string; overlap: number; allocationPercent: number; isPhaseLevel: boolean }[]>> {
  // Map: resourceId -> weekIdentifier -> array of task overlaps
  const resourceTaskOverlaps = new Map<string, Map<string, { taskId: string; taskName: string; phaseId: string; phaseName: string; phaseColor: string; overlap: number; allocationPercent: number; isPhaseLevel: boolean }[]>>();

  phases.forEach((phase) => {
    const phaseStart = phase.startDate ? new Date(phase.startDate) : null;
    const phaseEnd = phase.endDate ? new Date(phase.endDate) : null;

    // Process phase-level assignments
    if (phase.resourceAssignments && phaseStart && phaseEnd) {
      phase.resourceAssignments.forEach((assignment) => {
        if (!resourceTaskOverlaps.has(assignment.resourceId)) {
          resourceTaskOverlaps.set(assignment.resourceId, new Map());
        }
        const resourceWeeks = resourceTaskOverlaps.get(assignment.resourceId)!;

        weeks.forEach((week) => {
          const overlap = calculateWeekOverlap(week.weekStartDate, week.weekEndDate, phaseStart, phaseEnd);
          if (overlap > 0) {
            if (!resourceWeeks.has(week.weekIdentifier)) {
              resourceWeeks.set(week.weekIdentifier, []);
            }
            resourceWeeks.get(week.weekIdentifier)!.push({
              taskId: `phase_${phase.id}`,
              taskName: `${phase.name} (Phase)`,
              phaseId: phase.id,
              phaseName: phase.name,
              phaseColor: phase.color || "#007AFF",
              overlap,
              allocationPercent: assignment.allocationPercentage,
              isPhaseLevel: true,
            });
          }
        });
      });
    }

    // Process task-level assignments
    phase.tasks?.forEach((task) => {
      if (!task.resourceAssignments || !task.startDate || !task.endDate) return;

      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);

      task.resourceAssignments.forEach((assignment) => {
        if (!resourceTaskOverlaps.has(assignment.resourceId)) {
          resourceTaskOverlaps.set(assignment.resourceId, new Map());
        }
        const resourceWeeks = resourceTaskOverlaps.get(assignment.resourceId)!;

        weeks.forEach((week) => {
          const overlap = calculateWeekOverlap(week.weekStartDate, week.weekEndDate, taskStart, taskEnd);
          if (overlap > 0) {
            if (!resourceWeeks.has(week.weekIdentifier)) {
              resourceWeeks.set(week.weekIdentifier, []);
            }
            resourceWeeks.get(week.weekIdentifier)!.push({
              taskId: task.id,
              taskName: task.name,
              phaseId: phase.id,
              phaseName: phase.name,
              phaseColor: phase.color || "#007AFF",
              overlap,
              allocationPercent: assignment.allocationPercentage,
              isPhaseLevel: false,
            });
          }
        });
      });
    });
  });

  return resourceTaskOverlaps;
}

/**
 * Calculate weekly capacity for all resources based on task assignments
 * Optimized: Pre-computes task overlaps once, then iterates resources
 */
export function calculateResourceCapacity(
  input: CapacityCalculatorInput
): ResourceCapacityResult[] {
  const { phases, resources, projectStartDate, projectEndDate, manualOverrides } = input;

  // Generate all weeks in project timeline
  const weeks = getProjectWeeks(projectStartDate, projectEndDate);

  // OPTIMIZATION: Pre-compute all task-week overlaps once
  const precomputedOverlaps = precomputeTaskWeekOverlaps(phases, weeks);

  // Calculate capacity for each resource using pre-computed data
  return resources.map((resource) => {
    const resourceOverlaps = precomputedOverlaps.get(resource.id);
    const weekAllocations = calculateResourceWeekAllocationsOptimized(
      resource,
      weeks,
      resourceOverlaps,
      manualOverrides
    );

    // Calculate summary
    const totalAllocatedDays = weekAllocations.reduce((sum, w) => sum + w.allocatedDays, 0);
    const totalAvailableDays = weekAllocations.reduce((sum, w) => sum + w.availableDays, 0);
    const totalPossibleDays = weeks.length * 5;
    const averageUtilization = totalPossibleDays > 0
      ? (totalAllocatedDays / totalPossibleDays) * 100
      : 0;
    const overallocatedWeeks = weekAllocations.filter((w) => w.isOverallocated).length;
    const atRiskWeeks = weekAllocations.filter((w) => w.isAtRisk).length;

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      resourceCategory: resource.category,
      weeks: weekAllocations,
      summary: {
        totalAllocatedDays: Math.round(totalAllocatedDays * 100) / 100,
        totalAvailableDays: Math.round(totalAvailableDays * 100) / 100,
        averageUtilization: Math.round(averageUtilization),
        overallocatedWeeks,
        atRiskWeeks,
      },
    };
  });
}

/**
 * Optimized version using pre-computed overlaps
 */
function calculateResourceWeekAllocationsOptimized(
  resource: Resource,
  weeks: WeekInfo[],
  precomputedOverlaps: Map<string, { taskId: string; taskName: string; phaseId: string; phaseName: string; phaseColor: string; overlap: number; allocationPercent: number; isPhaseLevel: boolean }[]> | undefined,
  manualOverrides?: Map<string, number>
): ResourceWeekAllocation[] {
  return weeks.map((week) => {
    const overrideKey = `${resource.id}_${week.weekIdentifier}`;
    const manualOverrideValue = manualOverrides?.get(overrideKey);
    const isManualOverride = manualOverrideValue !== undefined;

    // If manual override exists, use it
    if (isManualOverride && manualOverrideValue !== undefined) {
      const allocatedDays = (manualOverrideValue / 100) * 5;
      return {
        resourceId: resource.id,
        weekIdentifier: week.weekIdentifier,
        weekStartDate: week.weekStartDate,
        weekEndDate: week.weekEndDate,
        allocatedPercent: manualOverrideValue,
        allocatedDays: Math.round(allocatedDays * 100) / 100,
        availablePercent: Math.max(0, 100 - manualOverrideValue),
        availableDays: Math.max(0, Math.round((5 - allocatedDays) * 100) / 100),
        taskAllocations: [],
        isOverallocated: manualOverrideValue > 100,
        isAtRisk: manualOverrideValue > 80 && manualOverrideValue <= 100,
        isManualOverride: true,
        manualOverrideValue,
      };
    }

    // Use pre-computed overlaps
    const weekOverlaps = precomputedOverlaps?.get(week.weekIdentifier) || [];
    const taskAllocations = weekOverlaps.map((overlap) => ({
      taskId: overlap.taskId,
      taskName: overlap.taskName,
      phaseId: overlap.phaseId,
      phaseName: overlap.phaseName,
      phaseColor: overlap.phaseColor,
      allocationPercent: Math.round(overlap.allocationPercent * (overlap.overlap / 5)),
      overlapDays: overlap.overlap,
    }));

    const totalAllocatedPercent = taskAllocations.reduce(
      (sum, t) => sum + t.allocationPercent,
      0
    );
    const allocatedDays = (totalAllocatedPercent / 100) * 5;

    return {
      resourceId: resource.id,
      weekIdentifier: week.weekIdentifier,
      weekStartDate: week.weekStartDate,
      weekEndDate: week.weekEndDate,
      allocatedPercent: totalAllocatedPercent,
      allocatedDays: Math.round(allocatedDays * 100) / 100,
      availablePercent: Math.max(0, 100 - totalAllocatedPercent),
      availableDays: Math.max(0, Math.round((5 - allocatedDays) * 100) / 100),
      taskAllocations,
      isOverallocated: totalAllocatedPercent > 100,
      isAtRisk: totalAllocatedPercent > 80 && totalAllocatedPercent <= 100,
      isManualOverride: false,
    };
  });
}

/**
 * Calculate week-by-week allocations for a single resource
 */
function calculateResourceWeekAllocations(
  resource: Resource,
  phases: GanttPhase[],
  weeks: WeekInfo[],
  manualOverrides?: Map<string, number>
): ResourceWeekAllocation[] {
  return weeks.map((week) => {
    const overrideKey = `${resource.id}_${week.weekIdentifier}`;
    const manualOverrideValue = manualOverrides?.get(overrideKey);
    const isManualOverride = manualOverrideValue !== undefined;

    // If manual override exists, use it
    if (isManualOverride && manualOverrideValue !== undefined) {
      const allocatedDays = (manualOverrideValue / 100) * 5;
      return {
        resourceId: resource.id,
        weekIdentifier: week.weekIdentifier,
        weekStartDate: week.weekStartDate,
        weekEndDate: week.weekEndDate,
        allocatedPercent: manualOverrideValue,
        allocatedDays: Math.round(allocatedDays * 100) / 100,
        availablePercent: Math.max(0, 100 - manualOverrideValue),
        availableDays: Math.max(0, Math.round((5 - allocatedDays) * 100) / 100),
        taskAllocations: [], // Manual override doesn't track task breakdown
        isOverallocated: manualOverrideValue > 100,
        isAtRisk: manualOverrideValue > 80 && manualOverrideValue <= 100,
        isManualOverride: true,
        manualOverrideValue,
      };
    }

    // Calculate from task assignments
    const taskAllocations: ResourceWeekAllocation["taskAllocations"] = [];

    phases.forEach((phase) => {
      // Check phase-level assignments
      const phaseAssignment = phase.resourceAssignments?.find(
        (a) => a.resourceId === resource.id
      );

      if (phaseAssignment && phase.startDate && phase.endDate) {
        const overlap = calculateWeekOverlap(
          week.weekStartDate,
          week.weekEndDate,
          new Date(phase.startDate),
          new Date(phase.endDate)
        );

        if (overlap > 0) {
          // Phase-level assignment distributed across all weeks
          const weekAllocation = phaseAssignment.allocationPercentage * (overlap / 5);
          taskAllocations.push({
            taskId: `phase_${phase.id}`,
            taskName: `${phase.name} (Phase)`,
            phaseId: phase.id,
            phaseName: phase.name,
            phaseColor: phase.color || "#007AFF",
            allocationPercent: Math.round(weekAllocation),
            overlapDays: overlap,
          });
        }
      }

      // Check task-level assignments
      phase.tasks?.forEach((task) => {
        const taskAssignment = task.resourceAssignments?.find(
          (a) => a.resourceId === resource.id
        );

        if (taskAssignment && task.startDate && task.endDate) {
          const overlap = calculateWeekOverlap(
            week.weekStartDate,
            week.weekEndDate,
            new Date(task.startDate),
            new Date(task.endDate)
          );

          if (overlap > 0) {
            // Task assignment proportional to overlap
            const weekAllocation = taskAssignment.allocationPercentage * (overlap / 5);
            taskAllocations.push({
              taskId: task.id,
              taskName: task.name,
              phaseId: phase.id,
              phaseName: phase.name,
              phaseColor: phase.color || "#007AFF",
              allocationPercent: Math.round(weekAllocation),
              overlapDays: overlap,
            });
          }
        }
      });
    });

    // Sum up all allocations
    const totalAllocatedPercent = taskAllocations.reduce(
      (sum, t) => sum + t.allocationPercent,
      0
    );
    const allocatedDays = (totalAllocatedPercent / 100) * 5;

    return {
      resourceId: resource.id,
      weekIdentifier: week.weekIdentifier,
      weekStartDate: week.weekStartDate,
      weekEndDate: week.weekEndDate,
      allocatedPercent: totalAllocatedPercent,
      allocatedDays: Math.round(allocatedDays * 100) / 100,
      availablePercent: Math.max(0, 100 - totalAllocatedPercent),
      availableDays: Math.max(0, Math.round((5 - allocatedDays) * 100) / 100),
      taskAllocations,
      isOverallocated: totalAllocatedPercent > 100,
      isAtRisk: totalAllocatedPercent > 80 && totalAllocatedPercent <= 100,
      isManualOverride: false,
    };
  });
}

// ============================================================================
// Week Helpers
// ============================================================================

/**
 * Generate all weeks in the project timeline (project-relative numbering)
 */
export function getProjectWeeks(
  projectStartDate: Date,
  projectEndDate: Date
): WeekInfo[] {
  const weeks: WeekInfo[] = [];

  // Get all week starts in the interval
  const weekStarts = eachWeekOfInterval(
    { start: projectStartDate, end: projectEndDate },
    { weekStartsOn: 1 } // Monday
  );

  weekStarts.forEach((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekNumber = index + 1;

    weeks.push({
      weekIdentifier: `W${String(weekNumber).padStart(2, "0")}`,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      weekNumber,
    });
  });

  return weeks;
}

/**
 * Calculate how many working days a task overlaps with a week
 * Returns 0-5 (working days in a week)
 */
function calculateWeekOverlap(
  weekStart: Date,
  weekEnd: Date,
  taskStart: Date,
  taskEnd: Date
): number {
  // Check if there's any overlap
  if (taskEnd < weekStart || taskStart > weekEnd) {
    return 0;
  }

  // Get the overlapping period
  const overlapStart = max([weekStart, taskStart]);
  const overlapEnd = min([weekEnd, taskEnd]);

  // Count working days (Mon-Fri) in the overlap
  let workingDays = 0;
  let currentDate = new Date(overlapStart);

  while (currentDate <= overlapEnd) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return workingDays;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get allocation status color based on percentage
 */
export function getAllocationStatusColor(percent: number): string {
  if (percent > 100) return "#FF3B30"; // Red - overallocated
  if (percent > 80) return "#FF9500"; // Orange - at risk
  if (percent > 50) return "#34C759"; // Green - healthy
  if (percent > 0) return "#007AFF"; // Blue - light load
  return "transparent"; // No allocation
}

/**
 * Get availability status color (inverse logic)
 */
export function getAvailabilityStatusColor(availablePercent: number): string {
  if (availablePercent >= 80) return "#34C759"; // Green - highly available
  if (availablePercent >= 50) return "#007AFF"; // Blue - moderately available
  if (availablePercent >= 20) return "#FF9500"; // Orange - limited availability
  if (availablePercent > 0) return "#FF3B30"; // Red - almost full
  return "#8E8E93"; // Gray - fully allocated
}

/**
 * Format days as display string
 */
export function formatDays(days: number): string {
  if (days === 0) return "-";
  if (days === Math.floor(days)) return `${days}d`;
  return `${days.toFixed(1)}d`;
}

/**
 * Format percentage as display string
 */
export function formatPercent(percent: number): string {
  if (percent === 0) return "-";
  return `${Math.round(percent)}%`;
}

/**
 * Calculate total project capacity for a resource
 */
export function calculateTotalCapacity(
  results: ResourceCapacityResult[]
): {
  totalAllocatedDays: number;
  totalAvailableDays: number;
  totalPossibleDays: number;
  overallUtilization: number;
} {
  const totalAllocatedDays = results.reduce(
    (sum, r) => sum + r.summary.totalAllocatedDays,
    0
  );
  const totalAvailableDays = results.reduce(
    (sum, r) => sum + r.summary.totalAvailableDays,
    0
  );
  const totalPossibleDays = results.reduce(
    (sum, r) => sum + (r.weeks.length * 5),
    0
  );

  return {
    totalAllocatedDays,
    totalAvailableDays,
    totalPossibleDays,
    overallUtilization: totalPossibleDays > 0
      ? Math.round((totalAllocatedDays / totalPossibleDays) * 100)
      : 0,
  };
}
