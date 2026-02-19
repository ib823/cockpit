/**
 * Project Metrics Utilities
 * Calculate key metrics for project dashboard display
 * Following Apple HIG principles - show only what matters
 */

import { differenceInDays, format } from "date-fns";
import type { GanttProject, Resource } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "./working-days";

export interface ProjectMetrics {
  // Date information
  startDate: Date | null;
  endDate: Date | null;
  dateRangeDisplay: string;

  // Duration
  calendarDays: number;
  workingDays: number;
  durationDisplay: string;

  // Team
  teamSize: number;
  resourcesByCategory: Record<string, number>;
  teamDisplay: string;

  // Budget (optional)
  budgetTotal: number | null;
  budgetSpent: number | null;
  budgetUtilization: number | null;
  budgetDisplay: string | null;
  budgetStatus: "good" | "warning" | "danger" | null;

  // Progress (optional)
  progressPercentage: number | null;
  progressStatus: "on-track" | "at-risk" | "delayed" | null;
  progressDisplay: string | null;
}

/**
 * Calculate comprehensive project metrics
 */
export function calculateProjectMetrics(project: GanttProject | null): ProjectMetrics {
  if (!project) {
    return {
      startDate: null,
      endDate: null,
      dateRangeDisplay: "No project loaded",
      calendarDays: 0,
      workingDays: 0,
      durationDisplay: "0 days",
      teamSize: 0,
      resourcesByCategory: {},
      teamDisplay: "No team",
      budgetTotal: null,
      budgetSpent: null,
      budgetUtilization: null,
      budgetDisplay: null,
      budgetStatus: null,
      progressPercentage: null,
      progressStatus: null,
      progressDisplay: null,
    };
  }

  // 1. Calculate date range from phases
  const { startDate, endDate, dateRangeDisplay } = calculateDateRange(project);

  // 2. Calculate duration
  const { calendarDays, workingDays, durationDisplay } = calculateDuration(
    startDate,
    endDate,
    project
  );

  // 3. Calculate team size
  const { teamSize, resourcesByCategory, teamDisplay } = calculateTeamMetrics(project);

  // 4. Calculate budget metrics (if budget exists)
  const budgetMetrics = calculateBudgetMetrics(project);

  // 5. Calculate progress (optional - can be expensive)
  const progressMetrics = calculateProgressMetrics(project, startDate, endDate);

  return {
    startDate,
    endDate,
    dateRangeDisplay,
    calendarDays,
    workingDays,
    durationDisplay,
    teamSize,
    resourcesByCategory,
    teamDisplay,
    ...budgetMetrics,
    ...progressMetrics,
  };
}

/**
 * Calculate project date range from phases
 */
function calculateDateRange(project: GanttProject) {
  if (!project.phases || project.phases.length === 0) {
    return {
      startDate: null,
      endDate: null,
      dateRangeDisplay: "No timeline yet",
    };
  }

  const allDates = project.phases.flatMap(p => [
    new Date(p.startDate),
    new Date(p.endDate)
  ]);

  const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Format: DD-MMM-YY (Ddd) (e.g., "02-Feb-26 (Mon) - 16-Apr-27 (Wed)")
  const dateRangeDisplay = `${format(startDate, "dd-MMM-yy (EEE)")} - ${format(endDate, "dd-MMM-yy (EEE)")}`;

  return { startDate, endDate, dateRangeDisplay };
}

/**
 * Calculate project duration
 */
function calculateDuration(
  startDate: Date | null,
  endDate: Date | null,
  project: GanttProject
) {
  if (!startDate || !endDate) {
    return {
      calendarDays: 0,
      workingDays: 0,
      durationDisplay: "0 days",
    };
  }

  const calendarDays = differenceInDays(endDate, startDate) + 1; // Inclusive
  const workingDays = calculateWorkingDaysInclusive(
    startDate,
    endDate,
    project.holidays || []
  );

  // Duration: Use months for calendar days (1 month = 30 days), days for working days
  const months = calendarDays / 30;

  let durationDisplay: string;
  if (months >= 1) {
    const roundedMonths = Math.round(months * 10) / 10; // Round to 1 decimal
    durationDisplay = `${roundedMonths} m`;
  } else {
    durationDisplay = `${calendarDays} d`;
  }

  return { calendarDays, workingDays, durationDisplay };
}

/**
 * Calculate team metrics
 *
 * POLICY: Uses canonical resource count from project.resources array
 * This ensures consistency with Resource Capacity panel and Org Chart Builder
 */
