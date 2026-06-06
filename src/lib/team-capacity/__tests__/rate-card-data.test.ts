/**
 * Canonical rate-card baseline tests.
 *
 * Locks the authoritative values extracted from the rate-card workbook,
 * validates shape (lowercase known designations, positive rates/forex), and
 * documents the known gaps (no subcontractor; ABSG has no analyst).
 */
import { describe, it, expect } from "vitest";
import {
  RATE_CARD_DATA,
  REGIONS,
  DESIGNATIONS,
  toRateInfo,
  canonicalRateRows,
  DEFAULT_REALIZATION_RATE,
} from "../rate-card-data";

describe("rate-card-data (canonical baseline)", () => {
  it("has the 4 expected regions", () => {
    expect(REGIONS).toEqual(["ABMY", "ABSG", "ABVN", "ABTH"]);
  });

  it("every entry is well-formed (lowercase known designation, positive rate/forex)", () => {
    for (const region of REGIONS) {
      for (const [designation, entry] of Object.entries(RATE_CARD_DATA[region])) {
        expect(designation).toBe(designation.toLowerCase());
        expect(DESIGNATIONS).toContain(designation as (typeof DESIGNATIONS)[number]);
        expect(entry.standardRatePerHour).toBeGreaterThan(0);
        expect(entry.forexRate).toBeGreaterThan(0);
        expect(entry.currency).toBeTruthy();
      }
    }
  });

  it("matches the authoritative rate card (per-hour = sheet day rate / 8)", () => {
    expect(RATE_CARD_DATA.ABMY.principal).toEqual({
      standardRatePerHour: 2000,
      currency: "MYR",
      forexRate: 1,
    });
    expect(RATE_CARD_DATA.ABMY.consultant.standardRatePerHour).toBe(260); // 2,080/day
    expect(RATE_CARD_DATA.ABSG.principal).toEqual({
      standardRatePerHour: 1400,
      currency: "SGD",
      forexRate: 3.0814,
    });
    expect(RATE_CARD_DATA.ABVN.principal.standardRatePerHour).toBe(13000000); // 104,000,000/day
    expect(RATE_CARD_DATA.ABVN.principal.currency).toBe("VND");
    expect(RATE_CARD_DATA.ABTH.manager.standardRatePerHour).toBe(7300); // 58,400/day
  });

  it("reflects the known gaps (no subcontractor anywhere; ABSG has no analyst)", () => {
    for (const region of REGIONS) {
      expect(RATE_CARD_DATA[region].subcontractor).toBeUndefined();
    }
    expect(RATE_CARD_DATA.ABSG.analyst).toBeUndefined();
  });

  it("derives day and commercial rates correctly (×8, ×RR)", () => {
    const info = toRateInfo(RATE_CARD_DATA.ABMY.principal);
    expect(info.standardRatePerDay).toBe(16000); // 2000 × 8
    expect(info.commercialRatePerDay).toBeCloseTo(6880, 6); // 16000 × 0.43
    expect(info.realizationRate).toBe(DEFAULT_REALIZATION_RATE);
  });

  it("flattens to 27 authoritative seed rows with the DB column shape", () => {
    const rows = canonicalRateRows();
    expect(rows).toHaveLength(27); // 7 ABMY + 6 ABSG + 7 ABVN + 7 ABTH
    for (const row of rows) {
      expect(row).toMatchObject({
        regionCode: expect.any(String),
        designation: expect.any(String),
        hourlyRate: expect.any(Number),
        localCurrency: expect.any(String),
        forexRate: expect.any(Number),
        baseCurrency: "MYR",
      });
    }
  });
});
