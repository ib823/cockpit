/**
 * Resource Validator - Complete hierarchy and integrity validation
 *
 * Provides centralized validation for:
 * - Resource hierarchy integrity
 * - Manager relationship validity
 * - Orphaned resource detection
 * - Circular reference detection
 * - Assignment constraints
 *
 * Used by:
 * - API endpoints (before create/update)
 * - Zustand store (before mutations)
 * - UI components (for error messaging)
 */

import type { GanttResource, GanttProject } from '@prisma/client';

export interface ValidationError {
  code: string;
  message: string;
  resourceId?: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface HierarchyValidationReport {
  valid: GanttResource[];
  orphaned: GanttResource[];
  incomplete: GanttResource[];
  circular: GanttResource[]; // Resources in circular hierarchies
}

/**
 * Validates a single resource data before creation/update
 * Checks: required fields, FK validity, constraints
 */
export function validateResourceData(
  data: Partial<GanttResource>,
  allProjectResources: GanttResource[],
  isNew: boolean = true
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check required fields for new resources
  if (isNew) {
    if (!data.name || data.name.trim() === '') {
      errors.push({
        code: 'RESOURCE_NAME_REQUIRED',
        message: 'Resource name is required',
        field: 'name',
        severity: 'error',
      });
    }

    if (!data.category || data.category.trim() === '') {
      errors.push({
        code: 'RESOURCE_CATEGORY_REQUIRED',
        message: 'Resource category is required',
        field: 'category',
        severity: 'error',
      });
    }

    if (!data.designation || data.designation.trim() === '') {
      errors.push({
        code: 'RESOURCE_DESIGNATION_REQUIRED',
        message: 'Resource designation is required',
        field: 'designation',
        severity: 'error',
      });
    }
  }

  // Validate manager relationship if specified
  if (data.managerResourceId) {
    const managerExists = allProjectResources.some(r => r.id === data.managerResourceId);
    if (!managerExists) {
      errors.push({
        code: 'MANAGER_NOT_FOUND',
        message: `Manager resource not found: ${data.managerResourceId}`,
        field: 'managerResourceId',
        severity: 'error',
      });
    }

    // Check for self-reference
    if (data.id && data.id === data.managerResourceId) {
      errors.push({
        code: 'SELF_REFERENCE',
        message: 'A resource cannot be its own manager',
        field: 'managerResourceId',
        severity: 'error',
      });
    }
  }

  // Validate category if provided
  const validCategories = [
    'leadership',
    'pm',
    'functional',
    'technical',
    'change',
    'qa',
    'basis',
    'security',
    'other',
  ];
  if (data.category && !validCategories.includes(data.category)) {
    errors.push({
      code: 'INVALID_CATEGORY',
      message: `Invalid category: ${data.category}. Must be one of: ${validCategories.join(', ')}`,
      field: 'category',
      severity: 'error',
    });
  }

  // Validate designation if provided
  const validDesignations = [
    'principal',
    'director',
    'senior_manager',
    'manager',
    'senior_consultant',
    'consultant',
    'analyst',
    'subcontractor',
  ];
  if (data.designation && !validDesignations.includes(data.designation)) {
    errors.push({
      code: 'INVALID_DESIGNATION',
      message: `Invalid designation: ${data.designation}. Must be one of: ${validDesignations.join(', ')}`,
      field: 'designation',
      severity: 'error',
    });
  }

  // Validate assignmentLevel if provided
  const validAssignmentLevels = ['phase', 'task', 'both'];
  if (
    data.assignmentLevel &&
    !validAssignmentLevels.includes(data.assignmentLevel)
  ) {
    errors.push({
      code: 'INVALID_ASSIGNMENT_LEVEL',
      message: `Invalid assignmentLevel: ${data.assignmentLevel}. Must be: phase, task, or both`,
      field: 'assignmentLevel',
      severity: 'error',
    });
  }

  // Validate charge rate if billable
  if (data.isBillable && data.chargeRatePerHour && data.chargeRatePerHour <= 0) {
    errors.push({
      code: 'INVALID_CHARGE_RATE',
      message: 'Charge rate must be greater than 0 for billable resources',
      field: 'chargeRatePerHour',
      severity: 'error',
    });
  }

  // Validate utilization target if provided
  if (data.utilizationTarget !== undefined) {
    if (data.utilizationTarget < 0 || data.utilizationTarget > 100) {
      errors.push({
        code: 'INVALID_UTILIZATION_TARGET',
        message: 'Utilization target must be between 0 and 100',
        field: 'utilizationTarget',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates entire resource hierarchy for integrity
 * Returns categorized resources and detects issues
 */
export function validateResourceHierarchy(
  resources: GanttResource[]
): HierarchyValidationReport {
  const result: HierarchyValidationReport = {
    valid: [],
    orphaned: [],
    incomplete: [],
    circular: [],
  };

  const resourceMap = new Map(resources.map(r => [r.id, r]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Check each resource
  for (const resource of resources) {
    if (!resource.managerResourceId) {
      // Root-level resource is always valid
      result.valid.push(resource);
      continue;
    }

    // Check if manager exists
    if (!resourceMap.has(resource.managerResourceId)) {
      result.orphaned.push(resource);
      continue;
    }

    // Check for circular reference
    if (detectCircularReference(resource.id, resourceMap)) {
      result.circular.push(resource);
      continue;
    }

    // Resource is valid
    result.valid.push(resource);
  }

  return result;
}

/**
 * Detects circular references in hierarchy
 * Returns true if resource has a circular dependency
 */
function detectCircularReference(
  resourceId: string,
  resourceMap: Map<string, GanttResource>
): boolean {
  const visited = new Set<string>();
  let current = resourceId;

  while (current) {
    if (visited.has(current)) {
      // We've seen this before - circular reference!
      return true;
    }

    visited.add(current);
    const resource = resourceMap.get(current);
    if (!resource || !resource.managerResourceId) {
      // Reached root or invalid
      return false;
    }

    current = resource.managerResourceId;
  }

  return false;
}

/**
 * Checks if a resource can be safely deleted
 * Returns validation result with reasons if it can't be deleted
 */
export function canDeleteResource(
  resourceId: string,
  allResources: GanttResource[],
  hasAssignments: boolean = false
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check if resource has direct reports
  const directReports = allResources.filter(r => r.managerResourceId === resourceId);
  if (directReports.length > 0) {
    errors.push({
      code: 'HAS_DIRECT_REPORTS',
      message: `Cannot delete: ${directReports.length} resource(s) report to this manager`,
      resourceId,
      severity: 'error',
    });
  }

  // Check if resource is assigned to tasks/phases
  if (hasAssignments) {
    errors.push({
      code: 'HAS_ASSIGNMENTS',
      message: 'Cannot delete: Resource is assigned to one or more tasks/phases',
      resourceId,
      severity: 'error',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if manager relationship can be changed
 * Returns validation result
 */
export function canSetManager(
  resourceId: string,
  newManagerId: string | null,
  allResources: GanttResource[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // If no manager, always allowed
  if (!newManagerId) {
    return { valid: true, errors, warnings: [] };
  }

  // Check if new manager exists
  const managerExists = allResources.some(r => r.id === newManagerId);
  if (!managerExists) {
    errors.push({
      code: 'MANAGER_NOT_FOUND',
      message: `Manager not found: ${newManagerId}`,
      severity: 'error',
    });
    return { valid: false, errors, warnings: [] };
  }

  // Check for self-reference
  if (resourceId === newManagerId) {
    errors.push({
      code: 'SELF_REFERENCE',
      message: 'A resource cannot be its own manager',
      severity: 'error',
    });
    return { valid: false, errors, warnings: [] };
  }

  // Check for circular reference
  // If we set newManagerId as manager, would it create a loop?
  const resourceMap = new Map(allResources.map(r => [r.id, r]));
  const testMap = new Map(resourceMap);

  // Temporarily set the new manager relationship
  const originalResource = testMap.get(resourceId);
  if (originalResource) {
    const testResource = { ...originalResource, managerResourceId: newManagerId };
    testMap.set(resourceId, testResource);

    if (detectCircularReference(resourceId, testMap)) {
      errors.push({
        code: 'WOULD_CREATE_CIRCULAR_REFERENCE',
        message: 'This manager assignment would create a circular hierarchy',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Gets human-readable summary of validation issues
 */
export function getValidationSummary(report: HierarchyValidationReport): string {
  const parts: string[] = [];

  if (report.valid.length > 0) {
    parts.push(`✅ ${report.valid.length} valid resource(s)`);
  }

  if (report.orphaned.length > 0) {
    parts.push(
      `❌ ${report.orphaned.length} orphaned resource(s) (broken manager link)`
    );
  }

  if (report.incomplete.length > 0) {
    parts.push(`⚠️  ${report.incomplete.length} incomplete resource(s)`);
  }

  if (report.circular.length > 0) {
    parts.push(`🔄 ${report.circular.length} resource(s) in circular hierarchy`);
  }

  return parts.join(' | ');
}
