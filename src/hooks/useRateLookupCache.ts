/**
 * Rate Lookup Cache Hook
 *
 * Serves standard rates for real-time cost calculations, from the DB rate card
 * (GET /api/gantt-tool/team-capacity/rates) and nowhere else.
 *
 * There is deliberately no offline baseline: a copy of the rate card in a
 * public repository is the leak this removes. Before the fetch resolves — and
 * against an unseeded database — the map is empty and lookups return null, so
 * callers show a resource as unrated rather than at an invented rate.
 *
 * To adjust rates, update the database (ResourceRateLookup) — no code change.
 */

import { useState, useCallback, useEffect } from "react";
import { DEFAULT_REGION, type RateInfo } from "@/lib/team-capacity/rate-card";

export function useRateLookupCache() {
  // Empty until the DB answers. Nothing in the bundle carries a rate.
  const [rates, setRates] = useState<Map<string, RateInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gantt-tool/team-capacity/rates");
      if (!res.ok) throw new Error(`Rates API responded ${res.status}`);
      const data = await res.json();
      const next = new Map<string, RateInfo>(); // whatever the DB holds, nothing more
      for (const [key, info] of Object.entries(data?.rates ?? {})) {
        next.set(key, info as RateInfo);
      }
      setRates(next);
    } catch (err) {
      // The map stays as it was; callers show unrated resources rather than
      // substituting figures the bundle does not carry.
      setError(err instanceof Error ? err.message : "Failed to fetch rates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  /**
   * Rate for a resource, falling back across region/designation within what the
   * DB actually returned. Null when the rate card has nothing for it — an
   * honest gap the caller surfaces, not a substituted figure.
   */
  const getRateForResource = useCallback(
    (designation: string, regionCode?: string | null): RateInfo | null => {
      const region = regionCode || DEFAULT_REGION;
      return (
        rates.get(`${region}_${designation}`) ??
        rates.get(`${DEFAULT_REGION}_${designation}`) ??
        rates.get(`${region}_consultant`) ??
        null
      );
    },
    [rates]
  );

  /**
   * Cost for mandays = mandays × NSR (commercial rate per day). An unrated
   * resource contributes 0 rather than a guess; the resource itself is shown
   * as unrated, so a zero here reads as "not costed", not as "free".
   */
  const calculateCost = useCallback(
    (mandays: number, designation: string, regionCode?: string | null): number => {
      const rate = getRateForResource(designation, regionCode);
      return rate ? mandays * rate.commercialRatePerDay : 0;
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
    setRates(new Map());
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
