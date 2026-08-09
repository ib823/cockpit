"use client";

/**
 * Design system — timeline axis (layer 4, Domain surfaces)
 *
 * The date scale above the canvas, plus weekend, holiday and today marking.
 *
 * Two rules from the spec are enforced here:
 *
 *  - **Weekend and holiday shading renders at Day and Week grain only.** At
 *    Month a single day is 2.9px, so the shading stops being information and
 *    becomes texture — and texture is exactly what hides the exception you
 *    were looking for (principle P2).
 *
 *  - **The today marker never pulses.** A permanently animating element on a
 *    plan people stare at for an hour is an accessibility problem, not a
 *    delight. It is a 1.5px rule and a label.
 *
 * The shading is `aria-hidden`: the same information reaches assistive
 * technology as working-day counts inside each bar's accessible name, which is
 * more useful than "shaded region" repeated three hundred times.
 */

import React from "react";
import styles from "./TimelineAxis.module.css";
import { PX_PER_DAY, showsDayShading, type ZoomGrain } from "./scale";

export interface AxisTick {
  /** Day offset from the canvas origin. */
  day: number;
  label: string;
}

export interface NonWorkingDay {
  day: number;
  /** Present for holidays; absent means weekend. */
  name?: string;
}

export interface TimelineAxisProps {
  grain: ZoomGrain;
  totalDays: number;
  /** Upper row — months at Day/Week, quarters or years further out. */
  majorTicks: AxisTick[];
  /** Lower row — days, weeks or months. */
  minorTicks: AxisTick[];
  nonWorkingDays?: NonWorkingDay[];
  /** Day offset of today, or undefined when outside the window. */
  todayDay?: number;
  /**
   * Rendered day width. The canvas passes its stretch-to-fit density so the
   * axis and the bars can never disagree; absent, the grain's spec density.
   */
  pxPerDay?: number;
}

export function TimelineAxis({
  grain,
  totalDays,
  majorTicks,
  minorTicks,
  nonWorkingDays = [],
  todayDay,
  pxPerDay,
}: TimelineAxisProps) {
  const px = pxPerDay ?? PX_PER_DAY[grain];
  const width = totalDays * px;
  const shading = showsDayShading(grain);

  return (
    <div
      className={styles.axis}
      style={{ width }}
      // The axis is a scale, not data. Its labels duplicate what every bar
      // already says in its accessible name.
      aria-hidden="true"
    >
      {shading &&
        nonWorkingDays.map((d) => (
          <span
            key={`${d.day}-${d.name ?? "weekend"}`}
            className={`${styles.shade} ${d.name ? styles.holiday : styles.weekend}`}
            style={{ left: d.day * px, width: px }}
            title={d.name}
          />
        ))}

      {majorTicks.map((tick) => (
        <span key={`M${tick.day}`} className={styles.major} style={{ left: tick.day * px }}>
          {tick.label}
        </span>
      ))}

      {minorTicks.map((tick) => (
        <span key={`m${tick.day}`} className={styles.minor} style={{ left: tick.day * px }}>
          {tick.label}
        </span>
      ))}

      {todayDay != null && todayDay >= 0 && todayDay <= totalDays && (
        <>
          <span className={styles.today} style={{ left: todayDay * px }} />
          <span className={styles.todayLabel} style={{ left: todayDay * px }}>
            Today
          </span>
        </>
      )}
    </div>
  );
}
