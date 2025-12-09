/**
 * Debounced Hover Hook
 *
 * PERFORMANCE: Reduces re-renders caused by rapid hover state changes.
 * Uses requestAnimationFrame for smooth 60fps updates and debouncing
 * to prevent thrashing when moving mouse quickly over many elements.
 *
 * Key optimizations:
 * - requestAnimationFrame for visual updates (sync with browser paint)
 * - Trailing debounce to reduce state update frequency
 * - Cleanup on unmount to prevent memory leaks
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface UseDebouncedHoverOptions {
  /** Debounce delay in ms. Default: 16ms (~1 frame at 60fps) */
  delay?: number;
  /** Use requestAnimationFrame instead of setTimeout. Default: true */
  useRAF?: boolean;
}

/**
 * Hook for debounced hover state management
 *
 * @param initialValue - Initial hover value (default: null)
 * @param options - Configuration options
 * @returns [currentValue, setValueDebounced, setValueImmediate]
 *
 * @example
 * ```tsx
 * const [hoveredId, setHoveredId, setHoveredIdNow] = useDebouncedHover<string | null>(null);
 *
 * // Use debounced version for frequent updates (mousemove)
 * onMouseEnter={() => setHoveredId(item.id)}
 *
 * // Use immediate version for critical updates (click)
 * onClick={() => setHoveredIdNow(item.id)}
 * ```
 */
export function useDebouncedHover<T>(
  initialValue: T,
  options: UseDebouncedHoverOptions = {}
): [T, (value: T) => void, (value: T) => void] {
  const { delay = 16, useRAF = true } = options;

  const [value, setValue] = useState<T>(initialValue);
  const pendingValue = useRef<T>(initialValue);
  const rafId = useRef<number | null>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  // Debounced setter using RAF or setTimeout
  const setValueDebounced = useCallback((newValue: T) => {
    pendingValue.current = newValue;

    // Cancel any pending updates
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }

    if (useRAF) {
      // Use RAF for smooth visual updates
      rafId.current = requestAnimationFrame(() => {
        setValue(pendingValue.current);
        rafId.current = null;
      });
    } else {
      // Use setTimeout for longer delays
      timeoutId.current = setTimeout(() => {
        setValue(pendingValue.current);
        timeoutId.current = null;
      }, delay);
    }
  }, [delay, useRAF]);

  // Immediate setter (bypasses debounce)
  const setValueImmediate = useCallback((newValue: T) => {
    // Cancel any pending updates
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    pendingValue.current = newValue;
    setValue(newValue);
  }, []);

  return [value, setValueDebounced, setValueImmediate];
}

/**
 * Hook for throttled state updates
 *
 * Updates at most once per `delay` ms, with the latest value.
 * Useful for high-frequency events like scroll or resize.
 */
export function useThrottledState<T>(
  initialValue: T,
  delay: number = 100
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const lastUpdate = useRef<number>(0);
  const pendingValue = useRef<T>(initialValue);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  const setValueThrottled = useCallback((newValue: T) => {
    pendingValue.current = newValue;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    if (timeSinceLastUpdate >= delay) {
      // Enough time has passed, update immediately
      lastUpdate.current = now;
      setValue(newValue);
    } else {
      // Schedule update for when delay expires
      if (timeoutId.current === null) {
        timeoutId.current = setTimeout(() => {
          lastUpdate.current = Date.now();
          setValue(pendingValue.current);
          timeoutId.current = null;
        }, delay - timeSinceLastUpdate);
      }
    }
  }, [delay]);

  return [value, setValueThrottled];
}

/**
 * Hook for batched selection updates
 *
 * Batches multiple selection changes into a single state update.
 * Useful for bulk selection operations that would otherwise cause
 * multiple re-renders.
 */
export function useBatchedSelection<T>(
  initialValue: Set<T> = new Set()
): [
  Set<T>,
  (id: T) => void,
  (ids: T[]) => void,
  (ids: T[]) => void,
  () => void
] {
  const [selected, setSelected] = useState<Set<T>>(initialValue);
  const pendingAdds = useRef<T[]>([]);
  const pendingRemoves = useRef<T[]>([]);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const flush = useCallback(() => {
    if (pendingAdds.current.length === 0 && pendingRemoves.current.length === 0) {
      return;
    }

    setSelected((prev) => {
      const newSet = new Set(prev);
      pendingRemoves.current.forEach((id) => newSet.delete(id));
      pendingAdds.current.forEach((id) => newSet.add(id));
      pendingAdds.current = [];
      pendingRemoves.current = [];
      return newSet;
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        flush();
        rafId.current = null;
      });
    }
  }, [flush]);

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const addMany = useCallback((ids: T[]) => {
    pendingAdds.current.push(...ids);
    scheduleFlush();
  }, [scheduleFlush]);

  const removeMany = useCallback((ids: T[]) => {
    pendingRemoves.current.push(...ids);
    scheduleFlush();
  }, [scheduleFlush]);

  const clear = useCallback(() => {
    pendingAdds.current = [];
    pendingRemoves.current = [];
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setSelected(new Set());
  }, []);

  return [selected, toggle, addMany, removeMany, clear];
}
