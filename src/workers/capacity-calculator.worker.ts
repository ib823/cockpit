/**
 * Capacity Calculator Web Worker
 *
 * PERFORMANCE: Offloads heavy capacity calculations to a background thread.
 * This prevents UI blocking when processing large numbers of resources and tasks.
 *
 * Communication Protocol:
 * - Main thread sends: { type: 'calculate', payload: CapacityCalculatorInput }
 * - Worker responds: { type: 'result', payload: ResourceCapacityResult[] }
 * - Worker responds: { type: 'error', payload: string }
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

// ============================================================================
// Types (duplicated here since workers can't import from outside)
// ============================================================================

interface WeekInfo {
  weekIdentifier: string;
  weekStartDate: Date;
  weekEndDate: Date;
  weekNumber: number;
}

interface ResourceWeekAllocation {
  resourceId: string;
  weekIdentifier: string;
  weekStartDate: Date;
  weekEndDate: Date;
  allocatedPercent: number;
  allocatedDays: number;
  availablePercent: number;
  availableDays: number;
  taskAllocations: {
    taskId: string;
    taskName: string;
    phaseId: string;
    phaseName: string;
    phaseColor: string;
    allocationPercent: number;
    overlapDays: number;
  }[];
  isOverallocated: boolean;
  isAtRisk: boolean;
  isManualOverride: boolean;
  manualOverrideValue?: number;
}

interface ResourceCapacityResult {
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  weeks: ResourceWeekAllocation[];
  summary: {
    totalAllocatedDays: number;
    totalAvailableDays: number;
    averageUtilization: number;
    overallocatedWeeks: number;
    atRiskWeeks: number;
  };
}

interface TaskInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  phaseId: string;
  phaseName: string;
  phaseColor: string;
  resourceAssignments?: {
    resourceId: string;
    allocation?: number;
  }[];
}

interface PhaseInfo {
  id: string;
  name: string;
  color?: string;
  startDate: string;
  endDate: string;
  tasks: TaskInfo[];
  resourceAssignments?: {
    resourceId: string;
    allocation?: number;
  }[];
}

interface ResourceInfo {
  id: string;
  name: string;
  category: string;
  weeklyCapacity?: number;
}

interface CalculatorInput {
  phases: PhaseInfo[];
  resources: ResourceInfo[];
  projectStartDate: string;
  projectEndDate: string;
  manualOverrides?: [string, number][];
}

// ============================================================================
// Calculator Implementation
// ============================================================================

const WORKING_DAYS_PER_WEEK = 5;
const DEFAULT_ALLOCATION_PERCENT = 100;

function getProjectWeeks(startDate: Date, endDate: Date): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const weekStarts = eachWeekOfInterval(
    { start: startDate, end: endDate },
    { weekStartsOn: 1 }
  );

  weekStarts.forEach((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    weeks.push({
      weekIdentifier: `W${String(index + 1).padStart(2, "0")}`,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      weekNumber: index + 1,
    });
  });

  return weeks;
}

function calculateOverlapDays(
  taskStart: Date,
  taskEnd: Date,
  weekStart: Date,
  weekEnd: Date
): number {
  const overlapStart = max([taskStart, weekStart]);
  const overlapEnd = min([taskEnd, weekEnd]);

  if (overlapStart > overlapEnd) return 0;

  let workingDays = 0;
  const current = new Date(overlapStart);
  while (current <= overlapEnd) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

function calculateResourceCapacity(input: CalculatorInput): ResourceCapacityResult[] {
  const {
    phases,
    resources,
    projectStartDate,
    projectEndDate,
    manualOverrides: overridesArray,
  } = input;

  const startDate = new Date(projectStartDate);
  const endDate = new Date(projectEndDate);
  const manualOverrides = new Map(overridesArray || []);
  const projectWeeks = getProjectWeeks(startDate, endDate);

  // Pre-compute task-week overlaps
  const taskWeekOverlaps = new Map<string, Map<string, { days: number; allocation: number; taskInfo: TaskInfo; phaseInfo: PhaseInfo }>>();

  phases.forEach((phase) => {
    phase.tasks.forEach((task) => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);

      projectWeeks.forEach((week) => {
        const overlapDays = calculateOverlapDays(taskStart, taskEnd, week.weekStartDate, week.weekEndDate);
        if (overlapDays > 0) {
          if (!taskWeekOverlaps.has(task.id)) {
            taskWeekOverlaps.set(task.id, new Map());
          }
          taskWeekOverlaps.get(task.id)!.set(week.weekIdentifier, {
            days: overlapDays,
            allocation: DEFAULT_ALLOCATION_PERCENT,
            taskInfo: { ...task, phaseId: phase.id, phaseName: phase.name, phaseColor: phase.color || "#007AFF" },
            phaseInfo: phase,
          });
        }
      });
    });
  });

  // Calculate capacity for each resource
  return resources.map((resource) => {
    const weeklyCapacity = resource.weeklyCapacity || WORKING_DAYS_PER_WEEK;
    const weeks: ResourceWeekAllocation[] = [];
    let totalAllocatedDays = 0;
    let totalAvailableDays = 0;
    let overallocatedWeeks = 0;
    let atRiskWeeks = 0;

    projectWeeks.forEach((week) => {
      const taskAllocations: ResourceWeekAllocation["taskAllocations"] = [];
      let weekAllocatedPercent = 0;

      // Find all tasks this resource is assigned to in this week
      phases.forEach((phase) => {
        phase.tasks.forEach((task) => {
          const overlap = taskWeekOverlaps.get(task.id)?.get(week.weekIdentifier);
          if (!overlap) return;

          // Check if resource is assigned to this task
          const assignment = task.resourceAssignments?.find((a) => a.resourceId === resource.id);
          if (!assignment) return;

          const allocationPercent = assignment.allocation ?? DEFAULT_ALLOCATION_PERCENT;
          const weeklyContribution = (overlap.days / weeklyCapacity) * allocationPercent;

          weekAllocatedPercent += weeklyContribution;
          taskAllocations.push({
            taskId: task.id,
            taskName: task.name,
            phaseId: phase.id,
            phaseName: phase.name,
            phaseColor: phase.color || "#007AFF",
            allocationPercent: weeklyContribution,
            overlapDays: overlap.days,
          });
        });

        // Also check phase-level assignments
        const phaseAssignment = phase.resourceAssignments?.find((a) => a.resourceId === resource.id);
        if (phaseAssignment) {
          const phaseStart = new Date(phase.startDate);
          const phaseEnd = new Date(phase.endDate);
          const overlapDays = calculateOverlapDays(phaseStart, phaseEnd, week.weekStartDate, week.weekEndDate);
          if (overlapDays > 0) {
            const allocationPercent = phaseAssignment.allocation ?? DEFAULT_ALLOCATION_PERCENT;
            const weeklyContribution = (overlapDays / weeklyCapacity) * allocationPercent;
            weekAllocatedPercent += weeklyContribution;
          }
        }
      });

      // Check for manual override
      const overrideKey = `${resource.id}_${week.weekIdentifier}`;
      const hasOverride = manualOverrides.has(overrideKey);
      if (hasOverride) {
        weekAllocatedPercent = manualOverrides.get(overrideKey)!;
      }

      const allocatedDays = (weekAllocatedPercent / 100) * weeklyCapacity;
      const availablePercent = Math.max(0, 100 - weekAllocatedPercent);
      const availableDays = Math.max(0, weeklyCapacity - allocatedDays);

      const isOverallocated = weekAllocatedPercent > 100;
      const isAtRisk = weekAllocatedPercent > 80 && weekAllocatedPercent <= 100;

      if (isOverallocated) overallocatedWeeks++;
      if (isAtRisk) atRiskWeeks++;

      totalAllocatedDays += allocatedDays;
      totalAvailableDays += availableDays;

      weeks.push({
        resourceId: resource.id,
        weekIdentifier: week.weekIdentifier,
        weekStartDate: week.weekStartDate,
        weekEndDate: week.weekEndDate,
        allocatedPercent: weekAllocatedPercent,
        allocatedDays,
        availablePercent,
        availableDays,
        taskAllocations,
        isOverallocated,
        isAtRisk,
        isManualOverride: hasOverride,
        manualOverrideValue: hasOverride ? manualOverrides.get(overrideKey) : undefined,
      });
    });

    const totalWeeks = weeks.length || 1;
    const averageUtilization = totalAllocatedDays / (totalWeeks * WORKING_DAYS_PER_WEEK) * 100;

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      resourceCategory: resource.category,
      weeks,
      summary: {
        totalAllocatedDays,
        totalAvailableDays,
        averageUtilization,
        overallocatedWeeks,
        atRiskWeeks,
      },
    };
  });
}

// ============================================================================
// Worker Message Handler
// ============================================================================

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === "calculate") {
    try {
      const result = calculateResourceCapacity(payload);
      self.postMessage({ type: "result", payload: result });
    } catch (error) {
      self.postMessage({
        type: "error",
        payload: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

export {};
