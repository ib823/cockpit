/**
 * Resource Import Validator
 *
 * Centralized validation for resource imports from any source
 * (Excel, CSV, API, migration, etc.)
 *
 * Used by:
 * - import-parser.ts
 * - excel-template-parser.ts
 * - migrate-to-database.ts
 * - OrgChartBuilderV2.tsx
 * - Zustand store
 *
 * Ensures ALL resource imports follow the same validation rules
 * per GLOBAL QUALITY & INTEGRATION POLICY
 */

import type { GanttResource as Resource } from '@prisma/client';
import {
  validateResourceData,
  validateResourceHierarchy,
  canSetManager,
} from './resource-validator';

export interface ImportValidationError {
  rowOrIndex: number;
  field: string;
  value: any;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ResourceBatchValidationResult {
  valid: Resource[];
  invalid: ImportValidationError[];
  warnings: string[];
  hierarchyReport: ReturnType<typeof validateResourceHierarchy>;
}

/**
 * Validates a batch of resources imported from any source
 * Returns categorized results and hierarchy validation
 */
export function validateResourceBatch(
  resources: Partial<Resource>[],
  sourceIdentifier: string = 'import'
): ResourceBatchValidationResult {
  const result: ResourceBatchValidationResult = {
    valid: [],
    invalid: [],
    warnings: [],
    hierarchyReport: {
      valid: [],
      orphaned: [],
      incomplete: [],
      circular: [],
    },
  };

  // First pass: Validate individual resources
  const validatedResources: Resource[] = [];

  resources.forEach((resource, index) => {
    // Check required fields
    if (!resource.name || resource.name.trim() === '') {
      result.invalid.push({
        rowOrIndex: index,
        field: 'name',
        value: resource.name,
        message: 'Resource name is required',
        code: 'RESOURCE_NAME_REQUIRED',
        severity: 'error',
      });
      return;
    }

    if (!resource.category) {
      result.invalid.push({
        rowOrIndex: index,
        field: 'category',
        value: resource.category,
        message: 'Category is required',
        code: 'RESOURCE_CATEGORY_REQUIRED',
        severity: 'error',
      });
      return;
    }

    if (!resource.designation) {
      result.invalid.push({
        rowOrIndex: index,
        field: 'designation',
        value: resource.designation,
        message: 'Designation is required',
        code: 'RESOURCE_DESIGNATION_REQUIRED',
        severity: 'error',
      });
      return;
    }

    // Use centralized validation (but skip manager validation in individual pass)
    // Manager will be validated in the hierarchy pass
    const resourceWithoutManager = { ...resource, managerResourceId: null };
    const validationResult = validateResourceData(
      resourceWithoutManager as any,
      validatedResources, // Check against already-validated resources
      true // isNew
    );

    if (!validationResult.valid) {
      validationResult.errors.forEach(error => {
        result.invalid.push({
          rowOrIndex: index,
          field: error.field || 'unknown',
          value: (resource as any)[error.field || 'id'],
          message: error.message,
          code: error.code,
          severity: error.severity,
        });
      });
      return;
    }

    // Resource is valid (excluding manager relationship) - add to validated list
    // Restore managerResourceId (will be validated in hierarchy pass)
    validatedResources.push({
      id: resource.id || `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: resource.projectId || 'temp',
      name: resource.name,
      category: resource.category,
      description: resource.description || '',
      designation: resource.designation,
      managerResourceId: resource.managerResourceId || null, // Restored - will be validated in hierarchy pass
      email: resource.email || null,
      department: resource.department || null,
      location: resource.location || null,
      projectRole: resource.projectRole || null,
      companyName: resource.companyName || null,
      assignmentLevel: resource.assignmentLevel || 'both',
      isBillable: resource.isBillable || false,
      chargeRatePerHour: resource.chargeRatePerHour || null,
      currency: resource.currency || null,
      utilizationTarget: resource.utilizationTarget || null,
      isActive: resource.isActive !== false,
      validationStatus: 'valid',
      createdAt: resource.createdAt || new Date(),
      updatedAt: resource.updatedAt || new Date(),
      deletedAt: resource.deletedAt || null,
      rateType: resource.rateType || null,
      hourlyRate: resource.hourlyRate || null,
      dailyRate: resource.dailyRate || null,
    } as Resource);
  });

  result.valid = validatedResources;

  // Second pass: Validate hierarchy
  if (validatedResources.length > 0) {
    result.hierarchyReport = validateResourceHierarchy(validatedResources);

    // Convert hierarchy issues to validation errors/warnings
    result.hierarchyReport.orphaned.forEach(resource => {
      const index = resources.findIndex(r => r.id === resource.id);
      result.invalid.push({
        rowOrIndex: index >= 0 ? index : -1,
        field: 'managerResourceId',
        value: resource.managerResourceId,
        message: `Manager not found: ${resource.managerResourceId}`,
        code: 'MANAGER_NOT_FOUND',
        severity: 'error',
      });
    });

    result.hierarchyReport.circular.forEach(resource => {
      const index = resources.findIndex(r => r.id === resource.id);
      result.warnings.push(
        `Resource "${resource.name}" (row ${index + 1}) is part of a circular hierarchy`
      );
    });

    result.hierarchyReport.incomplete.forEach(resource => {
      result.warnings.push(
        `Resource "${resource.name}" is incomplete (may cause issues)`
      );
    });
  }

  return result;
}

/**
 * Validates manager relationship before setting it
 * Used during imports where manager is being established
 */
export function validateManagerAssignment(
  resourceId: string,
  newManagerId: string | null,
  allResources: Resource[]
): { valid: boolean; error?: string } {
  if (!newManagerId) {
    return { valid: true };
  }

  // Check self-reference first
  if (resourceId === newManagerId) {
    return {
      valid: false,
      error: 'A resource cannot be its own manager',
    };
  }

  const result = canSetManager(resourceId, newManagerId, allResources);

  if (!result.valid) {
    const errorMessage = result.errors[0]?.message || 'Invalid manager assignment';
    return { valid: false, error: errorMessage };
  }

  return { valid: true };
}

/**
 * Generates a summary of import validation results
 */
export function getImportValidationSummary(result: ResourceBatchValidationResult): {
  totalProcessed: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
  summary: string;
} {
  const totalProcessed = result.valid.length + result.invalid.length;
  const validCount = result.valid.length;
  const invalidCount = result.invalid.length;
  const warningCount = result.warnings.length;

  let summary = '';
  if (validCount > 0) {
    summary += `✅ ${validCount} resource(s) valid. `;
  }
  if (invalidCount > 0) {
    summary += `❌ ${invalidCount} resource(s) invalid. `;
  }
  if (warningCount > 0) {
    summary += `⚠️  ${warningCount} warning(s). `;
  }
  if (result.hierarchyReport.circular.length > 0) {
    summary += `🔄 ${result.hierarchyReport.circular.length} circular reference(s). `;
  }
  if (validCount === totalProcessed && warningCount === 0) {
    summary = '✅ All resources valid and ready to import.';
  }

  return {
    totalProcessed,
    validCount,
    invalidCount,
    warningCount,
    summary,
  };
}
