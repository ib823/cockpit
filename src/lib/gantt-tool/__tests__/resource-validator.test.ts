/**
 * Resource Validator Unit Tests
 *
 * Comprehensive test coverage for all validation scenarios
 * Tests: hierarchy, FK constraints, circular references, constraints
 */

import {
  validateResourceData,
  validateResourceHierarchy,
  canDeleteResource,
  canSetManager,
  getValidationSummary,
} from '../resource-validator';
import type { GanttResource } from '@prisma/client';

// Mock data factory
function createMockResource(overrides: Partial<GanttResource> = {}): GanttResource {
  return {
    id: `resource-${Date.now()}`,
    projectId: 'project-123',
    name: 'Test Resource',
    category: 'technical',
    description: 'Test description',
    designation: 'consultant',
    managerResourceId: null,
    email: 'test@example.com',
    department: 'IT',
    location: 'Remote',
    projectRole: 'Developer',
    companyName: 'Test Corp',
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
    ...overrides,
  };
}

describe('Resource Validator', () => {
  describe('validateResourceData', () => {
    test('should validate new resource with all required fields', () => {
      const data = {
        name: 'Project Manager',
        category: 'pm',
        designation: 'senior_manager',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject new resource without name', () => {
      const data = {
        category: 'pm',
        designation: 'senior_manager',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'RESOURCE_NAME_REQUIRED',
          severity: 'error',
        })
      );
    });

    test('should reject new resource without category', () => {
      const data = {
        name: 'Test',
        designation: 'consultant',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'RESOURCE_CATEGORY_REQUIRED',
        })
      );
    });

    test('should reject new resource without designation', () => {
      const data = {
        name: 'Test',
        category: 'technical',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'RESOURCE_DESIGNATION_REQUIRED',
        })
      );
    });

    test('should reject invalid category', () => {
      const data = {
        name: 'Test',
        category: 'invalid_category',
        designation: 'consultant',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY',
        })
      );
    });

    test('should reject invalid designation', () => {
      const data = {
        name: 'Test',
        category: 'technical',
        designation: 'invalid_designation',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_DESIGNATION',
        })
      );
    });

    test('should reject non-existent manager', () => {
      const existing = [createMockResource({ id: 'manager-1' })];

      const data = {
        name: 'Team Member',
        category: 'technical',
        designation: 'consultant',
        managerResourceId: 'non-existent',
      };

      const result = validateResourceData(data, existing, true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MANAGER_NOT_FOUND',
        })
      );
    });

    test('should reject self-reference', () => {
      const data = {
        id: 'resource-1',
        name: 'Test',
        category: 'technical',
        designation: 'consultant',
        managerResourceId: 'resource-1',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'SELF_REFERENCE',
        })
      );
    });

    test('should accept valid manager reference', () => {
      const manager = createMockResource({ id: 'manager-1' });
      const data = {
        name: 'Team Member',
        category: 'technical',
        designation: 'consultant',
        managerResourceId: 'manager-1',
      };

      const result = validateResourceData(data, [manager], true);

      expect(result.valid).toBe(true);
    });

    test('should reject invalid assignmentLevel', () => {
      const data = {
        name: 'Test',
        category: 'technical',
        designation: 'consultant',
        assignmentLevel: 'invalid',
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ASSIGNMENT_LEVEL',
        })
      );
    });

    test('should reject invalid charge rate for billable resource', () => {
      const data = {
        name: 'Test',
        category: 'technical',
        designation: 'consultant',
        isBillable: true,
        chargeRatePerHour: -100,
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CHARGE_RATE',
        })
      );
    });

    test('should reject invalid utilization target', () => {
      const data = {
        name: 'Test',
        category: 'technical',
        designation: 'consultant',
        utilizationTarget: 150,
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_UTILIZATION_TARGET',
        })
      );
    });

    test('should accept valid utilization target (0-100)', () => {
      const data = {
        name: 'Test',
        category: 'technical',
        designation: 'consultant',
        utilizationTarget: 75,
      };

      const result = validateResourceData(data, [], true);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateResourceHierarchy', () => {
    test('should identify all valid root-level resources', () => {
      const resources = [
        createMockResource({ id: 'res-1', name: 'Root 1' }),
        createMockResource({ id: 'res-2', name: 'Root 2' }),
        createMockResource({ id: 'res-3', name: 'Root 3' }),
      ];

      const result = validateResourceHierarchy(resources);

      expect(result.valid).toHaveLength(3);
      expect(result.orphaned).toHaveLength(0);
    });

    test('should detect orphaned resources (broken manager link)', () => {
      const resources = [
        createMockResource({ id: 'res-1', name: 'Root' }),
        createMockResource({
          id: 'res-2',
          name: 'Orphan',
          managerResourceId: 'non-existent',
        }),
      ];

      const result = validateResourceHierarchy(resources);

      expect(result.valid).toHaveLength(1);
      expect(result.orphaned).toHaveLength(1);
      expect(result.orphaned[0].name).toBe('Orphan');
    });

    test('should build valid hierarchy', () => {
      const resources = [
        createMockResource({ id: 'manager', name: 'Manager' }),
        createMockResource({
          id: 'employee1',
          name: 'Employee 1',
          managerResourceId: 'manager',
        }),
        createMockResource({
          id: 'employee2',
          name: 'Employee 2',
          managerResourceId: 'manager',
        }),
      ];

      const result = validateResourceHierarchy(resources);

      expect(result.valid).toHaveLength(3);
      expect(result.orphaned).toHaveLength(0);
    });

    test('should detect circular references', () => {
      const resources = [
        createMockResource({ id: 'a', managerResourceId: 'b' }),
        createMockResource({ id: 'b', managerResourceId: 'a' }),
      ];

      const result = validateResourceHierarchy(resources);

      expect(result.circular.length).toBeGreaterThan(0);
    });

    test('should handle deep circular references', () => {
      const resources = [
        createMockResource({ id: 'a', managerResourceId: 'b' }),
        createMockResource({ id: 'b', managerResourceId: 'c' }),
        createMockResource({ id: 'c', managerResourceId: 'a' }),
      ];

      const result = validateResourceHierarchy(resources);

      expect(result.circular.length).toBeGreaterThan(0);
    });

    test('should handle mixed valid and orphaned resources', () => {
      const resources = [
        createMockResource({ id: 'res-1', name: 'Root' }),
        createMockResource({
          id: 'res-2',
          name: 'Child',
          managerResourceId: 'res-1',
        }),
        createMockResource({
          id: 'res-3',
          name: 'Orphan',
          managerResourceId: 'non-existent',
        }),
      ];

      const result = validateResourceHierarchy(resources);

      expect(result.valid).toHaveLength(2);
      expect(result.orphaned).toHaveLength(1);
    });
  });

  describe('canDeleteResource', () => {
    test('should allow deletion of root-level resource with no assignments', () => {
      const resources = [createMockResource({ id: 'res-1' })];

      const result = canDeleteResource('res-1', resources, false);

      expect(result.valid).toBe(true);
    });

    test('should reject deletion if resource has direct reports', () => {
      const resources = [
        createMockResource({ id: 'manager', name: 'Manager' }),
        createMockResource({
          id: 'employee',
          managerResourceId: 'manager',
        }),
      ];

      const result = canDeleteResource('manager', resources, false);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'HAS_DIRECT_REPORTS',
        })
      );
    });

    test('should reject deletion if resource has task assignments', () => {
      const resources = [createMockResource({ id: 'res-1' })];

      const result = canDeleteResource('res-1', resources, true);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'HAS_ASSIGNMENTS',
        })
      );
    });

    test('should reject deletion if both managers and assignments exist', () => {
      const resources = [
        createMockResource({ id: 'manager', name: 'Manager' }),
        createMockResource({
          id: 'employee',
          managerResourceId: 'manager',
        }),
      ];

      const result = canDeleteResource('manager', resources, true);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('canSetManager', () => {
    test('should allow setting manager if valid', () => {
      const resources = [
        createMockResource({ id: 'employee' }),
        createMockResource({ id: 'manager' }),
      ];

      const result = canSetManager('employee', 'manager', resources);

      expect(result.valid).toBe(true);
    });

    test('should allow removing manager (null)', () => {
      const resources = [
        createMockResource({
          id: 'employee',
          managerResourceId: 'manager',
        }),
      ];

      const result = canSetManager('employee', null, resources);

      expect(result.valid).toBe(true);
    });

    test('should reject non-existent manager', () => {
      const resources = [createMockResource({ id: 'employee' })];

      const result = canSetManager('employee', 'non-existent', resources);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MANAGER_NOT_FOUND',
        })
      );
    });

    test('should reject self-reference', () => {
      const resources = [createMockResource({ id: 'employee' })];

      const result = canSetManager('employee', 'employee', resources);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'SELF_REFERENCE',
        })
      );
    });

    test('should detect would-be circular reference', () => {
      const resources = [
        createMockResource({
          id: 'a',
          managerResourceId: 'b',
        }),
        createMockResource({ id: 'b', name: 'B' }),
      ];

      // Trying to set a as manager of b would create: a -> b -> a
      const result = canSetManager('b', 'a', resources);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'WOULD_CREATE_CIRCULAR_REFERENCE',
        })
      );
    });

    test('should handle deep hierarchy without circular reference', () => {
      const resources = [
        createMockResource({ id: 'ceo' }),
        createMockResource({ id: 'director', managerResourceId: 'ceo' }),
        createMockResource({ id: 'manager', managerResourceId: 'director' }),
        createMockResource({ id: 'employee', managerResourceId: 'manager' }),
      ];

      // Setting director as employee's manager should be fine
      const result = canSetManager('employee', 'director', resources);

      expect(result.valid).toBe(true);
    });
  });

  describe('getValidationSummary', () => {
    test('should generate summary for all valid resources', () => {
      const report = {
        valid: Array(5).fill(null).map(() => createMockResource()),
        orphaned: [],
        incomplete: [],
        circular: [],
      };

      const summary = getValidationSummary(report);

      expect(summary).toContain('✅ 5 valid resource(s)');
    });

    test('should generate summary for orphaned resources', () => {
      const report = {
        valid: [],
        orphaned: Array(2).fill(null).map(() => createMockResource()),
        incomplete: [],
        circular: [],
      };

      const summary = getValidationSummary(report);

      expect(summary).toContain('❌ 2 orphaned resource(s)');
    });

    test('should generate comprehensive summary', () => {
      const report = {
        valid: Array(10).fill(null).map(() => createMockResource()),
        orphaned: Array(2).fill(null).map(() => createMockResource()),
        incomplete: Array(1).fill(null).map(() => createMockResource()),
        circular: [],
      };

      const summary = getValidationSummary(report);

      expect(summary).toContain('✅ 10 valid');
      expect(summary).toContain('❌ 2 orphaned');
      expect(summary).toContain('⚠️  1 incomplete');
    });
  });
});
