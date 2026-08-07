"use client";

/**
 * Design system — the Gantt status region (layer 4, Domain surfaces)
 *
 * One live region, mounted for the lifetime of the canvas, that every
 * announcement is written into.
 *
 * Mounted once and kept, rather than created when a message arrives: a live
 * region that appears at the same moment as its first message is frequently
 * not announced at all, because assistive technology has to be observing the
 * node before the text changes. That failure is silent and looks exactly like
 * working code.
 *
 * `aria-atomic` is true so each message is read whole. Without it, a screen
 * reader may announce only the changed words, which turns "Start 21 Jul 26,
 * finish 03 Aug 26" into "21" on the second nudge.
 */

import React from "react";
import styles from "./GanttStatus.module.css";

export interface GanttStatusProps {
  message: string;
  /**
   * Renders the region visibly. For the design showcase and for debugging an
   * announcement sequence — in the product it stays hidden and the sync chip
   * owns everything about sync.
   */
  visible?: boolean;
  id?: string;
}

export function GanttStatus({ message, visible, id = "gantt-status" }: GanttStatusProps) {
  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={visible ? styles.visible : styles.hidden}
    >
      {message}
    </div>
  );
}
