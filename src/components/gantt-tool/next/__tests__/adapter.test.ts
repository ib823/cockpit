/**
 * The adapter is the strangler's only translation point, so these tests are the
 * parity contract: if the new canvas ever draws a bar somewhere the legacy one
 * would not, it is because one of these assertions changed.
 *
 * The two that matter most are inclusivity (a task from the 5th to the 30th is
 * 26 days, and every duration in the legacy canvas carries a `+ 1` for it) and
 * the origin (day 0 is the timeline start, not the phase start).
 */

import { describe, expect, it } from "vitest";
import { differenceInDays } from "date-fns";
import type { GanttPhase, GanttTask } from "@/types/gantt-tool";
import {
  dayOffset,
  inclusiveDays,
  toCanvasModel,
  type ProjectBounds,
} from "../adapter";

function task(over: Partial<GanttTask> & Pick<GanttTask, "id" | "startDate" | "endDate">): GanttTask {
  return {
    phaseId: "p1",
    name: over.id,
    dependencies: [],
    progress: 0,
    order: 0,
    level: 0,
    collapsed: false,
    isParent: false,
    ...over,
  } as GanttTask;
}

function phase(over: Partial<GanttPhase> & Pick<GanttPhase, "id" | "startDate" | "endDate">): GanttPhase {
  return {
    name: over.id,
    color: "#0B57D0",
    tasks: [],
    collapsed: false,
    dependencies: [],
    order: 0,
    ...over,
  } as GanttPhase;
}

const bounds = (start: string, end: string): ProjectBounds => ({
  startDate: new Date(start),
  endDate: new Date(end),
  durationDays: differenceInDays(new Date(end), new Date(start)) + 1,
});

describe("inclusiveDays", () => {
  it("counts both endpoints, as every legacy duration does", () => {
    // The legacy canvas writes `differenceInDays(end, start) + 1` at each of
    // its position sites. Dropping the +1 shortens every bar by a day.
    expect(inclusiveDays("2026-01-05", "2026-01-30")).toBe(26);
  });

  it("gives a single-day task a width of 1, not 1 day of nothing", () => {
    expect(inclusiveDays("2026-01-05", "2026-01-05")).toBe(1);
  });

  it("never returns zero or less, even for an inverted range", () => {
    // Imported plans have carried end < start. A zero or negative width bar
    // vanishes silently, which hides the bad data instead of showing it.
    expect(inclusiveDays("2026-01-30", "2026-01-05")).toBe(1);
  });
});

describe("dayOffset", () => {
  it("puts the timeline origin at day 0", () => {
    expect(dayOffset("2026-01-05", new Date("2026-01-05"))).toBe(0);
  });

  it("is measured from the origin, not from the phase", () => {
    expect(dayOffset("2026-02-01", new Date("2026-01-05"))).toBe(27);
  });

  it("goes negative for anything before the origin rather than clamping", () => {
    // Clamping would draw an out-of-range bar at day 0, where it looks like
    // legitimate data. Negative is visibly wrong, which is what it is.
    expect(dayOffset("2026-01-01", new Date("2026-01-05"))).toBe(-4);
  });
});

