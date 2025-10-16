/**
 * Sensitivity Analysis Engine
 *
 * Performs tornado chart analysis to identify which input variables have
 * the greatest impact on project duration and cost estimates.
 */

import { formulaEngine } from './formula-engine';
import type { EstimatorInputs, EstimatorResults } from './types';

export interface SensitivityResult {
  variable: string;
  baseline: number;
  lowImpact: number;
  highImpact: number;
  range: number;
  rangePercent: number;
  lowValue: number;
  highValue: number;
}

export interface SensitivityConfig {
  variableName: string;
  field: keyof EstimatorInputs;
  deltaPercent?: number;
  deltaAbsolute?: number;
  minValue?: number;
  maxValue?: number;
}

/**
 * Perform comprehensive sensitivity analysis
 */
export function performSensitivity(
  baseInputs: EstimatorInputs,
  metric: 'duration' | 'effort' = 'duration'
): SensitivityResult[] {
  const variables: SensitivityConfig[] = [
    { variableName: 'FTE', field: 'fte', deltaPercent: 0.2, minValue: 1 },
    { variableName: 'Utilization', field: 'utilization', deltaPercent: 0.1, minValue: 0.5, maxValue: 1.0 },
    { variableName: 'Overlap Factor', field: 'overlapFactor', deltaPercent: 0.1, minValue: 0.6, maxValue: 1.0 },
    { variableName: 'Integrations', field: 'integrations', deltaAbsolute: 2, minValue: 0 },
    { variableName: 'Custom Forms', field: 'customForms', deltaAbsolute: 2, minValue: 0 },
    { variableName: 'Fit to Standard', field: 'fitToStandard', deltaPercent: 0.1, minValue: 0, maxValue: 1.0 },
    { variableName: 'Legal Entities', field: 'legalEntities', deltaAbsolute: 1, minValue: 1 },
    { variableName: 'Countries', field: 'countries', deltaAbsolute: 1, minValue: 1 },
    { variableName: 'Languages', field: 'languages', deltaAbsolute: 1, minValue: 1 },
  ];

  const baseline = formulaEngine.calculateTotal(baseInputs);
  const baselineValue = metric === 'duration' ? baseline.durationMonths : baseline.totalMD;

  const results: SensitivityResult[] = variables.map(config => {
    const lowInputs = { ...baseInputs };
    const highInputs = { ...baseInputs };

    const currentValue = baseInputs[config.field] as number;

    // Calculate delta
    let delta: number;
    if (config.deltaPercent) {
      delta = currentValue * config.deltaPercent;
    } else if (config.deltaAbsolute) {
      delta = config.deltaAbsolute;
    } else {
      delta = currentValue * 0.1; // Default 10%
    }

    // Apply bounds
    let lowValue = currentValue - delta;
    let highValue = currentValue + delta;

    if (config.minValue !== undefined) {
      lowValue = Math.max(config.minValue, lowValue);
    }
    if (config.maxValue !== undefined) {
      highValue = Math.min(config.maxValue, highValue);
    }

    // Special handling for selectedL3Items
    if (config.field === 'selectedL3Items') {
      const itemCount = (currentValue as any).length || 0;
      const deltaItems = Math.max(1, Math.floor(itemCount * 0.2));
      lowValue = itemCount - deltaItems;
      highValue = itemCount + deltaItems;
    }

    // Update inputs
    (lowInputs[config.field] as any) = lowValue;
    (highInputs[config.field] as any) = highValue;

    // Calculate impacts
    let lowResult: EstimatorResults;
    let highResult: EstimatorResults;

    try {
      lowResult = formulaEngine.calculateTotal(lowInputs);
      highResult = formulaEngine.calculateTotal(highInputs);
    } catch (error) {
      // If calculation fails, return zero impact
      return {
        variable: config.variableName,
        baseline: baselineValue,
        lowImpact: baselineValue,
        highImpact: baselineValue,
        range: 0,
        rangePercent: 0,
        lowValue,
        highValue,
      };
    }

    const lowImpact = metric === 'duration' ? lowResult.durationMonths : lowResult.totalMD;
    const highImpact = metric === 'duration' ? highResult.durationMonths : highResult.totalMD;
    const range = Math.abs(highImpact - lowImpact);
    const rangePercent = (range / baselineValue) * 100;

    return {
      variable: config.variableName,
      baseline: baselineValue,
      lowImpact,
      highImpact,
      range,
      rangePercent,
      lowValue,
      highValue,
    };
  });

  // Sort by range (descending) - highest impact first
  return results.sort((a, b) => b.range - a.range);
}

/**
 * Identify the most critical input variables (top 3)
 */
export function getCriticalVariables(results: SensitivityResult[]): string[] {
  return results
    .slice(0, 3)
    .map(r => r.variable);
}

/**
 * Generate sensitivity insights
 */
export function generateSensitivityInsights(results: SensitivityResult[]): string[] {
  const insights: string[] = [];

  if (results.length === 0) return insights;

  const topVariable = results[0];
  insights.push(
    `${topVariable.variable} has the highest impact on ${topVariable.rangePercent.toFixed(0)}% variation in estimates.`
  );

  const highImpactVars = results.filter(r => r.rangePercent > 15);
  if (highImpactVars.length > 1) {
    insights.push(
      `${highImpactVars.length} variables cause >15% estimate variation. Focus on: ${highImpactVars.map(r => r.variable).join(', ')}.`
    );
  }

  const lowImpactVars = results.filter(r => r.rangePercent < 5);
  if (lowImpactVars.length > 0) {
    insights.push(
      `${lowImpactVars.length} variables have minimal impact (<5%). These can use default values.`
    );
  }

  return insights;
}

/**
 * Calculate elasticity (% change in output / % change in input)
 */
export function calculateElasticity(
  baseInputs: EstimatorInputs,
  variable: keyof EstimatorInputs,
  delta: number = 0.01
): number {
  const baseline = formulaEngine.calculateTotal(baseInputs);
  const baselineDuration = baseline.durationMonths;

  const testInputs = { ...baseInputs };
  const currentValue = baseInputs[variable] as number;
  (testInputs[variable] as any) = currentValue * (1 + delta);

  try {
    const testResult = formulaEngine.calculateTotal(testInputs);
    const durationChange = testResult.durationMonths - baselineDuration;

    const outputChangePercent = (durationChange / baselineDuration) * 100;
    const inputChangePercent = delta * 100;

    return outputChangePercent / inputChangePercent;
  } catch {
    return 0;
  }
}
