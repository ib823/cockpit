/**
 * Strangler seam — axis ticks and non-working-day shading.
 *
 * Pure, like the adapter, and for the same reason: the ticks live in the same
 * day-offset space as the bars, so the only way the axis can disagree with a
 * bar is if one of these functions changes — and that is assertable.
 *
 * ## Mapping legacy's one labelled row onto the canvas's two
 *
 * The legacy canvas renders one row of markers, each with a primary and a
 * secondary line ("W28" over "06-Jul-26"). The design-system axis renders two
 * rows: minor (the grain's own step) and major (the containing period). The
 * legacy pairs translate directly:
 *
 *     grain     minor (lower row)         major (upper row)
 *     Day       day of month "05"         month "Jul 26"
 *     Week      week "W28"                month "Jul 26"
 *     Month     month "Jul"               year "2026"
 *     Quarter   quarter "Q3"              year "2026"
 *
 * ## The first-tick clamp
 *
 * `eachMonthOfInterval` returns period STARTS, and the first period usually
 * starts before the plan does — a plan starting 5 Jan gets a "Jan" tick at
 * day -4, which the axis clips into invisibility. Any tick before day 0 is
 * clamped to 0: the label belongs to the period containing the origin, and
 * pinning it to the visible edge is what the legacy percentage layout
 * effectively did.
 */

import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  format,
  getDay,
  getMonth,
} from "date-fns";
import type { AxisTick, NonWorkingDay } from "@/components/ds/gantt/TimelineAxis";
import type { ZoomGrain } from "@/components/ds/gantt/scale";
import type { GanttHoliday } from "@/types/gantt-tool";
import { getUnifiedHolidays } from "@/lib/gantt-tool/holiday-integration";
import { dayOffset, type ProjectBounds } from "./adapter";

function tick(date: Date, origin: Date, label: string): AxisTick {
  return { day: Math.max(0, dayOffset(format(date, "yyyy-MM-dd"), origin)), label };
}

export interface AxisModel {
  majorTicks: AxisTick[];
  minorTicks: AxisTick[];
}

export function buildAxisTicks(bounds: ProjectBounds, grain: ZoomGrain): AxisModel {
  const { startDate: start, endDate: end } = bounds;
  const interval = { start, end };

  switch (grain) {
    case "Day":
      return {
        minorTicks: eachDayOfInterval(interval).map((d) =>
          tick(d, start, format(d, "dd"))
        ),
        majorTicks: eachMonthOfInterval(interval).map((d) =>
          tick(d, start, format(d, "MMM yy"))
        ),
      };
    case "Week":
      return {
        minorTicks: eachWeekOfInterval(interval, { weekStartsOn: 1 }).map((d) =>
          // Legacy labels weeks "W28"; the ISO week number, same format token.
          tick(d, start, `W${format(d, "w")}`)
        ),
        majorTicks: eachMonthOfInterval(interval).map((d) =>
          tick(d, start, format(d, "MMM yy"))
        ),
      };
    case "Month":
      return {
        minorTicks: eachMonthOfInterval(interval).map((d) =>
          tick(d, start, format(d, "MMM"))
        ),
        majorTicks: eachYearOfInterval(interval).map((d) =>
          tick(d, start, format(d, "yyyy"))
        ),
      };
    case "Quarter":
      return {
        minorTicks: eachQuarterOfInterval(interval).map((d) =>
          // Legacy's "Q3 '26" split across the two rows: Q3 below, year above.
          tick(d, start, `Q${Math.ceil((getMonth(d) + 1) / 3)}`)
        ),
        majorTicks: eachYearOfInterval(interval).map((d) =>
          tick(d, start, format(d, "yyyy"))
        ),
      };
  }
}

/**
 * Weekends and holidays as the axis's shading model.
 *
 * Weekends are derived by walking the plan a day at a time — a few thousand
 * iterations at worst, cheaper than being clever. Holidays come from the same
 * `getUnifiedHolidays` the legacy canvas calls, with the same hardcoded
 * "ABMY" region default, so the two canvases shade identical days. A holiday
 * that lands on a weekend keeps its name: named shading beats anonymous
 * shading when both apply.
 *
 * Generated regardless of grain; the axis itself only renders shading at Day
 * and Week, where a day is wide enough to be information rather than texture.
 */
export function buildNonWorkingDays(
  bounds: ProjectBounds,
  projectHolidays: GanttHoliday[]
): NonWorkingDay[] {
  const { startDate, durationDays } = bounds;
  const byDay = new Map<number, NonWorkingDay>();

  for (let day = 0; day < durationDays; day++) {
    const weekday = getDay(addDays(startDate, day));
    if (weekday === 0 || weekday === 6) {
      byDay.set(day, { day });
    }
  }

  for (const holiday of getUnifiedHolidays(
    bounds.startDate,
    bounds.endDate,
    projectHolidays,
    "ABMY"
  )) {
    const day = dayOffset(holiday.date, startDate);
    if (day >= 0 && day < durationDays) {
      byDay.set(day, { day, name: holiday.name });
    }
  }

  return [...byDay.values()].sort((a, b) => a.day - b.day);
}
