/**
 * Keystone - Formula Engine
 *
 * Core calculation logic for L3-based estimation following SAP Activate methodology
 *
 * Formula: E_total = E_FT + E_fixed + E_PMO
 * Where:
 * - E_FT = Base_FT × (1 + Sb) × (1 + Pc) × (1 + Os)
 * - E_fixed = Basis + Security & Auth
 * - E_PMO = Duration × PMO_rate (iterative)
 * - Duration = (E_total / Capacity) × Overlap
 */

import type { EstimatorInputs, EstimatorResults, PhaseBreakdown, L3ScopeItem } from "./types";

import { FORMULA_CONSTANTS, PHASE_WEIGHTS, validateInputs } from "./types";

/**
 * Main Formula Engine class
 */
export class FormulaEngine {
  /**
   * Calculate Scope Breadth coefficient (Sb)
   *
   * Formula: Sb = Σ(L3 coefficients) + (integrations × 0.02)
   */
  calculateScopeBreadth(selectedItems: L3ScopeItem[], integrations: number): number {
    const itemCoefficients = selectedItems
      .filter((item) => item.complexityMetrics?.defaultTier !== "D")
      .reduce((sum, item) => sum + (item.complexityMetrics?.coefficient ?? 0), 0);

    const integrationFactor = integrations * FORMULA_CONSTANTS.INTEGRATION_FACTOR;

    return Math.max(0, itemCoefficients + integrationFactor);
  }

  /**
   * Calculate Process Complexity coefficient (Pc)
   *
   * Formula: Pc = (extra_forms × 0.01) + ((1 - fit_to_standard) × 0.25)
   */
  calculateProcessComplexity(customForms: number, fitToStandard: number): number {
    const extraForms = Math.max(0, customForms - FORMULA_CONSTANTS.BASELINE_FORMS);
    const formsFactor = extraForms * FORMULA_CONSTANTS.EXTRA_FORM_FACTOR;

    const fitGap = Math.max(0, 1 - fitToStandard);
    const fitFactor = fitGap * FORMULA_CONSTANTS.FIT_GAP_FACTOR;

    return Math.max(0, formsFactor + fitFactor);
  }

  /**
   * Calculate Organizational Scale coefficient (Os)
   *
   * Formula: Os = (entities - 1) × 0.03 + (countries - 1) × 0.05 + (languages - 1) × 0.02
   */
  calculateOrgScale(legalEntities: number, countries: number, languages: number): number {
    const entitiesFactor = Math.max(0, legalEntities - 1) * FORMULA_CONSTANTS.ENTITY_FACTOR;
    const countriesFactor = Math.max(0, countries - 1) * FORMULA_CONSTANTS.COUNTRY_FACTOR;
    const languagesFactor = Math.max(0, languages - 1) * FORMULA_CONSTANTS.LANGUAGE_FACTOR;

    return Math.max(0, entitiesFactor + countriesFactor + languagesFactor);
  }

