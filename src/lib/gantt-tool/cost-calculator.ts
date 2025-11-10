/**
 * Gantt Tool - Cost Calculator
 *
 * Steve Jobs: "Innovation is saying no to 1000 things."
 *
 * Advanced cost calculations for project budgeting:
 * - Resource rate-based costing
 * - Budget tracking and alerts
 * - What-if scenario analysis
 * - Cost breakdown by phase, resource, category
 */

import { differenceInBusinessDays, addBusinessDays } from "date-fns";
import type {
  GanttProject,
  GanttPhase,
  GanttTask,
  Resource,
  ProjectBudget,
  CostCalculation,
  WhatIfScenario,
  ResourceCategory,
  BudgetAlert,
} from "@/types/gantt-tool";

// Constants
const HOURS_PER_DAY = 8;
const DAYS_PER_WEEK = 5;

/**
 * Calculate cost for a single task
 */
export function calculateTaskCost(
  task: GanttTask,
  resources: Resource[],
  holidays: { date: string }[] = []
): number {
  if (!task.resourceAssignments || task.resourceAssignments.length === 0) {
    return 0;
  }

  let totalCost = 0;

  // Calculate working days for this task (excluding weekends and holidays)
  const taskDays = calculateWorkingDays(task.startDate, task.endDate, holidays);

  task.resourceAssignments.forEach((assignment) => {
    const resource = resources.find((r) => r.id === assignment.resourceId);
    if (!resource) return;

    // Only include billable resources in cost calculations
    if (!resource.isBillable) return;

    // Calculate allocation (percentage of time working on this task)
    const allocationDecimal = assignment.allocationPercentage / 100;

    // Calculate cost using standardized hourly rate
    const hours = taskDays * HOURS_PER_DAY * allocationDecimal;
    totalCost += hours * resource.chargeRatePerHour;
  });

  return totalCost;
}

/**
 * Calculate cost for a phase (including all tasks)
 */
export function calculatePhaseCost(
  phase: GanttPhase,
  resources: Resource[],
  holidays: { date: string }[] = []
): number {
  let phaseCost = 0;

  // Sum up all task costs in this phase
  phase.tasks.forEach((task) => {
    phaseCost += calculateTaskCost(task, resources, holidays);
  });

  // Add phase-level resource costs
  if (phase.phaseResourceAssignments && phase.phaseResourceAssignments.length > 0) {
    const phaseDays = calculateWorkingDays(phase.startDate, phase.endDate, holidays);

    phase.phaseResourceAssignments.forEach((assignment) => {
      const resource = resources.find((r) => r.id === assignment.resourceId);
      if (!resource) return;

      // Only include billable resources in cost calculations
      if (!resource.isBillable) return;

      const allocationDecimal = assignment.allocationPercentage / 100;

      // Calculate cost using standardized hourly rate
      const hours = phaseDays * HOURS_PER_DAY * allocationDecimal;
      phaseCost += hours * resource.chargeRatePerHour;
    });
  }

  return phaseCost;
}

/**
 * Calculate total project cost with detailed breakdown
 */
export function calculateProjectCost(project: GanttProject): CostCalculation {
  let totalCost = 0;
  const costByPhase = new Map<string, number>();
  const costByResource = new Map<string, number>();
  const costByCategory = new Map<ResourceCategory, number>();

  // Calculate cost for each phase
  project.phases.forEach((phase) => {
    const phaseCost = calculatePhaseCost(phase, project.resources, project.holidays);
    costByPhase.set(phase.id, phaseCost);
    totalCost += phaseCost;

    // Track cost by resource and category
    phase.tasks.forEach((task) => {
      task.resourceAssignments?.forEach((assignment) => {
        const resource = project.resources.find((r) => r.id === assignment.resourceId);
        if (!resource) return;

        const taskCost = calculateTaskCostForResource(task, resource, assignment, project.holidays);

        // Add to resource total
        const currentResourceCost = costByResource.get(resource.id) || 0;
        costByResource.set(resource.id, currentResourceCost + taskCost);

        // Add to category total
        const currentCategoryCost = costByCategory.get(resource.category) || 0;
        costByCategory.set(resource.category, currentCategoryCost + taskCost);
      });
    });

    // Track phase-level costs
    phase.phaseResourceAssignments?.forEach((assignment) => {
      const resource = project.resources.find((r) => r.id === assignment.resourceId);
      if (!resource) return;

      // Only include billable resources in cost calculations
      if (!resource.isBillable) return;

      const phaseDays = calculateWorkingDays(phase.startDate, phase.endDate, project.holidays);
      const allocationDecimal = assignment.allocationPercentage / 100;

      // Calculate cost using standardized hourly rate
      const assignmentCost =
        phaseDays * HOURS_PER_DAY * allocationDecimal * resource.chargeRatePerHour;

      const currentResourceCost = costByResource.get(resource.id) || 0;
      costByResource.set(resource.id, currentResourceCost + assignmentCost);

      const currentCategoryCost = costByCategory.get(resource.category) || 0;
      costByCategory.set(resource.category, currentCategoryCost + assignmentCost);
    });
  });

  // Calculate budget metrics
  const budget = project.budget;
  const contingency = budget ? (budget.totalBudget * budget.contingencyPercentage) / 100 : 0;
  const laborCost = totalCost;
  const totalWithContingency = totalCost + contingency;
  const remainingBudget = budget ? budget.totalBudget - totalWithContingency : 0;
  const budgetUtilization = budget ? (totalWithContingency / budget.totalBudget) * 100 : 0;
  const isOverBudget = budget ? totalWithContingency > budget.totalBudget : false;
  const variance = budget ? budget.totalBudget - totalWithContingency : 0;

  return {
    totalCost: totalWithContingency,
    laborCost,
    contingency,
    remainingBudget,
    budgetUtilization,
    costByPhase,
    costByResource,
    costByCategory,
    isOverBudget,
    variance,
  };
}

