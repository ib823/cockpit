/**
 * The scale contract, validated on one concrete plan at all four grains.
 *
 * The plan is the one the redesign was specified against: a phase running
 * 15 June 2026 (Monday) to 13 July 2026 (Monday) — 29 inclusive days — with a
 * holiday on 17 June 2026, the Wednesday of its first week.
 *
 * What these assert is the property that makes semantic zoom trustworthy:
 * changing the grain changes the DENSITY OF TIME on screen and nothing else.
 * The phase is still 29 days long, the holiday is still on the 17th, and both
 * still sit at the same fraction along the calendar — at Day grain where a day
 * is 26px, and at Quarter grain where it is 1.15px.
 *
 * The failure they exist to catch is silent by nature: every one of these
 * still renders when it is wrong. A holiday snapped to the start of its week,
 * a bar measured from the plan instead of the window, a header labelled from a
 * different origin than the bars — all of them produce a plausible chart.
 */

import { describe, test, expect } from "vitest";
import { addDays, differenceInDays, format } from "date-fns";
import { buildAxisBands } from "@/components/ds/gantt/axis-bands";
import {
  computeTimelineWindow,
  HORIZON_DAYS,
} from "@/components/ds/gantt/timeline-window";
import { PX_PER_DAY, type ZoomGrain } from "@/components/ds/gantt/scale";
import { buildWorkingCalendar, parseIsoDate } from "@/lib/gantt-tool/working-calendar";
import { dayOffset, inclusiveDays } from "../adapter";

const PHASE_START = "2026-06-15";
const PHASE_END = "2026-07-13";
const HOLIDAY = "2026-06-17";
const GRAINS: ZoomGrain[] = ["Day", "Week", "Month", "Quarter"];

const projectStart = parseIsoDate(PHASE_START);
const projectEnd = parseIsoDate(PHASE_END);

function windowFor(grain: ZoomGrain) {
  return computeTimelineWindow({
    grain,
    projectStart,
    projectEnd,
    viewportPx: 1200,
  });
}

const HOLIDAYS = [
  { id: "h1", name: "Test Holiday", date: HOLIDAY, region: "ABMY" as const, type: "custom" as const },
];

describe("the 15 Jun – 13 Jul 2026 phase at every grain", () => {
  test("the phase is 29 days long, whatever the scale", () => {
    // Inclusive: 15 June to 13 July is 29 days, not 28. Every duration in the
    // plan carries that +1, and dropping it shortens every bar by a day.
    expect(inclusiveDays(PHASE_START, PHASE_END)).toBe(29);
  });

  test("the phase keeps its start date and duration at every grain", () => {
    for (const grain of GRAINS) {
      const { origin } = windowFor(grain);
      const startDay = dayOffset(PHASE_START, origin);

      // The bar's first day is 15 June and its last is 13 July, read back out
      // of the day-offset space the canvas actually places it in.
      expect(format(addDays(origin, startDay), "yyyy-MM-dd")).toBe(PHASE_START);
      expect(format(addDays(origin, startDay + 28), "yyyy-MM-dd")).toBe(PHASE_END);
    }
  });

  test("the holiday stays on 17 June at every grain", () => {
    for (const grain of GRAINS) {
      const { origin, totalDays } = windowFor(grain);
      const calendar = buildWorkingCalendar(origin, totalDays, HOLIDAYS);
      const holiday = calendar.holidays.find((h) => h.date === HOLIDAY);

      expect(holiday, `missing at ${grain}`).toBeDefined();
      expect(format(addDays(origin, holiday!.day), "yyyy-MM-dd")).toBe(HOLIDAY);
      expect(holiday!.label).toBe("17 Jun 2026");
    }
  });

  test("the holiday sits two days into the phase at every grain", () => {
    // The relationship that has to survive aggregation: 17 June is the third
    // day of a phase starting on the 15th. A holiday snapped to the start of
    // its week, month or quarter would put it on the 15th, the 1st or April.
    for (const grain of GRAINS) {
      const { origin, totalDays } = windowFor(grain);
      const calendar = buildWorkingCalendar(origin, totalDays, HOLIDAYS);
      const holiday = calendar.holidays.find((h) => h.date === HOLIDAY)!;

      expect(holiday.day - dayOffset(PHASE_START, origin)).toBe(2);
    }
  });

  test("the holiday's pixel position is proportional to its date, not its period", () => {
    for (const grain of GRAINS) {
      const { origin, totalDays } = windowFor(grain);
      const calendar = buildWorkingCalendar(origin, totalDays, HOLIDAYS);
      const holiday = calendar.holidays.find((h) => h.date === HOLIDAY)!;

      const px = PX_PER_DAY[grain];
      const expectedFraction =
        differenceInDays(parseIsoDate(HOLIDAY), origin) / totalDays;
      const actualFraction = (holiday.day * px) / (totalDays * px);

      expect(actualFraction).toBeCloseTo(expectedFraction, 10);
    }
  });

  test("a one-day holiday is never widened to the period containing it", () => {
    // At Quarter grain the marker is floored to stay visible, but the floor is
    // still an order of magnitude narrower than the month it sits in.
    const { origin, totalDays } = windowFor("Quarter");
    const calendar = buildWorkingCalendar(origin, totalDays, HOLIDAYS);

    expect(calendar.holidays.filter((h) => h.date === HOLIDAY)).toHaveLength(1);
    // One day marked, not seven, thirty or ninety.
    expect(calendar.holidays.filter((h) => h.name === "Test Holiday")).toHaveLength(1);
  });
});