  /**
   * Calculate total estimation with PMO iteration
   *
   * This is the main calculation method that combines all coefficients and
   * performs iterative PMO calculation until convergence.
   */
  calculateTotal(inputs: EstimatorInputs): EstimatorResults {
    const validationErrors = validateInputs(inputs);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid inputs: ${validationErrors.map((e) => e.message).join(", ")}`);
    }

    // Step 1: Calculate coefficients
    const Sb = this.calculateScopeBreadth(inputs.selectedL3Items, inputs.integrations);
    const Pc = this.calculateProcessComplexity(inputs.customForms, inputs.fitToStandard);
    const Os = this.calculateOrgScale(inputs.legalEntities, inputs.countries, inputs.languages);

    // Step 2: Calculate functional/technical effort
    const E_FT = inputs.profile.baseFT * (1 + Sb) * (1 + Pc) * (1 + Os);

    // Step 3: Calculate fixed effort
    const E_fixed = inputs.profile.basis + inputs.profile.securityAuth;

    // Step 4: Calculate capacity (MD per month)
    const capacity = inputs.fte * FORMULA_CONSTANTS.WORKING_DAYS_PER_MONTH * inputs.utilization;

    if (capacity <= 0) {
      throw new Error("Capacity must be positive (check FTE and utilization values)");
    }

    // Step 5: Iterative PMO calculation
    let D = ((E_FT + E_fixed) / capacity) * inputs.overlapFactor;
    let E_PMO = 0;

    for (let i = 0; i < FORMULA_CONSTANTS.MAX_PMO_ITERATIONS; i++) {
      const D_prev = D;
      E_PMO = D * FORMULA_CONSTANTS.PMO_MONTHLY_RATE;
      D = ((E_FT + E_fixed + E_PMO) / capacity) * inputs.overlapFactor;

      if (Math.abs(D - D_prev) < FORMULA_CONSTANTS.PMO_CONVERGENCE_THRESHOLD) {
        break;
      }
    }

    const E_total = E_FT + E_fixed + E_PMO;

    // Step 6: Distribute across phases
    const phases = this.distributePhases(E_total, D);

    return {
      totalMD: E_total,
      durationMonths: D,
      pmoMD: E_PMO,
      phases,
      capacityPerMonth: capacity,
      coefficients: { Sb, Pc, Os },
      intermediateValues: {
        E_FT,
        E_fixed,
        D_raw: (E_FT + E_fixed) / capacity,
      },
    };
  }

  /**
   * Distribute total effort and duration across SAP Activate phases
   */
  private distributePhases(totalMD: number, totalDuration: number): PhaseBreakdown[] {
    const phases: PhaseBreakdown[] = [];

    for (const [phaseName, weight] of Object.entries(PHASE_WEIGHTS)) {
      phases.push({
        phaseName: phaseName as PhaseBreakdown["phaseName"],
        effortMD: totalMD * weight,
        durationMonths: totalDuration * weight,
      });
    }

    return phases;
  }

  /**
   * Calculate dates for each phase based on start date
   */
  calculatePhaseDates(phases: PhaseBreakdown[], startDate: Date): PhaseBreakdown[] {
    let currentDate = new Date(startDate);

    return phases.map((phase) => {
      const phaseStartDate = new Date(currentDate);
      const phaseEndDate = new Date(currentDate);
      phaseEndDate.setMonth(phaseEndDate.getMonth() + phase.durationMonths);

      currentDate = new Date(phaseEndDate);

      return { ...phase, startDate: phaseStartDate, endDate: phaseEndDate };
    });
  }

  /**
   * Detect Tier D items in selection
   */
  detectTierDItems(selectedItems: L3ScopeItem[]): string[] {
    return selectedItems
      .filter((item) => item.complexityMetrics?.defaultTier === "D")
      .map((item) => item.l3Code);
  }

  /**
   * Generate warnings based on inputs and results
   */
  generateWarnings(inputs: EstimatorInputs, results: EstimatorResults): string[] {
    const warnings: string[] = [];

    const tierDItems = this.detectTierDItems(inputs.selectedL3Items);
    if (tierDItems.length > 0) {
      warnings.push(
        `⚠️ ${tierDItems.length} Tier D items require custom pricing: ${tierDItems.join(", ")}`
      );
    }

    const totalComplexity =
      results.coefficients.Sb + results.coefficients.Pc + results.coefficients.Os;
    if (totalComplexity > 0.5) {
      warnings.push(
        `⚠️ High complexity detected (${(totalComplexity * 100).toFixed(0)}%). Consider phased rollout.`
      );
    }

    if (inputs.utilization < 0.7) {
      warnings.push(
        `⚠️ Low utilization (${(inputs.utilization * 100).toFixed(0)}%). This may indicate resource availability issues.`
      );
    }

    if (inputs.overlapFactor < 0.65) {
      warnings.push(
        `⚠️ Aggressive phase overlap (${(inputs.overlapFactor * 100).toFixed(0)}%). High risk of quality issues.`
      );
    }

    if (results.durationMonths > 12) {
      warnings.push(`⚠️ Duration exceeds 12 months. Consider splitting into multiple phases.`);
    }

    if (inputs.fte > 20) {
      warnings.push(
        `⚠️ Large team size (${inputs.fte} FTE). Coordination overhead may be underestimated.`
      );
    }

    return warnings;
  }
}

/**
 * Singleton instance for use throughout the application
 */
export const formulaEngine = new FormulaEngine();

/**
 * Quick calculation function for convenience
 */
export function calculateEstimate(inputs: EstimatorInputs): {
  results: EstimatorResults;
  warnings: string[];
} {
  const results = formulaEngine.calculateTotal(inputs);
  const warnings = formulaEngine.generateWarnings(inputs, results);

  return { results, warnings };
}

// Re-export types and constants for convenience
export type { EstimatorInputs, EstimatorResults, L3ScopeItem, Profile } from "./types";
export { AVAILABLE_PROFILES, DEFAULT_PROFILE } from "./types";

// Alias for backward compatibility with tests
export { AVAILABLE_PROFILES as PROFILE_PRESETS } from "./types";