/**
 * Calculate cost for a specific resource assignment on a task
 */
function calculateTaskCostForResource(
  task: GanttTask,
  resource: Resource,
  assignment: { allocationPercentage: number },
  holidays: { date: string }[] = []
): number {
  // Only include billable resources in cost calculations
  if (!resource.isBillable) return 0;

  const taskDays = calculateWorkingDays(task.startDate, task.endDate, holidays);
  const allocationDecimal = assignment.allocationPercentage / 100;

  // Calculate cost using standardized hourly rate
  return taskDays * HOURS_PER_DAY * allocationDecimal * resource.chargeRatePerHour;
}

/**
 * Calculate working days between two dates (excluding weekends)
 * Note: For full holiday support, integrate with project holidays
 */
function calculateWorkingDays(
  startDate: string,
  endDate: string,
  holidays: { date: string }[] = []
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate business days (Mon-Fri)
  let workingDays = differenceInBusinessDays(end, start) + 1; // +1 to include end date

  // Subtract holidays that fall on working days
  const holidayDates = new Set(holidays.map((h) => h.date));
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayOfWeek = currentDate.getDay();

    // If it's a holiday and NOT a weekend, subtract it
    if (holidayDates.has(dateStr) && dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays--;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Math.max(workingDays, 0);
}

/**
 * Check budget alerts and trigger warnings
 */
export function checkBudgetAlerts(
  project: GanttProject,
  costCalculation: CostCalculation
): BudgetAlert[] {
  if (!project.budget || !project.budget.budgetAlerts) {
    return [];
  }

  const alerts: BudgetAlert[] = [];
  const now = new Date().toISOString();

  project.budget.budgetAlerts.forEach((alert) => {
    const wasTriggered = alert.triggered;
    const isNowTriggered = costCalculation.budgetUtilization >= alert.threshold;

    if (isNowTriggered && !wasTriggered) {
      // Newly triggered
      alerts.push({
        ...alert,
        triggered: true,
        triggeredAt: now,
        message: `Budget ${alert.type === "warning" ? "warning" : "critical alert"}: ${costCalculation.budgetUtilization.toFixed(1)}% of budget used (threshold: ${alert.threshold}%)`,
      });
    } else if (isNowTriggered) {
      // Still triggered
      alerts.push({ ...alert, triggered: true });
    } else {
      // Not triggered
      alerts.push({ ...alert, triggered: false });
    }
  });

  return alerts;
}

/**
 * Calculate what-if scenario cost
 */
export function calculateWhatIfScenario(
  project: GanttProject,
  scenario: WhatIfScenario
): CostCalculation {
  // Create a deep copy of the project with scenario overrides
  const scenarioProject: GanttProject = JSON.parse(JSON.stringify(project));

  // Apply resource rate overrides
  if (scenario.resourceRateOverrides) {
    scenario.resourceRateOverrides.forEach((override, resourceId) => {
      const resource = scenarioProject.resources.find((r) => r.id === resourceId);
      if (resource) {
        // Support legacy hourlyRate/dailyRate for backward compatibility
        if (override.hourlyRate !== undefined) {
          resource.chargeRatePerHour = override.hourlyRate;
        }
        if (override.dailyRate !== undefined) {
          // Convert daily rate to hourly
          resource.chargeRatePerHour = override.dailyRate / 8;
        }
      }
    });
  }

  // Apply allocation overrides
  if (scenario.allocationOverrides) {
    scenario.allocationOverrides.forEach((newAllocation, assignmentId) => {
      scenarioProject.phases.forEach((phase) => {
        phase.tasks.forEach((task) => {
          const assignment = task.resourceAssignments?.find((a) => a.id === assignmentId);
          if (assignment) {
            assignment.allocationPercentage = newAllocation;
          }
        });

        const phaseAssignment = phase.phaseResourceAssignments?.find((a) => a.id === assignmentId);
        if (phaseAssignment) {
          phaseAssignment.allocationPercentage = newAllocation;
        }
      });
    });
  }

  // Calculate cost with overrides
  return calculateProjectCost(scenarioProject);
}

/**
 * Get default resource ratios by designation
 * (Ratios instead of currency-based rates)
 */
export const DEFAULT_RESOURCE_RATES: Record<string, number> = {
  principal: 2.1672,
  director: 1.7337,
  senior_manager: 1.3003,
  manager: 0.8127,
  senior_consultant: 0.4443,
  consultant: 0.2817,
  analyst: 0.2601,
  subcontractor: 0.2,
};

/**
 * Apply default ratios to resources that don't have rates set
 */
export function applyDefaultRates(resources: Resource[]): Resource[] {
  return resources.map((resource) => {
    if (!resource.chargeRatePerHour || resource.chargeRatePerHour === 0) {
      const defaultRate = DEFAULT_RESOURCE_RATES[resource.designation] || 0.4443;
      return {
        ...resource,
        chargeRatePerHour: defaultRate,
        isBillable: resource.isBillable !== undefined ? resource.isBillable : true,
      };
    }
    return resource;
  });
}
