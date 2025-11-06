/**
 * Critical Path Analysis
 *
 * Calculates the critical path through a project using the Critical Path Method (CPM).
 * The critical path is the sequence of tasks that determines the minimum project duration.
 * Any delay in critical path tasks will delay the entire project.
 *
 * Key concepts:
 * - Early Start (ES): Earliest time a task can start
 * - Early Finish (EF): Earliest time a task can finish
 * - Late Start (LS): Latest time a task can start without delaying project
 * - Late Finish (LF): Latest time a task can finish without delaying project
 * - Slack/Float: LF - EF (amount of time a task can be delayed without impacting project)
 * - Critical Path: Tasks with zero slack
 */

import type { GanttProject, GanttTask, GanttPhase } from '@/types/gantt-tool';
import { differenceInDays, addDays, parseISO } from 'date-fns';

export interface CriticalPathTask {
  id: string;
  name: string;
  phaseId: string;
  phaseName: string;
  duration: number; // in days
  earlyStart: number; // days from project start
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  slack: number; // total float
  freeSlack: number; // float without affecting successors
  isCritical: boolean;
  dependencies: string[];
  successors: string[];
  actualStartDate: string;
  actualEndDate: string;
}

export interface CriticalPathAnalysis {
  criticalPath: CriticalPathTask[];
  allTasks: CriticalPathTask[];
  projectDuration: number; // in days
  criticalPathDuration: number;
  totalSlack: number;
  longestChain: string[];
  riskyTasks: CriticalPathTask[]; // tasks with low slack
  milestones: {
    name: string;
    date: string;
    isCritical: boolean;
  }[];
}

/**
 * Calculate critical path for a project
 */
