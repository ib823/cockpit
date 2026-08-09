/**
 * Costing-engine math tests (value-validating, no DB required).
 *
 * These exercise the PURE computation extracted from the DB lookup, with known
 * inputs and exact expected outputs — the correctness coverage the integration
 * smoke tests do not provide.
 *
 * Every figure below is INVENTED. The fixtures used to be the organisation's
 * real rate and realization, which made this file a public copy of the rate
 * card; round synthetic numbers test the same arithmetic and disclose nothing.
 */
import { describe, it, expect } from "vitest";
import { computeInternalCost, calculateSubcontractorCost } from "../costing";

describe("computeInternalCost (7-layer model)", () => {
  it("computes the full chain for a single MYR resource", () => {
    const r = computeInternalCost({
      standardRatePerHourLocal: 100,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 10,
      realizationRate: 0.5,
      internalCostPercent: 0.25,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.standardRatePerDay).toBe(800); // 100 × 8
    expect(r.grossStandardRate).toBe(8000); // 10 × 800
    expect(r.netStandardRate).toBeCloseTo(4000, 6); // 800 × 0.5 × 10
    expect(r.totalInternalCost).toBeCloseTo(2000, 6); // 800 × 0.25 × 10
    expect(r.margin).toBeCloseTo(2000, 6); // 4000 − 2000
    expect(r.marginPercent).toBeCloseTo(50, 4);
  });

  it("applies forex conversion for non-MYR rates (regression for the currency bug)", () => {
    // 100 SGD/hr × 3 = 300 MYR/hr
    const r = computeInternalCost({
      standardRatePerHourLocal: 100,
      currency: "SGD",
      forexToMYR: 3,
      totalMandays: 10,
      realizationRate: 0.5,
      internalCostPercent: 0.25,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.standardRatePerHour).toBeCloseTo(300, 6); // converted to MYR
    expect(r.standardRatePerDay).toBeCloseTo(2400, 6);
    expect(r.grossStandardRate).toBeCloseTo(24000, 6);
    expect(r.netStandardRate).toBeCloseTo(12000, 6);
    // Pre-fix (no forex) this was 100 × 8 × 0.5 × 10 = 4000 — guard against regression
    expect(r.netStandardRate).not.toBeCloseTo(4000, 0);
    expect(r.currency).toBe("SGD"); // original local currency retained for reference
  });

  it("guards against divide-by-zero when the rate is zero", () => {
    const r = computeInternalCost({
      standardRatePerHourLocal: 0,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 5,
      realizationRate: 0.5,
      internalCostPercent: 0.25,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.netStandardRate).toBe(0);
    expect(r.marginPercent).toBe(0); // not NaN/Infinity
    expect(Number.isFinite(r.marginPercent)).toBe(true);
  });

  it("computes OPE when onsite days are provided", () => {
    const r = computeInternalCost({
      standardRatePerHourLocal: 1000,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 20,
      realizationRate: 0.5,
      internalCostPercent: 0.25,
      opePerDay: 500,
      onsiteDaysPercent: 50,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.onsiteDays).toBe(10); // 20 × 50%
    expect(r.opeAmount).toBe(5000); // 10 × 500
  });

  it("falls back to neutral RR / internal-cost percent when zero is passed", () => {
    // Neutral, not commercial: the real percentages are configuration, never
    // constants in this repository (see docs/RATE_CARD.md).
    const r = computeInternalCost({
      standardRatePerHourLocal: 1000,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 1,
      realizationRate: 0,
      internalCostPercent: 0,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.realizationRate).toBe(1); // no discount
    expect(r.internalCostPercent).toBe(0); // no internal cost recorded
  });

  it("applies intercompany markup to internal cost (reducing margin)", () => {
    const common = {
      standardRatePerHourLocal: 1000,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 10,
      realizationRate: 0.5,
      internalCostPercent: 0.25,
      visibilityLevel: "FINANCE_ONLY" as const,
    };
    const base = computeInternalCost(common);
    const marked = computeInternalCost({ ...common, intercompanyMarkup: 1.15 });

    // Revenue is unchanged; internal (transfer) cost is +15%; margin is lower.
    expect(marked.netStandardRate).toBeCloseTo(base.netStandardRate, 6);
    expect(marked.totalInternalCost).toBeCloseTo(base.totalInternalCost * 1.15, 6);
    expect(marked.margin).toBeLessThan(base.margin);
  });
});

describe("calculateSubcontractorCost", () => {
  it("computes commercial / cost / margin", () => {
    const r = calculateSubcontractorCost(10, {
      dailyCommercialRate: 1000,
      dailyCostRate: 700,
    });
    expect(r.totalCommercial).toBe(10000);
    expect(r.totalCost).toBe(7000);
    expect(r.margin).toBe(3000);
    expect(r.marginPercent).toBeCloseTo(30, 6);
    expect(r.isNegativeMargin).toBe(false);
  });

  it("flags negative margins and guards a zero commercial rate", () => {
    const neg = calculateSubcontractorCost(5, {
      dailyCommercialRate: 100,
      dailyCostRate: 150,
    });
    expect(neg.isNegativeMargin).toBe(true);

    const zero = calculateSubcontractorCost(5, {
      dailyCommercialRate: 0,
      dailyCostRate: 0,
    });
    expect(zero.marginPercent).toBe(0); // guarded, not NaN
    expect(Number.isFinite(zero.marginPercent)).toBe(true);
  });
});
