/**
 * Strangler seam — store project → design-system canvas model.
 *
 * The port replaces `GanttCanvasV3` (4,078 lines) with
 * `components/ds/gantt/GanttCanvas` (499 lines) one capability at a time. Both
 * canvases render from the same store, so nothing forks: this file is the only
 * place that translates between them, and it is pure so the translation can be
 * asserted rather than eyeballed.
 *
 * ## The parity contract
 *
 * The legacy canvas positions a bar as a percentage of the container:
 *
 *     dayOffset = differenceInDays(date, bounds.startDate)
 *     left%     = dayOffset / extendedDuration * 100
 *
 * Two properties of that are contractual and reproduced exactly here:
 *
 *  - **The origin is `getProjectDuration().startDate`** — the earliest phase or
 *    task start, with AMS phases contributing their start but not their end.
 *    Passing `bounds` in rather than recomputing it is deliberate: the rule has
 *    real subtleties (a 21-day AMS chevron buffer, non-AMS ends only), and two
 *    implementations of it would drift.
 *  - **Durations are inclusive.** A task from the 5th to the 30th is 26 days,
 *    not 25. Every duration in the legacy canvas carries a `+ 1` for this, and
 *    dropping it shortens every bar in the plan by a day.
 *
 * ## The one thing that is deliberately NOT the same
 *
 * Legacy sizes the timeline as a percentage of the viewport, so a three-year
 * plan and a three-week plan both fill the width and a day means a different
 * distance in each. The new canvas uses a fixed px-per-day per zoom grain and
 * scrolls. That is a real behavioural change, not an oversight: constant day
 * width is what makes bars comparable, and it is why the new canvas can window
 * 1,200 rows instead of squeezing them.
 */

import { differenceInDays } from "date-fns";
import type {
  GanttMilestone as StoreMilestone,
  GanttPhase as StorePhase,
  GanttTask as StoreTask,
} from "@/types/gantt-tool";
import type { BarPlacement } from "@/components/ds/gantt/GanttCanvas";
import type { GanttPhase as CanvasPhase } from "@/components/ds/gantt/rows";
import type { CanvasMilestone } from "@/components/ds/gantt/GanttMilestones";

/** Timeline bounds as `getProjectDuration()` returns them. */
export interface ProjectBounds {
  startDate: Date;
  endDate: Date;
  durationDays: number;
}

export interface CanvasModel {
  phases: CanvasPhase[];
  placements: Record<string, BarPlacement>;
  totalDays: number;
}

/**
 * Day offset of an ISO date from the timeline origin.
 *
 * Exported because the milestone and today markers need the identical
 * calculation, and a marker that disagrees with the bars by a day is the kind
 * of defect nobody reports and everybody distrusts.
 */
export function dayOffset(iso: string, origin: Date): number {
  return differenceInDays(new Date(iso), origin);
}

/**
 * Inclusive span in days between two ISO dates.
 *
 * Returns at least 1: a zero-length bar is invisible, and the store does permit
 * `startDate === endDate` for a single-day task.
 */
export function inclusiveDays(startIso: string, endIso: string): number {
  const span = differenceInDays(new Date(endIso), new Date(startIso)) + 1;
  return span > 0 ? span : 1;
}

function placeTask(task: StoreTask, origin: Date): BarPlacement {
  return {
    startDay: dayOffset(task.startDate, origin),
    durationDays: inclusiveDays(task.startDate, task.endDate),
    // The store keeps progress as 0-100; the canvas wants 0-1. Clamped because
    // imported plans have been seen carrying 150.
    progress: Math.max(0, Math.min(1, (task.progress ?? 0) / 100)),
    critical: task.isCritical === true,
  };
}

function placePhase(phase: StorePhase, origin: Date): BarPlacement {
  return {
    startDay: dayOffset(phase.startDate, origin),
    durationDays: inclusiveDays(phase.startDate, phase.endDate),
    // A phase has no progress of its own in the store. Deriving one by
    // averaging its tasks would invent a number the plan does not contain, so
    // the bar shows none.
    critical: false,
  };
}

/**
 * Flattens the store's phase/task tree into what the canvas renders.
 *
 * Child tasks (`parentTaskId`) are included as ordinary rows rather than a
 * third level: the canvas's row model is two-level by design, and collapsing
 * the WBS into it is a decision the port has to make explicitly rather than by
 * silently dropping the deeper rows. Nesting is a later slice.
 */
export function toCanvasModel(
  phases: StorePhase[],
  bounds: ProjectBounds
): CanvasModel {
  const origin = bounds.startDate;
  const placements: Record<string, BarPlacement> = {};

  const canvasPhases: CanvasPhase[] = [...phases]
    .sort((a, b) => a.order - b.order)
    .map((phase) => {
      placements[phase.id] = placePhase(phase, origin);

      const tasks = [...(phase.tasks ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((task) => {
          placements[task.id] = placeTask(task, origin);
          return { id: task.id, name: task.name };
        });

      return { id: phase.id, name: phase.name, tasks };
    });

  return {
    phases: canvasPhases,
    placements,
    totalDays: bounds.durationDays,
  };
}

/**
 * Store milestones → canvas milestones, in the same day-offset space as the
 * bars — via the same `dayOffset`, so a milestone and a bar on the same date
 * can never disagree by a day.
 *
 * Out-of-range milestones are NOT dropped here: the canvas layer drops them
 * against `totalDays`, the same split the bars use. `formatDay` comes in from
 * the caller so the accessible date reads identically to the bar dates beside
 * it.
 */
export function toCanvasMilestones(
  milestones: StoreMilestone[],
  bounds: ProjectBounds,
  formatDay: (day: number) => string
): CanvasMilestone[] {
  return milestones.map((m) => {
    const day = dayOffset(m.date, bounds.startDate);
    return {
      id: m.id,
      name: m.name,
      day,
      dateLabel: formatDay(day),
      color: m.color || undefined,
    };
  });
}
