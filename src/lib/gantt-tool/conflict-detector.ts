/**
 * Conflict Detection for Gantt Tool Excel Imports
 * Detects conflicts between existing project data and imported data
 */

import type {
  GanttProject,
  GanttPhase,
  GanttTask,
  Resource,
  TaskResourceAssignment,
  PhaseResourceAssignment,
} from '@/types/gantt-tool';

// ============================================================================
// Types
// ============================================================================

export type ConflictType = 'resource' | 'phase' | 'task';
export type ConflictSeverity = 'error' | 'warning';

export interface DateRange {
  start: string; // ISO date
  end: string; // ISO date
}

export interface ResourceConflictDetail {
  resourceName: string;
  existingDesignation?: string;
  importedDesignation?: string;
  dateRange: DateRange;
  existingAllocation: number; // percentage
  importedAllocation: number; // percentage
  totalAllocation: number; // percentage (sum)
  tasks: string[]; // task names where conflict occurs
}

export interface PhaseConflictDetail {
  phaseName: string;
  existingDateRange: DateRange;
  importedDateRange: DateRange;
  taskCount: { existing: number; imported: number };
}

export interface TaskConflictDetail {
  taskName: string;
  phaseName: string;
  existingDateRange: DateRange;
  importedDateRange: DateRange;
}

