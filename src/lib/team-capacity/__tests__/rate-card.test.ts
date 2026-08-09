/**
 * Rate-card shape and derivation.
 *
 * These used to assert the organisation's real rates — the test file was a
 * second copy of the confidential rate card, and a public one. What matters
 * is the arithmetic and the invariants, so the fixtures below are invented
 * round numbers and the module under test carries no rates at all.
 */

import { describe, test, expect } from "vitest";
import {
  HOURS_PER_DAY,
  DESIGNATIONS,
  DEFAULT_REGION,
  NO_REALIZATION_DISCOUNT,
  toRateInfo,
} from "../rate-card";

// Invented. If these ever look like a real rate card, something has regressed.
const SAMPLE = { standardRatePerHour: 100, currency: "MYR", forexRate: 1 };

describe("rate-card module", () => {
  test("ships no rates of its own", async () => {
    // The regression this guards is the whole point of the file: someone
    // reintroducing a "sensible default" rate card in code.
    const module = await import("../rate-card");
    const exported = Object.entries(module);

    for (const [name, value] of exported) {
      if (typeof value === "function") continue;
      // No exported object may be a region → designation → rate table.
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = Object.values(value as Record<string, unknown>);
        const looksLikeRateTable = nested.some(
          (v) =>
            v !== null &&
            typeof v === "object" &&
            "standardRatePerHour" in (v as Record<string, unknown>)
        );
        expect(looksLikeRateTable, `${name} looks like a rate table`).toBe(false);
      }
    }
  });

  test("a day is eight hours", () => {
    expect(HOURS_PER_DAY).toBe(8);
  });

  test("realization defaults to no discount, which is visibly wrong", () => {
    // Never a plausible-looking commercial value: an unconfigured project must
    // not quietly under-report revenue with a rate someone might believe.
    expect(NO_REALIZATION_DISCOUNT).toBe(1);
  });

  test("the designation set is complete and unique", () => {
    expect(new Set(DESIGNATIONS).size).toBe(DESIGNATIONS.length);
    expect(DESIGNATIONS).toContain("principal");
    expect(DESIGNATIONS).toContain("subcontractor");
    expect(DEFAULT_REGION).toBeTruthy();
  });

  test("day rate is the hourly rate times a working day", () => {
    const info = toRateInfo(SAMPLE);
    expect(info.standardRatePerDay).toBe(SAMPLE.standardRatePerHour * HOURS_PER_DAY);
  });

  test("commercial rate is the day rate after realization", () => {
    const info = toRateInfo(SAMPLE, 0.5);
    expect(info.commercialRatePerDay).toBe(info.standardRatePerDay * 0.5);
    expect(info.realizationRate).toBe(0.5);
  });

  test("with no realization given, the commercial rate is the standard rate", () => {
    const info = toRateInfo(SAMPLE);
    expect(info.commercialRatePerDay).toBe(info.standardRatePerDay);
  });

  test("currency and forex pass through untouched", () => {
    const info = toRateInfo({ standardRatePerHour: 10, currency: "SGD", forexRate: 3 });
    expect(info.currency).toBe("SGD");
    expect(info.forexRate).toBe(3);
  });
});
