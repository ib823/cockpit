/**
 * PERT (Program Evaluation and Review Technique) Engine
 *
 * Provides uncertainty analysis for project duration estimates using three-point estimation
 * and probabilistic distributions.
 */

export interface PERTInputs {
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
}

export interface PERTResults {
  expected: number;
  standardDeviation: number;
  variance: number;
  confidenceInterval: {
    p10: number;
    p50: number;
    p80: number;
    p90: number;
    p95: number;
  };
}

export type UncertaintyLevel = 'low' | 'medium' | 'high';

export class PERTEngine {
  /**
   * Calculate PERT estimates from three-point inputs
   *
   * Expected = (O + 4M + P) / 6
   * StdDev = (P - O) / 6
   */
  calculate(inputs: PERTInputs): PERTResults {
    const { optimistic: O, mostLikely: M, pessimistic: P } = inputs;

    // Validate inputs
    if (O > M || M > P) {
      throw new Error('Invalid PERT inputs: optimistic ≤ most likely ≤ pessimistic');
    }

    if (O < 0 || M < 0 || P < 0) {
      throw new Error('PERT inputs must be non-negative');
    }

    // PERT weighted average
    const expected = (O + 4 * M + P) / 6;

    // Standard deviation (approximation)
    const stdDev = (P - O) / 6;

    const variance = stdDev ** 2;

    // Confidence intervals using normal distribution approximation
    // Z-scores: p10 = -1.28, p50 = 0, p80 = 0.84, p90 = 1.28, p95 = 1.645
    return {
      expected,
      standardDeviation: stdDev,
      variance,
      confidenceInterval: {
        p10: Math.max(0, expected - 1.28 * stdDev),
        p50: expected,
        p80: expected + 0.84 * stdDev,
        p90: expected + 1.28 * stdDev,
        p95: expected + 1.645 * stdDev,
      }
    };
  }

  /**
   * Add uncertainty to a baseline estimate based on confidence level
   *
   * @param baselineMonths - Deterministic estimate from formula engine
   * @param confidenceLevel - low (±15%), medium (±30%), high (±50%)
   */
  addUncertainty(
    baselineMonths: number,
    confidenceLevel: UncertaintyLevel = 'medium'
  ): PERTResults {
    const multipliers = {
      low: { O: 0.85, M: 1.0, P: 1.15 },      // ±15%
      medium: { O: 0.80, M: 1.0, P: 1.30 },   // -20%/+30%
      high: { O: 0.70, M: 1.0, P: 1.50 },     // -30%/+50%
    };

    const mult = multipliers[confidenceLevel];

    return this.calculate({
      optimistic: baselineMonths * mult.O,
      mostLikely: baselineMonths * mult.M,
      pessimistic: baselineMonths * mult.P,
    });
  }

  /**
   * Calculate probability of completing within target duration
   *
   * Uses normal distribution approximation
   */
  calculateCompletionProbability(
    pertResults: PERTResults,
    targetDuration: number
  ): number {
    const z = (targetDuration - pertResults.expected) / pertResults.standardDeviation;

    // Approximate cumulative normal distribution using error function
    // P(X ≤ target) = Φ(z)
    const probability = this.normalCDF(z);

    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Cumulative normal distribution approximation
   */
  private normalCDF(z: number): number {
    // Abramowitz & Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return z > 0 ? 1 - probability : probability;
  }

  /**
   * Generate risk assessment message
   */
  getRiskAssessment(pertResults: PERTResults, targetDuration?: number): string {
    if (!targetDuration) {
      return `Expected duration: ${pertResults.expected.toFixed(1)} months. ` +
             `90% confidence range: ${pertResults.confidenceInterval.p10.toFixed(1)} - ${pertResults.confidenceInterval.p90.toFixed(1)} months.`;
    }

    const probability = this.calculateCompletionProbability(pertResults, targetDuration);
    const percentile = Math.round(probability * 100);

    if (percentile >= 90) {
      return `✅ High confidence (${percentile}%) of completing within ${targetDuration.toFixed(1)} months.`;
    } else if (percentile >= 70) {
      return `⚠️ Moderate confidence (${percentile}%) of completing within ${targetDuration.toFixed(1)} months.`;
    } else if (percentile >= 50) {
      return `⚠️ Low confidence (${percentile}%) of completing within ${targetDuration.toFixed(1)} months. Consider buffer.`;
    } else {
      return `🚨 Very low confidence (${percentile}%) of completing within ${targetDuration.toFixed(1)} months. Significant risk.`;
    }
  }
}

/**
 * Singleton instance
 */
export const pertEngine = new PERTEngine();
