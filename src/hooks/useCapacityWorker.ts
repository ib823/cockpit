/**
 * Capacity Calculator Web Worker Hook
 *
 * PERFORMANCE: Offloads heavy capacity calculations to a background thread.
 * Falls back to main thread calculation if Web Workers are not supported.
 *
 * Usage:
 * ```tsx
 * const { calculate, result, isCalculating, error } = useCapacityWorker();
 *
 * useEffect(() => {
 *   calculate({
 *     phases: currentProject.phases,
 *     resources: currentProject.resources,
 *     projectStartDate: startDate,
 *     projectEndDate: endDate,
 *     manualOverrides,
 *   });
 * }, [currentProject, manualOverrides]);
 * ```
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { GanttPhase, Resource } from "@/types/gantt-tool";
import type { ResourceCapacityResult } from "@/lib/gantt-tool/resource-capacity-calculator";
import { calculateResourceCapacity } from "@/lib/gantt-tool/resource-capacity-calculator";

// ============================================================================
// Types
// ============================================================================

interface CapacityWorkerInput {
  phases: GanttPhase[];
  resources: Resource[];
  projectStartDate: Date;
  projectEndDate: Date;
  manualOverrides?: Map<string, number>;
}

interface UseCapacityWorkerResult {
  /** Trigger a calculation */
  calculate: (input: CapacityWorkerInput) => void;
  /** The calculated result (null if not yet calculated) */
  result: ResourceCapacityResult[] | null;
  /** Whether a calculation is in progress */
  isCalculating: boolean;
  /** Error message if calculation failed */
  error: string | null;
  /** Whether Web Worker is supported and being used */
  isUsingWorker: boolean;
}

// ============================================================================
// Worker Setup
// ============================================================================

let workerInstance: Worker | null = null;
let workerSupported = true;

function getWorker(): Worker | null {
  if (!workerSupported) return null;

  if (typeof window === "undefined") {
    workerSupported = false;
    return null;
  }

  if (!workerInstance) {
    try {
      // Create worker using dynamic import
      workerInstance = new Worker(
        new URL("../workers/capacity-calculator.worker.ts", import.meta.url),
        { type: "module" }
      );
    } catch (error) {
      console.warn("[useCapacityWorker] Web Worker not supported, falling back to main thread:", error);
      workerSupported = false;
      return null;
    }
  }

  return workerInstance;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCapacityWorker(): UseCapacityWorkerResult {
  const [result, setResult] = useState<ResourceCapacityResult[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingWorker, setIsUsingWorker] = useState(false);

  const callbackRef = useRef<((result: ResourceCapacityResult[]) => void) | null>(null);
  const pendingInput = useRef<CapacityWorkerInput | null>(null);

  // Setup worker message handler
  useEffect(() => {
    const worker = getWorker();

    if (worker) {
      setIsUsingWorker(true);

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;

        if (type === "result") {
          // Convert date strings back to Date objects
          const parsedResult = payload.map((r: ResourceCapacityResult) => ({
            ...r,
            weeks: r.weeks.map((w) => ({
              ...w,
              weekStartDate: new Date(w.weekStartDate),
              weekEndDate: new Date(w.weekEndDate),
            })),
          }));

          setResult(parsedResult);
          setIsCalculating(false);
          setError(null);

          if (callbackRef.current) {
            callbackRef.current(parsedResult);
            callbackRef.current = null;
          }
        } else if (type === "error") {
          setError(payload);
          setIsCalculating(false);
        }
      };

      const handleError = (event: ErrorEvent) => {
        console.error("[useCapacityWorker] Worker error:", event);
        setError("Worker encountered an error");
        setIsCalculating(false);
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      return () => {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
      };
    } else {
      setIsUsingWorker(false);
    }
  }, []);

  const calculate = useCallback((input: CapacityWorkerInput) => {
    setIsCalculating(true);
    setError(null);
    pendingInput.current = input;

    const worker = getWorker();

    if (worker) {
      // Serialize input for worker
      const serializedInput = {
        phases: input.phases.map((phase) => ({
          id: phase.id,
          name: phase.name,
          color: phase.color,
          startDate: phase.startDate,
          endDate: phase.endDate,
          tasks: phase.tasks.map((task) => ({
            id: task.id,
            name: task.name,
            startDate: task.startDate,
            endDate: task.endDate,
            resourceAssignments: task.resourceAssignments?.map((a) => ({
              resourceId: a.resourceId,
              allocation: a.allocation,
            })),
          })),
          resourceAssignments: phase.resourceAssignments?.map((a) => ({
            resourceId: a.resourceId,
            allocation: a.allocation,
          })),
        })),
        resources: input.resources.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          weeklyCapacity: r.weeklyCapacity,
        })),
        projectStartDate: input.projectStartDate.toISOString(),
        projectEndDate: input.projectEndDate.toISOString(),
        manualOverrides: input.manualOverrides
          ? Array.from(input.manualOverrides.entries())
          : [],
      };

      worker.postMessage({ type: "calculate", payload: serializedInput });
    } else {
      // Fall back to main thread calculation
      try {
        const mainThreadResult = calculateResourceCapacity({
          phases: input.phases,
          resources: input.resources,
          projectStartDate: input.projectStartDate,
          projectEndDate: input.projectEndDate,
          manualOverrides: input.manualOverrides,
        });
        setResult(mainThreadResult);
        setIsCalculating(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Calculation failed");
        setIsCalculating(false);
      }
    }
  }, []);

  return {
    calculate,
    result,
    isCalculating,
    error,
    isUsingWorker,
  };
}

/**
 * Cleanup function to terminate the worker when no longer needed
 * Call this on application unmount or when done with capacity calculations
 */
export function terminateCapacityWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}