export function calculateCriticalPath(project: GanttProject): CriticalPathAnalysis {
  // Build task map
  const taskMap = new Map<string, CriticalPathTask>();
  const phaseMap = new Map<string, GanttPhase>();

  // Initialize phase map
  project.phases.forEach((phase) => {
    phaseMap.set(phase.id, phase);
  });

  // Initialize all tasks
  project.phases.forEach((phase) => {
    phase.tasks.forEach((task) => {
      const duration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) + 1;

      taskMap.set(task.id, {
        id: task.id,
        name: task.name,
        phaseId: task.phaseId,
        phaseName: phase.name,
        duration,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
        freeSlack: 0,
        isCritical: false,
        dependencies: task.dependencies || [],
        successors: [],
        actualStartDate: task.startDate,
        actualEndDate: task.endDate,
      });
    });
  });

  // Build successor relationships
  taskMap.forEach((task) => {
    task.dependencies.forEach((depId) => {
      const predecessor = taskMap.get(depId);
      if (predecessor) {
        predecessor.successors.push(task.id);
      }
    });
  });

  // Forward pass: Calculate Early Start and Early Finish
  const visited = new Set<string>();
  const calculateEarlyTimes = (taskId: string): number => {
    if (visited.has(taskId)) {
      return taskMap.get(taskId)!.earlyFinish;
    }

    const task = taskMap.get(taskId)!;
    visited.add(taskId);

    // Early start is the max of all predecessor early finishes
    let maxPredecessorFinish = 0;
    task.dependencies.forEach((depId) => {
      const predFinish = calculateEarlyTimes(depId);
      maxPredecessorFinish = Math.max(maxPredecessorFinish, predFinish);
    });

    task.earlyStart = maxPredecessorFinish;
    task.earlyFinish = task.earlyStart + task.duration;

    return task.earlyFinish;
  };

  // Calculate early times for all tasks
  taskMap.forEach((_, taskId) => {
    calculateEarlyTimes(taskId);
  });

  // Find project duration (max early finish)
  const projectDuration = Math.max(...Array.from(taskMap.values()).map((t) => t.earlyFinish));

  // Backward pass: Calculate Late Start and Late Finish
  const calculateLateTimes = (taskId: string, projectEnd: number) => {
    const task = taskMap.get(taskId)!;

    // If already calculated, skip
    if (task.lateFinish > 0) return;

    // If no successors, late finish is project end
    if (task.successors.length === 0) {
      task.lateFinish = projectEnd;
    } else {
      // Late finish is the min of all successor late starts
      let minSuccessorStart = Infinity;
      task.successors.forEach((succId) => {
        calculateLateTimes(succId, projectEnd);
        const successor = taskMap.get(succId)!;
        minSuccessorStart = Math.min(minSuccessorStart, successor.lateStart);
      });
      task.lateFinish = minSuccessorStart;
    }

    task.lateStart = task.lateFinish - task.duration;
    task.slack = task.lateFinish - task.earlyFinish;
    task.isCritical = task.slack === 0;
  };

  // Calculate late times for all tasks
  taskMap.forEach((_, taskId) => {
    calculateLateTimes(taskId, projectDuration);
  });

  // Calculate free slack (slack without affecting successors)
  taskMap.forEach((task) => {
    if (task.successors.length === 0) {
      task.freeSlack = task.slack;
    } else {
      const minSuccessorES = Math.min(
        ...task.successors.map((succId) => taskMap.get(succId)!.earlyStart)
      );
      task.freeSlack = minSuccessorES - task.earlyFinish;
    }
  });

  // Extract critical path
  const criticalTasks = Array.from(taskMap.values()).filter((t) => t.isCritical);

  // Build critical path chain
  const buildCriticalChain = (): string[] => {
    const chain: string[] = [];
    const findStartTask = () => criticalTasks.find((t) => t.dependencies.length === 0);

    let current = findStartTask();
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      chain.push(current.id);
      visited.add(current.id);

      // Find next critical task in chain
      const nextTask = criticalTasks.find(
        (t) => t.dependencies.includes(current!.id) && !visited.has(t.id)
      );

      current = nextTask;
    }

    return chain;
  };

  const longestChain = buildCriticalChain();

  // Identify risky tasks (low slack but not critical)
  const riskyTasks = Array.from(taskMap.values())
    .filter((t) => !t.isCritical && t.slack > 0 && t.slack <= 2) // 2 days or less slack
    .sort((a, b) => a.slack - b.slack);

  // Calculate total slack in project
  const totalSlack = Array.from(taskMap.values()).reduce((sum, t) => sum + t.slack, 0);

  // Analyze milestones
  const milestones = (project.milestones || []).map((milestone) => {
    // A milestone is critical if it falls on or near a critical path task
    const milestoneDate = parseISO(milestone.date);
    const daysSinceStart = differenceInDays(milestoneDate, parseISO(project.startDate));

    const isCritical = criticalTasks.some((task) => {
      return (
        daysSinceStart >= task.earlyStart - 1 && daysSinceStart <= task.earlyFinish + 1
      );
    });

    return {
      name: milestone.name,
      date: milestone.date,
      isCritical,
    };
  });

  return {
    criticalPath: criticalTasks,
    allTasks: Array.from(taskMap.values()),
    projectDuration,
    criticalPathDuration: projectDuration, // Critical path determines duration
    totalSlack,
    longestChain,
    riskyTasks,
    milestones,
  };
}

/**
 * Get impact analysis for delaying a specific task
 */