export interface ImportConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  message: string;
  detail: ResourceConflictDetail | PhaseConflictDetail | TaskConflictDetail;
  suggestedResolution: string;
}

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: ImportConflict[];
  summary: {
    resourceConflicts: number;
    phaseConflicts: number;
    taskConflicts: number;
    totalErrors: number;
    totalWarnings: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if two date ranges overlap
 */
function doDateRangesOverlap(range1: DateRange, range2: DateRange): boolean {
  const start1 = new Date(range1.start);
  const end1 = new Date(range1.end);
  const start2 = new Date(range2.start);
  const end2 = new Date(range2.end);

  return start1 <= end2 && start2 <= end1;
}

/**
 * Calculate the overlap period between two date ranges
 */
function getOverlapDateRange(
  range1: DateRange,
  range2: DateRange
): DateRange | null {
  if (!doDateRangesOverlap(range1, range2)) {
    return null;
  }

  const start1 = new Date(range1.start);
  const end1 = new Date(range1.end);
  const start2 = new Date(range2.start);
  const end2 = new Date(range2.end);

  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;

  return {
    start: overlapStart.toISOString().split('T')[0],
    end: overlapEnd.toISOString().split('T')[0],
  };
}

/**
 * Generate unique ID for conflicts
 */
function generateConflictId(): string {
  return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all resource allocations from a project with date ranges
 */
interface ResourceAllocation {
  resourceId: string;
  resourceName: string;
  taskId: string;
  taskName: string;
  phaseId: string;
  phaseName: string;
  dateRange: DateRange;
  allocationPercentage: number;
}

function getResourceAllocations(project: GanttProject): ResourceAllocation[] {
  const allocations: ResourceAllocation[] = [];

  for (const phase of project.phases) {
    for (const task of phase.tasks) {
      if (task.resourceAssignments) {
        for (const assignment of task.resourceAssignments) {
          const resource = project.resources.find(
            (r) => r.id === assignment.resourceId
          );
          if (resource) {
            allocations.push({
              resourceId: resource.id,
              resourceName: resource.name,
              taskId: task.id,
              taskName: task.name,
              phaseId: phase.id,
              phaseName: phase.name,
              dateRange: {
                start: task.startDate,
                end: task.endDate,
              },
              allocationPercentage: assignment.allocationPercentage,
            });
          }
        }
      }
    }
  }

  return allocations;
}

/**
 * Format date range for display
 */
function formatDateRange(range: DateRange): string {
  const start = new Date(range.start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const end = new Date(range.end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${start} - ${end}`;
}

// ============================================================================
// Conflict Detection Functions
// ============================================================================

/**
 * Detect resource conflicts between existing and imported data
 */
function detectResourceConflicts(
  existingProject: GanttProject,
  importedPhases: GanttPhase[],
  importedResources: Resource[]
): ImportConflict[] {
  const conflicts: ImportConflict[] = [];

  // Get all existing allocations
  const existingAllocations = getResourceAllocations(existingProject);

  // Build map of imported resource allocations
  const importedAllocations: ResourceAllocation[] = [];
  for (const phase of importedPhases) {
    for (const task of phase.tasks) {
      if (task.resourceAssignments) {
        for (const assignment of task.resourceAssignments) {
          const resource = importedResources.find(
            (r) => r.id === assignment.resourceId
          );
          if (resource) {
            importedAllocations.push({
              resourceId: resource.id,
              resourceName: resource.name,
              taskId: task.id,
              taskName: task.name,
              phaseId: phase.id,
              phaseName: phase.name,
              dateRange: {
                start: task.startDate,
                end: task.endDate,
              },
              allocationPercentage: assignment.allocationPercentage,
            });
          }
        }
      }
    }
  }

  // Group allocations by resource name (case-insensitive)
  const allocationsByResourceName = new Map<string, {
    existing: ResourceAllocation[];
    imported: ResourceAllocation[];
  }>();

  for (const allocation of existingAllocations) {
    const key = allocation.resourceName.toLowerCase().trim();
    if (!allocationsByResourceName.has(key)) {
      allocationsByResourceName.set(key, { existing: [], imported: [] });
    }
    allocationsByResourceName.get(key)!.existing.push(allocation);
  }

  for (const allocation of importedAllocations) {
    const key = allocation.resourceName.toLowerCase().trim();
    if (!allocationsByResourceName.has(key)) {
      allocationsByResourceName.set(key, { existing: [], imported: [] });
    }
    allocationsByResourceName.get(key)!.imported.push(allocation);
  }

  // Check for conflicts
  for (const [resourceNameKey, allocations] of allocationsByResourceName) {
    const { existing, imported } = allocations;

    // Skip if no overlap (only in existing or only in imported)
    if (existing.length === 0 || imported.length === 0) {
      continue;
    }

    // Check for date range overlaps
    for (const existingAlloc of existing) {
      for (const importedAlloc of imported) {
        const overlapRange = getOverlapDateRange(
          existingAlloc.dateRange,
          importedAlloc.dateRange
        );

        if (overlapRange) {
          // Found overlap - calculate total allocation
          const totalAllocation =
            existingAlloc.allocationPercentage +
            importedAlloc.allocationPercentage;

          // Get resource details
          const existingResource = existingProject.resources.find(
            (r) => r.id === existingAlloc.resourceId
          );
          const importedResource = importedResources.find(
            (r) => r.id === importedAlloc.resourceId
          );

          const detail: ResourceConflictDetail = {
            resourceName: existingAlloc.resourceName,
            existingDesignation: existingResource?.designation,
            importedDesignation: importedResource?.designation,
            dateRange: overlapRange,
            existingAllocation: existingAlloc.allocationPercentage,
            importedAllocation: importedAlloc.allocationPercentage,
            totalAllocation,
            tasks: [existingAlloc.taskName, importedAlloc.taskName],
          };

          // Determine severity
          const severity: ConflictSeverity =
            totalAllocation > 100 ? 'error' : 'warning';

          conflicts.push({
            id: generateConflictId(),
            type: 'resource',
            severity,
            message: `Resource "${existingAlloc.resourceName}" has ${totalAllocation}% allocation during ${formatDateRange(overlapRange)}`,
            detail,
            suggestedResolution:
              totalAllocation > 100
                ? 'Resource is over-allocated (>100%). Choose to overwrite existing or rename imported resource.'
                : 'Resource has overlapping allocations. Consider reviewing resource assignments.',
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Detect phase name conflicts
 */
function detectPhaseConflicts(
  existingProject: GanttProject,
  importedPhases: GanttPhase[]
): ImportConflict[] {
  const conflicts: ImportConflict[] = [];

  const existingPhaseMap = new Map<string, GanttPhase>();
  for (const phase of existingProject.phases) {
    existingPhaseMap.set(phase.name.toLowerCase().trim(), phase);
  }

  for (const importedPhase of importedPhases) {
    const key = importedPhase.name.toLowerCase().trim();
    const existingPhase = existingPhaseMap.get(key);

    if (existingPhase) {
      const detail: PhaseConflictDetail = {
        phaseName: importedPhase.name,
        existingDateRange: {
          start: existingPhase.startDate,
          end: existingPhase.endDate,
        },
        importedDateRange: {
          start: importedPhase.startDate,
          end: importedPhase.endDate,
        },
        taskCount: {
          existing: existingPhase.tasks.length,
          imported: importedPhase.tasks.length,
        },
      };

      conflicts.push({
        id: generateConflictId(),
        type: 'phase',
        severity: 'error',
        message: `Phase "${importedPhase.name}" already exists in the project`,
        detail,
        suggestedResolution:
          'Choose to overwrite existing phase or rename imported phase.',
      });
    }
  }

  return conflicts;
}

/**
 * Detect task name conflicts within the same phase
 */
function detectTaskConflicts(
  existingProject: GanttProject,
  importedPhases: GanttPhase[]
): ImportConflict[] {
  const conflicts: ImportConflict[] = [];

  // Build map of existing tasks by phase name
  const existingTasksByPhase = new Map<string, Map<string, GanttTask>>();
  for (const phase of existingProject.phases) {
    const phaseKey = phase.name.toLowerCase().trim();
    const taskMap = new Map<string, GanttTask>();
    for (const task of phase.tasks) {
      taskMap.set(task.name.toLowerCase().trim(), task);
    }
    existingTasksByPhase.set(phaseKey, taskMap);
  }

  // Check imported tasks
  for (const importedPhase of importedPhases) {
    const phaseKey = importedPhase.name.toLowerCase().trim();
    const existingTasks = existingTasksByPhase.get(phaseKey);

    if (existingTasks) {
      for (const importedTask of importedPhase.tasks) {
        const taskKey = importedTask.name.toLowerCase().trim();
        const existingTask = existingTasks.get(taskKey);

        if (existingTask) {
          const detail: TaskConflictDetail = {
            taskName: importedTask.name,
            phaseName: importedPhase.name,
            existingDateRange: {
              start: existingTask.startDate,
              end: existingTask.endDate,
            },
            importedDateRange: {
              start: importedTask.startDate,
              end: importedTask.endDate,
            },
          };

          conflicts.push({
            id: generateConflictId(),
            type: 'task',
            severity: 'warning',
            message: `Task "${importedTask.name}" already exists in phase "${importedPhase.name}"`,
            detail,
            suggestedResolution:
              'Task will be renamed automatically or overwritten if you choose refresh.',
          });
        }
      }
    }
  }

  return conflicts;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Detect all conflicts between existing project and imported data
 */
export function detectImportConflicts(
  existingProject: GanttProject,
  importedPhases: GanttPhase[],
  importedResources: Resource[]
): ConflictDetectionResult {
  const conflicts: ImportConflict[] = [
    ...detectResourceConflicts(existingProject, importedPhases, importedResources),
    ...detectPhaseConflicts(existingProject, importedPhases),
    ...detectTaskConflicts(existingProject, importedPhases),
  ];

  const summary = {
    resourceConflicts: conflicts.filter((c) => c.type === 'resource').length,
    phaseConflicts: conflicts.filter((c) => c.type === 'phase').length,
    taskConflicts: conflicts.filter((c) => c.type === 'task').length,
    totalErrors: conflicts.filter((c) => c.severity === 'error').length,
    totalWarnings: conflicts.filter((c) => c.severity === 'warning').length,
  };

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    summary,
  };
}

/**
 * Generate suggested names for conflicting items
 * Uses (2), (3), (4) suffix pattern
 */
export function generateSuggestedName(
  baseName: string,
  existingNames: string[]
): string {
  const baseNameLower = baseName.toLowerCase().trim();
  const existingNamesLower = existingNames.map((n) => n.toLowerCase().trim());

  // If no conflict, return as-is
  if (!existingNamesLower.includes(baseNameLower)) {
    return baseName;
  }

  // Find the next available number
  let counter = 2;
  let suggestedName = `${baseName} (${counter})`;

  while (existingNamesLower.includes(suggestedName.toLowerCase().trim())) {
    counter++;
    suggestedName = `${baseName} (${counter})`;
  }

  return suggestedName;
}

/**
 * Generate suggested names for all conflicting phases
 */
export function generatePhaseSuggestions(
  importedPhases: GanttPhase[],
  existingPhases: GanttPhase[]
): Map<string, string> {
  const suggestions = new Map<string, string>();
  const existingNames = existingPhases.map((p) => p.name);

  for (const phase of importedPhases) {
    const suggested = generateSuggestedName(phase.name, existingNames);
    if (suggested !== phase.name) {
      suggestions.set(phase.id, suggested);
    }
  }

  return suggestions;
}

/**
 * Generate suggested names for all conflicting resources
 */
export function generateResourceSuggestions(
  importedResources: Resource[],
  existingResources: Resource[]
): Map<string, string> {
  const suggestions = new Map<string, string>();
  const existingNames = existingResources.map((r) => r.name);

  for (const resource of importedResources) {
    const suggested = generateSuggestedName(resource.name, existingNames);
    if (suggested !== resource.name) {
      suggestions.set(resource.id, suggested);
    }
  }

  return suggestions;
}
