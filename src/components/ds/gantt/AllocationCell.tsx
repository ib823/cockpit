"use client";

/**
 * Design system — allocation heat cell (layer 4, Domain surfaces)
 *
 * One resource-week in the allocation matrix.
 *
 * This is the clearest case in the product for principle P4, "colour is the
 * second channel": an over-allocated resource in week 32 is a staffing
 * escalation, and it has to be readable on a projector, in a monochrome
 * printout, and by anyone with a colour-vision deficiency. So the cell carries
 * the figure as text, the heat as fill, AND a diagonal hatch above 100%.
 *
 * It also handles redaction, per principle P6, "hidden must look deliberate".
 * An empty cell reads as a data error, or worse as zero. A redacted cell shows
 * a fixed-width mask with a lock and states the level required.
 */

import { cx } from "../cx";
import React from "react";
import styles from "./AllocationCell.module.css";

export interface AllocationCellProps {
  /** Percentage. May exceed 100 — over-allocation is a real state, not an error. */
  value: number;
  /** Names the cell for assistive technology, e.g. "Ada Lovelace, week 32". */
  label: string;
  /**
   * Set when the viewer's cost-visibility level forbids this figure. The value
   * is then never rendered, not merely hidden with CSS.
   */
  redactedReason?: string;
  onSelect?: () => void;
}

/** Bands chosen so each printed figure clears 4.5:1 on its own fill. */
function band(value: number): string {
  if (value > 100) return styles.over;
  if (value >= 95) return styles.full;
  if (value >= 60) return styles.healthy;
  if (value > 0) return styles.light;
  return styles.free;
}

export function AllocationCell({
  value,
  label,
  redactedReason,
  onSelect,
}: AllocationCellProps) {
  if (redactedReason) {
    return (
      <button
        type="button"
        className={cx(styles.cell, styles.redacted)}
        // The reason is the accessible name, so a screen-reader user is told
        // this is deliberate rather than encountering an unexplained blank.
        aria-label={`${label}: restricted. ${redactedReason}`}
        aria-disabled="true"
        onClick={(event) => event.preventDefault()}
      >
        <svg className={styles.lock} viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <rect x="2" y="4.5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.1" />
          <path d="M3.5 4.5V3.2a1.5 1.5 0 0 1 3 0v1.3" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span aria-hidden="true">•••</span>
      </button>
    );
  }

  const over = value > 100;

  return (
    <button
      type="button"
      className={cx(styles.cell, band(value), over && styles.hatch)}
      // Spelled out because "120" alone does not say what is over-allocated,
      // and the visible figure has no unit.
      aria-label={`${label}: ${Math.round(value)}% allocated${over ? ", over-allocated" : ""}`}
      onClick={onSelect}
    >
      <span aria-hidden="true">{value === 0 ? "—" : `${Math.round(value)}`}</span>
    </button>
  );
}
