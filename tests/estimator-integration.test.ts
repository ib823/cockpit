/**
 * ESTIMATOR INTEGRATION TEST
 *
 * End-to-end flow testing complete estimation workflow.
 */

import { describe, it, expect } from 'vitest';
import { formulaEngine, PROFILE_PRESETS, type EstimatorInputs } from '@/lib/estimator/formula-engine';
import { theoremEngine } from '@/lib/estimator/theorem-engine';
import { l3Catalog } from '@/lib/estimator/l3-catalog';

describe('Estimator Integration', () => {
  describe('Quick Estimate Flow (Estimator Page)', () => {
    it('should complete estimate in 3 inputs', () => {
      // Step 1: Select profile
      const profile = PROFILE_PRESETS[0]; // Malaysia SME
      expect(profile.name).toBe('Malaysia SME (Finance)');
      expect(profile.bce).toBe(378);

      // Step 2: Set complexity (implicit in profile)
      expect(profile.complexity).toBe(2);

      // Step 3: Add extras (optional)
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      // Calculate
      const estimate = formulaEngine.calculateTotal(inputs);

      // Verify result
      expect(estimate.totalEffort).toBeGreaterThan(0);
      expect(estimate.duration.months).toBeGreaterThan(0);
      expect(estimate.cost.amount).toBeGreaterThan(0);
      expect(estimate.description).toContain('integrations');
    });

    it('should update instantly on input change', () => {
      const profile = PROFILE_PRESETS[0];

      // Initial estimate (0 integrations)
      const inputs1: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 0,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };
      const estimate1 = formulaEngine.calculateTotal(inputs1);

      // Updated estimate (2 integrations)
      const inputs2: EstimatorInputs = {
        ...inputs1,
        integrations: 2
      };
      const estimate2 = formulaEngine.calculateTotal(inputs2);

      // Should increase effort
      expect(estimate2.totalEffort).toBeGreaterThan(estimate1.totalEffort);
      expect(estimate2.sbEffort).toBeGreaterThan(0);
    });

    it('should provide confidence score', () => {
      const profile = PROFILE_PRESETS[1]; // Mid-market
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 2,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);

      expect(estimate.confidence).toBeGreaterThanOrEqual(50);
      expect(estimate.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Deep Analysis Flow (Whiteboard Page)', () => {
    it('should generate all theorems', () => {
      const profile = PROFILE_PRESETS[1];
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 1,
        btpExtensions: 0,
        countries: 2,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // Verify all theorems generated
      expect(theorems.pareto).toBeDefined();
      expect(theorems.regression).toBeDefined();
      expect(theorems.sensitivity).toBeDefined();
      expect(theorems.benchmark).toBeDefined();
      expect(theorems.confidence).toBeDefined();
      expect(theorems.calibration).toBeDefined();
    });

    it('should identify top effort drivers (Pareto)', () => {
      const profile = PROFILE_PRESETS[1];
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // Top driver should be base scope
      expect(theorems.pareto.drivers[0].category).toBe('base');
      expect(theorems.pareto.drivers[0].percentOfTotal).toBeGreaterThan(50);
    });

    it('should provide statistical validation (Regression)', () => {
      const profile = PROFILE_PRESETS[1];
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // Good model fit
      expect(theorems.regression.modelFit.rSquared).toBeGreaterThan(0.7);
      expect(theorems.regression.modelFit.mape).toBeLessThan(20);
      expect(theorems.regression.allSignificant).toBe(true);
    });

    it('should show input sensitivity (Sensitivity)', () => {
      const profile = PROFILE_PRESETS[1];
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 2,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // Most sensitive should be base effort
      expect(theorems.sensitivity.mostSensitive).toBe('Base effort');
      expect(theorems.sensitivity.factors.length).toBeGreaterThan(0);
    });

    it('should benchmark against industry (Validate)', () => {
      const profile = PROFILE_PRESETS[1];
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // Should provide percentile and confidence
      expect(theorems.benchmark.percentile).toBeGreaterThanOrEqual(0);
      expect(theorems.benchmark.percentile).toBeLessThanOrEqual(100);
      expect(theorems.benchmark.confidenceLevel).toBeGreaterThan(0);
    });

    it('should provide estimate ranges (Confidence)', () => {
      const profile = PROFILE_PRESETS[1];
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // Ranges should make sense
      expect(theorems.confidence.optimistic).toBeLessThan(theorems.confidence.realistic);
      expect(theorems.confidence.realistic).toBe(estimate.totalEffort);
      expect(theorems.confidence.realistic).toBeLessThan(theorems.confidence.pessimistic);
    });
  });

  describe('L3 Catalog Integration', () => {
    it('should load L3 items for selected modules', () => {
      // Get FI items
      const fiItems = l3Catalog.getByModule('FI');
      expect(fiItems.length).toBeGreaterThan(0);

      // Use in estimate
      const profile = PROFILE_PRESETS[0];
      const inputs: EstimatorInputs = {
        profile,
        modules: ['FI'],
        l3Items: fiItems.slice(0, 5), // First 5 items
        integrations: 0,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      expect(estimate.totalEffort).toBeGreaterThan(profile.bce);
    });

    it('should search L3 items by keyword', () => {
      const results = l3Catalog.search('invoice');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((item) => {
        const searchable = `${item.name} ${item.description} ${item.code}`.toLowerCase();
        expect(searchable).toContain('invoice');
      });
    });

    it('should filter by tier', () => {
      const tierB = l3Catalog.getByTier('B');
      expect(tierB.length).toBeGreaterThan(0);
      tierB.forEach((item) => {
        expect(item.tier).toBe('B');
        expect(item.coefficient).toBe(0.008);
      });
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full estimation cycle', () => {
      // 1. User selects profile on Estimator page
      const profile = PROFILE_PRESETS[1]; // Singapore Mid-Market

      // 2. User adjusts inputs
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 2,
        inAppExtensions: 1,
        btpExtensions: 0,
        countries: 2,
        entities: 1,
        languages: 1,
        peakSessions: 100
      };

      // 3. Get quick estimate
      const estimate = formulaEngine.calculateTotal(inputs);
      expect(estimate.totalEffort).toBeGreaterThan(0);

      // 4. User clicks "Open Whiteboard"
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // 5. User reviews Pareto tab
      const topDrivers = theorems.pareto.top80Percent;
      expect(topDrivers.length).toBeGreaterThan(0);

      // 6. User reviews Benchmark tab
      const percentile = theorems.benchmark.percentile;
      expect(percentile).toBeGreaterThanOrEqual(0);

      // 7. User reviews Confidence tab
      const ranges = theorems.confidence;
      expect(ranges.optimistic).toBeLessThan(ranges.pessimistic);

      // 8. User exports or presents
      expect(estimate.description).toBeDefined();
      expect(estimate.duration.months).toBeGreaterThan(0);
      expect(estimate.cost.amount).toBeGreaterThan(0);
    });

    it('should maintain consistency across all components', () => {
      const profile = PROFILE_PRESETS[2]; // Multi-country
      const inputs: EstimatorInputs = {
        profile,
        modules: profile.modules,
        l3Items: [],
        integrations: 3,
        inAppExtensions: 2,
        btpExtensions: 1,
        countries: 3,
        entities: 2,
        languages: 2,
        peakSessions: 500
      };

      const estimate = formulaEngine.calculateTotal(inputs);
      const theorems = theoremEngine.generateAllTheorems(inputs, estimate);

      // All should reference same baseline (within 1% due to rounding)
      const paretoTotal = theorems.pareto.drivers.reduce(
        (sum, d) => sum + d.effortMD,
        0
      );
      expect(Math.abs(paretoTotal - estimate.totalEffort)).toBeLessThan(estimate.totalEffort * 0.01);

      expect(theorems.sensitivity.baselineEstimate).toBe(estimate.totalEffort);
      expect(theorems.benchmark.yourEstimate).toBe(estimate.totalEffort);
      expect(theorems.confidence.realistic).toBe(estimate.totalEffort);
    });
  });
});
