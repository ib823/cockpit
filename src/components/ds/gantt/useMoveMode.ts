"use client";

/**
 * Design system — Gantt Move mode (layer 4, Domain surfaces)
 *
 * The keyboard equivalent of dragging a bar.
 *
 * Principle P5: "the keyboard is the primary input." Expert users re-plan a
 * phase faster by typing than by dragging, and a drag-only interaction is
 * simply unavailable to anyone using assistive technology. So every pointer
 * gesture on the canvas has a stated keyboard equivalent, and this hook is the
 * one for moving and resizing.
 *
 * The design decisions worth stating:
 *
 *  - **A nudge moves by one unit of the CURRENT zoom grain.** Nudging by one
 *    day at Quarter zoom moves the bar 1.15px — a keystroke with no visible
 *    effect, which reads as a broken control.
 *
 *  - **Escape reverts to the position held when Move mode was entered**, not
 *    to the last nudge. A user who has pressed the arrow key eleven times
 *    wants out, not a eleven-press undo.
 *
 *  - **Nothing is persisted until Enter.** The bar moves on screen during Move
 *    mode, but the change is uncommitted, so Escape costs nothing and a
 *    mistaken nudge never reaches the sync queue.
 */

import { useCallback, useRef, useState } from "react";
import { nudgeDays, type ZoomGrain } from "./scale";

export interface MoveModeBar {
  /** Days from the canvas origin. */
  startDay: number;
  /** Duration in days. Never allowed below 1 by a resize. */
  durationDays: number;
}

export interface UseMoveModeOptions {
  grain: ZoomGrain;
  /** Called on Enter with the committed position. */
  onCommit: (next: MoveModeBar, deltaDays: number) => void;
  /** Every announcement is routed here, to the #gantt-status live region. */
  announce: (message: string) => void;
  /** Builds the strings; injected so the caller owns date formatting. */
  messages: {
    enter: (grain: ZoomGrain) => string;
    nudge: (bar: MoveModeBar) => string;
    commit: (bar: MoveModeBar, deltaDays: number) => string;
    revert: (bar: MoveModeBar) => string;
  };
}

export interface MoveModeState {
  active: boolean;
  /** The live position while in Move mode; the committed one otherwise. */
  bar: MoveModeBar;
}

/** Shift multiplies a nudge, so crossing a long plan does not take 40 presses. */
const SHIFT_MULTIPLIER = 4;

export function useMoveMode(initial: MoveModeBar, options: UseMoveModeOptions) {
  const { grain, onCommit, announce, messages } = options;

  const [state, setState] = useState<MoveModeState>({ active: false, bar: initial });

  // The position when Move mode was entered. Escape returns here rather than
  // stepping back through every nudge.
  const anchor = useRef<MoveModeBar>(initial);

  const enter = useCallback(() => {
    anchor.current = state.bar;
    setState((s) => ({ ...s, active: true }));
    announce(messages.enter(grain));
  }, [state.bar, grain, announce, messages]);

  const revert = useCallback(() => {
    const restored = anchor.current;
    setState({ active: false, bar: restored });
    announce(messages.revert(restored));
  }, [announce, messages]);

  const commit = useCallback(() => {
    const delta = state.bar.startDay - anchor.current.startDay;
    setState((s) => ({ ...s, active: false }));
    onCommit(state.bar, delta);
    announce(messages.commit(state.bar, delta));
  }, [state.bar, onCommit, announce, messages]);

  const nudge = useCallback(
    (direction: -1 | 1, multiplier = 1) => {
      setState((s) => {
        const next: MoveModeBar = {
          ...s.bar,
          startDay: s.bar.startDay + direction * nudgeDays(grain) * multiplier,
        };
        announce(messages.nudge(next));
        return { ...s, bar: next };
      });
    },
    [grain, announce, messages]
  );

  /** Resize moves the finish only, leaving the start fixed. Minimum 1 day. */
  const resize = useCallback(
    (direction: -1 | 1, multiplier = 1) => {
      setState((s) => {
        const next: MoveModeBar = {
          ...s.bar,
          durationDays: Math.max(
            1,
            s.bar.durationDays + direction * nudgeDays(grain) * multiplier
          ),
        };
        announce(messages.nudge(next));
        return { ...s, bar: next };
      });
    },
    [grain, announce, messages]
  );

  /**
   * Returns true when the event was handled, so the caller knows whether to
   * call preventDefault. Move mode swallows the arrow keys that would
   * otherwise move the row cursor — which is the point of it being a mode.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent): boolean => {
      const multiplier = event.shiftKey ? SHIFT_MULTIPLIER : 1;

      if (!state.active) {
        if (event.key === "m" || event.key === "M") {
          enter();
          return true;
        }
        return false;
      }

      switch (event.key) {
        case "ArrowLeft":
          // Alt resizes instead of moving: the finish date only.
          if (event.altKey) resize(-1, multiplier);
          else nudge(-1, multiplier);
          return true;
        case "ArrowRight":
          if (event.altKey) resize(1, multiplier);
          else nudge(1, multiplier);
          return true;
        case "Enter":
          commit();
          return true;
        case "Escape":
          revert();
          return true;
        case "m":
        case "M":
          // Toggling out of Move mode commits, matching the mental model that
          // M is a switch rather than a one-way door.
          commit();
          return true;
        default:
          return false;
      }
    },
    [state.active, enter, nudge, resize, commit, revert]
  );

  return { state, handleKeyDown, enter, commit, revert, nudge, resize };
}
