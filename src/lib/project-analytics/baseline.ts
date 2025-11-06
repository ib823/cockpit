/**
 * Project Baseline Management
 *
 * Allows saving project snapshots as baselines and comparing actual progress
 * against planned baseline to track variance and identify schedule drift.
 *
 * Key metrics:
 * - Schedule Variance (SV): Actual Progress - Planned Progress
 * - Cost Variance (CV): Actual Cost - Planned Cost
 * - Schedule Performance Index (SPI): Actual / Planned
 * - Variance Analysis: Task-by-task comparison
 */

import type { GanttProject, GanttPhase, GanttTask } from '@/types/gantt-tool';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';

export interface ProjectBaseline {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  snapshot: GanttProject; // Complete project snapshot
  metadata: {
    totalDuration: number;
    totalTasks: number;
    totalPhases: number;
    estimatedCost?: number;
  };
}

export interface BaselineComparison {
  projectId: string;
  baselineId: string;
  comparisonDate: string;
  overall: {
    scheduleVarianceDays: number; // Positive = ahead, negative = behind
    schedulePerformanceIndex: number; // >1 = ahead, <1 = behind
    completionPercentage: {
      baseline: number;
      actual: number;
      variance: number;
    };
    duration: {
      baseline: number;
      actual: number;
      variance: number;
    };
  };
  phases: PhaseVariance[];
  tasks: TaskVariance[];
  summary: {
    tasksAhead: number;
    tasksBehind: number;
    tasksOnTrack: number;
    criticalIssues: VarianceIssue[];
    warnings: VarianceIssue[];
  };
}

export interface PhaseVariance {
  phaseId: string;
  phaseName: string;
  baseline: {
    startDate: string;
    endDate: string;
    duration: number;
    taskCount: number;
  };
  actual: {
    startDate: string;
    endDate: string;
    duration: number;
    taskCount: number;
  };
  variance: {
    startDateDays: number;
    endDateDays: number;
    durationDays: number;
  };
  status: 'ahead' | 'on-track' | 'behind';
}

export interface TaskVariance {
  taskId: string;
  taskName: string;
  phaseId: string;
  phaseName: string;
  baseline: {
    startDate: string;
    endDate: string;
    duration: number;
    progress: number;
  };
  actual: {
    startDate: string;
    endDate: string;
    duration: number;
    progress: number;
  };
  variance: {
    startDateDays: number;
    endDateDays: number;
    durationDays: number;
    progressPercentage: number;
  };
  status: 'ahead' | 'on-track' | 'behind' | 'at-risk';
  isCritical: boolean;
}

