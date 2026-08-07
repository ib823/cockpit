/**
 * Design system — Gantt announcements (layer 4, Domain surfaces)
 *
 * The exact strings the `#gantt-status` live region says. They live here, not
 * inline in the canvas, for one reason: what a screen reader hears is as much
 * a designed artifact as what a sighted user sees, and it is the half nobody
 * notices has regressed.
 *
 * The rule that shapes all of them, from the spec: **a nudge announces the new
 * dates only, not the whole bar name.** Repeating "Fit-gap — Finance 6, task,
 * level 2, …" on every arrow press makes the keyboard equivalent of a drag
 * unusable, because a user nudging ten times hears the same forty words ten
 * times and cannot tell whether anything moved.
 */

import type { ZoomGrain } from "./scale";

/** How a grain is spoken. "1 day" reads better than "Day grain". */
const GRAIN_PHRASE: Record<ZoomGrain, string> = {
  Day: "one day",
  Week: "one week",
  Month: "one month",
  Quarter: "one quarter",
};

export interface BarFacts {
  name: string;
  kind: "phase" | "task" | "milestone";
  /** Tree depth, 1-based, as `aria-level` reports it. */
  level?: number;
  startLabel: string;
  finishLabel: string;
  /** 1-based position and total, matching aria-posinset / aria-setsize. */
  rowIndex?: number;
  rowCount?: number;
}

/**
 * Said when the row cursor moves.
 *
 * Includes position because a treegrid without it strands the user: "row 39 of
 * 95" is the only way to know how far through a 1,200-task plan you are.
 */
export function sayCursorMove(bar: BarFacts): string {
  const parts = [bar.name, bar.kind];
  if (bar.level != null) parts.push(`level ${bar.level}`);
  parts.push(`${bar.startLabel} to ${bar.finishLabel}`);
  if (bar.rowIndex != null && bar.rowCount != null) {
    parts.push(`row ${bar.rowIndex} of ${bar.rowCount}`);
  }
  return `${parts.join(", ")}.`;
}

/**
 * Said on entering Move mode.
 *
 * States the grain and both exits. A mode the user can enter but not discover
 * how to leave is worse than no mode.
 */
export function sayMoveModeOn(bar: BarFacts, grain: ZoomGrain): string {
  return (
    `Move mode on. ${bar.name}. ` +
    `Left and right arrows move by ${GRAIN_PHRASE[grain]}. ` +
    `Enter commits, Escape reverts.`
  );
}

/**
 * Said on each nudge — dates only.
 *
 * Deliberately omits the name, the level and the row position. See the module
 * note: repeating them makes repeated nudging unusable.
 */
export function sayNudge(startLabel: string, finishLabel: string): string {
  return `Start ${startLabel}, finish ${finishLabel}.`;
}

/**
 * Said on commit.
 *
 * Names the object again — the user has left Move mode, so the context that
 * was implied throughout the nudges is no longer implied — states the net
 * change, and reports the sync consequence, because a local-first app that
 * says "saved" without saying "not yet synced" is overstating.
 */
export function sayCommit(
  bar: BarFacts,
  deltaDays: number,
  pendingChanges: number
): string {
  const magnitude = Math.abs(deltaDays);
  const direction = deltaDays === 0 ? "unchanged" : deltaDays > 0 ? "later" : "earlier";
  const moved =
    deltaDays === 0
      ? `${bar.name} unchanged`
      : `Moved ${bar.name} by ${magnitude} ${magnitude === 1 ? "day" : "days"} ${direction}`;

  const sync =
    pendingChanges > 0
      ? ` Saved locally, ${pendingChanges} ${pendingChanges === 1 ? "change" : "changes"} pending sync.`
      : " Saved.";

  return `${moved}.${sync}`;
}

/** Said on revert. Names the position restored, so the user can trust it. */
export function sayRevert(bar: BarFacts, startLabel: string): string {
  return `Move cancelled. ${bar.name} returned to ${startLabel}.`;
}

/** Said when a phase expands or collapses. The count is the useful part. */
export function sayExpand(name: string, expanded: boolean, taskCount: number): string {
  return expanded
    ? `${name} expanded, ${taskCount} ${taskCount === 1 ? "task" : "tasks"}.`
    : `${name} collapsed.`;
}

/** Said when the multi-selection changes. */
export function saySelection(count: number): string {
  if (count === 0) return "Selection cleared.";
  return `${count} ${count === 1 ? "row" : "rows"} selected.`;
}

/**
 * The full accessible name of a bar.
 *
 * Everything the colour, hatch and outline encode has to be in here, because
 * none of it exists for a screen-reader user: allocation, critical path and
 * progress are all visual-only signals otherwise.
 */
export function barAccessibleName(
  bar: BarFacts,
  extra: {
    phasePath?: string;
    workingDays?: number;
    percentComplete?: number;
    allocationPercent?: number;
    onCriticalPath?: boolean;
  } = {}
): string {
  const parts = [bar.name, bar.kind];
  if (extra.phasePath) parts.push(extra.phasePath);
  parts.push(`${bar.startLabel} to ${bar.finishLabel}`);
  if (extra.workingDays != null) {
    parts.push(`${extra.workingDays} working ${extra.workingDays === 1 ? "day" : "days"}`);
  }
  if (extra.percentComplete != null) {
    parts.push(`${Math.round(extra.percentComplete)}% complete`);
  }
  if (extra.allocationPercent != null) {
    // The hatch and the heat colour say this visually; this is the other half.
    parts.push(`${Math.round(extra.allocationPercent)}% allocated`);
  }
  if (extra.onCriticalPath) parts.push("on critical path");
  return `${parts.join(", ")}.`;
}

/**
 * The hidden predecessor list a task row points at with `aria-describedby`.
 *
 * Dependencies are drawn as arrows, which a screen reader cannot follow. This
 * is how the same information reaches a keyboard user.
 */
export function describePredecessors(
  predecessors: Array<{ name: string; type: "FS" | "SS" | "FF" | "SF"; lagDays?: number }>
): string {
  if (predecessors.length === 0) return "No predecessors.";

  const TYPE_WORDS = {
    FS: "finish-to-start",
    SS: "start-to-start",
    FF: "finish-to-finish",
    SF: "start-to-finish",
  } as const;

  const list = predecessors.map((p) => {
    const lag =
      p.lagDays && p.lagDays !== 0
        ? `, ${Math.abs(p.lagDays)}-day ${p.lagDays > 0 ? "lag" : "lead"}`
        : "";
    return `${p.name} (${TYPE_WORDS[p.type]}${lag})`;
  });

  return `Predecessors: ${list.join("; ")}.`;
}
