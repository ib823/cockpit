/**
 * Rate-card SHAPE and derivation — deliberately carrying no rates.
 *
 * This file used to hold the organisation's actual rate card: per-hour billing
 * rates for every region and grade, the forex multipliers, and the default
 * realization rate. That is commercially confidential and this repository is
 * public, so the figures are gone and the only source of rates is now the
 * `ResourceRateLookup` table.
 *
 * ## Where rates come from now
 *
 *  - **Runtime**: the database, exclusively. `GET /api/gantt-tool/team-capacity/rates`
 *    serves what is in `ResourceRateLookup` and nothing else.
 *  - **Seeding**: a rate-card file that lives outside the repository — see
 *    `scripts/seed-team-capacity-data.ts` and `docs/RATE_CARD.md`.
 *
 * There is no baked-in fallback any more, and that is the point: a fallback
 * is a copy, and a copy of a rate card in a public repository is the leak.
 * An unseeded database therefore has no rates, which the costing path already
 * handles — resources whose region/designation has no rate are reported in
 * `unratedResources` rather than being costed at a guess. A guessed rate that
 * looks plausible is worse than a visibly missing one.
 */

/** Billable hours in a working day. A convention, not a rate. */
export const HOURS_PER_DAY = 8;

/** The region a resource is assumed to belong to when none is set. */
export const DEFAULT_REGION = "ABMY";

/**
 * Realization is the discount from standard to commercial rate. It has no
 * default here because an organisation's realization is a commercial secret;
 * 1.0 means "no discount applied", which is visibly wrong rather than
 * plausibly wrong, so a missing configuration cannot quietly under-report
 * revenue. Configure the real value in `ProjectCostingConfig`.
 */
export const NO_REALIZATION_DISCOUNT = 1;

/** The app's full designation set. Not every one need have a rate. */
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

export type Designation = (typeof DESIGNATIONS)[number];

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

/** Derive the full UI rate shape (day + commercial rates) from a DB entry. */
export function toRateInfo(
  rate: CanonicalRate,
  realizationRate: number = NO_REALIZATION_DISCOUNT
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
