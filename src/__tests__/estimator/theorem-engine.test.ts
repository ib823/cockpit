/**
 * THEOREM ENGINE TESTS
 *
 * Unit tests for mathematical justification logic.
 */

import { describe, it, expect } from 'vitest';
import { TheoremEngine } from '@/lib/estimator/theorem-engine';
import { formulaEngine, PROFILE_PRESETS, type EstimatorInputs } from '@/lib/estimator/formula-engine';

describe('TheoremEngine', () => {
  const engine = new TheoremEngine();

  // Helper: Create baseline estimate
  const createBaselineEstimate = () => {
    const inputs: EstimatorInputs = {
      profile: PROFILE_PRESETS[1], // Mid-market
      modules: ['FI', 'CO', 'MM'],
      l3Items: [],
      integrations: 2,
      inAppExtensions: 0,
      btpExtensions: 0,
      countries: 1,
      entities: 1,
      languages: 1,
      peakSessions: 100
    };
    return { inputs, estimate: formulaEngine.calculateTotal(inputs) };
  };

  describe('paretoAnalysis', () => {
    it('should identify effort drivers', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.paretoAnalysis(estimate);

      expect(result.drivers).toHaveLength(5); // Base, SB, PC, OSG, FW
      expect(result.drivers[0].label).toBeDefined();
      expect(result.drivers[0].effortMD).toBeGreaterThan(0);
      expect(result.drivers[0].percentOfTotal).toBeGreaterThan(0);
    });

    it('should sort by effort descending', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.paretoAnalysis(estimate);

      for (let i = 0; i < result.drivers.length - 1; i++) {
        expect(result.drivers[i].effortMD).toBeGreaterThanOrEqual(
          result.drivers[i + 1].effortMD
        );
      }
    });

    it('should calculate cumulative percentages', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.paretoAnalysis(estimate);

      const lastCumulative = result.drivers[result.drivers.length - 1].cumulativePercent;
      expect(lastCumulative).toBeCloseTo(100, 0);
    });

    it('should identify top 80% drivers', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.paretoAnalysis(estimate);

      expect(result.top80Percent.length).toBeGreaterThan(0);
      expect(result.top80Percent.length).toBeLessThanOrEqual(result.drivers.length);
    });

    it('should generate actionable recommendation', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.paretoAnalysis(estimate);

      expect(result.recommendation).toContain('Focus');
      expect(result.recommendation).toMatch(/\d+%/); // Contains percentage
    });
  });

  describe('regressionAnalysis', () => {
    it('should return valid regression data', () => {
      const result = engine.regressionAnalysis();

      expect(result.projectCount).toBeGreaterThan(0);
      expect(result.variables.length).toBeGreaterThan(0);
      expect(result.modelFit.rSquared).toBeGreaterThan(0);
      expect(result.modelFit.rSquared).toBeLessThanOrEqual(1);
    });

    it('should have significant variables', () => {
      const result = engine.regressionAnalysis();

      result.variables.forEach((variable) => {
        expect(variable.beta).toBeDefined();
        expect(variable.pValue).toBeDefined();
        expect(variable.confidenceInterval).toHaveLength(2);
        expect(variable.confidenceInterval[0]).toBeLessThan(variable.confidenceInterval[1]);
      });
    });

    it('should report good model fit', () => {
      const result = engine.regressionAnalysis();

      expect(result.modelFit.rSquared).toBeGreaterThan(0.7); // Good fit
      expect(result.modelFit.mape).toBeLessThan(20); // <20% error
    });
  });

  describe('sensitivityAnalysis', () => {
    it('should analyze input sensitivity', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.sensitivityAnalysis(inputs, estimate);

      expect(result.baselineEstimate).toBe(estimate.totalEffort);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('should calculate swings correctly', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.sensitivityAnalysis(inputs, estimate);

      result.factors.forEach((factor) => {
        expect(factor.lowEstimate).toBeLessThan(factor.highEstimate);
        expect(factor.swingMD).toBeGreaterThan(0);
        expect(factor.swingPercent).toBeGreaterThan(0);
      });
    });

    it('should sort by swing magnitude', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.sensitivityAnalysis(inputs, estimate);

      for (let i = 0; i < result.factors.length - 1; i++) {
        expect(result.factors[i].swingMD).toBeGreaterThanOrEqual(
          result.factors[i + 1].swingMD
        );
      }
    });

    it('should identify most and least sensitive factors', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.sensitivityAnalysis(inputs, estimate);

      expect(result.mostSensitive).toBeDefined();
      expect(result.leastSensitive).toBeDefined();
      expect(result.mostSensitive).not.toBe('');
      expect(result.leastSensitive).not.toBe('');
    });
  });

  describe('benchmarkValidation', () => {
    it('should compare against benchmarks', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.benchmarkValidation(estimate, inputs);

      expect(result.yourEstimate).toBe(estimate.totalEffort);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
    });

    it('should calculate median variance', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.benchmarkValidation(estimate, inputs);

      expect(result.vsMedian).toBeDefined();
      expect(result.vsMedianPercent).toBeDefined();
    });

    it('should provide similar projects', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.benchmarkValidation(estimate, inputs);

      expect(result.similarProjects.length).toBeGreaterThan(0);
      result.similarProjects.forEach((project) => {
        expect(project.name).toBeDefined();
        expect(project.estimateMD).toBeGreaterThan(0);
        expect(project.similarity).toBeGreaterThan(0);
        expect(project.similarity).toBeLessThanOrEqual(1);
      });
    });

    it('should perform per-user sanity check', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.benchmarkValidation(estimate, inputs);

      expect(result.perUserCheck.yourValue).toBeGreaterThan(0);
      expect(result.perUserCheck.benchmarkRange).toHaveLength(2);
      expect(result.perUserCheck.withinRange).toBeDefined();
    });
  });

  describe('confidenceInterval', () => {
    it('should provide three estimates', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.confidenceInterval(estimate);

      expect(result.optimistic).toBeLessThan(result.realistic);
      expect(result.realistic).toBe(estimate.totalEffort);
      expect(result.realistic).toBeLessThan(result.pessimistic);
    });

    it('should use standard ranges', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.confidenceInterval(estimate);

      // Optimistic = 85% of baseline
      expect(result.optimistic).toBeCloseTo(estimate.totalEffort * 0.85, 0);

      // Pessimistic = 120% of baseline
      expect(result.pessimistic).toBeCloseTo(estimate.totalEffort * 1.2, 0);
    });

    it('should report confidence level', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.confidenceInterval(estimate);

      expect(result.confidenceLevel).toBeGreaterThan(0);
      expect(result.confidenceLevel).toBeLessThanOrEqual(100);
    });
  });

  describe('effortCalibration', () => {
    it('should adjust for junior team', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.effortCalibration(estimate, 1, '2508');

      expect(result.calibrationFactor).toBeGreaterThan(1); // Uplift for junior team
      expect(result.adjustedEstimate).toBeGreaterThan(estimate.totalEffort);
    });

    it('should adjust for experienced team', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.effortCalibration(estimate, 5, '2508');

      expect(result.calibrationFactor).toBeLessThan(1); // Discount for experienced team
      expect(result.adjustedEstimate).toBeLessThan(estimate.totalEffort);
    });

    it('should adjust for latest release', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.effortCalibration(estimate, 3, '2508');

      expect(result.l3Maturity).toBe('2508');
      expect(result.calibrationFactor).toBeGreaterThan(0);
    });

    it('should cap adjustments at ±20%', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.effortCalibration(estimate, 0, '2508'); // Extreme junior

      expect(result.calibrationFactor).toBeGreaterThanOrEqual(0.85);
      expect(result.calibrationFactor).toBeLessThanOrEqual(1.2);
    });

    it('should provide reasoning', () => {
      const { estimate } = createBaselineEstimate();
      const result = engine.effortCalibration(estimate, 1, '2508');

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('generateAllTheorems', () => {
    it('should generate all theorem types', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.generateAllTheorems(inputs, estimate);

      expect(result.pareto).toBeDefined();
      expect(result.regression).toBeDefined();
      expect(result.sensitivity).toBeDefined();
      expect(result.benchmark).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.calibration).toBeDefined();
    });

    it('should return consistent data', () => {
      const { inputs, estimate } = createBaselineEstimate();
      const result = engine.generateAllTheorems(inputs, estimate);

      // All should reference same baseline
      expect(result.pareto.drivers.reduce((sum, d) => sum + d.effortMD, 0)).toBeCloseTo(
        estimate.totalEffort,
        0
      );
      expect(result.sensitivity.baselineEstimate).toBe(estimate.totalEffort);
      expect(result.benchmark.yourEstimate).toBe(estimate.totalEffort);
      expect(result.confidence.realistic).toBe(estimate.totalEffort);
    });
  });
});