describe("toCanvasModel", () => {
  it("places phases and tasks against the same origin", () => {
    const model = toCanvasModel(
      [
        phase({
          id: "p1",
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [task({ id: "t1", startDate: "2026-01-12", endDate: "2026-01-16" })],
        }),
      ],
      bounds("2026-01-05", "2026-03-31")
    );

    expect(model.placements.p1).toMatchObject({ startDay: 0, durationDays: 26 });
    expect(model.placements.t1).toMatchObject({ startDay: 7, durationDays: 5 });
  });

  it("carries totalDays from the bounds rather than deriving its own", () => {
    // Deriving it from the phases would disagree with the axis, which is drawn
    // from the same bounds — and a timeline whose ticks and bars disagree is
    // worse than one that is simply too long.
    const model = toCanvasModel([], bounds("2026-01-05", "2026-03-31"));
    expect(model.totalDays).toBe(86);
  });

  it("converts progress from the store's 0-100 to the canvas's 0-1", () => {
    const model = toCanvasModel(
      [
        phase({
          id: "p1",
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [task({ id: "t1", startDate: "2026-01-05", endDate: "2026-01-09", progress: 40 })],
        }),
      ],
      bounds("2026-01-05", "2026-01-30")
    );

    expect(model.placements.t1.progress).toBeCloseTo(0.4);
  });

  it("clamps out-of-range progress instead of drawing past the bar", () => {
    const model = toCanvasModel(
      [
        phase({
          id: "p1",
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [
            task({ id: "over", startDate: "2026-01-05", endDate: "2026-01-09", progress: 150 }),
            task({ id: "under", startDate: "2026-01-05", endDate: "2026-01-09", progress: -10 }),
          ],
        }),
      ],
      bounds("2026-01-05", "2026-01-30")
    );

    expect(model.placements.over.progress).toBe(1);
    expect(model.placements.under.progress).toBe(0);
  });

  it("gives a phase no progress rather than an invented average", () => {
    const model = toCanvasModel(
      [
        phase({
          id: "p1",
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [task({ id: "t1", startDate: "2026-01-05", endDate: "2026-01-09", progress: 100 })],
        }),
      ],
      bounds("2026-01-05", "2026-01-30")
    );

    expect(model.placements.p1.progress).toBeUndefined();
  });

  it("orders phases and tasks by `order`, not by array position", () => {
    // The store mutates arrays in place in several actions, so array order is
    // not the display order and relying on it produces a plan that reshuffles
    // as it is edited.
    const model = toCanvasModel(
      [
        phase({ id: "second", order: 2, startDate: "2026-02-01", endDate: "2026-02-10" }),
        phase({
          id: "first",
          order: 1,
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [
            task({ id: "t2", order: 2, startDate: "2026-01-20", endDate: "2026-01-22" }),
            task({ id: "t1", order: 1, startDate: "2026-01-06", endDate: "2026-01-08" }),
          ],
        }),
      ],
      bounds("2026-01-05", "2026-02-10")
    );

    expect(model.phases.map((p) => p.id)).toEqual(["first", "second"]);
    expect(model.phases[0].tasks.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("does not mutate the phases it is given", () => {
    // It sorts, and sorting in place would reorder the store's own array —
    // which is the sort of change that shows up three screens away.
    const input = [
      phase({ id: "b", order: 2, startDate: "2026-02-01", endDate: "2026-02-10" }),
      phase({ id: "a", order: 1, startDate: "2026-01-05", endDate: "2026-01-30" }),
    ];

    toCanvasModel(input, bounds("2026-01-05", "2026-02-10"));

    expect(input.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("survives a phase with no tasks array at all", () => {
    // `tasks` is required by the type but absent in some imported payloads.
    const bare = { ...phase({ id: "p1", startDate: "2026-01-05", endDate: "2026-01-30" }) };
    delete (bare as { tasks?: unknown }).tasks;

    const model = toCanvasModel([bare], bounds("2026-01-05", "2026-01-30"));

    expect(model.phases[0].tasks).toEqual([]);
  });

  it("marks a critical task, and leaves the rest unmarked", () => {
    const model = toCanvasModel(
      [
        phase({
          id: "p1",
          startDate: "2026-01-05",
          endDate: "2026-01-30",
          tasks: [
            task({ id: "crit", startDate: "2026-01-05", endDate: "2026-01-09", isCritical: true }),
            task({ id: "plain", startDate: "2026-01-05", endDate: "2026-01-09" }),
          ],
        }),
      ],
      bounds("2026-01-05", "2026-01-30")
    );

    expect(model.placements.crit.critical).toBe(true);
    expect(model.placements.plain.critical).toBe(false);
  });
});
