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
 * seed / fallback baseline.
 *
 * SOURCE: extracted from the rate-card workbook ("Rates Lookup" tab). Rates are
 * PER HOUR in local currency; day rate = hourly × 8 (per the sheet's own note).
 * Values below are the per-hour figures (= sheet day rate ÷ 8).
 *
 * KNOWN GAPS (the rate card is sparse — not a full region×designation matrix):
 *  - No `subcontractor` rate in any region: subcontractors are costed via the
 *    separate SubcontractorRate model, not this rate card.
 *  - ABSG has no `analyst` grade (its lowest core grade is `consultant`).
 *  Missing combinations degrade gracefully (server costing marks them unrated;
 *  the client editor falls back to the nearest rate).
 *
 * FOREX: MYR (base) and SGD are official (XE.com). VND/THB are UNOFFICIAL
 * (Yahoo Finance, ~2026-02-19) per the sheet author — verify and maintain the
 * authoritative values in the DB (ResourceRateLookup.forexRate).
 */

export const HOURS_PER_DAY = 8;
export const DEFAULT_REALIZATION_RATE = 0.43;
export const DEFAULT_REGION = "ABMY";

/** The app's full designation set. NOTE: the rate card (below) is sparse — not
 *  every designation has a rate in every region (see KNOWN GAPS above). */
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

// Per-hour standard rates (local currency). Comments show the source day rate (×8).
export const RATE_CARD_DATA: Record<string, Record<string, CanonicalRate>> = {
  ABMY: {
    // forex 1.0 (base)
    principal: { standardRatePerHour: 2000, currency: "MYR", forexRate: 1 }, // 16,000/day
    director: { standardRatePerHour: 1600, currency: "MYR", forexRate: 1 }, // 12,800
    senior_manager: { standardRatePerHour: 1200, currency: "MYR", forexRate: 1 }, // 9,600
    manager: { standardRatePerHour: 750, currency: "MYR", forexRate: 1 }, // 6,000
    senior_consultant: { standardRatePerHour: 410, currency: "MYR", forexRate: 1 }, // 3,280
    consultant: { standardRatePerHour: 260, currency: "MYR", forexRate: 1 }, // 2,080
    analyst: { standardRatePerHour: 220, currency: "MYR", forexRate: 1 }, // 1,760
  },
  ABSG: {
    // forex 3.0814 (SGD→MYR, XE.com)
    principal: { standardRatePerHour: 1400, currency: "SGD", forexRate: 3.0814 }, // 11,200/day
    director: { standardRatePerHour: 1000, currency: "SGD", forexRate: 3.0814 }, // 8,000
    senior_manager: { standardRatePerHour: 800, currency: "SGD", forexRate: 3.0814 }, // 6,400
    manager: { standardRatePerHour: 450, currency: "SGD", forexRate: 3.0814 }, // 3,600
    senior_consultant: { standardRatePerHour: 300, currency: "SGD", forexRate: 3.0814 }, // 2,400
    consultant: { standardRatePerHour: 230, currency: "SGD", forexRate: 3.0814 }, // 1,840
    // (no analyst grade in ABSG)
  },
  ABVN: {
    // forex 0.0001605 (VND→MYR, UNOFFICIAL — verify)
    principal: { standardRatePerHour: 13000000, currency: "VND", forexRate: 0.0001605 }, // 104,000,000/day
    director: { standardRatePerHour: 10000000, currency: "VND", forexRate: 0.0001605 }, // 80,000,000
    senior_manager: { standardRatePerHour: 6000000, currency: "VND", forexRate: 0.0001605 }, // 48,000,000
    manager: { standardRatePerHour: 4000000, currency: "VND", forexRate: 0.0001605 }, // 32,000,000
    senior_consultant: { standardRatePerHour: 2600000, currency: "VND", forexRate: 0.0001605 }, // 20,800,000
    consultant: { standardRatePerHour: 1400000, currency: "VND", forexRate: 0.0001605 }, // 11,200,000
    analyst: { standardRatePerHour: 1000000, currency: "VND", forexRate: 0.0001605 }, // 8,000,000
  },
  ABTH: {
    // forex 0.129 (THB→MYR, UNOFFICIAL — verify)
    principal: { standardRatePerHour: 35000, currency: "THB", forexRate: 0.129 }, // 280,000/day
    director: { standardRatePerHour: 25000, currency: "THB", forexRate: 0.129 }, // 200,000
    senior_manager: { standardRatePerHour: 11000, currency: "THB", forexRate: 0.129 }, // 88,000
    manager: { standardRatePerHour: 7300, currency: "THB", forexRate: 0.129 }, // 58,400
    senior_consultant: { standardRatePerHour: 4300, currency: "THB", forexRate: 0.129 }, // 34,400
    consultant: { standardRatePerHour: 3300, currency: "THB", forexRate: 0.129 }, // 26,400
    analyst: { standardRatePerHour: 2300, currency: "THB", forexRate: 0.129 }, // 18,400
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
