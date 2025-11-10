/**
 * Delta Calculator - Compute incremental changes for efficient saves
 *
 * Compares current state with last saved state to identify only what changed.
 * This dramatically reduces database operations and API payload size.
 */

import type {
  GanttProject,
  GanttPhase,
  GanttTask,
  GanttMilestone,
  GanttHoliday,
  Resource,
  ProjectDelta,
} from "@/types/gantt-tool";

/**
 * Deep equality check for objects
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Compare two arrays and return created, updated, and deleted items
 */
function compareArrays<T extends { id: string }>(
  current: T[],
  previous: T[]
): { created: T[]; updated: T[]; deleted: string[] } {
  const created: T[] = [];
  const updated: T[] = [];
  const deleted: string[] = [];

  const previousMap = new Map(previous.map((item) => [item.id, item]));
  const currentMap = new Map(current.map((item) => [item.id, item]));

  // Find created and updated
  for (const item of current) {
    const prevItem = previousMap.get(item.id);
    if (!prevItem) {
      created.push(item);
    } else if (!deepEqual(item, prevItem)) {
      updated.push(item);
    }
  }

  // Find deleted
  for (const item of previous) {
    if (!currentMap.has(item.id)) {
      deleted.push(item.id);
    }
  }

  return { created, updated, deleted };
}

/**
 * Calculate delta between current project state and last saved state
 */
export function calculateProjectDelta(
  current: GanttProject,
  lastSaved: GanttProject | null
): ProjectDelta {
  // If no last saved state, treat everything as created (fallback to full save)
  if (!lastSaved) {
    return {
      projectUpdates: {
        name: current.name,
        description: current.description,
        startDate: current.startDate,
        viewSettings: current.viewSettings,
        budget: current.budget,
      },
      phases: {
        created: current.phases,
      },
      milestones: {
        created: current.milestones,
      },
      holidays: {
        created: current.holidays,
      },
      resources: {
        created: current.resources,
      },
    };
  }

  const delta: ProjectDelta = {};

  // Check project-level updates
  const projectUpdates: any = {};
  let hasProjectUpdates = false;

  if (current.name !== lastSaved.name) {
    projectUpdates.name = current.name;
    hasProjectUpdates = true;
  }
  if (current.description !== lastSaved.description) {
    projectUpdates.description = current.description;
    hasProjectUpdates = true;
  }
  if (current.startDate !== lastSaved.startDate) {
    projectUpdates.startDate = current.startDate;
    hasProjectUpdates = true;
  }
  if (!deepEqual(current.viewSettings, lastSaved.viewSettings)) {
    projectUpdates.viewSettings = current.viewSettings;
    hasProjectUpdates = true;
  }
  if (!deepEqual(current.budget, lastSaved.budget)) {
    projectUpdates.budget = current.budget;
    hasProjectUpdates = true;
  }
  if (!deepEqual((current as any).orgChart, (lastSaved as any).orgChart)) {
    projectUpdates.orgChart = (current as any).orgChart;
    hasProjectUpdates = true;
  }

  if (hasProjectUpdates) {
    delta.projectUpdates = projectUpdates;
  }

  // Compare phases
  const phaseChanges = compareArrays(current.phases, lastSaved.phases);
  if (
    phaseChanges.created.length > 0 ||
    phaseChanges.updated.length > 0 ||
    phaseChanges.deleted.length > 0
  ) {
    delta.phases = {};
    if (phaseChanges.created.length > 0) delta.phases.created = phaseChanges.created;
    if (phaseChanges.updated.length > 0) delta.phases.updated = phaseChanges.updated;
    if (phaseChanges.deleted.length > 0) delta.phases.deleted = phaseChanges.deleted;
  }

  // Compare tasks (flatten from all phases)
  const currentTasks = current.phases.flatMap((p) => p.tasks);
  const previousTasks = lastSaved.phases.flatMap((p) => p.tasks);
  const taskChanges = compareArrays(currentTasks, previousTasks);
  if (
    taskChanges.created.length > 0 ||
    taskChanges.updated.length > 0 ||
    taskChanges.deleted.length > 0
  ) {
    delta.tasks = {};
    if (taskChanges.created.length > 0) delta.tasks.created = taskChanges.created;
    if (taskChanges.updated.length > 0) delta.tasks.updated = taskChanges.updated;
    if (taskChanges.deleted.length > 0) delta.tasks.deleted = taskChanges.deleted;
  }

  // Compare resources
  const resourceChanges = compareArrays(current.resources, lastSaved.resources);
  if (
    resourceChanges.created.length > 0 ||
    resourceChanges.updated.length > 0 ||
    resourceChanges.deleted.length > 0
  ) {
    delta.resources = {};
    if (resourceChanges.created.length > 0) delta.resources.created = resourceChanges.created;
    if (resourceChanges.updated.length > 0) delta.resources.updated = resourceChanges.updated;
    if (resourceChanges.deleted.length > 0) delta.resources.deleted = resourceChanges.deleted;
  }

  // Compare milestones
  const milestoneChanges = compareArrays(current.milestones, lastSaved.milestones);
  if (
    milestoneChanges.created.length > 0 ||
    milestoneChanges.updated.length > 0 ||
    milestoneChanges.deleted.length > 0
  ) {
    delta.milestones = {};
    if (milestoneChanges.created.length > 0) delta.milestones.created = milestoneChanges.created;
    if (milestoneChanges.updated.length > 0) delta.milestones.updated = milestoneChanges.updated;
    if (milestoneChanges.deleted.length > 0) delta.milestones.deleted = milestoneChanges.deleted;
  }

  // Compare holidays
  const holidayChanges = compareArrays(current.holidays, lastSaved.holidays);
  if (
    holidayChanges.created.length > 0 ||
    holidayChanges.updated.length > 0 ||
    holidayChanges.deleted.length > 0
  ) {
    delta.holidays = {};
    if (holidayChanges.created.length > 0) delta.holidays.created = holidayChanges.created;
    if (holidayChanges.updated.length > 0) delta.holidays.updated = holidayChanges.updated;
    if (holidayChanges.deleted.length > 0) delta.holidays.deleted = holidayChanges.deleted;
  }

  return delta;
}

