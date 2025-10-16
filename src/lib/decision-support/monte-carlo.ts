/**
 * Monte Carlo Simulation Engine
 *
 * Runs thousands of simulations with random variations to estimate
 * probability distributions for project outcomes.
 */

import type { EstimatorInputs, EstimatorResults } from '@/lib/estimator/types';

export interface MonteCarloConfig {
  iterations: number; // Number of simulations (e.g., 1000, 10000)
  variationFactors: {
    scopeBreadth: number; // ±% variation (e.g., 0.1 = ±10%)
    processComplexity: number;
    orgScale: number;
    fte: number;
    utilization: number;
  };
}

export interface MonteCarloResults {
  iterations: number;
  durationDistribution: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    percentiles: {
      p10: number;
      p50: number;
      p80: number;
      p90: number;
      p95: number;
    };
  };
  effortDistribution: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    percentiles: {
      p10: number;
      p50: number;
      p80: number;
      p90: number;
      p95: number;
    };
  };
  histogram: {
    durationBuckets: Array<{ range: string; count: number }>;
    effortBuckets: Array<{ range: string; count: number }>;
  };
}

export class MonteCarloEngine {
  /**
   * Run Monte Carlo simulation
   */
  async simulate(
    baselineInputs: EstimatorInputs,
    config: MonteCarloConfig,
    calculateFn: (inputs: EstimatorInputs) => Promise<EstimatorResults>
  ): Promise<MonteCarloResults> {
    const durations: number[] = [];
    const efforts: number[] = [];

    for (let i = 0; i < config.iterations; i++) {
      // Apply random variations to inputs
      const variedInputs = this.applyVariations(baselineInputs, config.variationFactors);

      // Run calculation
      const results = await calculateFn(variedInputs);

      durations.push(results.durationMonths);
      efforts.push(results.totalMD);
    }

    // Sort for percentile calculations
    durations.sort((a, b) => a - b);
    efforts.sort((a, b) => a - b);

    return {
      iterations: config.iterations,
      durationDistribution: this.calculateDistribution(durations),
      effortDistribution: this.calculateDistribution(efforts),
      histogram: {
        durationBuckets: this.createHistogram(durations, 10),
        effortBuckets: this.createHistogram(efforts, 10),
      },
    };
  }

  /**
   * Apply random variations to inputs
   */
  private applyVariations(
    inputs: EstimatorInputs,
    factors: MonteCarloConfig['variationFactors']
  ): EstimatorInputs {
    return {
      ...inputs,
      integrations: this.varyValue(inputs.integrations, factors.scopeBreadth),
      customForms: this.varyValue(inputs.customForms, factors.processComplexity),
      legalEntities: this.varyValue(inputs.legalEntities, factors.orgScale),
      fte: this.varyValue(inputs.fte, factors.fte),
      utilization: Math.max(
        0.5,
        Math.min(0.95, this.varyValue(inputs.utilization, factors.utilization))
      ),
    };
  }

  /**
   * Apply random variation to a value
   */
  private varyValue(value: number, factor: number): number {
    // Random value between -factor and +factor
    const variation = (Math.random() * 2 - 1) * factor;
    return Math.max(0, value * (1 + variation));
  }

  /**
   * Calculate distribution statistics
   */
  private calculateDistribution(
    values: number[]
  ): MonteCarloResults['durationDistribution'] {
    const n = values.length;
    const min = values[0];
    const max = values[n - 1];
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const median = values[Math.floor(n / 2)];

    // Standard deviation
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return {
      min,
      max,
      mean,
      median,
      stdDev,
      percentiles: {
        p10: values[Math.floor(n * 0.1)],
        p50: median,
        p80: values[Math.floor(n * 0.8)],
        p90: values[Math.floor(n * 0.9)],
        p95: values[Math.floor(n * 0.95)],
      },
    };
  }

  /**
   * Create histogram buckets
   */
  private createHistogram(
    values: number[],
    bucketCount: number
  ): Array<{ range: string; count: number }> {
    const min = values[0];
    const max = values[values.length - 1];
    const bucketSize = (max - min) / bucketCount;

    const buckets = Array(bucketCount)
      .fill(0)
      .map((_, i) => ({
        range: `${(min + i * bucketSize).toFixed(0)}-${(min + (i + 1) * bucketSize).toFixed(0)}`,
        count: 0,
      }));

    values.forEach(v => {
      const bucketIndex = Math.min(
        Math.floor((v - min) / bucketSize),
        bucketCount - 1
      );
      buckets[bucketIndex].count++;
    });

    return buckets;
  }
}

export const monteCarloEngine = new MonteCarloEngine();
