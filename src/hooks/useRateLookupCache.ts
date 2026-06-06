/**
 * Rate Lookup Cache Hook
 *
 * Serves standard rates for real-time cost calculations. The DB rate card
 * (via GET /api/gantt-tool/team-capacity/rates) is the source of truth; the
 * canonical baseline in `@/lib/team-capacity/rate-card-data` is used as an
 * offline fallback while/if the API is unavailable.
 *
 * To adjust rates, update the database (ResourceRateLookup) — no code change.
 */

import { useState, useCallback, useEffect } from "react";
import {
  RATE_CARD_DATA,
  toRateInfo,
  DEFAULT_REGION,
  type RateInfo,
} from "@/lib/team-capacity/rate-card-data";

// Build the offline fallback map once from the canonical baseline.
function buildFallback(): Map<string, RateInfo> {
  const map = new Map<string, RateInfo>();
  for (const [region, designations] of Object.entries(RATE_CARD_DATA)) {
    for (const [designation, rate] of Object.entries(designations)) {
      map.set(`${region}_${designation}`, toRateInfo(rate));
    }
  }
  return map;
}

const FALLBACK: Map<string, RateInfo> = buildFallback();

export function useRateLookupCache() {
  // Start from the canonical baseline so the first render matches the seeded DB;
  // the on-mount fetch overlays any DB overrides.
  const [rates, setRates] = useState<Map<string, RateInfo>>(FALLBACK);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gantt-tool/team-capacity/rates");
      if (!res.ok) throw new Error(`Rates API responded ${res.status}`);
      const data = await res.json();
      const next = new Map<string, RateInfo>(FALLBACK); // canonical base, DB overlaid
      for (const [key, info] of Object.entries(data?.rates ?? {})) {
        next.set(key, info as RateInfo);
      }
      setRates(next);
    } catch (err) {
      // Keep the canonical fallback already in state.
      setError(err instanceof Error ? err.message : "Failed to fetch rates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  /** Get rate for a resource, falling back across region/designation as needed. */
  const getRateForResource = useCallback(
    (designation: string, regionCode?: string | null): RateInfo => {
      const region = regionCode || DEFAULT_REGION;
      return (
        rates.get(`${region}_${designation}`) ??
        rates.get(`${DEFAULT_REGION}_${designation}`) ??
        rates.get(`${region}_consultant`) ??
        FALLBACK.get(`${DEFAULT_REGION}_consultant`)!
      );
    },
    [rates]
  );

  /** Cost for mandays = mandays × NSR (commercial rate per day). */
  const calculateCost = useCallback(
    (mandays: number, designation: string, regionCode?: string | null): number => {
      return mandays * getRateForResource(designation, regionCode).commercialRatePerDay;
    },
    [getRateForResource]
  );

  const calculateTotalCost = useCallback(
    (
      allocations: Array<{
        mandays: number;
        designation: string;
        regionCode?: string | null;
      }>
    ): number => {
      return allocations.reduce(
        (total, alloc) =>
          total + calculateCost(alloc.mandays, alloc.designation, alloc.regionCode),
        0
      );
    },
    [calculateCost]
  );

  const clearCache = useCallback(() => {
    setRates(FALLBACK);
  }, []);

  return {
    getRateForResource,
    calculateCost,
    calculateTotalCost,
    fetchRates,
    clearCache,
    isLoading,
    error,
  };
}

export type { RateInfo };