/**
 * Check if delta is empty (no changes)
 */
export function isDeltaEmpty(delta: ProjectDelta): boolean {
  return (
    !delta.projectUpdates &&
    !delta.phases &&
    !delta.tasks &&
    !delta.resources &&
    !delta.milestones &&
    !delta.holidays
  );
}

/**
 * Get summary of delta changes for logging
 */
export function getDeltaSummary(delta: ProjectDelta): string {
  const parts: string[] = [];

  if (delta.projectUpdates) {
    parts.push(`project fields: ${Object.keys(delta.projectUpdates).join(", ")}`);
  }

  if (delta.phases) {
    const counts = [];
    if (delta.phases.created?.length) counts.push(`${delta.phases.created.length} created`);
    if (delta.phases.updated?.length) counts.push(`${delta.phases.updated.length} updated`);
    if (delta.phases.deleted?.length) counts.push(`${delta.phases.deleted.length} deleted`);
    if (counts.length > 0) parts.push(`phases: ${counts.join(", ")}`);
  }

  if (delta.tasks) {
    const counts = [];
    if (delta.tasks.created?.length) counts.push(`${delta.tasks.created.length} created`);
    if (delta.tasks.updated?.length) counts.push(`${delta.tasks.updated.length} updated`);
    if (delta.tasks.deleted?.length) counts.push(`${delta.tasks.deleted.length} deleted`);
    if (counts.length > 0) parts.push(`tasks: ${counts.join(", ")}`);
  }

  if (delta.resources) {
    const counts = [];
    if (delta.resources.created?.length) counts.push(`${delta.resources.created.length} created`);
    if (delta.resources.updated?.length) counts.push(`${delta.resources.updated.length} updated`);
    if (delta.resources.deleted?.length) counts.push(`${delta.resources.deleted.length} deleted`);
    if (counts.length > 0) parts.push(`resources: ${counts.join(", ")}`);
  }

  if (delta.milestones) {
    const counts = [];
    if (delta.milestones.created?.length) counts.push(`${delta.milestones.created.length} created`);
    if (delta.milestones.updated?.length) counts.push(`${delta.milestones.updated.length} updated`);
    if (delta.milestones.deleted?.length) counts.push(`${delta.milestones.deleted.length} deleted`);
    if (counts.length > 0) parts.push(`milestones: ${counts.join(", ")}`);
  }

  if (delta.holidays) {
    const counts = [];
    if (delta.holidays.created?.length) counts.push(`${delta.holidays.created.length} created`);
    if (delta.holidays.updated?.length) counts.push(`${delta.holidays.updated.length} updated`);
    if (delta.holidays.deleted?.length) counts.push(`${delta.holidays.deleted.length} deleted`);
    if (counts.length > 0) parts.push(`holidays: ${counts.join(", ")}`);
  }

  return parts.length > 0 ? parts.join("; ") : "no changes";
}

