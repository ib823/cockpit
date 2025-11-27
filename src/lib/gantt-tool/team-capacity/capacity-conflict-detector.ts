/**
 * DEPRECATED: This file has been superseded by enhanced conflicts API
 *
 * The new implementation provides:
 * - Mandays-based conflict detection (>5.0 mandays per week = conflict)
 * - Support for new week numbering types
 * - Version-aware conflict detection
 * - Enhanced conflict severity classification
 *
 * Migration path:
 * - API endpoint /api/gantt-tool/team-capacity/conflicts has been updated
 * - This file is kept for reference only
 * - DO NOT use this for new development
 *
 * Team Capacity - Cross-Project Conflict Detector (LEGACY)
 *
 * Detects resource overallocation across multiple projects
 *
 * Conflict Types:
 * - Overallocation: Total allocation >100% in a single week
 * - Warning: Total allocation >80% (approaching capacity)
 * - Info: Shared allocation across multiple projects
 *
 * Security: Only shows conflicts for projects user has access to
 * Performance: Uses composite index (resourceId, weekIdentifier) for fast queries
 */

import type { ResourceWeeklyAllocation } from "@/types/gantt-tool";
import { mergeAllocations } from "./weekly-allocation-generator";

// ============================================================================
// Types
// ============================================================================

export type ConflictSeverity = "critical" | "warning" | "info";

export interface ResourceCapacityConflict {
  id: string;
  severity: ConflictSeverity;

  // Resource identification
  resourceId: string;
  resourceName?: string;
  resourceDesignation?: string;

  // Week identification
  weekIdentifier: string; // "2025-W03"
  weekStartDate: string; // "2025-01-15"
  weekEndDate: string; // "2025-01-21"

  // Conflict details
  totalAllocation: number; // Total % across all projects
  totalWorkingDays: number; // Total days allocated
  projectAllocations: ProjectAllocationDetail[];

  // Message
  message: string;
  suggestedResolution: string;
}

export interface ProjectAllocationDetail {
  projectId: string;
  projectName?: string;
  phaseId?: string;
  phaseName?: string;
  allocationPercent: number;
  workingDays: number;
  pattern?: string; // "STEADY" | "CUSTOM"
}

export interface ConflictDetectionInput {
  // Resource to check (if checking single resource)
  resourceId?: string;

  // Week range to check (if checking specific weeks)
  weekIdentifierStart?: string; // "2025-W01"
  weekIdentifierEnd?: string; // "2025-W12"

  // Severity thresholds
  criticalThreshold?: number; // Default: 100 (>100% = critical)
  warningThreshold?: number; // Default: 80 (>80% = warning)
}

export interface ConflictDetectionOutput {
  hasConflicts: boolean;
  conflicts: ResourceCapacityConflict[];
  summary: {
    totalConflicts: number;
    criticalConflicts: number;
    warningConflicts: number;
    infoConflicts: number;
    affectedResources: number;
    affectedWeeks: number;
  };
}

// ============================================================================
// Core Conflict Detection
// ============================================================================

/**
 * Detect cross-project resource conflicts from weekly allocations
 *
 * Performance: Uses Map grouping for O(n) complexity with large datasets
 * Security: Caller must filter allocations by user's accessible projects
 */
