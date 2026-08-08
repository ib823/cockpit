"use client";

/**
 * Design system — beacon loader (Brand: loading identity)
 *
 * The beacon emits. A wave leaves the dot and travels out past the inner arc
 * to the ring — the same gesture the mark already draws, now in time. No
 * glow, no gradient, no flare: only the mark's two colours, opacity and
 * scale. Every number below is from docs/design/brand.html, not tuned by
 * eye.
 *
 *  - Cycle 1800ms; the wave is the inner arc scaled 0.42 → 1.92 from the dot
 *    centre, opacity 0 → 1 → 0; two instances offset by half a cycle.
 *  - Easing cubic-bezier(.25,.6,.35,1) — fast off the dot, decelerating
 *    outward. A signal loses energy as it travels.
 *  - The dot scales 1 → 1.16 → 1 in phase with the launch. It never changes
 *    colour or opacity — it is the constant.
 *  - Ring and stem hold at 28% as the unfilled track, so the mark is legible
 *    at every frame and never mid-disassembly.
 *  - Determinate: the outer ring is an 88.3-unit track (2π·16 minus the 44°
 *    gap) filling clockwise from the bottom gap. 0% shows the track only.
 *  - Appears only after 400ms, in CSS: "under 400ms of expected wait, show
 *    nothing at all" — a loader that flashes for a fast operation teaches
 *    people the app is slower than it is.
 *  - Reduced motion, enforced by media query rather than a JS branch: no
 *    scale, no opacity ramp; progress is carried by the status text, which
 *    is where it belonged anyway.
 *
 * The SVG never announces — the visible status line is the live region, and
 * it carries the STATE, not the brand: "Restoring your last project, 64%".
 *
 * Reserved for full-surface loads. Inline waits use the layer-2 spinner; the
 * misuse list is explicit that the mark is never a button spinner.
 */

import React from "react";
import styles from "./BeaconLoader.module.css";

export interface BeaconLoaderProps {
  /** The state, not the brand: "Restoring your last project". */
  label: string;
  /** 0–100 switches to the determinate ring. Absent means indeterminate. */
  progress?: number;
  /** Mark size in px. Full-surface loads; never below the 40px full form. */
  size?: number;
}

const SLATE = "#3A5060";
const GOLD = "#E5C264";

/** The ring drawn CLOCKWISE from the gap's left edge, so a stroke-dash fill
 * advances clockwise as the spec requires. pathLength normalises the 88.3
 * real units to 100, letting the dash be the percentage itself. */
const RING_CLOCKWISE = "M 18.01 35.84 A 16 16 0 1 1 29.99 35.84";

export function BeaconLoader({ label, progress, size = 64 }: BeaconLoaderProps) {
  const determinate = typeof progress === "number";
  const clamped = determinate ? Math.max(0, Math.min(100, progress)) : 0;

  return (
    <div className={styles.panel}>
      <svg
        className={styles.mark}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        {/* Track: ring and stem at 28%, the mark's own structure. */}
        <path
          d={RING_CLOCKWISE}
          className={styles.track}
          stroke={SLATE}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 24 28 L 24 41"
          className={styles.track}
          stroke={SLATE}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {determinate ? (
          <path
            d={RING_CLOCKWISE}
            className={styles.progress}
            stroke={SLATE}
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${clamped} 100`}
            data-testid="beacon-progress"
          />
        ) : (
          <>
            {/* Two waves, half a cycle apart, launched from the dot. */}
            <g className={styles.wave}>
              <path
                d="M 15 21 A 9 9 0 0 1 33 21"
                stroke={SLATE}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
            <g className={`${styles.wave} ${styles.waveSecond}`}>
              <path
                d="M 15 21 A 9 9 0 0 1 33 21"
                stroke={SLATE}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </>
        )}

        {/* Static inner arc joins the track in determinate mode, so the mark
          * stays whole while the ring fills. */}
        {determinate && (
          <path
            d="M 15 21 A 9 9 0 0 1 33 21"
            className={styles.track}
            stroke={SLATE}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        <circle
          className={determinate ? undefined : styles.dot}
          cx="24"
          cy="21"
          r="4"
          fill={GOLD}
        />
      </svg>

      {/* The live region. Carries the state, never the brand. */}
      <p className={styles.status} role="status">
        {label}
        {determinate ? `, ${Math.round(clamped)}%` : ""}
      </p>
    </div>
  );
}
