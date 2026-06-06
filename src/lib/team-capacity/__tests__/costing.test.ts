/**
 * Costing-engine math tests (value-validating, no DB required).
 *
 * These exercise the PURE computation extracted from the DB lookup, with known
 * inputs and exact expected outputs — the correctness coverage the integration
 * smoke tests do not provide.
 */
import { describe, it, expect } from "vitest";
import { computeInternalCost, calculateSubcontractorCost } from "../costing";

describe("computeInternalCost (7-layer model)", () => {
  it("computes the full chain for a single MYR resource", () => {
    const r = computeInternalCost({
      standardRatePerHourLocal: 2000,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 10,
      realizationRate: 0.43,
      internalCostPercent: 0.35,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.standardRatePerDay).toBe(16000); // 2000 × 8
    expect(r.grossStandardRate).toBe(160000); // 10 × 16000
    expect(r.netStandardRate).toBeCloseTo(68800, 6); // 16000 × 0.43 × 10
    expect(r.totalInternalCost).toBeCloseTo(56000, 6); // 16000 × 0.35 × 10
    expect(r.margin).toBeCloseTo(12800, 6); // 68800 − 56000
    expect(r.marginPercent).toBeCloseTo(18.604651, 4);
  });

  it("applies forex conversion for non-MYR rates (regression for the currency bug)", () => {
    // 650 SGD/hr × 3.25 = 2112.5 MYR/hr
    const r = computeInternalCost({
      standardRatePerHourLocal: 650,
      currency: "SGD",
      forexToMYR: 3.25,
      totalMandays: 10,
      realizationRate: 0.43,
      internalCostPercent: 0.35,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.standardRatePerHour).toBeCloseTo(2112.5, 6); // converted to MYR
    expect(r.standardRatePerDay).toBeCloseTo(16900, 6);
    expect(r.grossStandardRate).toBeCloseTo(169000, 6);
    expect(r.netStandardRate).toBeCloseTo(72670, 6);
    // Pre-fix (no forex) this was 650 × 8 × 0.43 × 10 = 22360 — guard against regression
    expect(r.netStandardRate).not.toBeCloseTo(22360, 0);
    expect(r.currency).toBe("SGD"); // original local currency retained for reference
  });

  it("guards against divide-by-zero when the rate is zero", () => {
    const r = computeInternalCost({
      standardRatePerHourLocal: 0,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 5,
      realizationRate: 0.43,
      internalCostPercent: 0.35,
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
      realizationRate: 0.43,
      internalCostPercent: 0.35,
      opePerDay: 500,
      onsiteDaysPercent: 50,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.onsiteDays).toBe(10); // 20 × 50%
    expect(r.opeAmount).toBe(5000); // 10 × 500
  });

  it("falls back to default RR / internal-cost percent when zero is passed", () => {
    const r = computeInternalCost({
      standardRatePerHourLocal: 1000,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 1,
      realizationRate: 0,
      internalCostPercent: 0,
      visibilityLevel: "FINANCE_ONLY",
    });
    expect(r.realizationRate).toBe(0.43);
    expect(r.internalCostPercent).toBe(0.35);
  });

  it("applies intercompany markup to internal cost (reducing margin)", () => {
    const common = {
      standardRatePerHourLocal: 1000,
      currency: "MYR",
      forexToMYR: 1,
      totalMandays: 10,
      realizationRate: 0.43,
      internalCostPercent: 0.35,
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