export function detectCapacityConflicts(
  allocations: ResourceWeeklyAllocation[],
  input: ConflictDetectionInput = {}
): ConflictDetectionOutput {
  const conflicts: ResourceCapacityConflict[] = [];

  // Set thresholds
  const criticalThreshold = input.criticalThreshold ?? 100;
  const warningThreshold = input.warningThreshold ?? 80;

  // Filter allocations by input criteria
  let filteredAllocations = allocations;

  if (input.resourceId) {
    filteredAllocations = filteredAllocations.filter(
      (a) => a.resourceId === input.resourceId
    );
  }

  if (input.weekIdentifierStart || input.weekIdentifierEnd) {
    filteredAllocations = filteredAllocations.filter((a) => {
      if (input.weekIdentifierStart && a.weekIdentifier < input.weekIdentifierStart) {
        return false;
      }
      if (input.weekIdentifierEnd && a.weekIdentifier > input.weekIdentifierEnd) {
        return false;
      }
      return true;
    });
  }

  // Group allocations by resource and week
  const groupedAllocations = groupAllocationsByResourceAndWeek(filteredAllocations);

  // Check each group for conflicts
  for (const [key, group] of groupedAllocations) {
    const [resourceId, weekIdentifier] = key.split("__");

    // Calculate total allocation
    const totalAllocation = group.reduce(
      (sum, a) => sum + a.allocationPercent,
      0
    );

    const totalWorkingDays = group.reduce(
      (sum, a) => sum + a.workingDays,
      0
    );

    // Determine severity
    let severity: ConflictSeverity;
    let message: string;
    let suggestedResolution: string;

    if (totalAllocation > criticalThreshold) {
      severity = "critical";
      message = `Resource is critically overallocated: ${totalAllocation.toFixed(0)}% in week ${weekIdentifier} (>${criticalThreshold}%)`;
      suggestedResolution = "Reduce allocation or reassign tasks to other resources. Resource capacity exceeded.";
    } else if (totalAllocation > warningThreshold) {
      severity = "warning";
      message = `Resource is approaching full capacity: ${totalAllocation.toFixed(0)}% in week ${weekIdentifier} (>${warningThreshold}%)`;
      suggestedResolution = "Consider reducing allocation or adding buffer for unexpected tasks.";
    } else if (group.length > 1) {
      // Multiple projects but not overallocated
      severity = "info";
      message = `Resource allocated to ${group.length} projects in week ${weekIdentifier}: ${totalAllocation.toFixed(0)}% total`;
      suggestedResolution = "No action required. Resource is shared across projects within capacity.";
    } else {
      // Single project, within capacity - no conflict
      continue;
    }

    // Build project allocation details
    const projectAllocations: ProjectAllocationDetail[] = group.map((alloc) => ({
      projectId: alloc.projectId,
      projectName: undefined, // To be filled by caller with project data
      phaseId: alloc.sourcePhaseId || undefined,
      phaseName: undefined, // To be filled by caller with phase data
      allocationPercent: alloc.allocationPercent,
      workingDays: alloc.workingDays,
      pattern: alloc.sourcePattern || undefined,
    }));

    // Create conflict record
    const conflict: ResourceCapacityConflict = {
      id: generateConflictId(resourceId, weekIdentifier),
      severity,
      resourceId,
      resourceName: undefined, // To be filled by caller with resource data
      resourceDesignation: undefined, // To be filled by caller
      weekIdentifier,
      weekStartDate: group[0].weekStartDate,
      weekEndDate: group[0].weekEndDate,
      totalAllocation,
      totalWorkingDays,
      projectAllocations,
      message,
      suggestedResolution,
    };

    conflicts.push(conflict);
  }

  // Calculate summary
  const affectedResources = new Set(conflicts.map((c) => c.resourceId)).size;
  const affectedWeeks = new Set(conflicts.map((c) => c.weekIdentifier)).size;

  const summary = {
    totalConflicts: conflicts.length,
    criticalConflicts: conflicts.filter((c) => c.severity === "critical").length,
    warningConflicts: conflicts.filter((c) => c.severity === "warning").length,
    infoConflicts: conflicts.filter((c) => c.severity === "info").length,
    affectedResources,
    affectedWeeks,
  };

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    summary,
  };
}

/**
 * Detect conflicts for a specific resource across all projects
 *
 * Use case: When user assigns a resource to a phase, check if it causes conflicts
 */
export function detectResourceConflicts(
  resourceId: string,
  existingAllocations: ResourceWeeklyAllocation[],
  newAllocations: ResourceWeeklyAllocation[]
): ConflictDetectionOutput {
  // Combine existing and new allocations
  const allAllocations = [...existingAllocations, ...newAllocations];

  // Filter to this resource only
  const resourceAllocations = allAllocations.filter(
    (a) => a.resourceId === resourceId
  );

  // Detect conflicts
  return detectCapacityConflicts(resourceAllocations, { resourceId });
}

/**
 * Detect conflicts for a specific week across all resources
 *
 * Use case: Weekly capacity planning view
 */
export function detectWeeklyConflicts(
  weekIdentifier: string,
  allocations: ResourceWeeklyAllocation[]
): ConflictDetectionOutput {
  return detectCapacityConflicts(allocations, {
    weekIdentifierStart: weekIdentifier,
    weekIdentifierEnd: weekIdentifier,
  });
}

/**
 * Get resource utilization summary for a date range
 *
 * Performance: Optimized for dashboard widgets and summary cards
 */
export interface ResourceUtilization {
  resourceId: string;
  resourceName?: string;
  weeklyUtilization: {
    weekIdentifier: string;
    totalAllocation: number; // Percentage
    totalWorkingDays: number;
    projectCount: number;
    isOverallocated: boolean; // >100%
  }[];
  averageUtilization: number; // Average % across all weeks
  peakUtilization: number; // Maximum % in any week
  utilizationTrend: "increasing" | "stable" | "decreasing";
}