describe("the planning horizon", () => {
  test("no grain fits the window to the 29-day phase", () => {
    // The defect this replaces: the timeline was sized to the plan, so five
    // weeks filled the screen at every zoom and "Quarter" showed two quarters.
    for (const grain of GRAINS) {
      const { totalDays } = windowFor(grain);
      expect(totalDays).toBe(HORIZON_DAYS[grain]);
      expect(totalDays).toBeGreaterThan(29 * 2);
    }
  });

  test("the window opens before the phase, so work can be planned earlier", () => {
    for (const grain of GRAINS) {
      const { origin } = windowFor(grain);
      expect(dayOffset(PHASE_START, origin)).toBeGreaterThan(0);
      expect(origin.getTime()).toBeLessThan(projectStart.getTime());
    }
  });

  test("the window ends after the phase, so work can be planned later", () => {
    for (const grain of GRAINS) {
      const { origin, totalDays } = windowFor(grain);
      expect(dayOffset(PHASE_END, origin)).toBeLessThan(totalDays - 1);
    }
  });

  test("the origin starts on a whole unit of its own grain", () => {
    // A header whose first column is a stub reads as a rendering error.
    expect(windowFor("Day").origin.getDay()).toBe(1); // Monday
    expect(windowFor("Week").origin.getDay()).toBe(1);
    expect(windowFor("Month").origin.getDate()).toBe(1);
    const quarterOrigin = windowFor("Quarter").origin;
    expect(quarterOrigin.getDate()).toBe(1);
    expect(quarterOrigin.getMonth() % 3).toBe(0);
  });
});

