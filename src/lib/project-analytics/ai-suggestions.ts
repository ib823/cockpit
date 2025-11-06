/**
 * AI-Powered Scheduling Suggestions
 *
 * Provides intelligent recommendations for project optimization using
 * heuristics, pattern recognition, and best practices.
 */

import type { GanttProject, GanttTask, GanttPhase } from '@/types/gantt-tool';
import { differenceInDays, parseISO, addDays, format, isWeekend } from 'date-fns';
import { calculateCriticalPath } from './critical-path';

export interface SchedulingSuggestion {
  id: string;
  type:
    | 'optimization'
    | 'risk-mitigation'
    | 'resource-allocation'
    | 'dependency'
    | 'timeline';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    timeSaved?: number; // days
    riskReduction?: number; // percentage
    efficiencyGain?: number; // percentage
  };
  action: {
    type: 'auto' | 'manual';
    description: string;
    affectedTasks?: string[];
    affectedPhases?: string[];
  };
  reasoning: string;
  confidence: number; // 0-100
}

export interface AIInsights {
  suggestions: SchedulingSuggestion[];
  summary: {
    totalSuggestions: number;
    highPriority: number;
    potentialTimeSavings: number; // days
    automationOpportunities: number;
  };
  patterns: {
    name: string;
    description: string;
    occurrences: number;
  }[];
}

/**
 * Generate AI-powered scheduling suggestions
 */
export function generateSchedulingSuggestions(project: GanttProject): AIInsights {
  const suggestions: SchedulingSuggestion[] = [];

  // Run various analyzers
  suggestions.push(...analyzeParallelization(project));
  suggestions.push(...analyzeTaskDurations(project));
  suggestions.push(...analyzeDependencies(project));
  suggestions.push(...analyzeResourceAllocation(project));
  suggestions.push(...analyzeBufferTime(project));
  suggestions.push(...analyzeWeekendWork(project));
  suggestions.push(...analyzePhaseBalance(project));

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  // Calculate summary
  const highPriority = suggestions.filter((s) => s.priority === 'high').length;
  const potentialTimeSavings = suggestions.reduce(
    (sum, s) => sum + (s.impact.timeSaved || 0),
    0
  );
  const automationOpportunities = suggestions.filter((s) => s.action.type === 'auto').length;

  // Identify patterns
  const patterns = identifyPatterns(project);

  return {
    suggestions,
    summary: {
      totalSuggestions: suggestions.length,
      highPriority,
      potentialTimeSavings,
      automationOpportunities,
    },
    patterns,
  };
}

/**
 * Analyze opportunities for task parallelization
 */
function analyzeParallelization(project: GanttProject): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];
  const allTasks = project.phases.flatMap((p) => p.tasks);

  // Find sequential tasks that could run in parallel
  project.phases.forEach((phase) => {
    const sequentialTasks = phase.tasks.filter(
      (task) =>
        !task.dependencies || task.dependencies.length === 0 || task.dependencies.length === 1
    );

    if (sequentialTasks.length >= 3) {
      // Check if tasks overlap in timeline
      const canParallelize = sequentialTasks.filter((task, idx) => {
        if (idx === 0) return false;
        const prevTask = sequentialTasks[idx - 1];
        const timeDiff = differenceInDays(
          parseISO(task.startDate),
          parseISO(prevTask.endDate)
        );
        return timeDiff <= 1; // Tasks start right after each other
      });

      if (canParallelize.length >= 2) {
        const potentialSavings = canParallelize.reduce((sum, task) => {
          return sum + differenceInDays(parseISO(task.endDate), parseISO(task.startDate));
        }, 0) * 0.4; // Assume 40% time savings

        suggestions.push({
          id: `parallel-${phase.id}`,
          type: 'optimization',
          priority: potentialSavings > 10 ? 'high' : 'medium',
          title: `Parallelize tasks in ${phase.name}`,
          description: `${canParallelize.length} tasks could potentially run in parallel`,
          impact: {
            timeSaved: Math.floor(potentialSavings),
            efficiencyGain: 25,
          },
          action: {
            type: 'manual',
            description: 'Review task dependencies and adjust start dates to overlap work',
            affectedTasks: canParallelize.map((t) => t.id),
            affectedPhases: [phase.id],
          },
          reasoning:
            'Tasks without hard dependencies can often run simultaneously with proper resource allocation',
          confidence: 75,
        });
      }
    }
  });

  return suggestions;
}

