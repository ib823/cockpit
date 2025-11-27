/**
 * Resource Utilities - Single Source of Truth for Resource Counts
 *
 * GLOBAL POLICY: All resource counting and statistics must use these utilities
 * to ensure consistency across the entire application.
 *
 * Use Case:
 * - Resource Management Modal shows "X resources"
 * - Org Chart Builder shows "X resources"
 * - Both numbers must be IDENTICAL
 */

import type { GanttProject, Resource } from "@/types/gantt-tool";

/**
 * Get total resource count from project
 *
 * CANONICAL IMPLEMENTATION - DO NOT DUPLICATE THIS LOGIC ELSEWHERE
 * All components must call this function for resource counts.
 *
 * @param project - The current Gantt project
 * @returns Total number of resources in the project
 */
export function getTotalResourceCount(project: GanttProject | null | undefined): number {
  if (!project) return 0;

  // Canonical source of truth: project.resources array
  const resources = project.resources || [];

  // Simple, explicit count - no filtering, no transformation
  return resources.length;
}

/**
 * Get all resources from project (canonical list)
 *
 * @param project - The current Gantt project
 * @returns Array of all resources
 */
export function getAllResources(project: GanttProject | null | undefined): Resource[] {
  if (!project) return [];

  return project.resources || [];
}

/**
 * Get filtered resource count
 *
 * Use this when you need to count resources with filters applied.
 * IMPORTANT: Only use this for filtered views, NOT for total counts.
 *
 * @param project - The current Gantt project
 * @param filters - Filter criteria
 * @returns Number of resources matching filters
 */
export function getFilteredResourceCount(
  project: GanttProject | null | undefined,
  filters: {
    searchQuery?: string;
    category?: string;
    excludeIds?: string[];
  } = {}
): number {
  const resources = getAllResources(project);

  return resources.filter((resource) => {
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
        resource.name.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      if (resource.category !== filters.category) return false;
    }

    // Exclude IDs filter
    if (filters.excludeIds && filters.excludeIds.includes(resource.id)) {
      return false;
    }

    return true;
  }).length;
}

/**
 * Validate resource count consistency
 *
 * Use this in development/testing to ensure counts match across components.
 *
 * @param project - The current Gantt project
 * @param componentName - Name of the component for logging
 * @param displayedCount - The count being displayed in the UI
 * @throws Error if counts don't match (in development only)
 */
export function validateResourceCount(
  project: GanttProject | null | undefined,
  componentName: string,
  displayedCount: number
): void {
  const canonicalCount = getTotalResourceCount(project);

  if (displayedCount !== canonicalCount) {
    const errorMessage = `[Resource Count Mismatch] ${componentName} shows ${displayedCount} resources, but canonical count is ${canonicalCount}`;

    // Log error in all environments
    console.error(errorMessage, {
      component: componentName,
      displayed: displayedCount,
      canonical: canonicalCount,
      projectId: project?.id,
      resourcesArray: project?.resources || [],
    });

    // In development, throw error to catch issues immediately
    if (process.env.NODE_ENV === "development") {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Get resource count summary for debugging
 *
 * @param project - The current Gantt project
 * @returns Object with count breakdown
 */
export function getResourceCountDebugInfo(project: GanttProject | null | undefined) {
  if (!project) {
    return {
      total: 0,
      byCategory: {},
      hasManagerRelationships: 0,
      noManagerRelationships: 0,
    };
  }

  const resources = getAllResources(project);
  const byCategory: Record<string, number> = {};
  let hasManagerRelationships = 0;
  let noManagerRelationships = 0;

  resources.forEach((resource) => {
    // Count by category
    byCategory[resource.category] = (byCategory[resource.category] || 0) + 1;

    // Count manager relationships
    if (resource.managerResourceId) {
      hasManagerRelationships++;
    } else {
      noManagerRelationships++;
    }
  });

  return {
    total: resources.length,
    byCategory,
    hasManagerRelationships,
    noManagerRelationships,
  };
}
