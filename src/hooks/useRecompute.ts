/**
 * useRecompute Hook
 *
 * React hook that provides access to the recompute engine and handles
 * automatic recomputation when dependencies change.
 *
 * Usage:
 *   const computed = useRecompute(inputs, options);
 *   console.log(computed.totalCost, computed.totalEffort);
 */

'use client';

import { ComputedOutputs, ProjectInputs, recompute, recomputeCosts, recomputePhases, recomputeRicefw } from '@/lib/engine/recompute';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseRecomputeOptions {
  /**
   * Enable automatic recomputation on input changes
   * Default: true
   */
  autoRecompute?: boolean;

  /**
   * Debounce delay in milliseconds
   * Default: 100
   */
  debounceMs?: number;

  /**
   * Enable debug logging
   * Default: false
   */
  debug?: boolean;

  /**
   * Callback when recomputation completes
   */
  onRecompute?: (outputs: ComputedOutputs) => void;
}

export interface UseRecomputeResult extends ComputedOutputs {
  /**
   * Manually trigger recomputation
   */
  recompute: () => void;

  /**
   * Check if recomputation is needed
   */
  isDirty: boolean;

  /**
   * Last recomputation timestamp
   */
  lastComputedAt: Date | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Main useRecompute hook
 */
export function useRecompute(
  inputs: ProjectInputs,
  options: UseRecomputeOptions = {}
): UseRecomputeResult {
  const {
    autoRecompute = true,
    debounceMs = 100,
    debug = false,
    onRecompute,
  } = options;

  const lastComputedInputsRef = useRef<string>('');
  const lastComputedAtRef = useRef<Date | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Serialize inputs for comparison
  const inputsHash = useMemo(() => JSON.stringify(inputs), [inputs]);

  // Check if inputs have changed
  const isDirty = inputsHash !== lastComputedInputsRef.current;

  // Compute outputs
  const outputs = useMemo(() => {
    if (!autoRecompute && !isDirty) {
      // Return cached results if auto-recompute is disabled
      return recompute(inputs);
    }

    if (debug) {
      console.log('[useRecompute] Computing outputs', { inputs, isDirty });
    }

    const result = recompute(inputs);
    lastComputedInputsRef.current = inputsHash;
    lastComputedAtRef.current = new Date();

    if (onRecompute) {
      onRecompute(result);
    }

    return result;
  }, [inputsHash, autoRecompute, isDirty, debug, onRecompute]);

  // Manual recompute function
  const manualRecompute = useCallback(() => {
    if (debug) {
      console.log('[useRecompute] Manual recompute triggered');
    }
    lastComputedInputsRef.current = '';
    lastComputedAtRef.current = new Date();
  }, [debug]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...outputs,
    recompute: manualRecompute,
    isDirty,
    lastComputedAt: lastComputedAtRef.current,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for RICEFW-only recomputation (optimized)
 */
export function useRecomputeRicefw(
  ricefwItems: ProjectInputs['ricefwItems'],
  averageHourlyRate: number = 150
) {
  return useMemo(() => {
    return recomputeRicefw(ricefwItems || [], averageHourlyRate);
  }, [ricefwItems, averageHourlyRate]);
}

/**
 * Hook for phase-only recomputation (optimized)
 */
export function useRecomputePhases(
  phases: ProjectInputs['phases'],
  averageHourlyRate: number = 150
) {
  return useMemo(() => {
    return recomputePhases(phases || [], averageHourlyRate);
  }, [phases, averageHourlyRate]);
}

/**
 * Hook for cost-only recomputation (optimized)
 */
export function useRecomputeCosts(inputs: ProjectInputs) {
  return useMemo(() => {
    return recomputeCosts(inputs);
  }, [inputs]);
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook that provides a debounced version of inputs
 */
export function useDebouncedInputs<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

// Missing import
import { useState } from 'react';

/**
 * Hook that tracks computation performance metrics
 */
export function useRecomputeMetrics() {
  const [metrics, setMetrics] = useState({
    computeCount: 0,
    totalComputeTime: 0,
    avgComputeTime: 0,
    lastComputeTime: 0,
  });

  const trackComputation = useCallback((computeFn: () => void) => {
    const start = performance.now();
    computeFn();
    const end = performance.now();
    const computeTime = end - start;

    setMetrics((prev) => ({
      computeCount: prev.computeCount + 1,
      totalComputeTime: prev.totalComputeTime + computeTime,
      avgComputeTime: (prev.totalComputeTime + computeTime) / (prev.computeCount + 1),
      lastComputeTime: computeTime,
    }));
  }, []);

  return { metrics, trackComputation };
}