"use client";

/**
 * Design system — AMS chevron (layer 4, Domain surfaces)
 *
 * An AMS phase is an ongoing support contract, and the timeline treats it
 * differently on purpose: `getProjectDuration()` excludes AMS end dates so a
 * three-year contract does not stretch a four-month plan into illegibility.
 * The consequence is that an AMS phase CANNOT be drawn as a duration bar —
 * its end lies beyond the canvas — so the legacy canvas draws a fixed-width
 * strip of five chevrons at the start date, and this reproduces that:
 * same 160px footprint, same 24×32 chevron path, same #FF6B35.
 *
 * The interactive surface deliberately mirrors GanttBar's: one `<button>`
 * whose accessible name carries the whole fact, `aria-pressed` for selection,
 * select and keydown delegated to the canvas. The cursor, selection and
 * announcement plumbing then treat an AMS row exactly like any other — the
 * only thing that differs is the paint.
 */

import React from "react";
import styles from "./GanttAmsChevron.module.css";

export interface GanttAmsChevronProps {
  /** Offset from the canvas origin, in pixels. */
  left: number;
  /**
   * The full accessible fact — name, that it is AMS, the start date. There is
   * no visible text at all, so this is everything a screen reader gets.
   */
  description: string;
  selected?: boolean;
  onSelect?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

/** Legacy geometry, kept exactly: five chevrons, 24×32 each, 4px gaps. */
const CHEVRON_COUNT = 5;
const AMS_COLOR = "#FF6B35";

export function GanttAmsChevron({
  left,
  description,
  selected,
  onSelect,
  onKeyDown,
}: GanttAmsChevronProps) {
  return (
    <button
      type="button"
      className={styles.hit}
      style={{ left }}
      aria-label={description}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: CHEVRON_COUNT }, (_, i) => (
        <svg key={i} width="24" height="32" viewBox="0 0 24 32" aria-hidden="true">
          <path d="M0 0 L16 0 L24 16 L16 32 L0 32 L8 16 Z" fill={AMS_COLOR} />
        </svg>
      ))}
    </button>
  );
}
