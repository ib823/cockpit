/**
 * Resource Import Validator Tests
 *
 * Tests for batch validation of imported resources
 * Covers all import paths: Excel, CSV, API, migration
 */

import {
  validateResourceBatch,
  validateManagerAssignment,
  getImportValidationSummary,
} from '../resource-import-validator';
import type { GanttResource as Resource } from '@prisma/client';

function createMockResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: `resource-${Date.now()}`,
    projectId: 'project-123',
    name: 'Test Resource',
    category: 'technical',
    description: 'Test',
    designation: 'consultant',
    managerResourceId: null,
    email: 'test@example.com',
    department: null,
    location: null,
    projectRole: null,
    companyName: null,
    assignmentLevel: 'both',
    isBillable: false,
    chargeRatePerHour: null,
    currency: null,
    utilizationTarget: null,
    isActive: true,
    validationStatus: 'valid',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    rateType: null,
    hourlyRate: null,
    dailyRate: null,
    regionCode: null,
    isSubcontractor: false,
    ...overrides,
  };
}

describe('Resource Import Validator', () => {
  describe('validateResourceBatch', () => {
    test('should validate empty batch', () => {
      const result = validateResourceBatch([]);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should validate single valid resource', () => {
      const resources = [
        {
          id: 'res-1',
          name: 'Manager',
          category: 'pm',
          designation: 'manager',
          description: 'Test manager',
        },
      ];

      const result = validateResourceBatch(resources);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
      expect(result.valid[0].name).toBe('Manager');
    });

    test('should reject resource missing name', () => {
      const resources = [
        {
          category: 'technical',
          designation: 'consultant',
          description: 'No name',
        },
      ];

      const result = validateResourceBatch(resources);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].code).toBe('RESOURCE_NAME_REQUIRED');
    });

    test('should reject resource missing category', () => {
      const resources = [
        {
          name: 'Test',
          designation: 'consultant',
          description: 'No category',
        },
      ];

      const result = validateResourceBatch(resources);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].code).toBe('RESOURCE_CATEGORY_REQUIRED');
    });

    test('should reject resource with invalid category', () => {
      const resources = [
        {
          name: 'Test',
          category: 'invalid_category',
          designation: 'consultant',
          description: 'Invalid cat',
        },
      ];

      const result = validateResourceBatch(resources);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid.length).toBeGreaterThan(0);
      expect(result.invalid[0].code).toBe('INVALID_CATEGORY');
    });

    test('should validate batch with mixed valid/invalid', () => {
      const resources = [
        {
          name: 'Valid Resource',
          category: 'technical',
          designation: 'consultant',
          description: 'Valid one',
        },
        {
          name: '', // Invalid: missing name
          category: 'technical',
          designation: 'consultant',
          description: 'Invalid one',
        },
        {
          name: 'Another Valid',
          category: 'pm',
          designation: 'manager',
          description: 'Another good one',
        },
      ];

      const result = validateResourceBatch(resources);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });

    test('should detect orphaned resources', () => {
      // This resource has a manager ID but the manager won't be in the batch
      const resources = [
        {
          id: 'employee-1',
          name: 'Employee',
          category: 'technical',
          designation: 'consultant',
          description: 'Employee',
          managerResourceId: 'non-existent-manager',
        },
      ];

      const result = validateResourceBatch(resources);

      // Resource passes individual validation (manager is checked in hierarchy pass)
      // but appears in orphaned in hierarchy report
      expect(result.valid.length).toBe(1);
      expect(result.hierarchyReport.orphaned.length).toBe(1);
    });

    test('should detect circular references in batch', () => {
      const resources = [
        {
          id: 'res-a',
          name: 'A',
          category: 'technical',
          designation: 'consultant',
          description: 'A',
          managerResourceId: 'res-b',
        },
        {
          id: 'res-b',
          name: 'B',
          category: 'technical',
          designation: 'consultant',
          description: 'B',
          managerResourceId: 'res-a', // Creates circle: A→B→A
        },
      ];

      const result = validateResourceBatch(resources);

      // Both resources pass individual validation
      expect(result.valid.length).toBe(2);
      // Circular reference detected in hierarchy pass
      expect(result.hierarchyReport.circular.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should handle complex hierarchy', () => {
      const resources = [
        {
          id: 'ceo',
          name: 'CEO',
          category: 'leadership',
          designation: 'principal',
          description: 'CEO',
        },
        {
          id: 'director',
          name: 'Director',
          category: 'leadership',
          designation: 'director',
          description: 'Director',
          managerResourceId: 'ceo',
        },
        {
          id: 'manager',
          name: 'Manager',
          category: 'pm',
          designation: 'manager',
          description: 'Manager',
          managerResourceId: 'director',
        },
        {
          id: 'employee',
          name: 'Employee',
          category: 'technical',
          designation: 'consultant',
          description: 'Employee',
          managerResourceId: 'manager',
        },
      ];

      const result = validateResourceBatch(resources);

      expect(result.valid).toHaveLength(4);
      expect(result.invalid).toHaveLength(0);
      expect(result.hierarchyReport.valid).toHaveLength(4);
    });
  });

  describe('validateManagerAssignment', () => {
    test('should allow null manager', () => {
      const result = validateManagerAssignment('res-1', null, []);
      expect(result.valid).toBe(true);
    });

    test('should reject non-existent manager', () => {
      const result = validateManagerAssignment('res-1', 'non-existent', []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Manager not found');
    });

    test('should reject self-reference', () => {
      const result = validateManagerAssignment('res-1', 'res-1', []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be its own manager');
    });

    test('should allow valid manager', () => {
      const resources = [createMockResource({ id: 'manager' })];
      const result = validateManagerAssignment('employee', 'manager', resources);
      expect(result.valid).toBe(true);
    });
  });

  describe('getImportValidationSummary', () => {
    test('should generate summary for all valid', () => {
      const result = validateResourceBatch([
        {
          name: 'R1',
          category: 'technical',
          designation: 'consultant',
          description: 'R1',
        },
        {
          name: 'R2',
          category: 'pm',
          designation: 'manager',
          description: 'R2',
        },
      ]);

      const summary = getImportValidationSummary(result);

      expect(summary.validCount).toBe(2);
      expect(summary.invalidCount).toBe(0);
      expect(summary.summary).toContain('✅ All resources valid');
    });

    test('should generate summary for mixed', () => {
      const result = validateResourceBatch([
        {
          name: 'Valid',
          category: 'technical',
          designation: 'consultant',
          description: 'Valid',
        },
        {
          name: '', // Invalid
          category: 'technical',
          designation: 'consultant',
          description: 'Invalid',
        },
      ]);

      const summary = getImportValidationSummary(result);

      expect(summary.validCount).toBe(1);
      expect(summary.invalidCount).toBe(1);
      expect(summary.summary).toContain('❌');
    });

    test('should include circular reference warning', () => {
      const result = validateResourceBatch([
        {
          id: 'a',
          name: 'A',
          category: 'technical',
          designation: 'consultant',
          description: 'A',
          managerResourceId: 'b',
        },
        {
          id: 'b',
          name: 'B',
          category: 'technical',
          designation: 'consultant',
          description: 'B',
          managerResourceId: 'a',
        },
      ]);

      const summary = getImportValidationSummary(result);

      // Both resources are valid, but circular reference is detected
      expect(summary.validCount).toBe(2);
      expect(summary.summary).toContain('🔄');
    });
  });
});
