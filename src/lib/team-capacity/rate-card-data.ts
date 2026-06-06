/**
 * Canonical rate-card dataset — the SINGLE SOURCE OF TRUTH for standard rates.
 *
 * This baseline is:
 *  - seeded into the `ResourceRateLookup` table (scripts/seed-team-capacity-data.ts),
 *  - served to the client by GET /api/gantt-tool/team-capacity/rates,
 *  - used as the offline fallback by useRateLookupCache.
 *
 * At runtime the DB rate card is authoritative — to ADJUST RATES, update
 * `ResourceRateLookup` in the database. Update this file only to change the
 * seed / fallback baseline (e.g. add a region or designation).
 *
 * Designations are the app's lowercase set (must match the resource designation
 * enum) so server-side costing lookups resolve.
 */

export const HOURS_PER_DAY = 8;
export const DEFAULT_REALIZATION_RATE = 0.43;
export const DEFAULT_REGION = "ABMY";

export const DESIGNATIONS = [
  "principal",
  "director",
  "senior_manager",
  "manager",
  "senior_consultant",
  "consultant",
  "analyst",
  "subcontractor",
] as const;

/** Source-of-truth fields for a rate card entry (everything else is derived). */
export interface CanonicalRate {
  standardRatePerHour: number; // in `currency`
  currency: string; // local currency for the region
  forexRate: number; // multiplier to convert `currency` → MYR
}

/** Full rate shape consumed by the UI (derived fields included). */
export interface RateInfo {
  standardRatePerHour: number;
  standardRatePerDay: number;
  currency: string;
  forexRate: number;
  realizationRate: number;
  commercialRatePerDay: number;
}

/**
 * NOTE: ABVN/ABTH are currently expressed in MYR (forexRate 1), matching the
 * values the resource editor has historically used. If/when proper local-currency
 * rates are introduced, set `currency`/`forexRate` here and re-seed the DB.
 */
export const RATE_CARD_DATA: Record<string, Record<string, CanonicalRate>> = {
  ABMY: {
    principal: { standardRatePerHour: 2000, currency: "MYR", forexRate: 1 },
    director: { standardRatePerHour: 1600, currency: "MYR", forexRate: 1 },
    senior_manager: { standardRatePerHour: 1200, currency: "MYR", forexRate: 1 },
    manager: { standardRatePerHour: 800, currency: "MYR", forexRate: 1 },
    senior_consultant: { standardRatePerHour: 600, currency: "MYR", forexRate: 1 },
    consultant: { standardRatePerHour: 450, currency: "MYR", forexRate: 1 },
    analyst: { standardRatePerHour: 300, currency: "MYR", forexRate: 1 },
    subcontractor: { standardRatePerHour: 400, currency: "MYR", forexRate: 1 },
  },
  ABSG: {
    principal: { standardRatePerHour: 650, currency: "SGD", forexRate: 3.3 },
    director: { standardRatePerHour: 520, currency: "SGD", forexRate: 3.3 },
    senior_manager: { standardRatePerHour: 390, currency: "SGD", forexRate: 3.3 },
    manager: { standardRatePerHour: 260, currency: "SGD", forexRate: 3.3 },
    senior_consultant: { standardRatePerHour: 195, currency: "SGD", forexRate: 3.3 },
    consultant: { standardRatePerHour: 150, currency: "SGD", forexRate: 3.3 },
    analyst: { standardRatePerHour: 100, currency: "SGD", forexRate: 3.3 },
    subcontractor: { standardRatePerHour: 130, currency: "SGD", forexRate: 3.3 },
  },
  ABVN: {
    principal: { standardRatePerHour: 750, currency: "MYR", forexRate: 1 },
    director: { standardRatePerHour: 600, currency: "MYR", forexRate: 1 },
    senior_manager: { standardRatePerHour: 450, currency: "MYR", forexRate: 1 },
    manager: { standardRatePerHour: 300, currency: "MYR", forexRate: 1 },
    senior_consultant: { standardRatePerHour: 225, currency: "MYR", forexRate: 1 },
    consultant: { standardRatePerHour: 170, currency: "MYR", forexRate: 1 },
    analyst: { standardRatePerHour: 110, currency: "MYR", forexRate: 1 },
    subcontractor: { standardRatePerHour: 150, currency: "MYR", forexRate: 1 },
  },
  ABTH: {
    principal: { standardRatePerHour: 900, currency: "MYR", forexRate: 1 },
    director: { standardRatePerHour: 720, currency: "MYR", forexRate: 1 },
    senior_manager: { standardRatePerHour: 540, currency: "MYR", forexRate: 1 },
    manager: { standardRatePerHour: 360, currency: "MYR", forexRate: 1 },
    senior_consultant: { standardRatePerHour: 270, currency: "MYR", forexRate: 1 },
    consultant: { standardRatePerHour: 200, currency: "MYR", forexRate: 1 },
    analyst: { standardRatePerHour: 135, currency: "MYR", forexRate: 1 },
    subcontractor: { standardRatePerHour: 180, currency: "MYR", forexRate: 1 },
  },
};

export const REGIONS = Object.keys(RATE_CARD_DATA);

/** Derive the full UI rate shape (day + commercial rates) from a canonical entry. */
export function toRateInfo(
  rate: CanonicalRate,
  realizationRate: number = DEFAULT_REALIZATION_RATE
): RateInfo {
  const standardRatePerDay = rate.standardRatePerHour * HOURS_PER_DAY;
  return {
    standardRatePerHour: rate.standardRatePerHour,
    standardRatePerDay,
    currency: rate.currency,
    forexRate: rate.forexRate,
    realizationRate,
    commercialRatePerDay: standardRatePerDay * realizationRate,
  };
}

/** Flatten the canonical dataset into rows for seeding ResourceRateLookup. */
export function canonicalRateRows(): Array<{
  regionCode: string;
  designation: string;
  hourlyRate: number;
  localCurrency: string;
  forexRate: number;
  baseCurrency: string;
}> {
  return Object.entries(RATE_CARD_DATA).flatMap(([regionCode, designations]) =>
    Object.entries(designations).map(([designation, r]) => ({
      regionCode,
      designation,
      hourlyRate: r.standardRatePerHour,
      localCurrency: r.currency,
      forexRate: r.forexRate,
      baseCurrency: "MYR",
    }))
  );
}
