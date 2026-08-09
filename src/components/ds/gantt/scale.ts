/**
 * Design system — Gantt scale (layer 4, Domain surfaces)
 *
 * The arithmetic every Gantt surface shares: pixels per day at each zoom
 * grain, and the rules that decide whether a bar is clickable and whether its
 * label fits inside it.
 *
 * Separated from the components because the timeline canvas, the tree column
 * and the export renderer all have to agree on these numbers. When they were
 * duplicated, they drifted.
 */

export type ZoomGrain = "Day" | "Week" | "Month" | "Quarter";

/** Pixels per day. */
export const PX_PER_DAY: Record<ZoomGrain, number> = {
  Day: 26,
  Week: 8.4,
  Month: 2.9,
  Quarter: 1.15,
};

/** Days per tick at each grain. */
export const DAYS_PER_TICK: Record<ZoomGrain, number> = {
  Day: 1,
  Week: 7,
  Month: 30,
  Quarter: 90,
};

/** Standard and compact row heights. Text size never changes between them —
 *  density comes from space, not from shrinking type below legibility. */
export const ROW_HEIGHT = { standard: 32, compact: 28 } as const;

export const BAR_HEIGHT = {
  phase: 10,
  task: 14,
  milestone: 12,
  baseline: 4,
} as const;

/**
 * Below this a bar cannot be clicked reliably, so it renders at this width
 * with a larger invisible hit area and its label outside.
 */
export const MIN_BAR_PX = 4;

/** The invisible hit area given to a sub-minimum bar. */
export const MIN_HIT_PX = 24;

/**
 * The day width actually rendered: the grain's density, raised so a plan
 * shorter than the viewport still spans it end to end. The grain then only
 * changes tick density, never leaves dead canvas to the right — a 4-week plan
 * at Quarter zoom is a full-width chart, not a 32px sliver.
 */
export function effectivePxPerDay(
  grain: ZoomGrain,
  totalDays: number,
  viewportPx: number
): number {
  const base = PX_PER_DAY[grain];
  if (totalDays <= 0 || viewportPx <= 0) return base;
  return Math.max(base, viewportPx / totalDays);
}

export function daysToPx(days: number, grain: ZoomGrain): number {
  return days * PX_PER_DAY[grain];
}

export function pxToDays(px: number, grain: ZoomGrain): number {
  return px / PX_PER_DAY[grain];
}

/**
 * Whether a label fits inside a bar of this width.
 *
 * 6.2px per character is the measured average advance of the body face at
 * 13px; 14px covers the padding either side. Deliberately an estimate rather
 * than a measurement: measuring text for 1,200 rows on every zoom change costs
 * more than the occasional label that could have squeezed in.
 */
export function labelFitsInside(label: string, barPx: number): boolean {
  return barPx >= label.length * 6.2 + 14;
}

/**
 * Below this much free canvas to the right, an outside label has nowhere to
 * go and becomes a tooltip only. The tree column stays the reliable place to
 * read a name — which is why it never scrolls away.
 */
export const MIN_OUTSIDE_LABEL_PX = 60;

/** Weekend and holiday shading is only drawn where a day is wide enough to
 *  read. At Month a single day is 2.9px and the shading becomes noise. */
export function showsDayShading(grain: ZoomGrain): boolean {
  return grain === "Day" || grain === "Week";
}

/** Arrow-key nudge distance: one unit of the current grain, so the keyboard
 *  equivalent of a drag moves by what the user can actually see. */
export function nudgeDays(grain: ZoomGrain): number {
  return DAYS_PER_TICK[grain];
}