describe("the header each grain draws", () => {
  test("each grain nests the pair the spec calls for", () => {
    const { origin, totalDays } = windowFor("Day");

    // Day: months above, individual days below.
    const day = buildAxisBands(origin, totalDays, "Day");
    expect(day.major[0].label).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
    expect(day.minor[0].label).toMatch(/^\d{1,2}$/);
    expect(day.minor).toHaveLength(totalDays);

    // Week: months above, week numbers below, days as gridlines.
    const week = buildAxisBands(origin, totalDays, "Week");
    expect(week.major[0].label).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
    expect(week.minor[0].label).toMatch(/^W\d{1,2}$/);
    expect(week.gridlineDays.length).toBeGreaterThan(week.minor.length);

    // Month: years above, months below, weeks as gridlines.
    const month = buildAxisBands(origin, totalDays, "Month");
    expect(month.major[0].label).toMatch(/^\d{4}$/);
    expect(month.minor[0].label).toMatch(/^[A-Z][a-z]{2}$/);
    expect(month.gridlineDays.length).toBeGreaterThan(month.minor.length);

    // Quarter: years above, quarters below, months as gridlines.
    const quarter = buildAxisBands(origin, totalDays, "Quarter");
    expect(quarter.major[0].label).toMatch(/^\d{4}$/);
    expect(quarter.minor[0].label).toMatch(/^Q[1-4]$/);
    expect(quarter.gridlineDays.length).toBeGreaterThan(quarter.minor.length);
  });

  test("bands span their period rather than marking its start", () => {
    const { origin, totalDays } = windowFor("Week");
    const bands = buildAxisBands(origin, totalDays, "Week");

    for (const band of bands.minor) {
      expect(band.days).toBeGreaterThan(0);
      expect(band.startDay).toBeGreaterThanOrEqual(0);
      expect(band.startDay + band.days).toBeLessThanOrEqual(totalDays);
    }
    // A full week is 7 days wide; only the edges may be clipped.
    expect(bands.minor.filter((b) => b.days === 7).length).toBeGreaterThan(
      bands.minor.length - 3
    );
  });

  test("the bands tile the window with no gap and no overlap", () => {
    // A gap is a missing column; an overlap is a label sitting on days it does
    // not name. Both render perfectly happily.
    for (const grain of GRAINS) {
      const { origin, totalDays } = windowFor(grain);
      const { major, minor } = buildAxisBands(origin, totalDays, grain);

      for (const row of [major, minor]) {
        expect(row[0].startDay).toBe(0);
        expect(row[row.length - 1].startDay + row[row.length - 1].days).toBe(totalDays);
        for (let i = 1; i < row.length; i++) {
          expect(row[i].startDay).toBe(row[i - 1].startDay + row[i - 1].days);
        }
      }
    }
  });

  test("the phase's first week is labelled W25", () => {
    // 15 June 2026 is the Monday of ISO week 25 — the label the tree pane's
    // dates column and the header have to agree on.
    const { origin, totalDays } = windowFor("Week");
    const bands = buildAxisBands(origin, totalDays, "Week");
    const startDay = dayOffset(PHASE_START, origin);
    const band = bands.minor.find(
      (b) => startDay >= b.startDay && startDay < b.startDay + b.days
    );

    expect(band?.label).toBe("W25");
  });
});

describe("the shared working calendar", () => {
  test("weekends and holidays never claim the same day", () => {
    // Two fills on one column reads as a rendering fault, and the named day is
    // the one worth keeping.
    const { origin, totalDays } = windowFor("Week");
    const calendar = buildWorkingCalendar(origin, totalDays, [
      // 20 June 2026 is a Saturday.
      { id: "h2", name: "Saturday Holiday", date: "2026-06-20", region: "ABMY", type: "custom" },
    ]);

    const holidayDays = new Set(calendar.holidays.map((h) => h.day));
    expect(calendar.weekendDays.some((d) => holidayDays.has(d))).toBe(false);
  });

  test("weekends land on real Saturdays and Sundays", () => {
    const { origin, totalDays } = windowFor("Day");
    const calendar = buildWorkingCalendar(origin, totalDays, []);

    for (const day of calendar.weekendDays.slice(0, 20)) {
      const weekday = addDays(origin, day).getDay();
      expect(weekday === 0 || weekday === 6).toBe(true);
    }
  });

  test("the same list feeds the shading and the duration columns", () => {
    // The disagreement this closes: the axis shaded the region's public
    // holidays while every working-day count had only seen the project's own.
    const { origin, totalDays } = windowFor("Week");
    const calendar = buildWorkingCalendar(origin, totalDays, HOLIDAYS);

    expect(calendar.holidayList.some((h) => h.date === HOLIDAY)).toBe(true);
    expect(calendar.holidays.map((h) => h.date)).toContain(HOLIDAY);
  });

  test("ISO dates are read as local days, never as UTC instants", () => {
    // `new Date("2026-06-17")` is midnight UTC; subtracting it from a
    // local-midnight origin is a day of error east of Greenwich, which lands
    // the holiday in the wrong column.
    const parsed = parseIsoDate(HOLIDAY);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(5); // June
    expect(parsed.getDate()).toBe(17);
    expect(parsed.getHours()).toBe(0);
  });
});
