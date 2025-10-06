import { describe, it, expect } from 'vitest';
import lineage from '@/lib/lineage';

describe('M1 - Traceability Ledger', () => {
  describe('Lineage Library', () => {
    it('should load traceability data', () => {
      const summary = lineage.getSummary();
      expect(summary).toBeDefined();
      // M2: All mock fields migrated to db
      expect(summary.db).toBeGreaterThan(0);
      expect(summary.derived).toBeGreaterThan(0);
    });

    it('should get a specific field', () => {
      const field = lineage.getField('project.totalEffort');
      expect(field).toBeDefined();
      expect(field?.id).toBe('project.totalEffort');
      expect(field?.status).toBe('derived');
      expect(field?.label).toBe('Total Effort (PD)');
    });

    it('should get mock fields', () => {
      const mocks = lineage.getMockFields();
      // M2: All mocks migrated to db, should be 0
      expect(mocks.length).toBe(0);
    });

    it('should trace field lineage', () => {
      const trace = lineage.trace('project.totalEffort');
      expect(trace).toBeDefined();
      expect(trace?.field.id).toBe('project.totalEffort');
      expect(trace?.sources.length).toBeGreaterThan(0);
      expect(trace?.destinations.length).toBeGreaterThan(0);
    });

    it('should get fields by page', () => {
      const dashboardFields = lineage.getFieldsByPage('Dashboard');
      expect(dashboardFields.length).toBeGreaterThan(0);

      // All dashboard fields should be derived
      dashboardFields.forEach(field => {
        expect(field.status).toBe('derived');
      });
    });

    it('should get proposed migrations', () => {
      const migrations = lineage.getMigrations();
      // M2: All migrations completed
      expect(migrations.length).toBe(0);
    });

    it('should validate traceability data', () => {
      const isValid = lineage.validate();
      expect(isValid).toBe(true);
    });

    it('should provide correct summary counts', () => {
      const summary = lineage.getSummary();

      // Based on the spec: 10 total fields
      const total = summary.mock + summary.db + summary.derived + summary.user_input;
      expect(total).toBe(10);

      // M4 Reality:
      // - 3 DB fields (phase.effort, ricefw.reports.count, ricefw.interfaces.complexity)
      // - 5 Derived fields (project.totalEffort, project.totalCost, resources.pm.allocation, wrapper.projectManagement.effort, timeline.phase.startBusinessDay)
      // - 2 User input fields (project.moduleCombo, chips.country.value)
      expect(summary.mock).toBe(0);
      expect(summary.db).toBe(3);
      expect(summary.derived).toBe(5);
      expect(summary.user_input).toBe(2);
    });

    it('should identify key fields', () => {
      const keyFields = [
        'project.totalEffort',
        'project.totalCost',
        'phase.effort',
        'chips.country.value',
        'timeline.phase.startBusinessDay',
      ];

      keyFields.forEach(fieldId => {
        const field = lineage.getField(fieldId);
        expect(field).toBeDefined();
        expect(field?.id).toBe(fieldId);
      });
    });

    it('should correctly identify mock fields needing migration', () => {
      const mocks = lineage.getMockFields();
      // M2: All mocks migrated, should be empty
      expect(mocks).toEqual([]);
    });

    it('should provide field metadata correctly', () => {
      const field = lineage.getField('project.totalCost');
      expect(field).toBeDefined();
      expect(field?.validation).toContain('number');
      expect(field?.currency).toBe('USD');
      expect(field?.component).toBe('CostPanel');
    });
  });
});
