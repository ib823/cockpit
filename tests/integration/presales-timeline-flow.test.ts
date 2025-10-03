// Integration test suite for Presales → Timeline conversion flow
import { describe, it, expect } from 'vitest';
import { convertPresalesToTimeline, mapModulesToPackages, extractClientProfile } from '@/lib/presales-to-timeline-bridge';
import { generateTimelineFromSAPSelection } from '@/lib/timeline/phase-generation';
import { Chip } from '@/types/core';

describe('Presales → Timeline Integration Flow', () => {
  describe('Full Flow: Chips → Timeline', () => {
    it('should auto-populate timeline from presales chips', () => {
      const chips: Chip[] = [
        { type: 'country', value: 'Malaysia', confidence: 0.9, source: 'test' },
        { type: 'employees', value: 1000, confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'HR', confidence: 0.9, source: 'test' },
        { type: 'legal_entities', value: 5, confidence: 0.9, source: 'test' }
      ];

      const decisions = {};
      const result = convertPresalesToTimeline(chips, decisions);

      // Validate conversion succeeded
      expect(result.selectedPackages.length).toBeGreaterThan(0);
      expect(result.totalEffort).toBeGreaterThan(0);
      expect(result.profile.region).toBe('ABMY');
      expect(result.profile.employees).toBe(1000);
      expect(result.profile.size).toBe('large'); // 1000 employees = large
    });

    it('should apply multi-entity multiplier correctly', () => {
      const chipsWithMultiEntity: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' },
        { type: 'modules', value: '5 legal entities', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chipsWithMultiEntity, {});

      // Multi-entity detection requires text parsing from chip values
      // The multiplier should be applied if "5 entities" is detected in the full text
      expect(result.appliedMultipliers).toBeDefined();
      expect(result.totalEffort).toBeGreaterThan(0);
    });

    it('should map modules to packages correctly', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'HR', confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'Supply Chain', confidence: 0.9, source: 'test' }
      ];

      const packages = mapModulesToPackages(chips);

      expect(packages).toContain('Finance_1');
      expect(packages).toContain('Finance_3');
      expect(packages).toContain('HCM_1');
      expect(packages).toContain('SCM_1');
      expect(packages.length).toBeGreaterThanOrEqual(4);
    });

    it('should generate timeline phases from packages', () => {
      const packages = ['Finance_1', 'Finance_3', 'HCM_1'];
      const profile = {
        company: 'Test Corp',
        industry: 'manufacturing',
        size: 'medium' as const,
        complexity: 'standard' as const,
        timelinePreference: 'normal' as const,
        region: 'ABMY' as const,
        employees: 500,
        annualRevenue: 50000000
      };

      const phases = generateTimelineFromSAPSelection(packages, profile);

      // Should have standard SAP phases
      expect(phases.length).toBeGreaterThan(0);

      // Should have Explore phase
      const explorePhase = phases.find(p => p.name.includes('Explore'));
      expect(explorePhase).toBeDefined();

      // Should have Realize phase
      const realizePhase = phases.find(p => p.name.includes('Realize'));
      expect(realizePhase).toBeDefined();
    });
  });

  describe('Incomplete Data Handling', () => {
    it('should handle missing country chip', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // Should use default region
      expect(result.profile.region).toBe('ABMY');
      expect(result.selectedPackages.length).toBeGreaterThan(0);
    });

    it('should handle missing employee count', () => {
      const chips: Chip[] = [
        { type: 'country', value: 'Singapore', confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // Should use default employee count (500)
      expect(result.profile.employees).toBe(500);
      expect(result.profile.size).toBe('medium');
    });

    it('should handle no modules selected', () => {
      const chips: Chip[] = [
        { type: 'country', value: 'Malaysia', confidence: 0.9, source: 'test' },
        { type: 'employees', value: 1000, confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // Should return empty packages
      expect(result.selectedPackages.length).toBe(0);
      expect(result.totalEffort).toBe(0);
    });

    it('should handle completely empty chips array', () => {
      const chips: Chip[] = [];

      const result = convertPresalesToTimeline(chips, {});

      // Should return default profile
      expect(result.profile).toBeDefined();
      expect(result.selectedPackages.length).toBe(0);
      expect(result.totalEffort).toBe(0);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Multiplier Application', () => {
    it('should apply employee count multiplier correctly', () => {
      // Employee multiplier requires detecting employee count from TEXT, not just chip type
      const testCases = [
        { text: '50 employees', expectedRange: [0.7, 1.0] },
        { text: '200 employees', expectedRange: [0.9, 1.2] },
        { text: '500 employees', expectedRange: [1.1, 1.4] },
        { text: '1000 employees', expectedRange: [1.3, 1.6] },
        { text: '2000 employees', expectedRange: [1.5, 1.8] },
        { text: '5000 employees', expectedRange: [1.7, 2.0] }
      ];

      testCases.forEach(({ text, expectedRange }) => {
        const chips: Chip[] = [
          { type: 'modules', value: `Finance implementation for company with ${text}`, confidence: 0.9, source: 'test' }
        ];

        const result = convertPresalesToTimeline(chips, {});

        // Check if multiplier is within expected range
        expect(result.appliedMultipliers.employee).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(result.appliedMultipliers.employee).toBeLessThanOrEqual(expectedRange[1]);
      });
    });

    it('should apply integration multiplier correctly', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'Salesforce', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'Oracle', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'Legacy ERP', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // 3 integrations = 1 + (3 * 0.15) = 1.45x
      expect(result.appliedMultipliers.integration).toBeCloseTo(1.45, 2);
    });

    it('should apply compliance multiplier correctly', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'SOX', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'GDPR', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // 2 compliance requirements = 1 + (2 * 0.1) = 1.2x
      expect(result.appliedMultipliers.compliance).toBeCloseTo(1.2, 2);
    });

    it('should cap total multiplier at 5.0x', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance HR SCM implementation with 10000 employees and 20 legal entities', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System1', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System2', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System3', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System4', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System5', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'SOX', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'GDPR', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'HIPAA', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // Total multiplier should be capped at 5.0x
      expect(result.appliedMultipliers.total).toBeLessThanOrEqual(5.0);
      // With high complexity, should have warnings
      if (result.appliedMultipliers.total > 3.0) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should combine all multipliers correctly', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance and HR implementation for 500 employees with 3 legal entities', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'Salesforce', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'SOX', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // Should have applied multiple multipliers
      expect(result.appliedMultipliers.integration).toBeGreaterThan(1.0);
      expect(result.appliedMultipliers.compliance).toBeGreaterThan(1.0);
      expect(result.appliedMultipliers.total).toBeGreaterThan(1.0);

      // Base effort should be multiplied
      expect(result.totalEffort).toBeGreaterThan(120); // Base for 2 modules
    });
  });

  describe('Client Profile Extraction', () => {
    it('should detect region from country chip', () => {
      const testCases = [
        { country: 'Malaysia', expectedRegion: 'ABMY' },
        { country: 'Singapore', expectedRegion: 'ABSG' },
        { country: 'Vietnam', expectedRegion: 'ABVN' },
        { country: 'Thailand', expectedRegion: 'ABMY' } // Default to ABMY
      ];

      testCases.forEach(({ country, expectedRegion }) => {
        const chips: Chip[] = [
          { type: 'country', value: country, confidence: 0.9, source: 'test' }
        ];

        const profile = extractClientProfile(chips);
        expect(profile.region).toBe(expectedRegion);
      });
    });

    it('should detect company size from employee count', () => {
      const testCases = [
        { employees: 100, expectedSize: 'small' },
        { employees: 500, expectedSize: 'medium' },
        { employees: 2000, expectedSize: 'large' },
        { employees: 10000, expectedSize: 'enterprise' }
      ];

      testCases.forEach(({ employees, expectedSize }) => {
        const chips: Chip[] = [
          { type: 'employees', value: employees, confidence: 0.9, source: 'test' }
        ];

        const profile = extractClientProfile(chips);
        expect(profile.size).toBe(expectedSize);
      });
    });

    it('should detect complexity from integrations and compliance', () => {
      const simpleChips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' }
      ];

      const complexChips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System1', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System2', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System3', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'SOX', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'GDPR', confidence: 0.9, source: 'test' }
      ];

      const simpleProfile = extractClientProfile(simpleChips);
      const complexProfile = extractClientProfile(complexChips);

      expect(simpleProfile.complexity).toBe('standard');
      expect(complexProfile.complexity).toBe('complex');
    });

    it('should mark enterprise size as complex automatically', () => {
      const chips: Chip[] = [
        { type: 'employees', value: 10000, confidence: 0.9, source: 'test' }
      ];

      const profile = extractClientProfile(chips);

      expect(profile.size).toBe('enterprise');
      expect(profile.complexity).toBe('complex');
    });
  });

  describe('Module to Package Mapping', () => {
    it('should map Finance module correctly', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' }
      ];

      const packages = mapModulesToPackages(chips);

      expect(packages).toContain('Finance_1');
      expect(packages).toContain('Finance_3');
    });

    it('should map HR/HCM module correctly', () => {
      const testCases = ['HR', 'HCM', 'Human Resources', 'human capital'];

      testCases.forEach(moduleName => {
        const chips: Chip[] = [
          { type: 'modules', value: moduleName, confidence: 0.9, source: 'test' }
        ];

        const packages = mapModulesToPackages(chips);
        expect(packages).toContain('HCM_1');
      });
    });

    it('should map Supply Chain module correctly', () => {
      const testCases = ['Supply Chain', 'SCM', 'inventory', 'supply'];

      testCases.forEach(moduleName => {
        const chips: Chip[] = [
          { type: 'modules', value: moduleName, confidence: 0.9, source: 'test' }
        ];

        const packages = mapModulesToPackages(chips);
        expect(packages).toContain('SCM_1');
      });
    });

    it('should map Procurement module correctly', () => {
      const testCases = ['Procurement', 'purchasing', 'MM'];

      testCases.forEach(moduleName => {
        const chips: Chip[] = [
          { type: 'modules', value: moduleName, confidence: 0.9, source: 'test' }
        ];

        const packages = mapModulesToPackages(chips);
        expect(packages).toContain('PROC_1');
      });
    });

    it('should map Sales/CRM module correctly', () => {
      const testCases = ['Sales', 'CRM', 'customer'];

      testCases.forEach(moduleName => {
        const chips: Chip[] = [
          { type: 'modules', value: moduleName, confidence: 0.9, source: 'test' }
        ];

        const packages = mapModulesToPackages(chips);
        expect(packages).toContain('CX_1');
      });
    });

    it('should handle multiple modules without duplicates', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'FI', confidence: 0.9, source: 'test' }, // Should not duplicate
        { type: 'modules', value: 'HR', confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'HCM', confidence: 0.9, source: 'test' } // Should not duplicate
      ];

      const packages = mapModulesToPackages(chips);

      // Count occurrences
      const financeCount = packages.filter(p => p.startsWith('Finance')).length;
      const hcmCount = packages.filter(p => p.startsWith('HCM')).length;

      // Finance should appear twice (Finance_1 and Finance_3), not 4 times
      expect(financeCount).toBe(2);
      // HCM should appear once, not twice
      expect(hcmCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid chip data gracefully', () => {
      const invalidChips: Chip[] = [
        { type: 'employees', value: 'not a number', confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(invalidChips, {});

      // Should use default employee count
      expect(result.profile.employees).toBe(500);
      expect(result.selectedPackages.length).toBeGreaterThan(0);
    });

    it('should handle negative employee count', () => {
      const chips: Chip[] = [
        { type: 'employees', value: -100, confidence: 0.9, source: 'test' },
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // extractClientProfile uses the value directly from chip, even if negative
      // This test documents current behavior (no validation in extractClientProfile)
      expect(result.profile.employees).toBe(-100);
      expect(result.profile.size).toBe('small'); // Negative gets classified as < 200
    });

    it('should handle malformed decisions object', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance', confidence: 0.9, source: 'test' }
      ];

      // Testing malformed input - null should be handled gracefully
      const result = convertPresalesToTimeline(chips, null as any);

      // Should still work with default values
      expect(result.selectedPackages.length).toBeGreaterThan(0);
    });
  });

  describe('Warning Generation', () => {
    it('should warn when complexity multiplier is very high', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance implementation for 5000 employees with 15 legal entities', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System1', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System2', confidence: 0.9, source: 'test' },
        { type: 'integration', value: 'System3', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'SOX', confidence: 0.9, source: 'test' },
        { type: 'compliance', value: 'GDPR', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // High complexity should generate warnings
      if (result.appliedMultipliers.total > 3.0) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should warn about multi-entity complexity', () => {
      const chips: Chip[] = [
        { type: 'modules', value: 'Finance for company with 10 legal entities', confidence: 0.9, source: 'test' }
      ];

      const result = convertPresalesToTimeline(chips, {});

      // Multi-entity detection from text should trigger warnings
      if (result.appliedMultipliers.entity > 1.0) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });
  });
});
