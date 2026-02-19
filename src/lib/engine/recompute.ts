/**
 * Recompute Engine
 *
 * Central computation engine that ensures all derived values are calculated
 * consistently across the application. Single source of truth for calculations.
 *
 * Design principles:
 * - Pure functions (no side effects)
 * - Deterministic (same inputs → same outputs)
 * - Composable (small functions that combine)
 * - Type-safe (full TypeScript coverage)
 */

import { Phase } from "@/types/core";
import { RicefwItem, calculateRicefwSummary, FormItem, IntegrationItem } from "@/lib/ricefw/model";
import { calculateRicefwPhaseImpact } from "@/lib/ricefw/calculator";

// ============================================================================
// Types
// ============================================================================

export interface ProjectInputs {
  // Presales data
  chipCount?: number;
  completenessScore?: number;
  decisions?: Record<string, unknown>;

  // Timeline data
  phases?: Phase[];
  selectedPackages?: string[];

  // Estimation data
  ricefwItems?: RicefwItem[];
  formItems?: FormItem[];
  integrationItems?: IntegrationItem[];

  // Configuration
  averageHourlyRate?: number;
  region?: string;
}

export interface ComputedOutputs {
  // Effort calculations
  totalEffort: number;
  totalEffortPD: number;
  ricefwEffort: number;
  formEffort: number;
  integrationEffort: number;

  // Phase breakdowns
  phaseEffort: Record<string, number>;
  ricefwPhaseImpact: {
    explore: number;
    realize: number;
    deploy: number;
    total: number;
  };

  // Cost calculations
  totalCost: number;
  ricefwCost: number;
  formCost: number;
  integrationCost: number;
  phaseCost: Record<string, number>;

  // Timeline calculations
  totalDuration: number;
  earliestStart: Date | null;
  latestEnd: Date | null;

