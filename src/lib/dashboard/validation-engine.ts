/**
 * Real-time Validation & Quality Assurance Engine
 *
 * Zero-tolerance validation with constraint satisfaction checking
 */

import { GanttProject, Resource } from '@/types/gantt-tool';
import { calculateWeeklyAllocations, calculateUtilization } from './calculation-engine';

export type ValidationSeverity = 'blocking' | 'critical' | 'warning' | 'info';

export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  warnings: ValidationViolation[];
  info: ValidationViolation[];
}

export interface ValidationViolation {
  rule: string;
  message: string;
  severity: ValidationSeverity;
  context?: Record<string, any>;
  suggestion?: string;
}

// ============================================
// Validation Rules
// ============================================

export const VALIDATION_RULES = {
  resource_allocation: {
    rule: 'total_weekly_hours <= 40',
    message: 'Resource {resourceName} overallocated in {week} ({hours} hours)',
    severity: 'blocking' as ValidationSeverity,
    check: (hours: number) => hours <= 40,
  },
  skill_match: {
    rule: 'required_skills ⊆ assigned_skills',
    message: 'Skill gap detected for {activity}: missing {missingSkills}',
    severity: 'warning' as ValidationSeverity,
  },
  financial_viability: {
    rule: 'gross_margin >= minimum_acceptable_margin',
    message: 'Margin {currentMargin}% below threshold of {threshold}%',
    severity: 'critical' as ValidationSeverity,
    check: (margin: number, threshold: number) => margin >= threshold,
  },
  phase_continuity: {
    rule: 'phase_end_date >= phase_start_date',
    message: 'Phase {phaseName} has invalid date range',
    severity: 'blocking' as ValidationSeverity,
  },
  task_within_phase: {
    rule: 'task_dates ⊆ phase_dates',
    message: 'Task {taskName} extends beyond phase {phaseName} boundaries',
    severity: 'blocking' as ValidationSeverity,
  },
  resource_availability: {
    rule: 'assigned_resources ∈ available_resources',
    message: 'Resource {resourceId} assigned but not in resource pool',
    severity: 'blocking' as ValidationSeverity,
  },
  budget_adherence: {
    rule: 'total_cost <= budget',
    message: 'Project cost {cost} exceeds budget {budget}',
    severity: 'warning' as ValidationSeverity,
    check: (cost: number, budget: number) => cost <= budget,
  },
};

// ============================================
// Validation Functions
// ============================================

export function validateProject(
  project: GanttProject,
  options: {
    minimumMargin?: number;
    proposedRevenue?: number;
    budget?: number;
  } = {}
): ValidationResult {
  const violations: ValidationViolation[] = [];
  const warnings: ValidationViolation[] = [];
  const info: ValidationViolation[] = [];

  // 1. Resource Allocation Validation
  const weeklyAllocations = calculateWeeklyAllocations(project);
  const resources = project.resources || [];

  weeklyAllocations.forEach(week => {
    week.resourceAllocations.forEach((hours, resourceId) => {
      const resource = resources.find(r => r.id === resourceId);
      if (hours > 40) {
        violations.push({
          rule: 'resource_allocation',
          message: `Resource ${resource?.name || resourceId} overallocated in ${week.weekLabel} (${hours} hours)`,
          severity: 'blocking',
          context: {
            resourceId,
            resourceName: resource?.name,
            week: week.weekLabel,
            hours,
          },
          suggestion: 'Reduce allocation or extend timeline to distribute workload',
        });
      } else if (hours > 35) {
        warnings.push({
          rule: 'resource_allocation',
          message: `Resource ${resource?.name || resourceId} near capacity in ${week.weekLabel} (${hours} hours)`,
          severity: 'warning',
          context: {
            resourceId,
            resourceName: resource?.name,
            week: week.weekLabel,
            hours,
          },
          suggestion: 'Consider adding buffer to prevent overload',
        });
      }
    });
  });

  // 2. Phase Continuity Validation
  project.phases.forEach(phase => {
    const startDate = new Date(phase.startDate);
    const endDate = new Date(phase.endDate);

    if (endDate < startDate) {
      violations.push({
        rule: 'phase_continuity',
        message: `Phase "${phase.name}" has invalid date range`,
        severity: 'blocking',
        context: {
          phaseId: phase.id,
          phaseName: phase.name,
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      });
    }

    // 3. Task Within Phase Validation
    phase.tasks.forEach(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);

      if (taskStart < startDate || taskEnd > endDate) {
        violations.push({
          rule: 'task_within_phase',
          message: `Task "${task.name}" extends beyond phase "${phase.name}" boundaries`,
          severity: 'blocking',
          context: {
            taskId: task.id,
            taskName: task.name,
            phaseId: phase.id,
            phaseName: phase.name,
          },
          suggestion: 'Adjust task dates to fit within phase or extend phase duration',
        });
      }

      // 4. Resource Availability Validation
      task.resourceAssignments?.forEach(assignment => {
        const resourceExists = resources.some(r => r.id === assignment.resourceId);
        if (!resourceExists) {
          violations.push({
            rule: 'resource_availability',
            message: `Resource ${assignment.resourceId} assigned to task "${task.name}" but not in resource pool`,
            severity: 'blocking',
            context: {
              taskId: task.id,
              taskName: task.name,
              resourceId: assignment.resourceId,
            },
            suggestion: 'Add resource to project or reassign task',
          });
        }
      });
    });

    // Validate phase resource assignments
    phase.phaseResourceAssignments?.forEach(assignment => {
      const resourceExists = resources.some(r => r.id === assignment.resourceId);
      if (!resourceExists) {
        violations.push({
          rule: 'resource_availability',
          message: `Resource ${assignment.resourceId} assigned to phase "${phase.name}" but not in resource pool`,
          severity: 'blocking',
          context: {
            phaseId: phase.id,
            phaseName: phase.name,
            resourceId: assignment.resourceId,
          },
        });
      }
    });
  });

  // 5. Financial Viability Validation (if revenue provided)
  if (options.proposedRevenue && options.minimumMargin) {
    // Would need cost calculation here - importing would cause circular dependency
    // This is handled at component level where both are available
    info.push({
      rule: 'financial_viability',
      message: 'Financial validation requires cost calculation',
      severity: 'info',
      context: {
        minimumMargin: options.minimumMargin,
      },
    });
  }

  // 6. Budget Adherence (if budget provided)
  if (options.budget) {
    info.push({
      rule: 'budget_adherence',
      message: 'Budget validation requires cost calculation',
      severity: 'info',
      context: {
        budget: options.budget,
      },
    });
  }

  // 7. Data Quality Checks
  const dataQualityChecks = performDataQualityChecks(project);
  warnings.push(...dataQualityChecks.warnings);
  info.push(...dataQualityChecks.info);

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
    info,
  };
}

