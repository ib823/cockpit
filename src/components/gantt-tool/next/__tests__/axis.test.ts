/**
 * The axis model shares the bars' day-offset space; these tests are what keeps
 * a tick from drifting off its date. The two properties that matter:
 *
 *  - Tick offsets come from the same `dayOffset` as the bars, so "1 Feb" on
 *    the axis and a bar starting 1 Feb are the same pixel.
 *  - The first period's tick is clamped to day 0 instead of being clipped
 *    into invisibility, because plans rarely start on the 1st.
 */

import { describe, expect, it } from "vitest";
import { differenceInDays } from "date-fns";
import type { ProjectBounds } from "../adapter";
import { buildAxisTicks, buildNonWorkingDays } from "../axis";

const bounds = (start: string, end: string): ProjectBounds => ({
  startDate: new Date(start),
  endDate: new Date(end),
  durationDays: differenceInDays(new Date(end), new Date(start)) + 1,
});

// Mon 5 Jan – Tue 31 Mar 2026. Chosen because it starts mid-month AND
// mid-week, which exercises both clamps at once.
const Q1 = bounds("2026-01-05", "2026-03-31");

describe("buildAxisTicks", () => {
  it("clamps the origin-containing period to day 0 rather than clipping it", () => {
    const { majorTicks } = buildAxisTicks(Q1, "Week");

    // January "started" on day -4; its label must sit at the visible edge.
    expect(majorTicks[0]).toEqual({ day: 0, label: "Jan 26" });
  });

  it("places later ticks with the bars' arithmetic", () => {
    const { majorTicks } = buildAxisTicks(Q1, "Week");

    // 1 Feb is 27 days after 5 Jan — the same offset the adapter computes
    // for a bar starting 1 Feb.
    expect(majorTicks[1]).toEqual({ day: 27, label: "Feb 26" });
    expect(majorTicks[2]).toEqual({ day: 55, label: "Mar 26" });
  });

  it("labels weeks the way legacy does, and starts them on Monday", () => {
    const { minorTicks } = buildAxisTicks(Q1, "Week");

    // The plan starts on a Monday, so the first week tick is day 0 exactly —
    // no clamp involved — and the next is 7 days later.
    expect(minorTicks[0].day).toBe(0);
    expect(minorTicks[1].day).toBe(7);
    expect(minorTicks[0].label).toMatch(/^W\d+$/);
  });

  it("splits legacy's 'Q1 '26' across the two rows at Quarter grain", () => {
    const { minorTicks, majorTicks } = buildAxisTicks(Q1, "Quarter");

    expect(minorTicks[0]).toEqual({ day: 0, label: "Q1" });
    expect(majorTicks[0]).toEqual({ day: 0, label: "2026" });
  });

  it("gives Month grain months below and years above", () => {
    const twoYears = bounds("2026-11-15", "2027-02-10");
    const { minorTicks, majorTicks } = buildAxisTicks(twoYears, "Month");

    expect(minorTicks.map((t) => t.label)).toEqual(["Nov", "Dec", "Jan", "Feb"]);
    // 2026's tick clamps to 0; 2027's lands on 1 Jan, 47 days in.
    expect(majorTicks.map((t) => t.day)).toEqual([0, 47]);
  });

  it("emits one minor tick per day at Day grain", () => {
    const week = bounds("2026-01-05", "2026-01-11");
    const { minorTicks } = buildAxisTicks(week, "Day");

    expect(minorTicks).toHaveLength(7);
    expect(minorTicks.map((t) => t.day)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(minorTicks[0].label).toBe("05");
  });
});

describe("buildNonWorkingDays", () => {
  it("shades exactly the weekends of the plan", () => {
    // Mon 5 Jan – Sun 11 Jan: one weekend, days 5 (Sat) and 6 (Sun).
    const week = bounds("2026-01-05", "2026-01-11");
    const days = buildNonWorkingDays(week, []);

    const weekends = days.filter((d) => !d.name);
    expect(weekends.map((d) => d.day)).toEqual(
      expect.arrayContaining([5, 6])
    );
    // No weekday leaked in: Mon–Fri are 0–4, none of which may be shaded
    // as weekend.
    expect(weekends.every((d) => d.day === 5 || d.day === 6)).toBe(true);
  });

  it("carries a project holiday with its name at the bars' offset", () => {
    const days = buildNonWorkingDays(Q1, [
      { id: "h1", name: "Company Day", date: "2026-02-02", region: "ABMY", type: "company" },
    ]);

    // 2 Feb 2026 is a Monday, 28 days in — so it can only be here by name.
    expect(days).toContainEqual({ day: 28, name: "Company Day" });
  });

  it("keeps the name when a holiday falls on a weekend", () => {
    // 1 Feb 2026 is a Sunday. The named entry must win over the anonymous
    // weekend shading, not be swallowed by it.
    const days = buildNonWorkingDays(Q1, [
      { id: "h1", name: "Federal Day", date: "2026-02-01", region: "ABMY", type: "public" },
    ]);

    const feb1 = days.filter((d) => d.day === 27);
    expect(feb1).toEqual([{ day: 27, name: "Federal Day" }]);
  });

  it("drops a holiday outside the plan instead of shading a phantom day", () => {
    const days = buildNonWorkingDays(Q1, [
      { id: "h1", name: "Later", date: "2026-06-01", region: "ABMY", type: "company" },
    ]);

    expect(days.find((d) => d.name === "Later")).toBeUndefined();
  });

  it("returns days sorted, one entry per day", () => {
    const days = buildNonWorkingDays(Q1, []);

    const offsets = days.map((d) => d.day);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(new Set(offsets).size).toBe(offsets.length);
  });
});
