/**
 * BENCHMARK COMPARATOR
 *
 * Compares project estimates against industry benchmarks
 * Provides variance analysis and recommendations
 */

import type { Phase } from "@/types/core";
import {
  BENCHMARK_METRICS,
  INDUSTRY_FACTORS,
  GEOGRAPHIC_FACTORS,
  determineComplexity,
  type ComplexityLevel,
  type ProjectCharacteristics,
  type BenchmarkMetric,
} from "./benchmark-data";

export type VarianceStatus = "under" | "on-track" | "over" | "significantly-over";

export interface BenchmarkComparison {
  metricId: string;
  metricName: string;
  actual: number;
  benchmark: {
    min: number;
    max: number;
    median: number;
  };
  variance: number; // Percentage variance from median
  status: VarianceStatus;
  recommendation?: string;
  unit: string;
}

export interface ProjectBenchmarkReport {
  complexity: ComplexityLevel;
  complexityScore: number;
  industryFactor: number;
  geographicFactor: number;
  comparisons: BenchmarkComparison[];
  overallStatus: VarianceStatus;
  summary: {
    totalMetrics: number;
    onTrack: number;
    over: number;
    under: number;
    significantlyOver: number;
  };
  recommendations: string[];
}

/**
 * Calculate variance status from percentage
 */
function getVarianceStatus(variancePercent: number): VarianceStatus {
  if (variancePercent < -20) return "under";
  if (variancePercent <= 10) return "on-track";
  if (variancePercent <= 30) return "over";
  return "significantly-over";
}

/**
 * Generate recommendation based on variance
 */
function generateRecommendation(
  metric: BenchmarkMetric,
  variance: number,
  status: VarianceStatus
): string | undefined {
  if (status === "on-track") return undefined;

  const metricName = metric.name.toLowerCase();

  if (status === "under") {
    if (metric.category === "duration") {
      return `Your ${metricName} is ${Math.abs(variance).toFixed(0)}% below industry average. Ensure adequate time for quality assurance.`;
    }
    if (metric.category === "resources") {
      return `Your team size is ${Math.abs(variance).toFixed(0)}% below industry average. Consider if resources are sufficient for scope.`;
    }
  }

  if (status === "over" || status === "significantly-over") {
    const severity = status === "significantly-over" ? "significantly" : "moderately";

    if (metric.category === "duration") {
      return `Your ${metricName} is ${severity} above industry average (+${variance.toFixed(0)}%). Review scope and efficiency opportunities.`;
    }
    if (metric.category === "resources") {
      return `Your team size is ${severity} above industry average (+${variance.toFixed(0)}%). Validate resource requirements and utilization.`;
    }
    if (metric.category === "cost") {
      return `Your cost estimate is ${severity} above industry average (+${variance.toFixed(0)}%). Review pricing and scope assumptions.`;
    }
  }

  return undefined;
}

/**
 * Compare project against benchmarks
 */
export function compareToBenchmarks(
  phases: Phase[],
  projectChars: ProjectCharacteristics,
  industry?: string,
  country?: string
): ProjectBenchmarkReport {
  // Determine complexity
  const complexity = determineComplexity(projectChars);

  // Get adjustment factors
  const industryFactor =
    industry && INDUSTRY_FACTORS[industry] ? INDUSTRY_FACTORS[industry].multiplier : 1.0;

  const geographicFactor =
    country && GEOGRAPHIC_FACTORS[country] ? GEOGRAPHIC_FACTORS[country].multiplier : 1.0;

  // Calculate actual metrics from phases
  const actualMetrics = calculateActualMetrics(phases, projectChars);

  // Compare each metric
  const comparisons: BenchmarkComparison[] = [];

  for (const metric of BENCHMARK_METRICS) {
    const actual = actualMetrics[metric.id];
    if (actual === undefined) continue;

    const benchmark = metric[complexity];

    // Apply adjustment factors to benchmark
    const adjustedBenchmark = {
      min: benchmark.min * industryFactor * geographicFactor,
      max: benchmark.max * industryFactor * geographicFactor,
      median: benchmark.median * industryFactor * geographicFactor,
    };

    // Calculate variance from median
    const variance = ((actual - adjustedBenchmark.median) / adjustedBenchmark.median) * 100;
    const status = getVarianceStatus(variance);
    const recommendation = generateRecommendation(metric, variance, status);

    comparisons.push({
      metricId: metric.id,
      metricName: metric.name,
      actual,
      benchmark: adjustedBenchmark,
      variance,
      status,
      recommendation,
      unit: metric.unit,
    });
  }

  // Calculate summary
  const summary = {
    totalMetrics: comparisons.length,
    onTrack: comparisons.filter((c) => c.status === "on-track").length,
    over: comparisons.filter((c) => c.status === "over").length,
    under: comparisons.filter((c) => c.status === "under").length,
    significantlyOver: comparisons.filter((c) => c.status === "significantly-over").length,
  };

  // Determine overall status
  const overallStatus: VarianceStatus =
    summary.significantlyOver > 0
      ? "significantly-over"
      : summary.over > summary.onTrack
        ? "over"
        : summary.under > summary.onTrack
          ? "under"
          : "on-track";

  // Generate overall recommendations
  const recommendations = generateOverallRecommendations(comparisons, complexity, overallStatus);

  return {
    complexity,
    complexityScore: calculateComplexityScore(projectChars),
    industryFactor,
    geographicFactor,
    comparisons,
    overallStatus,
    summary,
    recommendations,
  };
}