/**
 * Analyze task durations for optimization
 */
function analyzeTaskDurations(project: GanttProject): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];
  const allTasks = project.phases.flatMap((p) => p.tasks);

  // Find tasks with unusually long durations
  const durations = allTasks.map((t) =>
    differenceInDays(parseISO(t.endDate), parseISO(t.startDate))
  );
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const longTasks = allTasks.filter((task) => {
    const duration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate));
    return duration > avgDuration * 2.5;
  });

  if (longTasks.length > 0) {
    longTasks.forEach((task) => {
      const duration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate));
      const phase = project.phases.find((p) => p.id === task.phaseId);

      suggestions.push({
        id: `duration-${task.id}`,
        type: 'optimization',
        priority: duration > avgDuration * 4 ? 'high' : 'medium',
        title: `Break down long task: ${task.name}`,
        description: `Task duration is ${duration} days, significantly longer than average (${avgDuration.toFixed(1)} days)`,
        impact: {
          timeSaved: Math.floor(duration * 0.15), // 15% potential savings
          efficiencyGain: 20,
        },
        action: {
          type: 'manual',
          description: 'Split task into smaller, manageable subtasks with clear milestones',
          affectedTasks: [task.id],
          affectedPhases: phase ? [phase.id] : [],
        },
        reasoning:
          'Long tasks are harder to estimate, track, and parallelize. Breaking them down improves control and flexibility',
        confidence: 80,
      });
    });
  }

  return suggestions;
}

/**
 * Analyze dependency chains
 */
function analyzeDependencies(project: GanttProject): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];
  const allTasks = project.phases.flatMap((p) => p.tasks);

  // Find tasks with excessive dependencies
  const heavyDeps = allTasks.filter((t) => (t.dependencies?.length || 0) > 3);

  heavyDeps.forEach((task) => {
    const phase = project.phases.find((p) => p.id === task.phaseId);

    suggestions.push({
      id: `deps-${task.id}`,
      type: 'dependency',
      priority: 'medium',
      title: `Simplify dependencies for ${task.name}`,
      description: `Task has ${task.dependencies?.length} dependencies, which increases complexity`,
      impact: {
        riskReduction: 30,
        efficiencyGain: 15,
      },
      action: {
        type: 'manual',
        description: 'Review and consolidate dependencies to only critical blockers',
        affectedTasks: [task.id],
        affectedPhases: phase ? [phase.id] : [],
      },
      reasoning:
        'Excessive dependencies create bottlenecks and increase schedule risk. Simplify where possible.',
      confidence: 70,
    });
  });

  // Find circular or unnecessary dependencies
  // (Simplified - in production would use graph algorithms)
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));
  allTasks.forEach((task) => {
    task.dependencies?.forEach((depId) => {
      const depTask = taskMap.get(depId);
      if (depTask && depTask.phaseId === task.phaseId) {
        // Check if dependency is from same phase - might be unnecessarily tight
        const phase = project.phases.find((p) => p.id === task.phaseId);
        if (phase && phase.tasks.length > 5) {
          suggestions.push({
            id: `dep-review-${task.id}-${depId}`,
            type: 'dependency',
            priority: 'low',
            title: `Review intra-phase dependency`,
            description: `${task.name} depends on ${depTask.name} within same phase`,
            impact: {
              timeSaved: 2,
              efficiencyGain: 10,
            },
            action: {
              type: 'manual',
              description: 'Verify if this dependency is truly necessary or can be relaxed',
              affectedTasks: [task.id, depId],
              affectedPhases: phase ? [phase.id] : [],
            },
            reasoning:
              'Some intra-phase dependencies can be relaxed to allow more parallel work',
            confidence: 60,
          });
        }
      }
    });
  });

  return suggestions.slice(0, 5); // Limit to avoid overwhelming user
}

