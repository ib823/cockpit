/**
 * Resource Allocator - Maps weekly resource effort to tasks
 *
 * Takes parsed resources with weekly effort and allocates them to tasks
 * based on date overlaps and proportional distribution.
 */

import {
  parse,
  addDays,
  isWithinInterval,
  differenceInDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import type { ParsedResource } from "./resource-parser";
import type { ParsedSchedule } from "./schedule-parser";
import type { TaskResourceAssignment } from "@/types/gantt-tool";

export interface AllocatedResource {
  resourceId: string;
  resourceName: string;
  designation: string;
  category: string;
  taskAllocations: Array<{
    taskId: string;
    taskName: string;
    phaseName: string;
    allocation: number; // Percentage (0-100)
    assignedAt: string;
  }>;
}

export interface AllocationResult {
  success: boolean;
  allocations: AllocatedResource[];
  errors: string[];
  warnings: string[];
}

/**
 * Allocate resources to tasks based on weekly effort data
 */
export function allocateResourcesToTasks(
  resources: ParsedResource[],
  schedule: ParsedSchedule,
  resourceIdMap: Map<string, string> // Maps resource name to resource ID
): AllocationResult {
  const allocations: AllocatedResource[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const resource of resources) {
    const resourceId = resourceIdMap.get(resource.name);
    if (!resourceId) {
      errors.push(`Resource "${resource.name}" not found in resource ID map`);
      continue;
    }

    const taskAllocations: AllocatedResource["taskAllocations"] = [];

    // For each week of effort
    for (const weekEffort of resource.weeklyEffort) {
      const weekStart = new Date(weekEffort.weekStartDate);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Monday-Sunday

      // Find all tasks that overlap with this week
      const overlappingTasks: Array<{
        phaseIndex: number;
        phaseName: string;
        taskIndex: number;
        task: (typeof schedule.phases)[0]["tasks"][0];
        overlapDays: number;
      }> = [];

      schedule.phases.forEach((phase, phaseIndex) => {
        phase.tasks.forEach((task, taskIndex) => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);

          // Check if task overlaps with this week
          const overlapStart = taskStart > weekStart ? taskStart : weekStart;
          const overlapEnd = taskEnd < weekEnd ? taskEnd : weekEnd;

          if (overlapStart <= overlapEnd) {
            const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
            overlappingTasks.push({
              phaseIndex,
              phaseName: phase.name,
              taskIndex,
              task,
              overlapDays,
            });
          }
        });
      });

      if (overlappingTasks.length === 0) {
        warnings.push(
          `Resource "${resource.name}" has ${weekEffort.days} days allocated in week starting ${weekEffort.weekStartDate} but no overlapping tasks found`
        );
        continue;
      }

      // Distribute effort across overlapping tasks proportionally
      const totalOverlapDays = overlappingTasks.reduce((sum, t) => sum + t.overlapDays, 0);

      overlappingTasks.forEach((overlap) => {
        // Calculate allocation percentage for this task
        // Effort for this task = (task overlap days / total overlap days) * weekly effort
        const taskEffort = (overlap.overlapDays / totalOverlapDays) * weekEffort.days;

        // Convert to percentage (assuming 5-day work week)
        const allocationPercentage = Math.min((taskEffort / 5) * 100, 100);

        // Check if this task already has an allocation for this resource
        const existingAlloc = taskAllocations.find(
          (a) => a.taskName === overlap.task.name && a.phaseName === overlap.phaseName
        );

        if (existingAlloc) {
          // Add to existing allocation (cumulative across weeks)
          existingAlloc.allocation = Math.min(existingAlloc.allocation + allocationPercentage, 100);
        } else {
          // Create new allocation
          taskAllocations.push({
            taskId: "", // Will be set during import
            taskName: overlap.task.name,
            phaseName: overlap.phaseName,
            allocation: allocationPercentage,
            assignedAt: new Date().toISOString(),
          });
        }
      });
    }

    if (taskAllocations.length > 0) {
      allocations.push({
        resourceId,
        resourceName: resource.name,
        designation: resource.designation,
        category: resource.category,
        taskAllocations,
      });
    }
  }

  return {
    success: errors.length === 0,
    allocations,
    errors,
    warnings,
  };
}
