// Comprehensive regression tests for presales chip extraction
import { describe, it, expect } from 'vitest';
import { parseRFPTextEnhanced } from '@/lib/enhanced-chip-parser';

describe('Presales Chip Extraction - Regression Tests', () => {

  describe('Basic Scenarios', () => {
    it('should extract from simple English RFP', () => {
      const text = `
        Malaysia manufacturing company with 500 employees and MYR 200M annual revenue.
        Need Finance, HR and Supply Chain modules.
        Operating in 3 locations with 2 legal entities.
      `;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'employees')).toBe(true);
      expect(chips.some(c => c.type === 'locations')).toBe(true);
      expect(chips.some(c => c.type === 'legal_entities')).toBe(true);
    });

    it('should extract from Bahasa Malaysia text', () => {
      const text = `
        Syarikat pembuatan di Malaysia dengan 500 pekerja.
        Beroperasi di 3 cawangan dengan 2 anak syarikat.
      `;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'employees')).toBe(true);
      expect(chips.some(c => c.type === 'locations')).toBe(true);
    });

    it('should handle minimal information', () => {
      const text = `Need Finance module for 100 employees`;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.length).toBeGreaterThan(0);
      expect(chips.some(c => c.type === 'employees')).toBe(true);
    });
  });

  describe('Complex Multi-Entity Scenarios', () => {
    it('should extract multi-branch operations', () => {
      const text = `
        Retail chain operating 25 branches across Malaysia.
        Need centralized Finance and distributed POS integration.
      `;

      const chips = parseRFPTextEnhanced(text);

      const branchChip = chips.find(c => c.type === 'locations');
      expect(branchChip).toBeDefined();
      expect(Number(branchChip?.value)).toBeGreaterThanOrEqual(25);
    });

    it('should extract company codes', () => {
      const text = `
        Implementation requires 5 company codes for different business units.
      `;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'company_codes')).toBe(true);
    });

    it('should extract plants and facilities', () => {
      const text = `
        Manufacturing group with 8 plants across Southeast Asia.
        Need integrated production planning.
      `;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'plants')).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should extract integration count', () => {
      const text = `
        Must integrate with 5 legacy systems and connect to Salesforce CRM.
      `;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'integrations')).toBe(true);
    });

    it('should handle no integrations mentioned', () => {
      const text = `Simple standalone Finance implementation for 50 employees.`;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'employees')).toBe(true);
      // Should not crash even if no integrations found
    });
  });

  describe('Data Volume Scenarios', () => {
    it('should extract transaction volumes', () => {
      const text = `
        Processing 10,000 transactions per day.
        Need high-performance batch processing.
      `;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'data_volume')).toBe(true);
    });
  });

  describe('Revenue and Employee Patterns', () => {
    it('should extract revenue with currency', () => {
      const text = `Annual revenue of MYR 500 million.`;

      const chips = parseRFPTextEnhanced(text);

      expect(chips.some(c => c.type === 'revenue')).toBe(true);
    });

    it('should handle comma-separated numbers', () => {
      const text = `Company with 1,500 employees.`;

      const chips = parseRFPTextEnhanced(text);

      const empChip = chips.find(c => c.type === 'employees');
      expect(empChip).toBeDefined();
      expect(Number(empChip?.value)).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const chips = parseRFPTextEnhanced('');
      expect(chips).toBeDefined();
      expect(Array.isArray(chips)).toBe(true);
    });

    it('should handle text with no extractable data', () => {
      const text = `This is just random text with no relevant information.`;
      const chips = parseRFPTextEnhanced(text);
      expect(chips).toBeDefined();
      expect(Array.isArray(chips)).toBe(true);
    });

    it('should handle very large numbers', () => {
      const text = `Processing 1000000 records per month.`;
      const chips = parseRFPTextEnhanced(text);
      expect(chips.some(c => c.type === 'data_volume')).toBe(true);
    });

    it('should sanitize XSS attempts', () => {
      const text = `Company with <script>alert(1)</script> 500 employees`;
      const chips = parseRFPTextEnhanced(text);

      // Should extract employees without executing script
      expect(chips.some(c => c.type === 'employees')).toBe(true);
      // Evidence should not contain script tags
      chips.forEach(chip => {
        if (chip.evidence) {
          expect(chip.evidence).not.toContain('<script>');
        }
      });
    });
  });

  describe('Country Inference', () => {
    it('should infer locations from multiple countries', () => {
      const text = `
        Operating in Malaysia, Singapore, and Vietnam.
        Need multi-country deployment.
      `;

      const chips = parseRFPTextEnhanced(text);

      // Should have inferred locations based on countries
      const locChip = chips.find(c => c.type === 'locations' && c.metadata?.inferred);
      expect(locChip).toBeDefined();
    });

    it('should infer legal entities from countries', () => {
      const text = `Operating in Malaysia, Singapore, Thailand, and Vietnam.`;

      const chips = parseRFPTextEnhanced(text);

      // Should infer legal entities from countries
      const entityChip = chips.find(c => c.type === 'legal_entities' && c.metadata?.inferred);
      expect(entityChip).toBeDefined();
    });
  });

  describe('Multiplier Calculations', () => {
    it('should add multiplier metadata for high-impact factors', () => {
      const text = `Implementation for 5 legal entities across 10 locations.`;

      const chips = parseRFPTextEnhanced(text);

      const entityChip = chips.find(c => c.type === 'legal_entities');
      expect(entityChip?.metadata?.multiplier).toBeGreaterThan(1);

      const locChip = chips.find(c => c.type === 'locations');
      expect(locChip?.metadata?.multiplier).toBeGreaterThan(1);
    });
  });
});