  // Validation
  isComplete: boolean;
  completenessScore: number;
  criticalGaps: string[];
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

const HOURS_PER_PERSON_DAY = 8;
const WORKING_DAYS_PER_WEEK = 5;

// ============================================================================
// Core Recompute Function
// ============================================================================

/**
 * Main recompute function - processes all inputs and returns all derived values
 */
export function recompute(inputs: ProjectInputs): ComputedOutputs {
  const {
    ricefwItems = [],
    formItems = [],
    integrationItems = [],
    phases = [],
    averageHourlyRate = 150,
    completenessScore = 0,
  } = inputs;

  // Calculate RICEFW totals
  const ricefwSummary = calculateRicefwSummary(ricefwItems, averageHourlyRate);
  const ricefwPhaseImpact = calculateRicefwPhaseImpact(ricefwItems);

  // Calculate Form totals
  const formEffort = formItems.reduce((sum, item) => sum + Number(item.effort), 0);
  const formCost = formEffort * HOURS_PER_PERSON_DAY * averageHourlyRate;

  // Calculate Integration totals
  const integrationEffort = integrationItems.reduce((sum, item) => sum + Number(item.effort), 0);
  const integrationCost = integrationEffort * HOURS_PER_PERSON_DAY * averageHourlyRate;

  // Calculate phase-based effort
  const phaseEffort: Record<string, number> = {};
  const phaseCost: Record<string, number> = {};

  for (const phase of phases) {
    const effort = phase.effort || 0;
    phaseEffort[phase.id] = effort;
    phaseCost[phase.id] = effort * HOURS_PER_PERSON_DAY * averageHourlyRate;
  }

  // Calculate totals
  const ricefwEffort = ricefwSummary.totals.effort;
  const ricefwCost = ricefwSummary.totals.cost;

  const totalEffortPD =
    ricefwEffort +
    formEffort +
    integrationEffort +
    phases.reduce((sum, p) => sum + (p.effort || 0), 0);

  const totalEffort = totalEffortPD * HOURS_PER_PERSON_DAY;

  const totalCost =
    ricefwCost +
    formCost +
    integrationCost +
    Object.values(phaseCost).reduce((sum, c) => sum + c, 0);

  // Calculate timeline metrics
  const { earliestStart, latestEnd, totalDuration } = calculateTimelineMetrics(phases);

  // Validation
  const { isComplete, criticalGaps, warnings } = validateProject({
    ...inputs,
    totalEffort: totalEffortPD,
  });

  return {
    // Effort
    totalEffort,
    totalEffortPD,
    ricefwEffort,
    formEffort,
    integrationEffort,

    // Phase breakdowns
    phaseEffort,
    ricefwPhaseImpact,

    // Costs
    totalCost,
    ricefwCost,
    formCost,
    integrationCost,
    phaseCost,

    // Timeline
    totalDuration,
    earliestStart,
    latestEnd,

    // Validation
    isComplete,
    completenessScore,
    criticalGaps,
    warnings,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate timeline metrics from phases
 */
function calculateTimelineMetrics(phases: Phase[]): {
  earliestStart: Date | null;
  latestEnd: Date | null;
  totalDuration: number;
} {
  if (phases.length === 0) {
    return { earliestStart: null, latestEnd: null, totalDuration: 0 };
  }

  // Phase type uses business days, not calendar dates
  // Calculate earliest start and total duration
  const minStartDay = Math.min(...phases.map((p) => p.startBusinessDay));
  const maxEndDay = Math.max(...phases.map((p) => p.startBusinessDay + p.workingDays));

  const totalDuration = maxEndDay - minStartDay;

  // For now, return null for dates since Phase type doesn't include calendar dates
  // These would need to be calculated using date-calculations.ts if needed
  return {
    earliestStart: null,
    latestEnd: null,
    totalDuration,
  };
}

/**
 * Validate project completeness and identify issues
 */
function validateProject(inputs: ProjectInputs & { totalEffort?: number }): {
  isComplete: boolean;
  criticalGaps: string[];
  warnings: string[];
} {
  const criticalGaps: string[] = [];
  const warnings: string[] = [];

  // Check completeness score
  const completenessScore = inputs.completenessScore || 0;
  if (completenessScore < 65) {
    criticalGaps.push(`Completeness score is ${completenessScore}% (minimum 65% required)`);
  }

  // Check RICEFW items
  if (!inputs.ricefwItems || inputs.ricefwItems.length === 0) {
    warnings.push(
      "No RICEFW items defined - consider adding reports, interfaces, conversions, etc."
    );
  }

  // Check phases
  if (!inputs.phases || inputs.phases.length === 0) {
    criticalGaps.push("No project phases defined");
  }

  // Check for excessive effort
  if (inputs.totalEffort && inputs.totalEffort > 1000) {
    warnings.push(`Total effort is ${inputs.totalEffort.toFixed(1)} PD - consider reviewing scope`);
  }

  // Check for unrealistic duration
  if (inputs.phases && inputs.phases.length > 0) {
    const { totalDuration } = calculateTimelineMetrics(inputs.phases);
    if (totalDuration > 730) {
      // 2 years
      warnings.push(
        `Project duration is ${totalDuration} days (>2 years) - consider phasing the implementation`
      );
    }
  }

  const isComplete = criticalGaps.length === 0;

  return { isComplete, criticalGaps, warnings };
}

// ============================================================================
// Incremental Recompute Functions
// ============================================================================

/**
 * Recompute only RICEFW-related values (for optimization)
 */
export function recomputeRicefw(
  ricefwItems: RicefwItem[],
  averageHourlyRate: number = 150
): Pick<ComputedOutputs, "ricefwEffort" | "ricefwCost" | "ricefwPhaseImpact"> {
  const ricefwSummary = calculateRicefwSummary(ricefwItems, averageHourlyRate);
  const ricefwPhaseImpact = calculateRicefwPhaseImpact(ricefwItems);

  return {
    ricefwEffort: ricefwSummary.totals.effort,
    ricefwCost: ricefwSummary.totals.cost,
    ricefwPhaseImpact,
  };
}

/**
 * Recompute only phase-related values (for optimization)
 */
export function recomputePhases(
  phases: Phase[],
  averageHourlyRate: number = 150
): Pick<
  ComputedOutputs,
  "phaseEffort" | "phaseCost" | "totalDuration" | "earliestStart" | "latestEnd"
> {
  const phaseEffort: Record<string, number> = {};
  const phaseCost: Record<string, number> = {};

  for (const phase of phases) {
    const effort = phase.effort || 0;
    phaseEffort[phase.id] = effort;
    phaseCost[phase.id] = effort * HOURS_PER_PERSON_DAY * averageHourlyRate;
  }

  const { earliestStart, latestEnd, totalDuration } = calculateTimelineMetrics(phases);

  return {
    phaseEffort,
    phaseCost,
    totalDuration,
    earliestStart,
    latestEnd,
  };
}

/**
 * Recompute only cost-related values (for optimization)
 */
export function recomputeCosts(
  inputs: ProjectInputs
): Pick<
  ComputedOutputs,
  "totalCost" | "ricefwCost" | "formCost" | "integrationCost" | "phaseCost"
> {
  const {
    ricefwItems = [],
    formItems = [],
    integrationItems = [],
    phases = [],
    averageHourlyRate = 150,
  } = inputs;

  const ricefwSummary = calculateRicefwSummary(ricefwItems, averageHourlyRate);
  const ricefwCost = ricefwSummary.totals.cost;

  const formEffort = formItems.reduce((sum, item) => sum + Number(item.effort), 0);
  const formCost = formEffort * HOURS_PER_PERSON_DAY * averageHourlyRate;

  const integrationEffort = integrationItems.reduce((sum, item) => sum + Number(item.effort), 0);
  const integrationCost = integrationEffort * HOURS_PER_PERSON_DAY * averageHourlyRate;

  const phaseCost: Record<string, number> = {};
  for (const phase of phases) {
    const effort = phase.effort || 0;
    phaseCost[phase.id] = effort * HOURS_PER_PERSON_DAY * averageHourlyRate;
  }

  const totalCost =
    ricefwCost +
    formCost +
    integrationCost +
    Object.values(phaseCost).reduce((sum, c) => sum + c, 0);

  return {
    totalCost,
    ricefwCost,
    formCost,
    integrationCost,
    phaseCost,
  };
}
