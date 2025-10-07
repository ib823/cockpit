"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Target,
} from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { usePresalesStore } from "@/stores/presales-store";
import {
  compareToBenchmarks,
  formatVariance,
  getStatusColor,
  getStatusLabel,
  type VarianceStatus,
  type BenchmarkComparison,
  type ProjectBenchmarkReport,
} from "@/lib/benchmarks/benchmark-comparator";
import type { ProjectCharacteristics } from "@/lib/benchmarks/benchmark-data";
import { cn } from "@/lib/utils";

/**
 * Variance icon component
 */
function VarianceIcon({ status }: { status: VarianceStatus }) {
  switch (status) {
    case 'under':
      return <TrendingDown className="w-4 h-4" />;
    case 'on-track':
      return <CheckCircle className="w-4 h-4" />;
    case 'over':
      return <TrendingUp className="w-4 h-4" />;
    case 'significantly-over':
      return <AlertTriangle className="w-4 h-4" />;
  }
}

/**
 * Metric card component
 */
function MetricCard({ comparison }: { comparison: BenchmarkComparison }) {
  const { actual, benchmark, variance, status, metricName, unit, recommendation } = comparison;

  // Format values based on unit
  const formatValue = (value: number) => {
    switch (unit) {
      case 'days':
        return `${Math.round(value)}d`;
      case 'months':
        return `${value.toFixed(1)}mo`;
      case 'fte':
        return `${Math.round(value)} FTE`;
      case 'ratio':
        return value.toFixed(2);
      case 'percentage':
        return `${Math.round(value)}%`;
      default:
        return value.toFixed(1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {metricName}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {formatValue(actual)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                getStatusColor(status)
              )}
            >
              <VarianceIcon status={status} />
              {formatVariance(variance)}
            </span>
          </div>
        </div>
      </div>

      {/* Benchmark range */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Benchmark Range</span>
          <span>Median: {formatValue(benchmark.median)}</span>
        </div>
        <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Benchmark range bar */}
          <div
            className="absolute h-full bg-green-200 dark:bg-green-800"
            style={{
              left: '0%',
              width: '100%',
            }}
          />
          {/* Median marker */}
          <div
            className="absolute h-full w-0.5 bg-green-600 dark:bg-green-400"
            style={{
              left: '50%',
            }}
          />
          {/* Actual value marker */}
          <div
            className="absolute h-full w-1 bg-gray-900 dark:bg-white"
            style={{
              left: `${Math.min(Math.max(((actual - benchmark.min) / (benchmark.max - benchmark.min)) * 100, 0), 100)}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>{formatValue(benchmark.min)}</span>
          <span>{formatValue(benchmark.max)}</span>
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{recommendation}</span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Overall status summary
 */
function StatusSummary({ report }: { report: ProjectBenchmarkReport }) {
  const { overallStatus, summary, complexity, recommendations } = report;

  const statusIcon =
    overallStatus === 'on-track' ? (
      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
    ) : overallStatus === 'significantly-over' ? (
      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
    ) : (
      <Info className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
    );

  return (
    <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-4 mb-4">
        {statusIcon}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {getStatusLabel(overallStatus)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Project Complexity: <span className="font-medium capitalize">{complexity}</span> •{' '}
            {summary.onTrack} of {summary.totalMetrics} metrics on track
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {summary.onTrack}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">On Track</div>
          </div>
          {summary.over > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                {summary.over}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Above</div>
            </div>
          )}
          {summary.under > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {summary.under}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Below</div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Recommendations
          </h4>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Main Benchmark Panel Component
 */
export function BenchmarkPanel() {
  const { phases } = useTimelineStore();
  const { chips, decisions } = usePresalesStore();

  // Extract project characteristics from chips and decisions
  const projectChars: ProjectCharacteristics = useMemo(() => {
    const moduleChips = chips.filter((c) => c.type === 'MODULES');
    const legalEntityChips = chips.filter((c) => c.type === 'LEGAL_ENTITIES');
    const userChips = chips.filter((c) => c.type === 'USERS' || c.type === 'EMPLOYEES');
    const integrationChips = chips.filter((c) => c.type === 'INTEGRATION');

    // Extract counts
    const moduleCount = decisions.modules?.length || moduleChips.length || 1;
    const legalEntityCount = legalEntityChips.length || 1;

    // Parse user count
    let userCount = 100; // Default
    if (userChips.length > 0) {
      const userValue = userChips[0].value;
      const match = typeof userValue === 'string' ? userValue.match(/\d+/) : null;
      if (match) {
        userCount = parseInt(match[0], 10);
      } else if (typeof userValue === 'number') {
        userCount = userValue;
      }
    }

    const integrationCount = integrationChips.length || 0;

    // Determine customization level
    const customizationLevel =
      decisions.complexity === 'high' ? 'high' :
      decisions.complexity === 'medium' ? 'medium' : 'low';

    // Check for global rollout
    const countryChips = chips.filter((c) => c.type === 'COUNTRY');
    const hasGlobalRollout = countryChips.length > 2;

    // Check for legacy migration
    const migrationChips = chips.filter((c) =>
      typeof c.value === 'string' && (
        c.value.toLowerCase().includes('migration') ||
        c.value.toLowerCase().includes('legacy')
      )
    );
    const hasLegacyMigration = migrationChips.length > 0;

    return {
      moduleCount,
      legalEntityCount,
      userCount,
      integrationCount,
      customizationLevel,
      hasGlobalRollout,
      hasLegacyMigration,
    };
  }, [chips, decisions]);

  // Get industry and country from chips
  const industry = chips.find((c) => c.type === 'INDUSTRY')?.value;
  const country = chips.find((c) => c.type === 'COUNTRY')?.value;

  // Generate benchmark report
  const report = useMemo(() => {
    const industryStr = typeof industry === 'string' ? industry : undefined;
    const countryStr = typeof country === 'string' ? country : undefined;
    return compareToBenchmarks(phases, projectChars, industryStr, countryStr);
  }, [phases, projectChars, industry, country]);

  // Filter to show only important metrics
  const importantComparisons = report.comparisons.filter((c) =>
    ['total_duration', 'design_phase', 'build_phase', 'test_phase', 'team_size', 'peak_team_size'].includes(c.metricId)
  );

  if (phases.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Generate a timeline to see benchmark comparisons</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Industry Benchmarks
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Compare your estimates against industry standards
          </p>
        </div>
      </div>

      {/* Overall Status */}
      <StatusSummary report={report} />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {importantComparisons.map((comparison) => (
          <MetricCard key={comparison.metricId} comparison={comparison} />
        ))}
      </div>

      {/* Adjustment Factors */}
      {(report.industryFactor !== 1.0 || report.geographicFactor !== 1.0) && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Adjustment Factors Applied
          </h4>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {industry && report.industryFactor !== 1.0 && (
              <div>
                <span className="font-medium">{industry}:</span>{' '}
                <span className={report.industryFactor > 1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                  {report.industryFactor}x
                </span>
              </div>
            )}
            {country && report.geographicFactor !== 1.0 && (
              <div>
                <span className="font-medium">{country}:</span>{' '}
                <span className={report.geographicFactor > 1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                  {report.geographicFactor}x
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
