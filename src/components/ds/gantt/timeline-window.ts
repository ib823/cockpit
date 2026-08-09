/**
 * Design system — the timeline's planning horizon (layer 4, Domain surfaces)
 *
 * What the canvas shows is a WINDOW ONTO A CALENDAR, not a rendering of the
 * plan's own span. That distinction is the whole point of this module.
 *
 * The canvas used to size itself to the plan: the first phase started at the
 * left edge, the last one ended at the right edge, and the zoom control only
 * relabelled the header. A five-week plan therefore filled the screen at every
 * grain, "Quarter" showed two quarters, and there was nowhere to put work that
 * had not been scheduled yet. That is a picture of a plan, not a planning
 * surface.
 *
 * Now each grain carries its own horizon — a quarter of days, a year of weeks,
 * three years of months, five years of quarters — anchored just before the
 * plan and scrolled horizontally. Zooming changes the DENSITY OF TIME on
 * screen and nothing else: a day is 26px at Day grain whatever the plan is, so
 * two plans at the same grain are directly comparable, and a bar's width means
 * the same thing on every screen.
 *
 * Three rules keep the horizon honest:
 *
 *  - It never ends before the plan does. A five-year programme at Day grain
 *    extends the horizon rather than truncating the plan at 92 days.
 *  - It never ends before the viewport does. A wide monitor shows MORE TIME,
 *    not stretched time — the alternative (widening the day to fill) is what
 *    made a day mean a different distance on every screen.
 *  - It starts on a boundary of the grain's own unit, so the first column is a
 *    whole week, month or quarter rather than a stub.
 */

import {
  addDays,
  differenceInDays,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  subDays,
} from "date-fns";
import { PX_PER_DAY, type ZoomGrain } from "./scale";

/**
 * Default planning horizon per grain, in days — what you see before scrolling
 * when the plan is small. Roughly: a quarter, a year, three years, five years.
 */
export const HORIZON_DAYS: Record<ZoomGrain, number> = {
  Day: 92,
  Week: 371,
  Month: 1096,
  Quarter: 1827,
};

/**
 * How much calendar to show BEFORE the plan starts. A plan pinned to the left
 * edge reads as though nothing could precede it; a little runway is what makes
 * the surface feel like a calendar you are placing work onto.
 */
export const LEAD_DAYS: Record<ZoomGrain, number> = {
  Day: 7,
  Week: 28,
  Month: 92,
  Quarter: 183,
};

/** The first day of the grain's own unit containing `date`. */
export function snapToGrainStart(date: Date, grain: ZoomGrain): Date {
  switch (grain) {
    case "Day":
    case "Week":
      // Monday, matching the week numbering and the weekend shading.
      return startOfWeek(date, { weekStartsOn: 1 });
    case "Month":
      return startOfMonth(date);
    case "Quarter":
      return startOfQuarter(date);
  }
}

export interface TimelineWindow {
  /** Day 0 of the canvas — bars, ticks and shading are all offsets from here. */
  origin: Date;
  /** Horizon length in days. */
  totalDays: number;
}

export interface TimelineWindowInput {
  grain: ZoomGrain;
  /** The plan's first day, when there is a plan. */
  projectStart?: Date;
  /** The plan's last day. */
  projectEnd?: Date;
  /** Used as the anchor when there is no plan yet. */
  today?: Date;
  /** Measured width of the scrolling pane; 0 before first measure. */
  viewportPx?: number;
}

/**
 * The window for a grain. Stable for a given plan and grain — deliberately
 * NOT a function of the scroll position, because a window that moved as you
 * scrolled would chase its own tail.
 */
export function computeTimelineWindow({
  grain,
  projectStart,
  projectEnd,
  today = new Date(),
  viewportPx = 0,
}: TimelineWindowInput): TimelineWindow {
  const lead = LEAD_DAYS[grain];
  const anchor = projectStart ?? today;
  const origin = snapToGrainStart(subDays(anchor, lead), grain);

  // Long enough to reach past the plan's end with the same runway it got at
  // the start, so the last bar is never flush against the right edge.
  const planDays = projectEnd ? differenceInDays(projectEnd, origin) + 1 + lead : 0;
  // Long enough that the canvas cannot end inside the viewport.
  const viewportDays = viewportPx > 0 ? Math.ceil(viewportPx / PX_PER_DAY[grain]) : 0;

  return {
    origin,
    totalDays: Math.max(HORIZON_DAYS[grain], planDays, viewportDays),
  };
}

/** The date at a day offset from the window origin. */
export function dayToDate(origin: Date, day: number): Date {
  return addDays(origin, day);
}

/** The day offset of a date from the window origin. */
export function dateToDay(date: Date, origin: Date): number {
  return differenceInDays(date, origin);
}

const FINEST_FIRST: ZoomGrain[] = ["Day", "Week", "Month", "Quarter"];

/**
 * The grain that shows `spanDays` in one screenful — the finest that fits, so
 * "Fit project" lands on the most detail the plan allows rather than the least.
 * Falls back to the coarsest grain for a plan too long for any of them.
 */
export function grainThatFits(spanDays: number, viewportPx: number): ZoomGrain {
  if (spanDays <= 0 || viewportPx <= 0) return "Week";
  return (
    FINEST_FIRST.find((grain) => spanDays * PX_PER_DAY[grain] <= viewportPx) ??
    "Quarter"
  );
}
