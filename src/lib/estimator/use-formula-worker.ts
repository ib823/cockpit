/**
 * Keystone - Formula Worker React Hook
 *
 * React hook for using the formula engine Web Worker.
 * Provides loading states, error handling, and automatic cleanup.
 *
 * Usage:
 *   const { calculate, calculating, error } = useFormulaWorker();
 *   const result = await calculate(inputs);
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wrap, Remote } from "comlink";
import type { FormulaWorkerAPI } from "./formula-worker";
import type { EstimatorInputs, EstimatorResults, PhaseBreakdown } from "./types";

/**
 * Hook return type
 */
export interface UseFormulaWorkerReturn {
  /**
   * Calculate estimate with results and warnings
   */
  calculate: (inputs: EstimatorInputs) => Promise<{
    results: EstimatorResults;
    warnings: string[];
  }>;

  /**
   * Calculate total only
   */
  calculateTotal: (inputs: EstimatorInputs) => Promise<EstimatorResults>;

  /**
   * Calculate phase dates
   */
  calculatePhaseDates: (phases: PhaseBreakdown[], startDate: Date) => Promise<PhaseBreakdown[]>;

  /**
   * Whether a calculation is in progress
   */
  calculating: boolean;

  /**
   * Last error encountered
   */
  error: Error | null;

  /**
   * Clear error state
   */
  clearError: () => void;

  /**
   * Worker ready state
   */
  ready: boolean;
}

/**
 * React hook for formula worker
 */
export function useFormulaWorker(): UseFormulaWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<FormulaWorkerAPI> | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize worker on mount
  useEffect(() => {
    console.log("[useFormulaWorker] Initializing Web Worker...");

    try {
      // Create worker with module type
      const worker = new Worker(new URL("./formula-worker.ts", import.meta.url), {
        type: "module",
      });

      // Wrap with Comlink
      const api = wrap<FormulaWorkerAPI>(worker);

      workerRef.current = worker;
      apiRef.current = api;
      setReady(true);

      console.log("[useFormulaWorker] ✅ Web Worker ready");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to initialize worker");
      console.error("[useFormulaWorker] ❌ Worker initialization failed:", error);
      setError(error);
      setReady(false);
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        console.log("[useFormulaWorker] Terminating Web Worker");
        workerRef.current.terminate();
        workerRef.current = null;
        apiRef.current = null;
      }
    };
  }, []);

  /**
   * Calculate estimate (main function)
   */
  const calculate = useCallback(
    async (inputs: EstimatorInputs): Promise<{ results: EstimatorResults; warnings: string[] }> => {
      if (!apiRef.current) {
        throw new Error("Worker not initialized");
      }

      setCalculating(true);
      setError(null);

      try {
        console.log("[useFormulaWorker] Starting calculation...");
        const startTime = performance.now();

        const result = await apiRef.current.calculateEstimate(inputs);

        const duration = performance.now() - startTime;
        console.log(`[useFormulaWorker] ✅ Calculation completed in ${duration.toFixed(2)}ms`);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Calculation failed");
        console.error("[useFormulaWorker] ❌ Calculation error:", error);
        setError(error);
        throw error;
      } finally {
        setCalculating(false);
      }
    },
    []
  );

  /**
   * Calculate total only
   */
  const calculateTotal = useCallback(async (inputs: EstimatorInputs): Promise<EstimatorResults> => {
    if (!apiRef.current) {
      throw new Error("Worker not initialized");
    }

    setCalculating(true);
    setError(null);

    try {
      const results = await apiRef.current.calculateTotal(inputs);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Calculation failed");
      setError(error);
      throw error;
    } finally {
      setCalculating(false);
    }
  }, []);

  /**
   * Calculate phase dates
   */
  const calculatePhaseDates = useCallback(
    async (phases: PhaseBreakdown[], startDate: Date): Promise<PhaseBreakdown[]> => {
      if (!apiRef.current) {
        throw new Error("Worker not initialized");
      }

      try {
        return await apiRef.current.calculatePhaseDates(phases, startDate);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Phase date calculation failed");
        setError(error);
        throw error;
      }
    },
    []
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    calculate,
    calculateTotal,
    calculatePhaseDates,
    calculating,
    error,
    clearError,
    ready,
  };
}

/**
 * Singleton hook for shared worker instance across components
 * Use this when you want to share the same worker across multiple components
 */
let sharedWorker: Worker | null = null;
let sharedApi: Remote<FormulaWorkerAPI> | null = null;

export function useSharedFormulaWorker(): UseFormulaWorkerReturn {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize shared worker once
  useEffect(() => {
    if (!sharedWorker) {
      try {
        sharedWorker = new Worker(new URL("./formula-worker.ts", import.meta.url), {
          type: "module",
        });
        sharedApi = wrap<FormulaWorkerAPI>(sharedWorker);
        console.log("[useSharedFormulaWorker] ✅ Shared worker initialized");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to initialize shared worker");
        console.error("[useSharedFormulaWorker] ❌ Shared worker initialization failed:", error);
        setError(error);
      }
    }

    if (sharedApi) {
      setReady(true);
    }

    // Note: Shared worker is NOT terminated on unmount
    // It persists across component lifecycles
  }, []);

  const calculate = useCallback(async (inputs: EstimatorInputs) => {
    if (!sharedApi) {
      throw new Error("Shared worker not initialized");
    }

    setCalculating(true);
    setError(null);

    try {
      const result = await sharedApi.calculateEstimate(inputs);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Calculation failed");
      setError(error);
      throw error;
    } finally {
      setCalculating(false);
    }
  }, []);

  const calculateTotal = useCallback(async (inputs: EstimatorInputs) => {
    if (!sharedApi) {
      throw new Error("Shared worker not initialized");
    }

    setCalculating(true);
    setError(null);

    try {
      return await sharedApi.calculateTotal(inputs);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Calculation failed");
      setError(error);
      throw error;
    } finally {
      setCalculating(false);
    }
  }, []);

  const calculatePhaseDates = useCallback(async (phases: PhaseBreakdown[], startDate: Date) => {
    if (!sharedApi) {
      throw new Error("Shared worker not initialized");
    }

    try {
      return await sharedApi.calculatePhaseDates(phases, startDate);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Phase date calculation failed");
      setError(error);
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    calculate,
    calculateTotal,
    calculatePhaseDates,
    calculating,
    error,
    clearError,
    ready,
  };
}
