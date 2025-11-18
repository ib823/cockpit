/**
 * Resource Analytics Selectors
 *
 * Computed selectors that transform gantt timeline data into resource analytics.
 * Calculates utilization metrics, timeline allocations, and category breakdowns.
 */

import { useMemo } from "react";
import { useGanttToolStoreV2 as useGanttToolStore } from "./gantt-tool-store-v2";
import { differenceInDays, eachWeekOfInterval, startOfWeek, endOfWeek, format } from "date-fns";
import type { Resource, ResourceCategory, ResourceDesignation } from "@/types/gantt-tool";

export interface ResourceAssignmentDetail {
  taskId: string;
  taskName: string;
  phaseName: string;
  phaseColor: string;
  effortDays: number;
  allocationPercentage: number;
  assignmentNotes: string;
  startDate: Date;
  endDate: Date;
}

export interface ResourceMetrics {
  resourceId: string;
  resourceName: string;
  category: ResourceCategory;
  designation: ResourceDesignation;
  description: string;
  totalEffortDays: number;
  taskCount: number;
  assignments: ResourceAssignmentDetail[];
  utilizationScore: number; // Average allocation across active periods
  peakAllocation: number; // Maximum allocation at any point in time
  activeFrom: Date | null;
  activeUntil: Date | null;
}

export interface TimelineAllocation {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  allocation: number; // Total allocation percentage for this week
  contributingTasks: Array<{
    taskName: string;
    phaseName: string;
    allocation: number;
  }>;
}

export interface ResourceWithTimeline extends ResourceMetrics {
  timeline: TimelineAllocation[];
}

export interface CategoryMetrics {
  category: ResourceCategory;
  totalEffortDays: number;
  resourceCount: number;
  averageUtilization: number;
  taskCount: number;
}

export interface DesignationMetrics {
  designation: ResourceDesignation;
  totalEffortDays: number;
  resourceCount: number;
  averageUtilization: number;
}

export interface ResourceAnalyticsSummary {
  totalEffortDays: number;
  totalResources: number;
  activeResources: number; // Resources with at least one assignment
  averageUtilization: number;
  totalTasks: number;
  overallocatedResources: number; // Resources with peak > 100%
  categories: CategoryMetrics[];
  designations: DesignationMetrics[];
}

/**
 * Main hook: Calculate resource metrics from gantt data
 */