export function calculateResourceUtilization(
  resourceId: string,
  allocations: ResourceWeeklyAllocation[]
): ResourceUtilization {
  // Filter to this resource
  const resourceAllocations = allocations.filter((a) => a.resourceId === resourceId);

  // Group by week
  const groupedByWeek = groupAllocationsByResourceAndWeek(resourceAllocations);

  // Calculate weekly utilization
  const weeklyUtilization = Array.from(groupedByWeek.entries())
    .filter(([key]) => key.startsWith(resourceId))
    .map(([key, group]) => {
      const weekIdentifier = key.split("__")[1];
      const totalAllocation = group.reduce((sum, a) => sum + a.allocationPercent, 0);
      const totalWorkingDays = group.reduce((sum, a) => sum + a.workingDays, 0);
      const projectCount = new Set(group.map((a) => a.projectId)).size;

      return {
        weekIdentifier,
        totalAllocation,
        totalWorkingDays,
        projectCount,
        isOverallocated: totalAllocation > 100,
      };
    })
    .sort((a, b) => a.weekIdentifier.localeCompare(b.weekIdentifier));

  // Calculate averages
  const averageUtilization =
    weeklyUtilization.length > 0
      ? weeklyUtilization.reduce((sum, w) => sum + w.totalAllocation, 0) /
        weeklyUtilization.length
      : 0;

  const peakUtilization =
    weeklyUtilization.length > 0
      ? Math.max(...weeklyUtilization.map((w) => w.totalAllocation))
      : 0;

  // Calculate trend (simple: compare first half vs second half)
  let utilizationTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (weeklyUtilization.length >= 4) {
    const midpoint = Math.floor(weeklyUtilization.length / 2);
    const firstHalf = weeklyUtilization.slice(0, midpoint);
    const secondHalf = weeklyUtilization.slice(midpoint);

    const firstAvg =
      firstHalf.reduce((sum, w) => sum + w.totalAllocation, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, w) => sum + w.totalAllocation, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 10) {
      utilizationTrend = "increasing";
    } else if (diff < -10) {
      utilizationTrend = "decreasing";
    }
  }

  return {
    resourceId,
    resourceName: undefined, // To be filled by caller
    weeklyUtilization,
    averageUtilization,
    peakUtilization,
    utilizationTrend,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Group allocations by resource and week for efficient conflict detection
 *
 * Performance: O(n) grouping using Map
 * Returns Map with key: "resourceId__weekIdentifier"
 */
function groupAllocationsByResourceAndWeek(
  allocations: ResourceWeeklyAllocation[]
): Map<string, ResourceWeeklyAllocation[]> {
  const grouped = new Map<string, ResourceWeeklyAllocation[]>();

  for (const allocation of allocations) {
    const key = `${allocation.resourceId}__${allocation.weekIdentifier}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(allocation);
  }

  return grouped;
}

/**
 * Generate unique conflict ID
 */
function generateConflictId(resourceId: string, weekIdentifier: string): string {
  return `conflict_${resourceId}_${weekIdentifier}`;
}

/**
 * Format conflict summary for display
 */
export function formatConflictSummary(conflict: ResourceCapacityConflict): string {
  const projectCount = conflict.projectAllocations.length;
  const resourceName = conflict.resourceName || conflict.resourceId;

  if (conflict.severity === "critical") {
    return `${resourceName} is overallocated by ${(conflict.totalAllocation - 100).toFixed(0)}% in ${conflict.weekIdentifier} across ${projectCount} projects`;
  } else if (conflict.severity === "warning") {
    return `${resourceName} is at ${conflict.totalAllocation.toFixed(0)}% capacity in ${conflict.weekIdentifier} across ${projectCount} projects`;
  } else {
    return `${resourceName} is allocated to ${projectCount} projects in ${conflict.weekIdentifier} (${conflict.totalAllocation.toFixed(0)}% total)`;
  }
}

/**
 * Get severity color for UI display
 */
export function getConflictSeverityColor(severity: ConflictSeverity): string {
  switch (severity) {
    case "critical":
      return "#dc2626"; // red-600
    case "warning":
      return "#f59e0b"; // amber-500
    case "info":
      return "#3b82f6"; // blue-500
    default:
      return "#6b7280"; // gray-500
  }
}

/**
 * Check if adding new allocations would cause conflicts
 *
 * Use case: Pre-flight check before saving new resource assignments
 */
export function wouldCauseConflicts(
  existingAllocations: ResourceWeeklyAllocation[],
  newAllocations: ResourceWeeklyAllocation[],
  criticalThreshold: number = 100
): boolean {
  const combined = [...existingAllocations, ...newAllocations];
  const result = detectCapacityConflicts(combined, { criticalThreshold });

  return result.summary.criticalConflicts > 0;
}

/**
 * Get available capacity for a resource in a specific week
 *
 * Returns: Remaining allocation percentage (e.g., 30 means 30% still available)
 */
export function getAvailableCapacity(
  resourceId: string,
  weekIdentifier: string,
  allocations: ResourceWeeklyAllocation[]
): number {
  const weekAllocations = allocations.filter(
    (a) => a.resourceId === resourceId && a.weekIdentifier === weekIdentifier
  );

  const totalAllocation = weekAllocations.reduce(
    (sum, a) => sum + a.allocationPercent,
    0
  );

  return Math.max(0, 100 - totalAllocation);
}

/**
 * Get weeks where resource has availability
 *
 * Returns: Week identifiers where resource has at least minAvailability% free
 */
export function getAvailableWeeks(
  resourceId: string,
  allocations: ResourceWeeklyAllocation[],
  minAvailability: number = 20
): string[] {
  const groupedByWeek = groupAllocationsByResourceAndWeek(
    allocations.filter((a) => a.resourceId === resourceId)
  );

  const availableWeeks: string[] = [];

  for (const [key, group] of groupedByWeek) {
    const weekIdentifier = key.split("__")[1];
    const totalAllocation = group.reduce((sum, a) => sum + a.allocationPercent, 0);
    const available = 100 - totalAllocation;

    if (available >= minAvailability) {
      availableWeeks.push(weekIdentifier);
    }
  }

  return availableWeeks.sort();
}