/**
 * Analyze resource allocation
 */
function analyzeResourceAllocation(project: GanttProject): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];
  const allTasks = project.phases.flatMap((p) => p.tasks);
  const resources = project.resources || [];

  // Find unassigned tasks
  const unassigned = allTasks.filter((t) => !t.assignee || t.assignee.trim() === '');

  if (unassigned.length > allTasks.length * 0.15) {
    // More than 15% unassigned
    suggestions.push({
      id: 'resource-unassigned',
      type: 'resource-allocation',
      priority: 'high',
      title: 'Assign resources to unassigned tasks',
      description: `${unassigned.length} tasks (${((unassigned.length / allTasks.length) * 100).toFixed(0)}%) have no assignee`,
      impact: {
        riskReduction: 40,
        efficiencyGain: 30,
      },
      action: {
        type: 'manual',
        description: 'Review and assign appropriate resources to all tasks',
        affectedTasks: unassigned.map((t) => t.id),
      },
      reasoning:
        'Unassigned tasks often slip through the cracks. Clear ownership improves accountability and execution.',
      confidence: 90,
    });
  }

  // Check for resource overload
  if (resources.length > 0) {
    const tasksByResource = new Map<string, typeof allTasks>();
    allTasks.forEach((task) => {
      if (task.assignee) {
        const existing = tasksByResource.get(task.assignee) || [];
        existing.push(task);
        tasksByResource.set(task.assignee, existing);
      }
    });

    const avgTasksPerResource = allTasks.length / resources.length;
    tasksByResource.forEach((tasks, resourceName) => {
      if (tasks.length > avgTasksPerResource * 1.5) {
        suggestions.push({
          id: `resource-overload-${resourceName}`,
          type: 'resource-allocation',
          priority: 'medium',
          title: `Balance workload for ${resourceName}`,
          description: `Assigned ${tasks.length} tasks, ${Math.floor((tasks.length / avgTasksPerResource - 1) * 100)}% above average`,
          impact: {
            riskReduction: 25,
            efficiencyGain: 20,
          },
          action: {
            type: 'manual',
            description: 'Redistribute some tasks to other team members',
            affectedTasks: tasks.map((t) => t.id),
          },
          reasoning:
            'Overloaded resources are at higher risk of burnout and delays. Balance workload across team.',
          confidence: 75,
        });
      }
    });
  }

  return suggestions;
}

/**
 * Analyze buffer time in schedule
 */
function analyzeBufferTime(project: GanttProject): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];

  const criticalPath = calculateCriticalPath(project);
  const criticalTasks = criticalPath.criticalPath;

  // Check if critical path has any slack (it shouldn't)
  const hasSlack = criticalTasks.some((t) => t.slack > 0);

  if (!hasSlack && criticalTasks.length > 5) {
    suggestions.push({
      id: 'buffer-critical',
      type: 'risk-mitigation',
      priority: 'high',
      title: 'Add buffer time to critical path',
      description: 'Critical path has zero slack - any delay will impact project completion',
      impact: {
        riskReduction: 50,
        timeSaved: -5, // Actually adds time, but reduces risk
      },
      action: {
        type: 'manual',
        description:
          'Add 10-15% buffer time to critical tasks or at phase boundaries',
        affectedTasks: criticalTasks.slice(0, 3).map((t) => t.id),
      },
      reasoning:
        'Buffer time protects against unexpected delays and provides contingency for risks',
      confidence: 85,
    });
  }

  return suggestions;
}

/**
 * Analyze weekend work scheduling
 */