export function getTaskDelayImpact(
  project: GanttProject,
  taskId: string,
  delayDays: number
): {
  affectedTasks: string[];
  projectDelayDays: number;
  newCriticalPath: string[];
} {
  // For simplicity, if task is on critical path, project is delayed by same amount
  // If task has slack, it may or may not delay project depending on slack amount

  const analysis = calculateCriticalPath(project);
  const task = analysis.allTasks.find((t) => t.id === taskId);

  if (!task) {
    return { affectedTasks: [], projectDelayDays: 0, newCriticalPath: [] };
  }

  // If task is critical, full delay impacts project
  if (task.isCritical) {
    // Find all tasks that come after this one in the critical chain
    const chainIndex = analysis.longestChain.indexOf(taskId);
    const affectedTasks = chainIndex >= 0 ? analysis.longestChain.slice(chainIndex) : [];

    return {
      affectedTasks,
      projectDelayDays: delayDays,
      newCriticalPath: analysis.longestChain,
    };
  }

  // If task has slack, check if delay exceeds slack
  if (delayDays <= task.slack) {
    // Delay absorbed by slack, no project impact
    return {
      affectedTasks: [taskId],
      projectDelayDays: 0,
      newCriticalPath: analysis.longestChain,
    };
  }

  // Delay exceeds slack - calculate overflow
  const overflow = delayDays - task.slack;

  // Find all successor tasks
  const findSuccessors = (id: string): string[] => {
    const t = analysis.allTasks.find((t) => t.id === id);
    if (!t || t.successors.length === 0) return [id];

    const successors: string[] = [id];
    t.successors.forEach((succId) => {
      successors.push(...findSuccessors(succId));
    });

    return successors;
  };

  const affectedTasks = Array.from(new Set(findSuccessors(taskId)));

  return {
    affectedTasks,
    projectDelayDays: overflow,
    newCriticalPath: analysis.longestChain,
  };
}

/**
 * Get suggestions for schedule compression (crashing or fast-tracking)
 */
export function getScheduleCompressionSuggestions(project: GanttProject): {
  crashingOpportunities: {
    taskId: string;
    taskName: string;
    potentialSavingsDays: number;
    effort: 'low' | 'medium' | 'high';
    reason: string;
  }[];
  fastTrackingOpportunities: {
    task1Id: string;
    task2Id: string;
    task1Name: string;
    task2Name: string;
    potentialSavingsDays: number;
    risk: 'low' | 'medium' | 'high';
    reason: string;
  }[];
} {
  const analysis = calculateCriticalPath(project);

  // Crashing: Add more resources to critical path tasks
  const crashingOpportunities = analysis.criticalPath
    .filter((t) => t.duration > 2) // Only tasks with meaningful duration
    .map((task) => ({
      taskId: task.id,
      taskName: task.name,
      potentialSavingsDays: Math.ceil(task.duration * 0.25), // Assume 25% reduction possible
      effort: task.duration > 10 ? ('low' as const) : task.duration > 5 ? ('medium' as const) : ('high' as const),
      reason: task.duration > 10
        ? 'Long duration task - good candidate for resource addition'
        : 'Short task - limited room for compression',
    }))
    .sort((a, b) => b.potentialSavingsDays - a.potentialSavingsDays)
    .slice(0, 5); // Top 5 opportunities

  // Fast-tracking: Run tasks in parallel that are currently sequential
  const fastTrackingOpportunities: {
    task1Id: string;
    task2Id: string;
    task1Name: string;
    task2Name: string;
    potentialSavingsDays: number;
    risk: 'low' | 'medium' | 'high';
    reason: string;
  }[] = [];

  analysis.criticalPath.forEach((task) => {
    task.successors.forEach((succId) => {
      const successor = analysis.allTasks.find((t) => t.id === succId);
      if (successor && successor.isCritical) {
        // Check if these could run in parallel
        const overlapPotential = Math.floor(Math.min(task.duration, successor.duration) * 0.5);

        fastTrackingOpportunities.push({
          task1Id: task.id,
          task2Id: successor.id,
          task1Name: task.name,
          task2Name: successor.name,
          potentialSavingsDays: overlapPotential,
          risk: task.dependencies.length > 2 ? 'high' : task.dependencies.length > 0 ? 'medium' : 'low',
          reason:
            overlapPotential > 3
              ? 'Significant overlap potential with manageable risk'
              : 'Limited overlap potential',
        });
      }
    });
  });

  return {
    crashingOpportunities,
    fastTrackingOpportunities: fastTrackingOpportunities
      .sort((a, b) => b.potentialSavingsDays - a.potentialSavingsDays)
      .slice(0, 5),
  };
}
