"use client";

/**
 * Design system — milestone layer (layer 4, Domain surfaces)
 *
 * Vertical rules through the canvas at each milestone's date, with a marker
 * at the top that opens milestone editing. Ported from the legacy canvas,
 * which drew the same two pieces — a 2px half-opacity rule and a clickable
 * diamond — with three deliberate changes:
 *
 *  - **The marker is a real `<button>` with an accessible name**, not a div
 *    with `role="button"` and only a `title`. The name carries the milestone's
 *    name and date, because "button" repeated once per milestone tells a
 *    screen reader user nothing.
 *
 *  - **The markers cannot live inside the axis.** The axis is `aria-hidden`
 *    (it is a scale, not data), and a focusable control inside an aria-hidden
 *    subtree is reachable by Tab but invisible to assistive technology — the
 *    worst of both. So this layer sits in the rows container, as data.
 *
 *  - **Out-of-range milestones are dropped, same as legacy** — a milestone
 *    outside the plan's bounds has no honest place to be drawn — but the drop
 *    is per-marker, so one stray date does not hide the rest.
 */

import React from "react";
import styles from "./GanttMilestones.module.css";
import { PX_PER_DAY, type ZoomGrain } from "./scale";

export interface CanvasMilestone {
  id: string;
  name: string;
  /** Day offset from the canvas origin, same space as bar placements. */
  day: number;
  /** Human date for the accessible name, e.g. "14 Jul 26". */
  dateLabel: string;
  color?: string;
}

export interface GanttMilestonesProps {
  milestones: CanvasMilestone[];
  grain: ZoomGrain;
  totalDays: number;
  /** Opens milestone editing. Absent renders the layer inert but visible. */
  onActivate?: (id: string) => void;
  /**
   * Rendered day width. The canvas passes its stretch-to-fit density so the
   * markers and the bars can never disagree; absent, the grain's spec density.
   */
  pxPerDay?: number;
}

/** Matches the legacy default (#FF3B30) so the two canvases agree on a plan. */
const DEFAULT_COLOR = "#FF3B30";

export function GanttMilestones({
  milestones,
  grain,
  totalDays,
  onActivate,
  pxPerDay,
}: GanttMilestonesProps) {
  const px = pxPerDay ?? PX_PER_DAY[grain];

  const visible = milestones.filter((m) => m.day >= 0 && m.day <= totalDays);
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((milestone) => {
        const left = milestone.day * px;
        const color = milestone.color || DEFAULT_COLOR;

        return (
          <React.Fragment key={milestone.id}>
            {/* The rule is decoration for the marker above it: the same fact
              * reaches assistive technology once, through the button's name,
              * instead of once per rule. pointer-events stays off so a rule
              * crossing a bar never steals the bar's click. */}
            <span
              className={styles.rule}
              style={{ left, backgroundColor: color }}
              aria-hidden="true"
            />
            <button
              type="button"
              className={styles.marker}
              style={{ left }}
              aria-label={`Milestone: ${milestone.name}, ${milestone.dateLabel}`}
              title={`${milestone.name} — ${milestone.dateLabel}`}
              onClick={() => onActivate?.(milestone.id)}
            >
              <span className={styles.diamond} style={{ backgroundColor: color }} aria-hidden="true" />
            </button>
          </React.Fragment>
        );
      })}
    </>
  );
}
