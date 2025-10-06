import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  validateProject,
  validatePhase,
  validateResource,
  validateChip,
  validateRicefwItem,
  ProjectSchema,
  PhaseSchema,
  ResourceSchema,
  ChipSchema,
} from '@/data/dal';

describe('M2 - DAL (DB TRUTH)', () => {
  describe('Validation Layer', () => {
    it('should validate valid Project data', () => {
      const validProject = {
        name: 'Test Project',
        description: 'A test SAP implementation',
        status: 'DRAFT' as const,
        clientName: 'Acme Corp',
        industry: 'Manufacturing',
        region: 'ABMY',
        employees: 500,
        revenue: 50000000,
        legalEntities: 2,
        moduleCombo: 'Finance,SCM',
        complexity: 'medium',
        ssoMode: 'federated',
        integrationPosture: 'moderate',
        rateRegion: 'ABMY',
        totalEffort: 120,
        totalCost: 500000,
        duration: 180,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => validateProject(validProject)).not.toThrow();
    });

    it('should reject invalid Project data', () => {
      const invalidProject = {
        name: '', // Empty name
        status: 'INVALID_STATUS',
        employees: -100, // Negative employees
        ownerId: 'not-a-cuid',
      };

      expect(() => validateProject(invalidProject)).toThrow();
    });

    it('should validate valid Phase data', () => {
      const validPhase = {
        projectId: 'cm4abc123def456ghi',
        name: 'Prepare Phase',
        category: 'prepare' as const,
        workingDays: 20,
        effort: 50,
        startBusinessDay: 0,
        color: 'blue',
        dependencies: [],
        order: 1,
      };

      expect(() => validatePhase(validPhase)).not.toThrow();
    });

    it('should reject invalid Phase category', () => {
      const invalidPhase = {
        projectId: 'cm4abc123def456ghi',
        name: 'Invalid Phase',
        category: 'invalid_category',
        workingDays: 20,
        effort: 50,
        startBusinessDay: 0,
        color: 'blue',
        order: 1,
      };

      expect(() => validatePhase(invalidPhase)).toThrow();
    });

    it('should validate valid Resource data', () => {
      const validResource = {
        projectId: 'cm4abc123def456ghi',
        phaseId: 'cm4def456ghi789jkl',
        name: 'John Doe',
        role: 'PM' as const,
        region: 'ABMY',
        allocation: 50,
        hourlyRate: 150,
      };

      expect(() => validateResource(validResource)).not.toThrow();
    });

    it('should reject Resource with invalid allocation', () => {
      const invalidResource = {
        projectId: 'cm4abc123def456ghi',
        name: 'Jane Doe',
        role: 'Technical',
        region: 'ABSG',
        allocation: 150, // Over 100%
        hourlyRate: 120,
      };

      expect(() => validateResource(invalidResource)).toThrow();
    });

    it('should validate valid Chip data', () => {
      const validChip = {
        projectId: 'cm4abc123def456ghi',
        type: 'COUNTRY' as const,
        value: 'Malaysia',
        confidence: 0.95,
        source: 'paste',
      };

      expect(() => validateChip(validChip)).not.toThrow();
    });

    it('should reject Chip with invalid confidence', () => {
      const invalidChip = {
        projectId: 'cm4abc123def456ghi',
        type: 'EMPLOYEES',
        value: '500',
        confidence: 1.5, // > 1.0
        source: 'paste',
      };

      expect(() => validateChip(invalidChip)).toThrow();
    });

    it('should validate valid RICEFW item', () => {
      const validRicefw = {
        projectId: 'cm4abc123def456ghi',
        type: 'report' as const,
        name: 'Financial Report',
        description: 'Monthly P&L report',
        complexity: 'M' as const,
        count: 5,
        effortPerItem: 8,
        totalEffort: 40,
        phase: 'realize' as const,
      };

      expect(() => validateRicefwItem(validRicefw)).not.toThrow();
    });

    it('should reject RICEFW with negative count', () => {
      const invalidRicefw = {
        projectId: 'cm4abc123def456ghi',
        type: 'interface',
        name: 'API Integration',
        complexity: 'L',
        count: -1, // Negative count
        effortPerItem: 16,
        totalEffort: -16,
        phase: 'realize',
      };

      expect(() => validateRicefwItem(invalidRicefw)).toThrow();
    });
  });

  describe('Business Validation Rules', () => {
    it('should enforce max employees constraint', () => {
      const invalidProject = {
        name: 'Large Corp',
        status: 'DRAFT' as const,
        employees: 2000000, // Exceeds 1,000,000 max
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should enforce max working days constraint', () => {
      const invalidPhase = {
        projectId: 'cm4abc123def456ghi',
        name: 'Too Long Phase',
        category: 'realize' as const,
        workingDays: 2000, // Exceeds 1000 max
        effort: 500,
        startBusinessDay: 0,
        color: 'green',
        order: 1,
      };

      expect(() => PhaseSchema.parse(invalidPhase)).toThrow();
    });

    it('should enforce valid color constraint', () => {
      const invalidPhase = {
        projectId: 'cm4abc123def456ghi',
        name: 'Invalid Color Phase',
        category: 'prepare' as const,
        workingDays: 20,
        effort: 50,
        startBusinessDay: 0,
        color: 'pink', // Invalid color
        order: 1,
      };

      expect(() => PhaseSchema.parse(invalidPhase)).toThrow();
    });

    it('should enforce valid ChipType enum', () => {
      const invalidChip = {
        projectId: 'cm4abc123def456ghi',
        type: 'INVALID_TYPE', // Not in ChipType enum
        value: 'test',
        confidence: 0.8,
        source: 'paste',
      };

      expect(() => ChipSchema.parse(invalidChip)).toThrow();
    });
  });

  describe('XSS and Security Validation', () => {
    it('should validate safe Project name', () => {
      const safeProject = {
        name: 'Clean Project Name',
        status: 'DRAFT' as const,
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => validateProject(safeProject)).not.toThrow();
    });

    it('should validate max length constraints', () => {
      const tooLongName = 'A'.repeat(300); // Exceeds 255 max
      const invalidProject = {
        name: tooLongName,
        status: 'DRAFT' as const,
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should validate description max length', () => {
      const tooLongDescription = 'A'.repeat(6000); // Exceeds 5000 max
      const invalidProject = {
        name: 'Test Project',
        description: tooLongDescription,
        status: 'DRAFT' as const,
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('Data Type Validation', () => {
    it('should validate numeric fields', () => {
      const validProject = {
        name: 'Numeric Test',
        status: 'DRAFT' as const,
        employees: 1000,
        revenue: 10000000.50,
        totalEffort: 150.5,
        totalCost: 750000.75,
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => validateProject(validProject)).not.toThrow();
    });

    it('should reject string where number expected', () => {
      const invalidProject = {
        name: 'Type Mismatch',
        status: 'DRAFT' as const,
        employees: 'five hundred' as any, // String instead of number
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should validate date fields', () => {
      const validProject = {
        name: 'Date Test',
        status: 'DRAFT' as const,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => validateProject(validProject)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const zeroProject = {
        name: 'Zero Values Test',
        status: 'DRAFT' as const,
        employees: 0,
        revenue: 0,
        totalEffort: 0,
        totalCost: 0,
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => validateProject(zeroProject)).not.toThrow();
    });

    it('should handle optional fields correctly', () => {
      const minimalProject = {
        name: 'Minimal Project',
        status: 'DRAFT' as const,
        ownerId: 'cm4abc123def456ghi',
      };

      expect(() => validateProject(minimalProject)).not.toThrow();
    });

    it('should handle empty arrays correctly', () => {
      const phaseWithNoDeps = {
        projectId: 'cm4abc123def456ghi',
        name: 'Independent Phase',
        category: 'prepare' as const,
        workingDays: 10,
        effort: 25,
        startBusinessDay: 0,
        color: 'blue',
        dependencies: [],
        order: 1,
      };

      expect(() => validatePhase(phaseWithNoDeps)).not.toThrow();
    });
  });
});