/**
 * Sanitize delta to prevent duplicate resource assignments
 * Removes duplicate task/phase resource assignments that would violate unique constraints
 */
export function sanitizeDelta(delta: ProjectDelta): ProjectDelta {
  const sanitized = { ...delta };

  // Deduplicate phase resource assignments
  if (sanitized.phases?.created) {
    sanitized.phases.created = sanitized.phases.created.map((phase) => {
      if (!phase.phaseResourceAssignments || phase.phaseResourceAssignments.length === 0) {
        return phase;
      }

      // Deduplicate by resourceId
      const seen = new Set<string>();
      const deduplicated = phase.phaseResourceAssignments.filter((assignment) => {
        if (seen.has(assignment.resourceId)) {
          console.warn(
            `[Delta Sanitizer] Removing duplicate PM resource assignment: phaseId=${phase.id}, resourceId=${assignment.resourceId}`
          );
          return false;
        }
        seen.add(assignment.resourceId);
        return true;
      });

      return { ...phase, phaseResourceAssignments: deduplicated };
    });
  }

  if (sanitized.phases?.updated) {
    sanitized.phases.updated = sanitized.phases.updated.map((phase) => {
      if (!phase.phaseResourceAssignments || phase.phaseResourceAssignments.length === 0) {
        return phase;
      }

      // Deduplicate by resourceId
      const seen = new Set<string>();
      const deduplicated = phase.phaseResourceAssignments.filter((assignment) => {
        if (seen.has(assignment.resourceId)) {
          console.warn(
            `[Delta Sanitizer] Removing duplicate PM resource assignment: phaseId=${phase.id}, resourceId=${assignment.resourceId}`
          );
          return false;
        }
        seen.add(assignment.resourceId);
        return true;
      });

      return { ...phase, phaseResourceAssignments: deduplicated };
    });
  }

  // Deduplicate task resource assignments in phases
  if (sanitized.phases?.created) {
    sanitized.phases.created = sanitized.phases.created.map((phase) => ({
      ...phase,
      tasks: phase.tasks.map((task) => {
        if (!task.resourceAssignments || task.resourceAssignments.length === 0) {
          return task;
        }

        // Deduplicate by resourceId
        const seen = new Set<string>();
        const deduplicated = task.resourceAssignments.filter((assignment) => {
          if (seen.has(assignment.resourceId)) {
            console.warn(
              `[Delta Sanitizer] Removing duplicate task resource assignment: taskId=${task.id}, resourceId=${assignment.resourceId}`
            );
            return false;
          }
          seen.add(assignment.resourceId);
          return true;
        });

        return { ...task, resourceAssignments: deduplicated };
      }),
    }));
  }

  if (sanitized.phases?.updated) {
    sanitized.phases.updated = sanitized.phases.updated.map((phase) => ({
      ...phase,
      tasks: phase.tasks.map((task) => {
        if (!task.resourceAssignments || task.resourceAssignments.length === 0) {
          return task;
        }

        // Deduplicate by resourceId
        const seen = new Set<string>();
        const deduplicated = task.resourceAssignments.filter((assignment) => {
          if (seen.has(assignment.resourceId)) {
            console.warn(
              `[Delta Sanitizer] Removing duplicate task resource assignment: taskId=${task.id}, resourceId=${assignment.resourceId}`
            );
            return false;
          }
          seen.add(assignment.resourceId);
          return true;
        });

        return { ...task, resourceAssignments: deduplicated };
      }),
    }));
  }

  return sanitized;
}