/**
 * Data Quality Checks
 * Ensure data integrity and completeness
 */
function performDataQualityChecks(project: GanttProject): {
  warnings: ValidationViolation[];
  info: ValidationViolation[];
} {
  const warnings: ValidationViolation[] = [];
  const info: ValidationViolation[] = [];

  // Check for phases without tasks
  project.phases.forEach(phase => {
    if (phase.tasks.length === 0) {
      warnings.push({
        rule: 'data_quality',
        message: `Phase "${phase.name}" has no tasks`,
        severity: 'warning',
        context: {
          phaseId: phase.id,
          phaseName: phase.name,
        },
        suggestion: 'Add tasks to phase or remove if unnecessary',
      });
    }
  });

  // Check for tasks without resource assignments
  project.phases.forEach(phase => {
    phase.tasks.forEach(task => {
      if (!task.resourceAssignments || task.resourceAssignments.length === 0) {
        info.push({
          rule: 'data_quality',
          message: `Task "${task.name}" has no resource assignments`,
          severity: 'info',
          context: {
            taskId: task.id,
            taskName: task.name,
            phaseId: phase.id,
          },
          suggestion: 'Assign resources to enable cost calculation',
        });
      }
    });
  });

  // Check for resources never assigned
  const assignedResourceIds = new Set<string>();
  project.phases.forEach(phase => {
    phase.phaseResourceAssignments?.forEach(a => assignedResourceIds.add(a.resourceId));
    phase.tasks.forEach(task => {
      task.resourceAssignments?.forEach(a => assignedResourceIds.add(a.resourceId));
    });
  });

  project.resources?.forEach(resource => {
    if (!assignedResourceIds.has(resource.id)) {
      info.push({
        rule: 'data_quality',
        message: `Resource "${resource.name}" is never assigned to any task or phase`,
        severity: 'info',
        context: {
          resourceId: resource.id,
          resourceName: resource.name,
        },
        suggestion: 'Assign to tasks or remove from project',
      });
    }
  });

  return { warnings, info };
}

/**
 * Validate allocation change before applying
 * Used for real-time validation during drag-and-drop
 */
export function validateAllocationChange(
  resourceId: string,
  weekIndex: number,
  newHours: number,
  currentAllocations: Map<string, number>
): ValidationViolation | null {
  const totalHours = (currentAllocations.get(resourceId) || 0) + newHours;

  if (totalHours > 40) {
    return {
      rule: 'resource_allocation',
      message: `This change would overallocate resource (${totalHours} hours)`,
      severity: 'blocking',
      context: {
        resourceId,
        weekIndex,
        newHours,
        totalHours,
      },
      suggestion: 'Reduce allocation percentage or extend task duration',
    };
  } else if (totalHours > 35) {
    return {
      rule: 'resource_allocation',
      message: `Resource will be near capacity (${totalHours} hours)`,
      severity: 'warning',
      context: {
        resourceId,
        weekIndex,
        newHours,
        totalHours,
      },
      suggestion: 'Consider adding buffer',
    };
  }

  return null;
}

/**
 * Cross-validation: Weekly totals vs. phase totals vs. project totals
 */
export function performCrossValidation(project: GanttProject): ValidationResult {
  const violations: ValidationViolation[] = [];
  const warnings: ValidationViolation[] = [];
  const info: ValidationViolation[] = [];

  // Calculate totals at different levels
  const utilization = calculateUtilization(project);
  const weeklyAllocations = calculateWeeklyAllocations(project);

  // Check consistency
  const resources = project.resources || [];
  resources.forEach(resource => {
    const weeklyTotal = weeklyAllocations.reduce((sum, week) => {
      return sum + (week.resourceAllocations.get(resource.id) || 0);
    }, 0);

    const utilizationHours = ((utilization.resourceUtilization.get(resource.id) || 0) / 100) *
      (weeklyAllocations.length * 40); // weeks * 40 hours

    const difference = Math.abs(weeklyTotal - utilizationHours);
    const threshold = utilizationHours * 0.05; // 5% tolerance

    if (difference > threshold) {
      warnings.push({
        rule: 'cross_validation',
        message: `Inconsistent allocation for ${resource.name}: weekly (${weeklyTotal}h) vs calculated (${utilizationHours.toFixed(1)}h)`,
        severity: 'warning',
        context: {
          resourceId: resource.id,
          resourceName: resource.name,
          weeklyTotal,
          utilizationHours,
          difference,
        },
        suggestion: 'Review resource assignments for data integrity',
      });
    }
  });

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
    info,
  };
}
