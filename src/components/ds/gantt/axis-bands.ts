/**
 * Design system — the timeline header's band model (layer 4, Domain surfaces)
 *
 * A Gantt header is two nested calendars: a coarse row that names the period
 * you are in, and a fine row that names the columns inside it. Each grain
 * pairs them differently, and each carries a third, unlabelled subdivision so
 * the eye can count within a column without reading anything:
 *
 *     grain     major row      minor row        gridlines
 *     Day       Jun 2026       15, 16, 17 …     — (the day columns are it)
 *     Week      Jun 2026       W25, W26 …       daily
 *     Month     2026           Jun, Jul …       weekly
 *     Quarter   2026           Q2, Q3 …         monthly
 *
 * Bands SPAN their period rather than marking its start. The previous header
 * positioned a label at the period's first pixel and let it run, which is why
 * "Jul 26" could sit above days belonging to June once a month was partly
 * scrolled: nothing tied the label to the extent of what it named. A band
 * carries its own width, so it can be clipped at the window edge and still
 * describe exactly the columns underneath it.
 *
 * Pure by design — the same reason the placement adapter is. The header and
 * the bars are two renderings of one day-offset space, and the only way they
 * can disagree is if this arithmetic is wrong, which is assertable.
 */

import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  format,
  getQuarter,
} from "date-fns";
import type { ZoomGrain } from "./scale";

export interface AxisBand {
  /** Stable across re-renders and scale changes. */
  key: string;
  /** Day offset of the band's first visible day, clipped to the window. */
  startDay: number;
  /** Visible width in days, after clipping. Always > 0. */
  days: number;
  label: string;
  /** True when the period is cut by the window edge, so the label may not fit. */
  clipped: boolean;
}

export interface AxisBands {
  /** The naming row: month/year at Day and Week, year at Month and Quarter. */
  major: AxisBand[];
  /** The column row: days, weeks, months or quarters. */
  minor: AxisBand[];
  /** Day offsets of the unlabelled subdivision lines, excluding both edges. */
  gridlineDays: number[];
}

const MONDAY = { weekStartsOn: 1 } as const;

interface Unit {
  starts: (start: Date, end: Date) => Date[];
  next: (date: Date) => Date;
  label: (date: Date) => string;
}

const DAY: Unit = {
  starts: (start, end) => eachDayOfInterval({ start, end }),
  next: (d) => addDays(d, 1),
  label: (d) => format(d, "d"),
};

const WEEK: Unit = {
  starts: (start, end) => eachWeekOfInterval({ start, end }, MONDAY),
  next: (d) => addWeeks(d, 1),
  // ISO week number, which is the Monday-based numbering the weeks are cut on.
  label: (d) => `W${format(d, "I")}`,
};

const MONTH_IN_YEAR: Unit = {
  starts: (start, end) => eachMonthOfInterval({ start, end }),
  next: (d) => addMonths(d, 1),
  label: (d) => format(d, "MMM"),
};

const MONTH_WITH_YEAR: Unit = {
  ...MONTH_IN_YEAR,
  label: (d) => format(d, "MMM yyyy"),
};

const QUARTER: Unit = {
  starts: (start, end) => eachQuarterOfInterval({ start, end }),
  next: (d) => addQuarters(d, 1),
  label: (d) => `Q${getQuarter(d)}`,
};

const YEAR: Unit = {
  starts: (start, end) => eachYearOfInterval({ start, end }),
  next: (d) => addYears(d, 1),
  label: (d) => format(d, "yyyy"),
};

/** major, minor, and the subdivision the gridlines are drawn on. */
const GRAINS: Record<ZoomGrain, { major: Unit; minor: Unit; grid?: Unit }> = {
  Day: { major: MONTH_WITH_YEAR, minor: DAY },
  Week: { major: MONTH_WITH_YEAR, minor: WEEK, grid: DAY },
  Month: { major: YEAR, minor: MONTH_IN_YEAR, grid: WEEK },
  Quarter: { major: YEAR, minor: QUARTER, grid: MONTH_IN_YEAR },
};

function bandsFor(unit: Unit, origin: Date, totalDays: number): AxisBand[] {
  const last = addDays(origin, Math.max(0, totalDays - 1));

  return unit
    .starts(origin, last)
    .map((periodStart) => {
      const rawStart = differenceInDays(periodStart, origin);
      const rawEnd = differenceInDays(unit.next(periodStart), origin);
      const startDay = Math.max(0, rawStart);
      const endDay = Math.min(totalDays, rawEnd);

      return {
        key: format(periodStart, "yyyy-MM-dd"),
        startDay,
        days: endDay - startDay,
        label: unit.label(periodStart),
        clipped: rawStart < 0 || rawEnd > totalDays,
      };
    })
    .filter((band) => band.days > 0);
}

/**
 * The header for one window at one grain.
 *
 * `totalDays` is the horizon, not the plan — see `timeline-window.ts`.
 */
export function buildAxisBands(
  origin: Date,
  totalDays: number,
  grain: ZoomGrain
): AxisBands {
  if (totalDays <= 0) return { major: [], minor: [], gridlineDays: [] };

  const { major, minor, grid } = GRAINS[grain];

  return {
    major: bandsFor(major, origin, totalDays),
    minor: bandsFor(minor, origin, totalDays),
    // The window edges already have the pane's own borders; a line on top of
    // them reads as a double rule.
    gridlineDays: grid
      ? bandsFor(grid, origin, totalDays)
          .map((band) => band.startDay)
          .filter((day) => day > 0 && day < totalDays)
      : [],
  };
}
