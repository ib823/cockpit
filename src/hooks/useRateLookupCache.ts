/**
 * Rate Lookup Cache Hook
 *
 * Provides efficient caching for resource rate lookups to enable
 * real-time cost calculations without excessive API calls.
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface RateInfo {
  standardRatePerHour: number;
  standardRatePerDay: number;
  currency: string;
  forexRate: number;
  realizationRate: number;
  commercialRatePerDay: number;
}

interface RateLookupCache {
  rates: Map<string, RateInfo>;
  lastFetched: Date | null;
  isLoading: boolean;
  error: string | null;
}

// Default rates by region and designation (fallback when API is unavailable)
const DEFAULT_RATES: Record<string, Record<string, RateInfo>> = {
  ABMY: {
    principal: { standardRatePerHour: 2000, standardRatePerDay: 16000, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 6880 },
    director: { standardRatePerHour: 1600, standardRatePerDay: 12800, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 5504 },
    senior_manager: { standardRatePerHour: 1200, standardRatePerDay: 9600, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 4128 },
    manager: { standardRatePerHour: 800, standardRatePerDay: 6400, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 2752 },
    senior_consultant: { standardRatePerHour: 600, standardRatePerDay: 4800, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 2064 },
    consultant: { standardRatePerHour: 450, standardRatePerDay: 3600, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 1548 },
    analyst: { standardRatePerHour: 300, standardRatePerDay: 2400, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 1032 },
    subcontractor: { standardRatePerHour: 400, standardRatePerDay: 3200, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 1376 },
  },
  ABSG: {
    principal: { standardRatePerHour: 650, standardRatePerDay: 5200, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 7379 },
    director: { standardRatePerHour: 520, standardRatePerDay: 4160, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 5903 },
    senior_manager: { standardRatePerHour: 390, standardRatePerDay: 3120, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 4427 },
    manager: { standardRatePerHour: 260, standardRatePerDay: 2080, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 2952 },
    senior_consultant: { standardRatePerHour: 195, standardRatePerDay: 1560, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 2214 },
    consultant: { standardRatePerHour: 150, standardRatePerDay: 1200, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 1703 },
    analyst: { standardRatePerHour: 100, standardRatePerDay: 800, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 1135 },
    subcontractor: { standardRatePerHour: 130, standardRatePerDay: 1040, currency: "SGD", forexRate: 3.3, realizationRate: 0.43, commercialRatePerDay: 1476 },
  },
  ABVN: {
    principal: { standardRatePerHour: 750, standardRatePerDay: 6000, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 2580 },
    director: { standardRatePerHour: 600, standardRatePerDay: 4800, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 2064 },
    senior_manager: { standardRatePerHour: 450, standardRatePerDay: 3600, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 1548 },
    manager: { standardRatePerHour: 300, standardRatePerDay: 2400, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 1032 },
    senior_consultant: { standardRatePerHour: 225, standardRatePerDay: 1800, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 774 },
    consultant: { standardRatePerHour: 170, standardRatePerDay: 1360, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 585 },
    analyst: { standardRatePerHour: 110, standardRatePerDay: 880, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 378 },
    subcontractor: { standardRatePerHour: 150, standardRatePerDay: 1200, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 516 },
  },
  ABTH: {
    principal: { standardRatePerHour: 900, standardRatePerDay: 7200, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 3096 },
    director: { standardRatePerHour: 720, standardRatePerDay: 5760, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 2477 },
    senior_manager: { standardRatePerHour: 540, standardRatePerDay: 4320, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 1858 },
    manager: { standardRatePerHour: 360, standardRatePerDay: 2880, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 1238 },
    senior_consultant: { standardRatePerHour: 270, standardRatePerDay: 2160, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 929 },
    consultant: { standardRatePerHour: 200, standardRatePerDay: 1600, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 688 },
    analyst: { standardRatePerHour: 135, standardRatePerDay: 1080, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 464 },
    subcontractor: { standardRatePerHour: 180, standardRatePerDay: 1440, currency: "MYR", forexRate: 1, realizationRate: 0.43, commercialRatePerDay: 619 },
  },
};

// Default region if not specified
const DEFAULT_REGION = "ABMY";

export function useRateLookupCache() {
  const cacheRef = useRef<Map<string, RateInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate cache key from region and designation
   */
  const getCacheKey = useCallback((region: string, designation: string): string => {
    return `${region}_${designation}`;
  }, []);

  /**
   * Get rate for a resource (from cache or defaults)
   */
  const getRateForResource = useCallback((
    designation: string,
    regionCode?: string | null
  ): RateInfo => {
    const region = regionCode || DEFAULT_REGION;
    const key = getCacheKey(region, designation);

    // Check cache first
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }

    // Use default rates
    const regionRates = DEFAULT_RATES[region] || DEFAULT_RATES[DEFAULT_REGION];
    const rate = regionRates[designation] || regionRates["consultant"];

    // Cache it
    cacheRef.current.set(key, rate);

    return rate;
  }, [getCacheKey]);

  /**
   * Calculate cost for mandays
   */
  const calculateCost = useCallback((
    mandays: number,
    designation: string,
    regionCode?: string | null
  ): number => {
    const rate = getRateForResource(designation, regionCode);
    // Use NSR (Net Standard Rate) = commercial rate per day
    return mandays * rate.commercialRatePerDay;
  }, [getRateForResource]);

  /**
   * Calculate total cost for multiple allocations
   */
  const calculateTotalCost = useCallback((
    allocations: Array<{
      mandays: number;
      designation: string;
      regionCode?: string | null;
    }>
  ): number => {
    return allocations.reduce((total, alloc) => {
      return total + calculateCost(alloc.mandays, alloc.designation, alloc.regionCode);
    }, 0);
  }, [calculateCost]);

  /**
   * Fetch rates from API (optional - for when we want fresh data)
   */
  const fetchRates = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // This would fetch from the costing API in a real implementation
      // For now, we use the default rates which are pre-calculated
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rates");
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear the cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
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