export function useResourceMetrics(): ResourceMetrics[] {
  const currentProject = useGanttToolStore((state) => state.currentProject);

  return useMemo(() => {
    if (!currentProject) return [];

    const metricsMap = new Map<string, ResourceMetrics>();

    // First pass: Collect all assignments from BOTH tasks AND phases
    currentProject.phases.forEach((phase) => {
      // Collect phase-level resource assignments
      if (phase.phaseResourceAssignments && phase.phaseResourceAssignments.length > 0) {
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);
        const phaseDays = differenceInDays(phaseEnd, phaseStart) + 1;

        phase.phaseResourceAssignments.forEach((assignment) => {
          const resource = currentProject.resources.find((r) => r.id === assignment.resourceId);
          if (!resource) return; // Resource was deleted

          const effortDays = phaseDays * (assignment.allocationPercentage / 100);

          // Initialize metrics for this resource if not exists
          if (!metricsMap.has(resource.id)) {
            metricsMap.set(resource.id, {
              resourceId: resource.id,
              resourceName: resource.name,
              category: resource.category,
              designation: resource.designation,
              description: resource.description,
              totalEffortDays: 0,
              taskCount: 0,
              assignments: [],
              utilizationScore: 0,
              peakAllocation: 0,
              activeFrom: null,
              activeUntil: null,
            });
          }

          const metrics = metricsMap.get(resource.id)!;
          metrics.totalEffortDays += effortDays;
          metrics.assignments.push({
            taskId: `phase-${phase.id}`,
            taskName: `Phase: ${phase.name}`,
            phaseName: phase.name,
            phaseColor: phase.color,
            effortDays,
            allocationPercentage: assignment.allocationPercentage,
            assignmentNotes: assignment.assignmentNotes,
            startDate: phaseStart,
            endDate: phaseEnd,
          });

          // Update active date range
          if (!metrics.activeFrom || phaseStart < metrics.activeFrom) {
            metrics.activeFrom = phaseStart;
          }
          if (!metrics.activeUntil || phaseEnd > metrics.activeUntil) {
            metrics.activeUntil = phaseEnd;
          }
        });
      }

      // Collect task-level resource assignments
      phase.tasks.forEach((task) => {
        if (!task.resourceAssignments || task.resourceAssignments.length === 0) return;

        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const taskDays = differenceInDays(taskEnd, taskStart) + 1;

        task.resourceAssignments.forEach((assignment) => {
          // Look up resource details
          const resource = currentProject.resources.find((r) => r.id === assignment.resourceId);
          if (!resource) return; // Resource was deleted

          const effortDays = taskDays * (assignment.allocationPercentage / 100);

          // Initialize metrics for this resource if not exists
          if (!metricsMap.has(resource.id)) {
            metricsMap.set(resource.id, {
              resourceId: resource.id,
              resourceName: resource.name,
              category: resource.category,
              designation: resource.designation,
              description: resource.description,
              totalEffortDays: 0,
              taskCount: 0,
              assignments: [],
              utilizationScore: 0,
              peakAllocation: 0,
              activeFrom: null,
              activeUntil: null,
            });
          }

          const metrics = metricsMap.get(resource.id)!;
          metrics.totalEffortDays += effortDays;
          metrics.taskCount += 1;
          metrics.assignments.push({
            taskId: task.id,
            taskName: task.name,
            phaseName: phase.name,
            phaseColor: phase.color,
            effortDays,
            allocationPercentage: assignment.allocationPercentage,
            assignmentNotes: assignment.assignmentNotes,
            startDate: taskStart,
            endDate: taskEnd,
          });

          // Update active date range
          if (!metrics.activeFrom || taskStart < metrics.activeFrom) {
            metrics.activeFrom = taskStart;
          }
          if (!metrics.activeUntil || taskEnd > metrics.activeUntil) {
            metrics.activeUntil = taskEnd;
          }
        });
      });
    });

    // Second pass: Calculate utilization and peak allocation
    metricsMap.forEach((metrics) => {
      if (!metrics.activeFrom || !metrics.activeUntil) return;

      const activeDays = differenceInDays(metrics.activeUntil, metrics.activeFrom) + 1;
      metrics.utilizationScore = (metrics.totalEffortDays / activeDays) * 100;

      // Calculate peak allocation (check each day for max simultaneous allocation)
      let currentDate = new Date(metrics.activeFrom);
      let maxAllocation = 0;

      while (currentDate <= metrics.activeUntil) {
        let dailyAllocation = 0;
        metrics.assignments.forEach((assignment) => {
          if (currentDate >= assignment.startDate && currentDate <= assignment.endDate) {
            dailyAllocation += assignment.allocationPercentage;
          }
        });
        if (dailyAllocation > maxAllocation) {
          maxAllocation = dailyAllocation;
        }
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
      }

      metrics.peakAllocation = maxAllocation;
    });

    // Sort by utilization score (highest first)
    return Array.from(metricsMap.values()).sort((a, b) => b.utilizationScore - a.utilizationScore);
  }, [currentProject]);
}

/**
 * Get resource metrics with timeline breakdown
 */
export function useResourceMetricsWithTimeline(): ResourceWithTimeline[] {
  const metrics = useResourceMetrics();
  const currentProject = useGanttToolStore((state) => state.currentProject);

  return useMemo(() => {
    if (!currentProject || metrics.length === 0) return [];

    // Determine overall project timeline
    const allDates = metrics
      .flatMap((m) => [m.activeFrom, m.activeUntil])
      .filter((d): d is Date => d !== null);

    if (allDates.length === 0) return [];

    const projectStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const projectEnd = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Generate week intervals
    const weeks = eachWeekOfInterval(
      { start: projectStart, end: projectEnd },
      { weekStartsOn: 1 } // Monday
    );

    return metrics.map((resource) => {
      const timeline: TimelineAllocation[] = weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        let totalAllocation = 0;
        const contributingTasks: TimelineAllocation["contributingTasks"] = [];

        resource.assignments.forEach((assignment) => {
          // Check if assignment overlaps with this week
          if (assignment.endDate < weekStart || assignment.startDate > weekEnd) {
            return; // No overlap
          }

          // Calculate overlap
          const overlapStart = assignment.startDate > weekStart ? assignment.startDate : weekStart;
          const overlapEnd = assignment.endDate < weekEnd ? assignment.endDate : weekEnd;
          const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
          const weekDays = differenceInDays(weekEnd, weekStart) + 1;

          // Weighted allocation for this week
          const weekAllocation = assignment.allocationPercentage * (overlapDays / weekDays);
          totalAllocation += weekAllocation;

          contributingTasks.push({
            taskName: assignment.taskName,
            phaseName: assignment.phaseName,
            allocation: weekAllocation,
          });
        });

        return {
          weekStart,
          weekEnd,
          weekLabel: format(weekStart, "MMM d"),
          allocation: Math.round(totalAllocation),
          contributingTasks,
        };
      });

      return {
        ...resource,
        timeline,
      };
    });
  }, [metrics, currentProject]);
}

