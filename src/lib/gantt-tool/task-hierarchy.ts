/**
 * Task Hierarchy Utilities
 *
 * Handles task hierarchy rendering, flattening, and visibility calculations
 */

import type { GanttTask } from "@/types/gantt-tool";

/**
 * Get all visible tasks in hierarchical render order
 * Respects collapsed state - children of collapsed parents are not included
 *
 * @param tasks - Flat array of all tasks in a phase
 * @returns Array of tasks in render order with metadata
 */
export function getVisibleTasksInOrder(
  tasks: GanttTask[]
): Array<GanttTask & { renderIndex: number }> {
  const result: Array<GanttTask & { renderIndex: number }> = [];
  let renderIndex = 0;

  // Build parent-child map for quick lookups
  const childrenMap = new Map<string, GanttTask[]>();
  tasks.forEach((task) => {
    if (task.parentTaskId) {
      const siblings = childrenMap.get(task.parentTaskId) || [];
      siblings.push(task);
      childrenMap.set(task.parentTaskId, siblings);
    }
  });

  // Sort children by order within each parent
  childrenMap.forEach((children) => {
    children.sort((a, b) => a.order - b.order);
  });

  // Recursive function to add task and its visible children
  const addTaskAndChildren = (task: GanttTask) => {
    result.push({ ...task, renderIndex: renderIndex++ });

    // Only show children if task is NOT collapsed
    if (!task.collapsed) {
      const children = childrenMap.get(task.id) || [];
      children.forEach(addTaskAndChildren);
    }
  };

  // Get top-level tasks (no parent) and sort by order
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId).sort((a, b) => a.order - b.order);

  // Add each top-level task and its visible children
  topLevelTasks.forEach(addTaskAndChildren);

  return result;
}

/**
 * Check if a task has any children
 *
 * @param taskId - Task ID to check
 * @param allTasks - All tasks in the phase
 * @returns True if task has children
 */
export function hasChildren(taskId: string, allTasks: GanttTask[]): boolean {
  return allTasks.some((t) => t.parentTaskId === taskId);
}

/**
 * Get all descendants of a task (recursive)
 *
 * @param taskId - Parent task ID
 * @param allTasks - All tasks in the phase
 * @returns Array of all descendant tasks
 */
export function getDescendants(taskId: string, allTasks: GanttTask[]): GanttTask[] {
  const descendants: GanttTask[] = [];

  const addChildren = (parentId: string) => {
    const children = allTasks.filter((t) => t.parentTaskId === parentId);
    children.forEach((child) => {
      descendants.push(child);
      addChildren(child.id); // Recursively add grandchildren
    });
  };

  addChildren(taskId);
  return descendants;
}

/**
 * Calculate whether a task is the last sibling at its level
 * Used for rendering tree lines
 *
 * @param task - Task to check
 * @param allTasks - All tasks in the phase
 * @returns True if task is the last sibling
 */
export function isLastSibling(task: GanttTask, allTasks: GanttTask[]): boolean {
  const siblings = allTasks
    .filter((t) => t.parentTaskId === task.parentTaskId)
    .sort((a, b) => a.order - b.order);

  if (siblings.length === 0) return true;
  return siblings[siblings.length - 1].id === task.id;
}

/**
 * Get ancestor tasks (path from task to root)
 *
 * @param task - Starting task
 * @param allTasks - All tasks in the phase
 * @returns Array of ancestor tasks from direct parent to root
 */
export function getAncestors(task: GanttTask, allTasks: GanttTask[]): GanttTask[] {
  const ancestors: GanttTask[] = [];
  let current = task;

  while (current.parentTaskId) {
    const parent = allTasks.find((t) => t.id === current.parentTaskId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}
