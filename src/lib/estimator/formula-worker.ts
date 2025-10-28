/**
 * Keystone - Formula Engine Web Worker
 *
 * Off-main-thread calculation worker using Comlink for seamless communication.
 * Ensures UI remains responsive during complex calculations.
 *
 * Usage:
 *   import { wrap } from 'comlink';
 *   const worker = new Worker(new URL('./formula-worker.ts', import.meta.url));
 *   const api = wrap<FormulaWorkerAPI>(worker);
 *   const result = await api.calculateEstimate(inputs);
 */

import { FormulaEngine } from './formula-engine';
import type {
  EstimatorInputs,
  EstimatorResults,
  PhaseBreakdown,
  L3ScopeItem,
} from './types';
import { expose } from 'comlink';

/**
 * Worker API interface (exported for type safety in consumer code)
 */
export interface FormulaWorkerAPI {
  /**
   * Calculate total estimation with all components
   */
  calculateTotal(inputs: EstimatorInputs): EstimatorResults;

  /**
   * Generate warnings based on inputs and results
   */
  generateWarnings(inputs: EstimatorInputs, results: EstimatorResults): string[];

  /**
   * All-in-one calculation with results and warnings
   */
  calculateEstimate(inputs: EstimatorInputs): {
    results: EstimatorResults;
    warnings: string[];
  };

  /**
   * Calculate phase dates based on start date
   */
  calculatePhaseDates(phases: PhaseBreakdown[], startDate: Date): PhaseBreakdown[];

  /**
   * Detect Tier D items in selection
   */
  detectTierDItems(selectedItems: L3ScopeItem[]): string[];

  /**
   * Calculate individual coefficients (for debugging/transparency)
   */
  calculateCoefficients(inputs: EstimatorInputs): {
    Sb: number;
    Pc: number;
    Os: number;
  };
}

/**
 * Web Worker implementation
 */
class FormulaWorker implements FormulaWorkerAPI {
  private engine: FormulaEngine;

  constructor() {
    this.engine = new FormulaEngine();
    console.log('[FormulaWorker] Initialized in Web Worker context');
  }

  /**
   * Calculate total estimation
   */
  calculateTotal(inputs: EstimatorInputs): EstimatorResults {
    const startTime = performance.now();
    const results = this.engine.calculateTotal(inputs);
    const duration = performance.now() - startTime;

    console.log(`[FormulaWorker] Calculation completed in ${duration.toFixed(2)}ms`);
    console.log(`[FormulaWorker] Result: ${results.totalMD} MD over ${results.durationMonths.toFixed(1)} months`);

    return results;
  }

  /**
   * Generate warnings
   */
  generateWarnings(inputs: EstimatorInputs, results: EstimatorResults): string[] {
    return this.engine.generateWarnings(inputs, results);
  }

  /**
   * All-in-one calculation (most common use case)
   */
  calculateEstimate(inputs: EstimatorInputs): {
    results: EstimatorResults;
    warnings: string[];
  } {
    const startTime = performance.now();

    const results = this.engine.calculateTotal(inputs);
    const warnings = this.engine.generateWarnings(inputs, results);

    const duration = performance.now() - startTime;
    console.log(`[FormulaWorker] Full calculation completed in ${duration.toFixed(2)}ms`);

    return { results, warnings };
  }

  /**
   * Calculate phase dates
   */
  calculatePhaseDates(phases: PhaseBreakdown[], startDate: Date): PhaseBreakdown[] {
    return this.engine.calculatePhaseDates(phases, startDate);
  }

  /**
   * Detect Tier D items
   */
  detectTierDItems(selectedItems: L3ScopeItem[]): string[] {
    return this.engine.detectTierDItems(selectedItems);
  }

  /**
   * Calculate coefficients only (for transparency/debugging)
   */
  calculateCoefficients(inputs: EstimatorInputs): {
    Sb: number;
    Pc: number;
    Os: number;
  } {
    const Sb = this.engine.calculateScopeBreadth(
      inputs.selectedL3Items,
      inputs.integrations
    );
    const Pc = this.engine.calculateProcessComplexity(
      inputs.customForms,
      inputs.fitToStandard
    );
    const Os = this.engine.calculateOrgScale(
      inputs.legalEntities,
      inputs.countries,
      inputs.languages
    );

    return { Sb, Pc, Os };
  }
}

// Expose worker API via Comlink
expose(new FormulaWorker());
