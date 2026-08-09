/**
 * The working calendar — the one source for "which days are not working days".
 *
 * Before this, three places answered that question and two of them disagreed:
 * the timeline axis shaded the UNIFIED holiday list (project holidays merged
 * with the region's public holidays), while every working-day count in the
 * tree pane was passed the project's own holidays only. A plan over a public
 * holiday therefore showed a shaded column and a duration that had not
 * noticed it. Both now read this module.
 *
 * It answers over an arbitrary window rather than the plan's own span, because
 * the timeline's horizon deliberately extends past the plan (see
 * `timeline-window.ts`) and a holiday in the empty months either side is still
 * a holiday.
 *
 * ## Dates are parsed as local midnight, always
 *
 * `new Date("2026-06-17")` is midnight UTC, while `startOfMonth(...)` and
 * every other date-fns constructor return local midnight. Subtracting one from
 * the other is up to a day of error either side of UTC — a holiday that lands
 * on the wrong column east of Greenwich. `parseIsoDate` keeps every date in
 * this system on the same local footing, so day offsets are exact.
 */

import { addDays, differenceInDays, format, getDay } from "date-fns";
import type { GanttHoliday } from "@/types/gantt-tool";
import { getUnifiedHolidays } from "./holiday-integration";

export type HolidayRegion = "ABMY" | "ABSG" | "ABVN";

/** The region the app has always defaulted to; kept in one place now. */
export const DEFAULT_REGION: HolidayRegion = "ABMY";

/**
 * `yyyy-MM-dd` (or a full ISO timestamp) as LOCAL midnight — never UTC.
 * Falls back to the platform parser for anything that is not ISO, so a
 * malformed stored date degrades rather than throwing.
 */
export function parseIsoDate(iso: string | Date): Date {
  if (iso instanceof Date) return iso;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(iso);
  }
  return new Date(y, m - 1, d);
}

export interface CalendarHoliday {
  /** Day offset from the window origin — the same space bars are placed in. */
  day: number;
  /** `yyyy-MM-dd`. */
  date: string;
  name: string;
  /** For the tooltip, e.g. "17 Jun 2026". */
  label: string;
}

export interface WorkingCalendar {
  /**
   * Weekend day offsets, EXCLUDING any that are also a holiday — a named day
   * beats an anonymous one, and painting both would stack two fills on one
   * column.
   */
  weekendDays: number[];
  holidays: CalendarHoliday[];
  /**
   * The unified list the window covers, in the shape the working-day and
   * costing helpers take. Passing this to them is what keeps a bar's duration
   * and the shading under it telling the same story.
   */
  holidayList: GanttHoliday[];
}

function isWeekend(date: Date): boolean {
  const weekday = getDay(date);
  return weekday === 0 || weekday === 6;
}

/**
 * Weekends and holidays across `[origin, origin + totalDays)`.
 *
 * Walks the window a day at a time for weekends — a few thousand iterations at
 * the widest horizon, cheaper than being clever about it.
 */
export function buildWorkingCalendar(
  origin: Date,
  totalDays: number,
  projectHolidays: GanttHoliday[] = [],
  region: HolidayRegion = DEFAULT_REGION
): WorkingCalendar {
  if (totalDays <= 0) return { weekendDays: [], holidays: [], holidayList: [] };

  const end = addDays(origin, totalDays - 1);
  // Fetched a day wide either side: the region list filters on UTC ISO
  // strings, so a local-midnight bound can drop the very first or last day
  // east of Greenwich. The day-offset filter below trims the overshoot.
  const holidayList = getUnifiedHolidays(
    addDays(origin, -1),
    addDays(end, 1),
    projectHolidays,
    region
  );

  const byDay = new Map<number, CalendarHoliday>();
  for (const holiday of holidayList) {
    const date = parseIsoDate(holiday.date);
    const day = differenceInDays(date, origin);
    if (day < 0 || day >= totalDays) continue;
    byDay.set(day, {
      day,
      date: holiday.date,
      name: holiday.name,
      label: format(date, "d MMM yyyy"),
    });
  }

  const weekendDays: number[] = [];
  for (let day = 0; day < totalDays; day++) {
    if (byDay.has(day)) continue;
    if (isWeekend(addDays(origin, day))) weekendDays.push(day);
  }

  return {
    weekendDays,
    holidays: [...byDay.values()].sort((a, b) => a.day - b.day),
    holidayList,
  };
}
