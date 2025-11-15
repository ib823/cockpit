/**
 * RACI Matrix Helper Functions
 *
 * Utility functions for validating and working with RACI assignments
 */

import type { RACIAssignment, Resource } from "@/types/gantt-tool";

/**
 * Validate RACI assignments for a single item (phase or task)
 * Returns array of validation errors
 */
export function validateRACIAssignments(
  assignments: RACIAssignment[]
): Array<{ type: string; message: string }> {
  const errors: Array<{ type: string; message: string }> = [];

  // Count Accountable roles
  const accountableCount = assignments.filter((a) => a.role === "accountable").length;

  // Rule 1: Maximum 1 Accountable
  if (accountableCount > 1) {
    errors.push({
      type: "multiple-accountable",
      message: `Only one resource can be Accountable. Found ${accountableCount}.`,
    });
  }

  // Rule 2: Warning if no Accountable (not blocking)
  if (accountableCount === 0 && assignments.length > 0) {
    errors.push({
      type: "no-accountable",
      message: "Consider assigning one resource as Accountable for clear ownership.",
    });
  }

  return errors;
}

/**
 * Get RACI summary counts
 */
export function getRACISummary(assignments: RACIAssignment[]): {
  responsible: number;
  accountable: number;
  consulted: number;
  informed: number;
  total: number;
} {
  return {
    responsible: assignments.filter((a) => a.role === "responsible").length,
    accountable: assignments.filter((a) => a.role === "accountable").length,
    consulted: assignments.filter((a) => a.role === "consulted").length,
    informed: assignments.filter((a) => a.role === "informed").length,
    total: assignments.length,
  };
}

/**
 * Get resource name by ID
 */
export function getResourceName(resourceId: string, resources: Resource[]): string {
  const resource = resources.find((r) => r.id === resourceId);
  return resource ? resource.name : "Unknown Resource";
}

/**
 * Get all resources with a specific RACI role
 */
export function getResourcesByRole(
  assignments: RACIAssignment[],
  role: "responsible" | "accountable" | "consulted" | "informed",
  resources: Resource[]
): Resource[] {
  const resourceIds = assignments.filter((a) => a.role === role).map((a) => a.resourceId);
  return resources.filter((r) => resourceIds.includes(r.id));
}

/**
 * Check if a resource has a specific role
 */
export function hasRole(
  resourceId: string,
  role: "responsible" | "accountable" | "consulted" | "informed",
  assignments: RACIAssignment[]
): boolean {
  return assignments.some((a) => a.resourceId === resourceId && a.role === role);
}

/**
 * Get role for a specific resource
 */
export function getResourceRole(
  resourceId: string,
  assignments: RACIAssignment[]
): "responsible" | "accountable" | "consulted" | "informed" | null {
  const assignment = assignments.find((a) => a.resourceId === resourceId);
  return assignment ? assignment.role : null;
}

/**
 * Format RACI role to display string
 */
export function formatRACIRole(role: "responsible" | "accountable" | "consulted" | "informed"): string {
  const roleMap = {
    responsible: "Responsible",
    accountable: "Accountable",
    consulted: "Consulted",
    informed: "Informed",
  };
  return roleMap[role];
}

/**
 * Get RACI role color (for UI display)
 */
export function getRACIRoleColor(
  role: "responsible" | "accountable" | "consulted" | "informed"
): string {
  const colorMap = {
    responsible: "#007AFF", // Blue
    accountable: "#FF3B30", // Red
    consulted: "#FF9500", // Orange
    informed: "#8E8E93", // Gray
  };
  return colorMap[role];
}

/**
 * Get RACI role short code (for compact display)
 */
export function getRACIRoleCode(
  role: "responsible" | "accountable" | "consulted" | "informed"
): string {
  const codeMap = {
    responsible: "R",
    accountable: "A",
    consulted: "C",
    informed: "I",
  };
  return codeMap[role];
}

/**
 * Check if RACI assignments are valid (no blocking errors)
 */
export function isValidRACIAssignments(assignments: RACIAssignment[]): boolean {
  const errors = validateRACIAssignments(assignments);
  // Only blocking error is multiple-accountable
  return !errors.some((e) => e.type === "multiple-accountable");
}
