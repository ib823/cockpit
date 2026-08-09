"use client";

/**
 * Design system — timeline axis (layer 4, Domain surfaces)
 *
 * The hierarchical date header: a naming row, a column row, unlabelled
 * subdivision lines, and the non-working days underneath them. What each row
 * contains at each grain is `axis-bands.ts`'s decision; this file is how it
 * looks.
 *
 * Four marks share this strip and must never be mistaken for one another, so
 * each is carried by a different property rather than by hue alone:
 *
 *  - **weekend** — a flat recessive fill, no rule. Rhythm, not information.
 *  - **holiday** — a warning fill AND a rule along the top. Named, and the
 *    only mark here that carries a tooltip.
 *  - **today** — a 1.5px accent rule and a chip. Never a pulse: a permanently
 *    animating element on a plan people stare at for an hour is an
 *    accessibility problem, not a delight.
 *  - **grid** — a hairline, no fill, behind everything.
 *
 * ## Why holidays render at every grain and weekends do not
 *
 * A weekend at Month grain is 5.8px of fill every 20px — stripes, and stripes
 * are exactly what hides the exception you were looking for (principle P2). A
 * holiday is a single named day that changes what a plan costs, so it survives
 * the zoom: at Quarter grain one day is 1.15px, which would vanish, so the
 * marker is floored at `HOLIDAY_MIN_PX` and stays anchored at its proportional
 * date. It marks the day, never the week or the quarter containing it.
 *
 * The strip is `aria-hidden`: its labels duplicate what every bar already says
 * in its accessible name, and the working-day counts that the shading conveys
 * visually reach assistive technology through each bar's description instead.
 */

import React from "react";
import styles from "./TimelineAxis.module.css";
import type { AxisBands } from "./axis-bands";
import { HOLIDAY_MIN_PX, showsWeekendShading, type ZoomGrain } from "./scale";

/** A named non-working day, in the canvas's day-offset space. */
export interface AxisHoliday {
  day: number;
  name: string;
  /** Human date for the tooltip, e.g. "17 Jun 2026". */
  label: string;
}

export interface TimelineAxisProps {
  grain: ZoomGrain;
  totalDays: number;
  /** Rendered day width. The canvas owns it so bars and header cannot drift. */
  pxPerDay: number;
  bands: AxisBands;
  /** Weekend day offsets. Rendered at Day and Week grain only. */
  weekendDays?: number[];
  /** Holidays. Rendered at every grain, proportional to their date. */
  holidays?: AxisHoliday[];
  /** Day offset of today, or undefined when outside the window. */
  todayDay?: number;
}

export function TimelineAxis({
  grain,
  totalDays,
  pxPerDay,
  bands,
  weekendDays = [],
  holidays = [],
  todayDay,
}: TimelineAxisProps) {
  const width = totalDays * pxPerDay;
  const holidayWidth = Math.max(pxPerDay, HOLIDAY_MIN_PX);

  return (
    <div className={styles.axis} style={{ width }} aria-hidden="true">
      {showsWeekendShading(grain) &&
        weekendDays.map((day) => (
          <span
            key={`w${day}`}
            className={styles.weekend}
            style={{ left: day * pxPerDay, width: pxPerDay }}
          />
        ))}

      {bands.gridlineDays.map((day) => (
        <span key={`g${day}`} className={styles.gridline} style={{ left: day * pxPerDay }} />
      ))}

      {/* Above the grid so a holiday is never cut by a line, and interactive
        * so the name and date are one hover away — the only mark in the strip
        * that has something to say beyond its position. */}
      {holidays.map((holiday) => (
        <span
          key={`h${holiday.day}`}
          className={styles.holiday}
          style={{ left: holiday.day * pxPerDay, width: holidayWidth }}
          title={`${holiday.name} — ${holiday.label}`}
        />
      ))}

      {bands.major.map((band) => (
        <span
          key={`M${band.key}`}
          className={styles.major}
          style={{ left: band.startDay * pxPerDay, width: band.days * pxPerDay }}
        >
          {band.label}
        </span>
      ))}

      {bands.minor.map((band) => (
        <span
          key={`m${band.key}`}
          className={styles.minor}
          style={{ left: band.startDay * pxPerDay, width: band.days * pxPerDay }}
        >
          {band.label}
        </span>
      ))}

      {todayDay != null && todayDay >= 0 && todayDay <= totalDays && (
        <>
          <span className={styles.today} style={{ left: todayDay * pxPerDay }} />
          <span className={styles.todayLabel} style={{ left: todayDay * pxPerDay }}>
            Today
          </span>
        </>
      )}
    </div>
  );
}
