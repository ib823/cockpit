"use client";

/**
 * Design system — Gantt bar (layer 4, Domain surfaces)
 *
 * A phase, task, milestone or baseline drawn on the timeline canvas.
 *
 * Three rules from the spec are enforced here rather than left to callers,
 * because each is a correctness decision that is easy to get subtly wrong:
 *
 *  - **A bar narrower than 4px is unclickable.** It renders at 4px with a
 *    24px invisible hit area, and its label moves outside. Drawing it wider
 *    to make it clickable would misstate the duration.
 *
 *  - **The label is drawn twice and clipped at the progress boundary.** One
 *    copy in `content/inverse` over the filled accent (6.39:1), one in
 *    `content/primary` over the unfilled remainder (15.72:1). A single label
 *    crossing that edge is unreadable for part of its length at exactly the
 *    moment progress matters.
 *
 *  - **Critical path is an outline plus a caret, never a red fill.** A fill
 *    would collide with the danger colour used for lateness, and would carry
 *    the meaning in colour alone.
 *
 * Every bar is a real `<button>`: the spec requires a keyboard equivalent for
 * every pointer gesture, and that starts with being focusable.
 */

import { cx } from "../cx";
import React, { type CSSProperties } from "react";
import styles from "./GanttBar.module.css";
import {
  BAR_HEIGHT,
  MIN_BAR_PX,
  MIN_HIT_PX,
  labelFitsInside,
  MIN_OUTSIDE_LABEL_PX,
} from "./scale";

export type BarKind = "phase" | "task" | "milestone";

export interface GanttBarProps {
  kind: BarKind;
  label: string;
  /** Offset from the canvas origin, in pixels. */
  left: number;
  /** Bar width in pixels, before the minimum is applied. */
  width: number;
  /** 0–100. Fills the bar from the left. */
  progress?: number;
  /** Draws a 4px baseline bar 2px below, so drift reads as a physical offset. */
  baseline?: { left: number; width: number };
  critical?: boolean;
  /** Milestone tone: a reached milestone is success, a missed one danger. */
  milestoneState?: "pending" | "done" | "late";
  /** Free canvas to the right, used to decide whether an outside label fits. */
  canvasRemainingPx?: number;
  /**
   * The full accessible description — dates, duration, owner. The visible
   * label is usually truncated or absent, so this is what a screen reader
   * actually reads.
   */
  description: string;
  selected?: boolean;
  onSelect?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export function GanttBar({
  kind,
  label,
  left,
  width,
  progress = 0,
  baseline,
  critical,
  milestoneState = "pending",
  canvasRemainingPx = Infinity,
  description,
  selected,
  onSelect,
  onKeyDown,
}: GanttBarProps) {
  const height = BAR_HEIGHT[kind];

  // A bar narrower than the minimum is drawn at the minimum. The duration it
  // represents is unchanged — this is a floor on legibility, not on the data.
  const drawnWidth = Math.max(width, MIN_BAR_PX);
  const belowMinimum = width < MIN_BAR_PX;

  const insideLabel = kind !== "milestone" && labelFitsInside(label, drawnWidth);
  const outsideLabel =
    !insideLabel && canvasRemainingPx >= MIN_OUTSIDE_LABEL_PX && kind !== "milestone";

  const clampedProgress = Math.max(0, Math.min(100, progress));

  const wrapStyle: CSSProperties = {
    left,
    width: kind === "milestone" ? BAR_HEIGHT.milestone : drawnWidth,
    height,
  };

  return (
    <>
      {baseline && (
        <span
          className={styles.baseline}
          style={{
            left: baseline.left,
            width: Math.max(baseline.width, MIN_BAR_PX),
            top: `calc(50% + ${height / 2 + 2}px)`,
          }}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className={styles.hit}
        style={{
          left: belowMinimum ? left - (MIN_HIT_PX - drawnWidth) / 2 : left,
          width: belowMinimum ? MIN_HIT_PX : Math.max(drawnWidth, MIN_HIT_PX / 2),
        }}
        // The visible label is frequently truncated or outside the bar, so the
        // accessible name carries the whole fact instead.
        aria-label={description}
        aria-pressed={selected}
        onClick={onSelect}
        onKeyDown={onKeyDown}
      >
        <span className={cx(styles.wrap, critical && styles.critical)} style={wrapStyle}>
          {critical && (
            <span className={styles.criticalCaret} aria-hidden="true">
              ▲
            </span>
          )}

          {kind === "milestone" ? (
            <span
              className={cx(
                styles.milestone,
                milestoneState === "done" && styles.milestoneDone,
                milestoneState === "late" && styles.milestoneLate
              )}
            />
          ) : (
            <span
              className={cx(styles.bar, kind === "phase" ? styles.phase : styles.task)}
              style={{ width: drawnWidth, height }}
            >
              <span
                className={kind === "phase" ? styles.phaseFill : styles.taskFill}
                style={{ width: `${clampedProgress}%` }}
                aria-hidden="true"
              />

              {insideLabel && (
                <>
                  {/* Two copies, each clipped to one side of the progress
                   * boundary, so no glyph is ever half on the fill. */}
                  <span
                    className={cx(
                      styles.labelLayer,
                      kind === "phase" ? styles.labelPhase : styles.labelOnRest
                    )}
                    aria-hidden="true"
                  >
                    {label}
                  </span>
                  <span
                    className={cx(
                      styles.labelLayer,
                      kind === "phase" ? styles.labelPhase : styles.labelOnFill
                    )}
                    style={{ clipPath: `inset(0 ${100 - clampedProgress}% 0 0)` }}
                    aria-hidden="true"
                  >
                    {label}
                  </span>
                </>
              )}
            </span>
          )}

          {outsideLabel && (
            <span className={styles.labelOutside} aria-hidden="true">
              {label}
            </span>
          )}
        </span>
      </button>
    </>
  );
}