function calculateTeamMetrics(project: GanttProject) {
  const categoryCount: Record<string, number> = {};

  // Use canonical resource count - ALL resources in the project
  // This matches the count shown in Resource Capacity panel and Org Chart Builder
  const resources = project.resources || [];

  // Count by category
  resources.forEach(resource => {
    if (resource?.category) {
      categoryCount[resource.category] = (categoryCount[resource.category] || 0) + 1;
    }
  });

  const teamSize = resources.length;
  const teamDisplay = teamSize === 0
    ? "No team"
    : teamSize === 1
    ? "1 person"
    : `${teamSize} people`;

  return {
    teamSize,
    resourcesByCategory: categoryCount,
    teamDisplay,
  };
}

/**
 * Calculate budget metrics
 */
function calculateBudgetMetrics(project: GanttProject) {
  if (!project.budget) {
    return {
      budgetTotal: null,
      budgetSpent: null,
      budgetUtilization: null,
      budgetDisplay: null,
      budgetStatus: null as null,
    };
  }

  const budgetTotal = project.budget.totalBudget;

  // Calculate spent from resource assignments
  // TODO: Implement proper budget calculation based on:
  // - Task/phase duration (working days)
  // - Resource allocation percentage
  // - Resource hourly rate
  // Formula: (duration_hours * allocation% * hourly_rate)
  const budgetSpent = 0;

  // This is a placeholder - proper implementation requires:
  // 1. Calculate working hours from task dates
  // 2. Multiply by allocation percentage
  // 3. Multiply by resource hourly rate
  // For now, return 0 to avoid TypeScript errors
  project.phases?.forEach(phase => {
    // Placeholder for phase-level resource cost calculation
    phase.phaseResourceAssignments?.forEach(assignment => {
      const resource = project.resources?.find(r => r.id === assignment.resourceId);
      // Will implement: budgetSpent += calculateResourceCost(phase, assignment, resource);
    });

    phase.tasks?.forEach(task => {
      task.resourceAssignments?.forEach(assignment => {
        const resource = project.resources?.find(r => r.id === assignment.resourceId);
        // Will implement: budgetSpent += calculateResourceCost(task, assignment, resource);
      });
    });
  });

  const budgetUtilization = budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0;

  // Determine status
  const budgetStatus =
    budgetUtilization < 75 ? "good" as const :
    budgetUtilization < 90 ? "warning" as const :
    "danger" as const;

  // Format display
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const budgetDisplay = budgetSpent > 0
    ? `${formatCurrency(budgetSpent)} / ${formatCurrency(budgetTotal)} (${Math.round(budgetUtilization)}%)`
    : `${formatCurrency(budgetTotal)} budget`;

  return {
    budgetTotal,
    budgetSpent,
    budgetUtilization,
    budgetDisplay,
    budgetStatus,
  };
}

/**
 * Calculate progress metrics (optional - can be expensive for large projects)
 */
function calculateProgressMetrics(
  project: GanttProject,
  startDate: Date | null,
  endDate: Date | null
) {
  // For now, return null - can implement later if needed
  // This would calculate task completion rate vs. time elapsed
  return {
    progressPercentage: null,
    progressStatus: null as null,
    progressDisplay: null,
  };
}

/**
 * Get tooltip text for duration metric
 */
export function getDurationTooltip(metrics: ProjectMetrics): string {
  if (!metrics.startDate || !metrics.endDate) return "";

  const { calendarDays, workingDays } = metrics;
  const weekends = Math.floor(calendarDays / 7) * 2;
  const holidays = calendarDays - workingDays - weekends;

  return `${workingDays} d (Work Days) - ${holidays} holidays, ${weekends} weekend days excluded`;
}

/**
 * Get tooltip text for team metric
 */
export function getTeamTooltip(metrics: ProjectMetrics): string {
  if (metrics.teamSize === 0) return "No team assigned yet";

  const categoryBreakdown = Object.entries(metrics.resourcesByCategory)
    .map(([category, count]) => `${count} ${category}`)
    .join(", ");

  return categoryBreakdown || `${metrics.teamSize} team members`;
}

/**
 * Get tooltip text for budget metric
 */
export function getBudgetTooltip(metrics: ProjectMetrics): string {
  if (!metrics.budgetTotal) return "";

  if (metrics.budgetSpent && metrics.budgetUtilization !== null) {
    return `Budget utilization: ${metrics.budgetUtilization.toFixed(1)}% of total budget`;
  }

  return `Total budget: $${metrics.budgetTotal.toLocaleString()}`;
}
