/**
 * useAutoSave Hook
 * Automatic saving of form data with debounce and visual feedback
 *
 * Usage:
 * const { save, saving, lastSaved } = useAutoSave({
 *   data: formData,
 *   onSave: async (data) => await api.save(data),
 *   debounceMs: 2000
 * });
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HexLoader } from "@/components/ui/HexLoader";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

interface UseAutoSaveReturn {
  save: () => Promise<void>;
  saving: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
  onError,
  onSuccess,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);
  const isMountedRef = useRef(true);

  // Manual save function
  const save = useCallback(async () => {
    if (!enabled) return;

    try {
      setSaving(true);
      setError(null);

      await onSave(data);

      if (isMountedRef.current) {
        setLastSaved(new Date());
        previousDataRef.current = data;
        onSuccess?.();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Save failed");
      if (isMountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, [data, enabled, onSave, onError, onSuccess]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled) return;

    // Check if data has changed
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (!dataChanged) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    saving,
    lastSaved,
    error,
  };
}

/**
 * AutoSaveIndicator Component
 * Visual feedback for auto-save status
 */
interface AutoSaveIndicatorProps {
  saving: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

export function AutoSaveIndicator({ saving, lastSaved, error }: AutoSaveIndicatorProps) {
  const getRelativeTime = (date: Date | null) => {
    if (!date) return null;

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (error) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-red-600"
        role="status"
        aria-live="polite"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span>Save failed</span>
      </div>
    );
  }

  if (saving) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-gray-600"
        role="status"
        aria-live="polite"
      >
        <HexLoader size="sm" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-green-600"
        role="status"
        aria-live="polite"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>Saved {getRelativeTime(lastSaved)}</span>
      </div>
    );
  }

  return null;
}
