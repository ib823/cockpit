/**
 * PERT (Program Evaluation and Review Technique) Engine
 *
 * Provides uncertainty analysis for project estimates using three-point estimation.
 * Calculates expected values, standard deviation, and confidence intervals.
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
    p50: number; // 50th percentile (median)
    p80: number; // 80th percentile
    p90: number; // 90th percentile
    p95: number; // 95th percentile
  };
}

export type ConfidenceLevel = "low" | "medium" | "high";

export class PERTEngine {
  /**
   * Calculate PERT metrics from three-point estimates
   */
  calculate(inputs: PERTInputs): PERTResults {
    const { optimistic: O, mostLikely: M, pessimistic: P } = inputs;

    // Validate inputs
    if (O > M || M > P) {
      throw new Error("Invalid PERT inputs: must satisfy O ≤ M ≤ P");
    }

    // PERT Expected Value: E = (O + 4M + P) / 6
    const expected = (O + 4 * M + P) / 6;

    // Standard Deviation: σ = (P - O) / 6
    const stdDev = (P - O) / 6;

    // Variance: σ²
    const variance = stdDev ** 2;

    // Confidence intervals using normal distribution z-scores
    // P50 = E (50th percentile)
    // P80 = E + 0.84σ (80th percentile)
    // P90 = E + 1.28σ (90th percentile)
    // P95 = E + 1.645σ (95th percentile)
    return {
      expected,
      standardDeviation: stdDev,
      variance,
      confidenceInterval: {
        p50: expected,
        p80: expected + 0.84 * stdDev,
        p90: expected + 1.28 * stdDev,
        p95: expected + 1.645 * stdDev,
      },
    };
  }

  /**
   * Add uncertainty to a baseline estimate based on confidence level
   */
  addUncertainty(baselineMonths: number, confidenceLevel: ConfidenceLevel): PERTResults {
    const multipliers = {
      low: { O: 0.85, M: 1.0, P: 1.15 }, // ±15% variation
      medium: { O: 0.8, M: 1.0, P: 1.3 }, // -20%/+30% variation
      high: { O: 0.7, M: 1.0, P: 1.5 }, // -30%/+50% variation
    };

    const mult = multipliers[confidenceLevel];

    return this.calculate({
      optimistic: baselineMonths * mult.O,
      mostLikely: baselineMonths * mult.M,
      pessimistic: baselineMonths * mult.P,
    });
  }

  /**
   * Calculate cumulative probability for a given duration
   */
  cumulativeProbability(duration: number, pert: PERTResults): number {
    // Using normal distribution CDF approximation
    const z = (duration - pert.expected) / pert.standardDeviation;

    // Approximation of standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p =
      d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return z >= 0 ? 1 - p : p;
  }

  /**
   * Generate duration range for visualization (10th to 95th percentile)
   */
  getDurationRange(pert: PERTResults): { min: number; max: number } {
    // P10 = E - 1.28σ
    // P95 = E + 1.645σ
    return {
      min: Math.max(0, pert.expected - 1.28 * pert.standardDeviation),
      max: pert.confidenceInterval.p95,
    };
  }
}

export const pertEngine = new PERTEngine();