/**
 * Calculate complexity score (used for internal analysis)
 */
function calculateComplexityScore(chars: ProjectCharacteristics): number {
  let score = 0;

  if (chars.moduleCount >= 8) score += 3;
  else if (chars.moduleCount >= 4) score += 2;
  else score += 1;

  if (chars.legalEntityCount >= 5) score += 2;
  else if (chars.legalEntityCount >= 2) score += 1;

  if (chars.userCount >= 1000) score += 2;
  else if (chars.userCount >= 200) score += 1;

  if (chars.integrationCount >= 10) score += 2;
  else if (chars.integrationCount >= 5) score += 1;

  if (chars.customizationLevel === "high") score += 2;
  else if (chars.customizationLevel === "medium") score += 1;

  if (chars.hasGlobalRollout) score += 1;
  if (chars.hasLegacyMigration) score += 1;

  return score;
}

/**
 * Calculate actual metrics from project phases
 */
function calculateActualMetrics(
  phases: Phase[],
  chars: ProjectCharacteristics
): Record<string, number> {
  const metrics: Record<string, number> = {};

  // Total duration in months
  const totalDays = phases.reduce((sum, p) => sum + p.workingDays, 0);
  metrics.total_duration = totalDays / 20; // Convert to months (20 working days/month)

  // Phase-specific durations
  const designPhase = phases.find(
    (p) => p.name.toLowerCase().includes("design") || p.name.toLowerCase().includes("blueprint")
  );
  if (designPhase) {
    metrics.design_phase = designPhase.workingDays;
  }

  const buildPhase = phases.find(
    (p) => p.name.toLowerCase().includes("build") || p.name.toLowerCase().includes("realize")
  );
  if (buildPhase) {
    metrics.build_phase = buildPhase.workingDays;
  }

  const testPhase = phases.find(
    (p) => p.name.toLowerCase().includes("test") || p.name.toLowerCase().includes("uat")
  );
  if (testPhase) {
    metrics.test_phase = testPhase.workingDays;
  }

  // Team size metrics
  const allResources = phases.flatMap((p) => p.resources || []);
  const uniqueResources = new Set(
    allResources.map((r) => (typeof r === "string" ? r : r.role || r.name || ""))
  );
  metrics.team_size = uniqueResources.size;

  // Peak team size (max resources in any single phase)
  const peakTeamSize = Math.max(...phases.map((p) => p.resources?.length || 0));
  metrics.peak_team_size = peakTeamSize;

  // Consultant to employee ratio (if employee count provided)
  if (chars.userCount > 0 && metrics.team_size > 0) {
    metrics.consultant_ratio = metrics.team_size / chars.userCount;
  }

  // RICEFW per module
  if (chars.moduleCount > 0 && chars.customizationLevel) {
    const ricefwEstimate =
      chars.customizationLevel === "high"
        ? chars.moduleCount * 25
        : chars.customizationLevel === "medium"
          ? chars.moduleCount * 10
          : chars.moduleCount * 3;

    metrics.ricefw_per_module = ricefwEstimate / chars.moduleCount;
  }

  // Test coverage (assume 90% baseline for quality projects)
  metrics.test_coverage = 90;

  return metrics;
}

/**
 * Generate overall recommendations
 */
function generateOverallRecommendations(
  comparisons: BenchmarkComparison[],
  complexity: ComplexityLevel,
  overallStatus: VarianceStatus
): string[] {
  const recommendations: string[] = [];

  // Add complexity-specific guidance
  if (complexity === "complex") {
    recommendations.push(
      "This is a complex implementation. Ensure strong governance and risk management processes."
    );
  } else if (complexity === "simple") {
    recommendations.push(
      "This is a relatively straightforward implementation. Consider accelerated delivery approaches."
    );
  }

  // Add status-specific guidance
  if (overallStatus === "significantly-over") {
    recommendations.push(
      "Multiple metrics significantly exceed industry benchmarks. Review scope, assumptions, and delivery approach."
    );
  } else if (overallStatus === "over") {
    recommendations.push(
      "Some metrics exceed industry benchmarks. Validate estimates and identify optimization opportunities."
    );
  } else if (overallStatus === "under") {
    recommendations.push(
      "Some metrics are below industry benchmarks. Ensure adequate time and resources for quality delivery."
    );
  } else {
    recommendations.push(
      "Your estimates align well with industry benchmarks. Proceed with confidence."
    );
  }

  // Add specific metric recommendations
  const significantVariances = comparisons.filter(
    (c) => c.status === "significantly-over" || (c.status === "under" && c.variance < -30)
  );

  if (significantVariances.length > 0) {
    recommendations.push(
      `Focus attention on: ${significantVariances.map((c) => c.metricName).join(", ")}`
    );
  }

  return recommendations;
}

/**
 * Format variance for display
 */
export function formatVariance(variance: number): string {
  const prefix = variance > 0 ? "+" : "";
  return `${prefix}${variance.toFixed(1)}%`;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: VarianceStatus): string {
  switch (status) {
    case "under":
      return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
    case "on-track":
      return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    case "over":
      return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "significantly-over":
      return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
  }
}

/**
 * Get status label for UI
 */
export function getStatusLabel(status: VarianceStatus): string {
  switch (status) {
    case "under":
      return "Below Benchmark";
    case "on-track":
      return "On Track";
    case "over":
      return "Above Benchmark";
    case "significantly-over":
      return "Significantly Above";
  }
}
