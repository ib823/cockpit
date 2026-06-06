/**
 * Canonical rate-card baseline tests.
 *
 * Guards the single-source-of-truth dataset: completeness (every region has every
 * app designation — the bug that broke server-side rate lookups), positive values,
 * and correct derivation of day/commercial rates.
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
  it("covers the 4 regions × 8 designations", () => {
    expect(REGIONS).toEqual(["ABMY", "ABSG", "ABVN", "ABTH"]);
    for (const region of REGIONS) {
      for (const designation of DESIGNATIONS) {
        const entry = RATE_CARD_DATA[region]?.[designation];
        expect(entry, `${region}/${designation} should exist`).toBeDefined();
        expect(entry.standardRatePerHour).toBeGreaterThan(0);
        expect(entry.forexRate).toBeGreaterThan(0);
        expect(entry.currency).toBeTruthy();
      }
    }
  });

  it("uses lowercase designations matching the app's resource enum", () => {
    for (const region of REGIONS) {
      for (const key of Object.keys(RATE_CARD_DATA[region])) {
        expect(key).toBe(key.toLowerCase());
        expect(DESIGNATIONS).toContain(key as (typeof DESIGNATIONS)[number]);
      }
    }
  });

  it("derives day and commercial rates correctly", () => {
    const info = toRateInfo(RATE_CARD_DATA.ABMY.principal);
    expect(info.standardRatePerDay).toBe(16000); // 2000 × 8
    expect(info.commercialRatePerDay).toBeCloseTo(6880, 6); // 16000 × 0.43
    expect(info.realizationRate).toBe(DEFAULT_REALIZATION_RATE);
  });

  it("flattens to 32 seed rows with the DB column shape", () => {
    const rows = canonicalRateRows();
    expect(rows).toHaveLength(REGIONS.length * DESIGNATIONS.length); // 32
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