export interface VarianceIssue {
  type: 'critical' | 'warning';
  category: 'schedule' | 'progress' | 'duration';
  taskId?: string;
  phaseId?: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

/**
 * Create a baseline snapshot of a project
 */
export function createBaseline(
  project: GanttProject,
  name: string,
  description?: string
): ProjectBaseline {
  const totalDuration = project.phases.reduce((total, phase) => {
    const phaseDuration = differenceInDays(parseISO(phase.endDate), parseISO(phase.startDate)) + 1;
    return total + phaseDuration;
  }, 0);

  const totalTasks = project.phases.reduce((total, phase) => total + phase.tasks.length, 0);

  return {
    id: `baseline-${Date.now()}`,
    projectId: project.id,
    name,
    description,
    createdAt: new Date().toISOString(),
    snapshot: JSON.parse(JSON.stringify(project)), // Deep clone
    metadata: {
      totalDuration,
      totalTasks,
      totalPhases: project.phases.length,
    },
  };
}

/**
 * Compare current project state against baseline
 */
export function compareToBaseline(
  currentProject: GanttProject,
  baseline: ProjectBaseline
): BaselineComparison {
  const comparisonDate = new Date().toISOString();
  const baselineProject = baseline.snapshot;

  // Create maps for easy lookup
  const baselinePhaseMap = new Map(baselineProject.phases.map((p) => [p.id, p]));
  const baselineTaskMap = new Map<string, { task: GanttTask; phase: GanttPhase }>();
  baselineProject.phases.forEach((phase) => {
    phase.tasks.forEach((task) => {
      baselineTaskMap.set(task.id, { task, phase });
    });
  });

  // Compare phases
  const phaseVariances: PhaseVariance[] = currentProject.phases.map((currentPhase) => {
    const baselinePhase = baselinePhaseMap.get(currentPhase.id);

    if (!baselinePhase) {
      // New phase not in baseline
      return {
        phaseId: currentPhase.id,
        phaseName: currentPhase.name,
        baseline: {
          startDate: '',
          endDate: '',
          duration: 0,
          taskCount: 0,
        },
        actual: {
          startDate: currentPhase.startDate,
          endDate: currentPhase.endDate,
          duration: differenceInDays(parseISO(currentPhase.endDate), parseISO(currentPhase.startDate)) + 1,
          taskCount: currentPhase.tasks.length,
        },
        variance: {
          startDateDays: 0,
          endDateDays: 0,
          durationDays: 0,
        },
        status: 'on-track' as const,
      };
    }

    const baselineDuration =
      differenceInDays(parseISO(baselinePhase.endDate), parseISO(baselinePhase.startDate)) + 1;
    const actualDuration =
      differenceInDays(parseISO(currentPhase.endDate), parseISO(currentPhase.startDate)) + 1;

    const startDateVariance = differenceInDays(
      parseISO(currentPhase.startDate),
      parseISO(baselinePhase.startDate)
    );
    const endDateVariance = differenceInDays(
      parseISO(currentPhase.endDate),
      parseISO(baselinePhase.endDate)
    );
    const durationVariance = actualDuration - baselineDuration;

    let status: 'ahead' | 'on-track' | 'behind';
    if (endDateVariance < -2) status = 'ahead';
    else if (endDateVariance > 2) status = 'behind';
    else status = 'on-track';

    return {
      phaseId: currentPhase.id,
      phaseName: currentPhase.name,
      baseline: {
        startDate: baselinePhase.startDate,
        endDate: baselinePhase.endDate,
        duration: baselineDuration,
        taskCount: baselinePhase.tasks.length,
      },
      actual: {
        startDate: currentPhase.startDate,
        endDate: currentPhase.endDate,
        duration: actualDuration,
        taskCount: currentPhase.tasks.length,
      },
      variance: {
        startDateDays: startDateVariance,
        endDateDays: endDateVariance,
        durationDays: durationVariance,
      },
      status,
    };
  });

  // Compare tasks
  const taskVariances: TaskVariance[] = [];
  currentProject.phases.forEach((currentPhase) => {
    currentPhase.tasks.forEach((currentTask) => {
      const baselineData = baselineTaskMap.get(currentTask.id);

      if (!baselineData) {
        // Task not in baseline (new task)
        taskVariances.push({
          taskId: currentTask.id,
          taskName: currentTask.name,
          phaseId: currentPhase.id,
          phaseName: currentPhase.name,
          baseline: {
            startDate: '',
            endDate: '',
            duration: 0,
            progress: 0,
          },
          actual: {
            startDate: currentTask.startDate,
            endDate: currentTask.endDate,
            duration: differenceInDays(parseISO(currentTask.endDate), parseISO(currentTask.startDate)) + 1,
            progress: currentTask.progress,
          },
          variance: {
            startDateDays: 0,
            endDateDays: 0,
            durationDays: 0,
            progressPercentage: 0,
          },
          status: 'on-track',
          isCritical: false,
        });
        return;
      }

      const baselineTask = baselineData.task;
      const baselinePhase = baselineData.phase;

      const baselineDuration =
        differenceInDays(parseISO(baselineTask.endDate), parseISO(baselineTask.startDate)) + 1;
      const actualDuration =
        differenceInDays(parseISO(currentTask.endDate), parseISO(currentTask.startDate)) + 1;

      const startDateVariance = differenceInDays(
        parseISO(currentTask.startDate),
        parseISO(baselineTask.startDate)
      );
      const endDateVariance = differenceInDays(
        parseISO(currentTask.endDate),
        parseISO(baselineTask.endDate)
      );
      const durationVariance = actualDuration - baselineDuration;
      const progressVariance = currentTask.progress - (baselineTask.progress || 0);

      // Determine status
      let status: TaskVariance['status'];
      const today = new Date();
      const taskEnd = parseISO(currentTask.endDate);
      const expectedProgress = calculateExpectedProgress(
        parseISO(currentTask.startDate),
        taskEnd,
        today
      );

      if (currentTask.progress >= expectedProgress + 10) {
        status = 'ahead';
      } else if (currentTask.progress < expectedProgress - 10) {
        status = 'at-risk';
      } else if (endDateVariance > 2) {
        status = 'behind';
      } else {
        status = 'on-track';
      }

      taskVariances.push({
        taskId: currentTask.id,
        taskName: currentTask.name,
        phaseId: currentPhase.id,
        phaseName: currentPhase.name,
        baseline: {
          startDate: baselineTask.startDate,
          endDate: baselineTask.endDate,
          duration: baselineDuration,
          progress: baselineTask.progress || 0,
        },
        actual: {
          startDate: currentTask.startDate,
          endDate: currentTask.endDate,
          duration: actualDuration,
          progress: currentTask.progress,
        },
        variance: {
          startDateDays: startDateVariance,
          endDateDays: endDateVariance,
          durationDays: durationVariance,
          progressPercentage: progressVariance,
        },
        status,
        isCritical: (currentTask.dependencies?.length || 0) > 0,
      });
    });
  });

  // Calculate overall metrics
  const baselineCompletion = calculateProjectCompletion(baselineProject);
  const actualCompletion = calculateProjectCompletion(currentProject);

  const baselineDuration = differenceInDays(
    parseISO(
      baselineProject.phases[baselineProject.phases.length - 1]?.endDate ||
        baselineProject.startDate
    ),
    parseISO(baselineProject.startDate)
  );

  const actualDuration = differenceInDays(
    parseISO(currentProject.phases[currentProject.phases.length - 1]?.endDate || currentProject.startDate),
    parseISO(currentProject.startDate)
  );

  const scheduleVariance = baselineDuration - actualDuration; // Positive = ahead
  const spi = baselineDuration > 0 ? actualDuration / baselineDuration : 1;

  // Identify issues
  const criticalIssues: VarianceIssue[] = [];
  const warnings: VarianceIssue[] = [];

  taskVariances.forEach((tv) => {
    if (tv.status === 'at-risk' && tv.isCritical) {
      criticalIssues.push({
        type: 'critical',
        category: 'progress',
        taskId: tv.taskId,
        phaseId: tv.phaseId,
        title: `Critical task behind schedule: ${tv.taskName}`,
        description: `Task is ${Math.abs(tv.variance.progressPercentage).toFixed(0)}% behind expected progress`,
        impact: 'high',
        recommendation: 'Allocate additional resources or re-evaluate dependencies',
      });
    } else if (tv.status === 'at-risk') {
      warnings.push({
        type: 'warning',
        category: 'progress',
        taskId: tv.taskId,
        title: `Task at risk: ${tv.taskName}`,
        description: `Progress is lagging behind schedule`,
        impact: 'medium',
      });
    }

    if (tv.variance.endDateDays > 7) {
      warnings.push({
        type: 'warning',
        category: 'schedule',
        taskId: tv.taskId,
        title: `Schedule slip: ${tv.taskName}`,
        description: `End date is ${tv.variance.endDateDays} days later than baseline`,
        impact: 'medium',
        recommendation: 'Review task dependencies and resource allocation',
      });
    }
  });

  const tasksAhead = taskVariances.filter((t) => t.status === 'ahead').length;
  const tasksBehind = taskVariances.filter((t) => t.status === 'behind' || t.status === 'at-risk').length;
  const tasksOnTrack = taskVariances.filter((t) => t.status === 'on-track').length;

  return {
    projectId: currentProject.id,
    baselineId: baseline.id,
    comparisonDate,
    overall: {
      scheduleVarianceDays: scheduleVariance,
      schedulePerformanceIndex: spi,
      completionPercentage: {
        baseline: baselineCompletion,
        actual: actualCompletion,
        variance: actualCompletion - baselineCompletion,
      },
      duration: {
        baseline: baselineDuration,
        actual: actualDuration,
        variance: actualDuration - baselineDuration,
      },
    },
    phases: phaseVariances,
    tasks: taskVariances,
    summary: {
      tasksAhead,
      tasksBehind,
      tasksOnTrack,
      criticalIssues,
      warnings,
    },
  };
}

/**
 * Calculate expected progress based on timeline
 */
function calculateExpectedProgress(startDate: Date, endDate: Date, currentDate: Date): number {
  const totalDuration = differenceInDays(endDate, startDate);
  const elapsed = differenceInDays(currentDate, startDate);

  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;

  return (elapsed / totalDuration) * 100;
}

/**
 * Calculate overall project completion percentage
 */
function calculateProjectCompletion(project: GanttProject): number {
  let totalProgress = 0;
  let taskCount = 0;

  project.phases.forEach((phase) => {
    phase.tasks.forEach((task) => {
      totalProgress += task.progress;
      taskCount++;
    });
  });

  return taskCount > 0 ? totalProgress / taskCount : 0;
}

/**
 * Get variance trend over time
 */
export function getVarianceTrend(
  comparisons: BaselineComparison[]
): {
  dates: string[];
  scheduleVariance: number[];
  completionVariance: number[];
  spi: number[];
} {
  const sorted = comparisons.sort(
    (a, b) => new Date(a.comparisonDate).getTime() - new Date(b.comparisonDate).getTime()
  );

  return {
    dates: sorted.map((c) => format(parseISO(c.comparisonDate), 'MMM dd')),
    scheduleVariance: sorted.map((c) => c.overall.scheduleVarianceDays),
    completionVariance: sorted.map((c) => c.overall.completionPercentage.variance),
    spi: sorted.map((c) => c.overall.schedulePerformanceIndex),
  };
}

/**
 * Forecast project completion date based on current variance
 */
export function forecastCompletion(
  project: GanttProject,
  comparison: BaselineComparison
): {
  forecastEndDate: string;
  varianceFromBaseline: number;
  confidence: 'high' | 'medium' | 'low';
  assumptions: string[];
} {
  const spi = comparison.overall.schedulePerformanceIndex;
  const remainingDuration = differenceInDays(
    parseISO(project.phases[project.phases.length - 1]?.endDate || project.startDate),
    new Date()
  );

  // Adjust remaining duration by SPI
  const forecastRemainingDays = Math.ceil(remainingDuration / spi);
  const forecastEndDate = format(addDays(new Date(), forecastRemainingDays), 'yyyy-MM-dd');

  const baselineEnd = comparison.tasks[comparison.tasks.length - 1]?.baseline.endDate || '';
  const varianceFromBaseline = baselineEnd
    ? differenceInDays(parseISO(forecastEndDate), parseISO(baselineEnd))
    : 0;

  // Determine confidence based on data quality
  let confidence: 'high' | 'medium' | 'low';
  const avgProgress =
    comparison.tasks.reduce((sum, t) => sum + t.actual.progress, 0) / comparison.tasks.length;

  if (avgProgress > 50 && comparison.summary.criticalIssues.length === 0) {
    confidence = 'high';
  } else if (avgProgress > 25 && comparison.summary.criticalIssues.length <= 2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const assumptions = [
    `Based on current SPI of ${spi.toFixed(2)}`,
    `Assumes no major scope changes`,
    `Assumes current resource levels maintained`,
  ];

  if (comparison.summary.criticalIssues.length > 0) {
    assumptions.push(`${comparison.summary.criticalIssues.length} critical issues need resolution`);
  }

  return {
    forecastEndDate,
    varianceFromBaseline,
    confidence,
    assumptions,
  };
}