function analyzeWeekendWork(project: GanttProject): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];
  const allTasks = project.phases.flatMap((p) => p.tasks);

  // Check if any tasks span weekends unnecessarily
  const weekendTasks = allTasks.filter((task) => {
    const start = parseISO(task.startDate);
    const end = parseISO(task.endDate);
    return isWeekend(start) || isWeekend(end);
  });

  if (weekendTasks.length > 0) {
    suggestions.push({
      id: 'weekend-work',
      type: 'optimization',
      priority: 'low',
      title: 'Adjust weekend scheduling',
      description: `${weekendTasks.length} tasks start or end on weekends`,
      impact: {
        efficiencyGain: 10,
      },
      action: {
        type: 'auto',
        description: 'Automatically shift task dates to start/end on weekdays',
        affectedTasks: weekendTasks.map((t) => t.id),
      },
      reasoning:
        'Weekend work is typically less productive and more expensive. Shift to weekdays where possible.',
      confidence: 65,
    });
  }

  return suggestions;
}

/**
 * Analyze phase balance
 */
function analyzePhaseBalance(project: GanttProject): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];

  const phaseDurations = project.phases.map((phase) => ({
    phase,
    duration: differenceInDays(parseISO(phase.endDate), parseISO(phase.startDate)),
    taskCount: phase.tasks.length,
  }));

  const avgDuration =
    phaseDurations.reduce((sum, p) => sum + p.duration, 0) / phaseDurations.length;

  // Find phases that are significantly longer than average
  const longPhases = phaseDurations.filter((p) => p.duration > avgDuration * 2);

  longPhases.forEach((phaseData) => {
    suggestions.push({
      id: `phase-balance-${phaseData.phase.id}`,
      type: 'timeline',
      priority: 'medium',
      title: `Consider splitting ${phaseData.phase.name}`,
      description: `Phase is ${phaseData.duration} days, ${Math.floor((phaseData.duration / avgDuration - 1) * 100)}% longer than average`,
      impact: {
        efficiencyGain: 15,
        riskReduction: 20,
      },
      action: {
        type: 'manual',
        description:
          'Split into sub-phases with clear milestones to improve tracking and control',
        affectedPhases: [phaseData.phase.id],
      },
      reasoning:
        'Long phases are harder to estimate and track. Breaking them down improves visibility and control.',
      confidence: 70,
    });
  });

  return suggestions;
}

/**
 * Identify patterns in project structure
 */
function identifyPatterns(project: GanttProject): AIInsights['patterns'] {
  const patterns: AIInsights['patterns'] = [];
  const allTasks = project.phases.flatMap((p) => p.tasks);

  // Pattern: Many short tasks
  const shortTasks = allTasks.filter(
    (t) => differenceInDays(parseISO(t.endDate), parseISO(t.startDate)) <= 2
  );
  if (shortTasks.length > allTasks.length * 0.4) {
    patterns.push({
      name: 'Many Short Tasks',
      description: 'Over 40% of tasks are 2 days or less',
      occurrences: shortTasks.length,
    });
  }

  // Pattern: Sequential phases
  const hasOverlap = project.phases.some((phase, idx) => {
    if (idx === 0) return false;
    const prevPhase = project.phases[idx - 1];
    return parseISO(phase.startDate) <= parseISO(prevPhase.endDate);
  });
  if (!hasOverlap && project.phases.length > 2) {
    patterns.push({
      name: 'Strict Sequential Phases',
      description: 'Phases do not overlap - consider parallel work',
      occurrences: project.phases.length,
    });
  }

  // Pattern: Uneven resource distribution
  const assignedTasks = allTasks.filter((t) => t.assignee && t.assignee.trim() !== '');
  if (assignedTasks.length > 0 && assignedTasks.length < allTasks.length * 0.7) {
    patterns.push({
      name: 'Inconsistent Resource Assignment',
      description: 'Some tasks assigned, others not',
      occurrences: allTasks.length - assignedTasks.length,
    });
  }

  return patterns;
}

/**
 * Apply an automated suggestion
 */
export function applySuggestion(
  project: GanttProject,
  suggestion: SchedulingSuggestion
): GanttProject {
  // This would implement the actual changes
  // For now, return project unchanged (implementation would vary by suggestion type)
  console.log('[AI] Would apply suggestion:', suggestion.id);
  return project;
}
