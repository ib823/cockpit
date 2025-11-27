/**
 * Resource Diagnostics Utility
 *
 * Helps diagnose org chart display issues by analyzing resource relationships
 */

import type { GanttProject, Resource } from "@/types/gantt-tool";

export interface ResourceDiagnostics {
  totalResources: number;
  resourcesWithManager: number;
  resourcesWithoutManager: number;
  orphanedResources: number;
  validHierarchyResources: number;
  hierarchyLevels: number;
  issues: string[];
  resourceBreakdown: {
    id: string;
    name: string;
    hasManager: boolean;
    managerExists: boolean;
    managerName: string | null;
    level: number;
  }[];
}

export function diagnoseResourceHierarchy(project: GanttProject | null | undefined): ResourceDiagnostics {
  if (!project) {
    return {
      totalResources: 0,
      resourcesWithManager: 0,
      resourcesWithoutManager: 0,
      orphanedResources: 0,
      validHierarchyResources: 0,
      hierarchyLevels: 0,
      issues: ["No project loaded"],
      resourceBreakdown: [],
    };
  }

  const resources = project.resources || [];
  const resourceMap = new Map(resources.map(r => [r.id, r]));
  const issues: string[] = [];
  const resourceBreakdown: ResourceDiagnostics["resourceBreakdown"] = [];

  let resourcesWithManager = 0;
  let resourcesWithoutManager = 0;
  let orphanedResources = 0;
  let validHierarchyResources = 0;

  // Calculate hierarchy level for each resource
  const getLevelRecursive = (resource: Resource, visited = new Set<string>()): number => {
    if (visited.has(resource.id)) {
      // Circular reference detected
      return -1;
    }
    visited.add(resource.id);

    if (!resource.managerResourceId) {
      return 0; // Root level
    }

    const manager = resourceMap.get(resource.managerResourceId);
    if (!manager) {
      return -1; // Orphaned - manager doesn't exist
    }

    const managerLevel = getLevelRecursive(manager, visited);
    return managerLevel === -1 ? -1 : managerLevel + 1;
  };

  // Analyze each resource
  resources.forEach(resource => {
    const hasManager = !!resource.managerResourceId;
    const manager = resource.managerResourceId ? resourceMap.get(resource.managerResourceId) : null;
    const managerExists = hasManager ? !!manager : true; // If no manager expected, it's valid
    const level = getLevelRecursive(resource);

    if (hasManager) {
      resourcesWithManager++;
    } else {
      resourcesWithoutManager++;
    }

    if (hasManager && !managerExists) {
      orphanedResources++;
      issues.push(`Resource "${resource.name}" (${resource.id}) has managerResourceId "${resource.managerResourceId}" which doesn't exist`);
    }

    if (level === -1) {
      if (hasManager && !managerExists) {
        issues.push(`Resource "${resource.name}" is orphaned - manager ID "${resource.managerResourceId}" not found`);
      } else {
        issues.push(`Resource "${resource.name}" has circular reporting structure`);
      }
    } else {
      validHierarchyResources++;
    }

    resourceBreakdown.push({
      id: resource.id,
      name: resource.name,
      hasManager,
      managerExists,
      managerName: manager?.name || null,
      level,
    });
  });

  // Calculate max hierarchy depth
  const hierarchyLevels = Math.max(...resourceBreakdown.map(r => r.level >= 0 ? r.level : 0)) + 1;

  // Additional checks
  if (orphanedResources > 0) {
    issues.push(`${orphanedResources} resource(s) reference non-existent managers`);
  }

  if (resourcesWithoutManager === 0 && resources.length > 0) {
    issues.push("No root resources found (all resources have managers). At least one resource should have no manager to serve as the root.");
  }

  if (resourcesWithoutManager > 1 && resources.length > 1) {
    issues.push(`${resourcesWithoutManager} root resources found. Org charts typically have 1 root (CEO/top executive). Multiple roots may cause display issues.`);
  }

  return {
    totalResources: resources.length,
    resourcesWithManager,
    resourcesWithoutManager,
    orphanedResources,
    validHierarchyResources,
    hierarchyLevels,
    issues,
    resourceBreakdown,
  };
}

export function getOrgChartExpectedCardCount(project: GanttProject | null | undefined): {
  expected: number;
  breakdown: string;
} {
  const diagnostics = diagnoseResourceHierarchy(project);

  const breakdown = `
Total Resources: ${diagnostics.totalResources}
- With Manager (should appear as children): ${diagnostics.resourcesWithManager}
- Without Manager (should appear as roots): ${diagnostics.resourcesWithoutManager}
- Orphaned (manager doesn't exist): ${diagnostics.orphanedResources}
- Valid in hierarchy: ${diagnostics.validHierarchyResources}

Expected cards in Org Chart: ${diagnostics.validHierarchyResources}
(Only resources with valid hierarchy show in org chart)

Issues:
${diagnostics.issues.length > 0 ? diagnostics.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n') : 'None'}

Detailed Breakdown:
${diagnostics.resourceBreakdown
  .sort((a, b) => a.level - b.level)
  .map(r => `- ${r.name} | Level ${r.level >= 0 ? r.level : 'INVALID'} | ${r.hasManager ? `Reports to: ${r.managerName || 'UNKNOWN'}` : 'Root (no manager)'}`)
  .join('\n')}
  `.trim();

  return {
    expected: diagnostics.validHierarchyResources,
    breakdown,
  };
}

/**
 * Fix orphaned resources by clearing their invalid managerResourceId
 *
 * Returns array of resources that were fixed
 */
export function getOrphanedResourceIds(project: GanttProject | null | undefined): string[] {
  if (!project) return [];

  const resources = project.resources || [];
  const resourceMap = new Map(resources.map(r => [r.id, r]));
  const orphanedIds: string[] = [];

  resources.forEach(resource => {
    if (resource.managerResourceId) {
      const manager = resourceMap.get(resource.managerResourceId);
      if (!manager) {
        orphanedIds.push(resource.id);
      }
    }
  });

  return orphanedIds;
}