/**
 * Get category-level aggregations
 */
export function useCategoryMetrics(): CategoryMetrics[] {
  const metrics = useResourceMetrics();

  return useMemo(() => {
    const categoryMap = new Map<ResourceCategory, CategoryMetrics>();

    metrics.forEach((resource) => {
      if (!categoryMap.has(resource.category)) {
        categoryMap.set(resource.category, {
          category: resource.category,
          totalEffortDays: 0,
          resourceCount: 0,
          averageUtilization: 0,
          taskCount: 0,
        });
      }

      const cat = categoryMap.get(resource.category)!;
      cat.totalEffortDays += resource.totalEffortDays;
      cat.resourceCount += 1;
      cat.taskCount += resource.taskCount;
      cat.averageUtilization += resource.utilizationScore;
    });

    // Calculate averages
    categoryMap.forEach((cat) => {
      if (cat.resourceCount > 0) {
        cat.averageUtilization = cat.averageUtilization / cat.resourceCount;
      }
    });

    // Sort by total effort (largest first)
    return Array.from(categoryMap.values()).sort((a, b) => b.totalEffortDays - a.totalEffortDays);
  }, [metrics]);
}

/**
 * Get designation-level aggregations
 */
export function useDesignationMetrics(): DesignationMetrics[] {
  const metrics = useResourceMetrics();

  return useMemo(() => {
    const designationMap = new Map<ResourceDesignation, DesignationMetrics>();

    metrics.forEach((resource) => {
      if (!designationMap.has(resource.designation)) {
        designationMap.set(resource.designation, {
          designation: resource.designation,
          totalEffortDays: 0,
          resourceCount: 0,
          averageUtilization: 0,
        });
      }

      const des = designationMap.get(resource.designation)!;
      des.totalEffortDays += resource.totalEffortDays;
      des.resourceCount += 1;
      des.averageUtilization += resource.utilizationScore;
    });

    // Calculate averages
    designationMap.forEach((des) => {
      if (des.resourceCount > 0) {
        des.averageUtilization = des.averageUtilization / des.resourceCount;
      }
    });

    // Sort by total effort (largest first)
    return Array.from(designationMap.values()).sort(
      (a, b) => b.totalEffortDays - a.totalEffortDays
    );
  }, [metrics]);
}

/**
 * Get overall summary statistics
 */
export function useResourceAnalyticsSummary(): ResourceAnalyticsSummary {
  const metrics = useResourceMetrics();
  const categories = useCategoryMetrics();
  const designations = useDesignationMetrics();
  const currentProject = useGanttToolStore((state) => state.currentProject);

  return useMemo(() => {
    const activeResources = metrics.length;
    const totalResources = currentProject?.resources.length || 0;
    const totalEffortDays = metrics.reduce((sum, m) => sum + m.totalEffortDays, 0);
    const totalUtilization = metrics.reduce((sum, m) => sum + m.utilizationScore, 0);
    const averageUtilization = activeResources > 0 ? totalUtilization / activeResources : 0;
    const totalTasks = metrics.reduce((sum, m) => sum + m.taskCount, 0);
    const overallocatedResources = metrics.filter((m) => m.peakAllocation > 100).length;

    return {
      totalEffortDays: Math.round(totalEffortDays * 10) / 10,
      totalResources,
      activeResources,
      averageUtilization: Math.round(averageUtilization * 10) / 10,
      totalTasks,
      overallocatedResources,
      categories,
      designations,
    };
  }, [metrics, categories, designations, currentProject]);
}
