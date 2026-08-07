/**
 * Row model and windowing.
 *
 * Every rule here fails silently: a plan that opens 1,280 rows deep still
 * works, a scrollbar sized by the rendered slice still scrolls, and an
 * aria-rowindex that counts the window still reads out a number. Only an
 * assertion catches any of them.
 */

import { describe, test, expect } from "vitest";
import {
  flattenRows,
  initialExpanded,
  computeWindow,
  moveCursor,
  scrollToRow,
  AUTO_EXPAND_ROW_LIMIT,
  type GanttPhase,
} from "../rows";

function makePlan(phaseCount: number, tasksEach: number): GanttPhase[] {
  return Array.from({ length: phaseCount }, (_, p) => ({
    id: `p${p}`,
    name: `Phase ${p}`,
    tasks: Array.from({ length: tasksEach }, (_, t) => ({
      id: `p${p}t${t}`,
      name: `Task ${t}`,
    })),
  }));
}

describe("flattenRows", () => {
  test("a collapsed phase still occupies a row", () => {
    // It needs a cursor position, an expand control and a summary bar.
    const rows = flattenRows(makePlan(3, 5), new Set());
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.kind === "phase")).toBe(true);
  });

  test("expanding one phase adds only its tasks", () => {
    const rows = flattenRows(makePlan(3, 5), new Set(["p1"]));
    expect(rows).toHaveLength(8);
    expect(rows.filter((r) => r.kind === "task")).toHaveLength(5);
  });

  test("aria-rowindex is absolute and contiguous", () => {
    // A screen reader must be able to say "row 812 of 1,280".
    const rows = flattenRows(makePlan(3, 4), new Set(["p0", "p1", "p2"]));
    expect(rows.map((r) => r.rowIndex)).toEqual(
      Array.from({ length: rows.length }, (_, i) => i + 1)
    );
  });

  test("levels distinguish phases from tasks", () => {
    const rows = flattenRows(makePlan(1, 2), new Set(["p0"]));
    expect(rows[0].level).toBe(1);
    expect(rows[1].level).toBe(2);
  });

  test("posinset and setsize are relative to the parent, not the flat list", () => {
    // Otherwise a screen reader says "task 7 of 1,280" instead of "3 of 5".
    const rows = flattenRows(makePlan(2, 3), new Set(["p0", "p1"]));
    const secondPhaseTasks = rows.filter((r) => r.parentId === "p1");

    expect(secondPhaseTasks.map((r) => r.posInSet)).toEqual([1, 2, 3]);
    expect(secondPhaseTasks.every((r) => r.setSize === 3)).toBe(true);
  });

  test("only phases carry an expanded state", () => {
    const rows = flattenRows(makePlan(1, 2), new Set(["p0"]));
    expect(rows[0].expanded).toBe(true);
    // A task has no expanded state; reporting false would claim it is a
    // collapsed parent.
    expect(rows[1].expanded).toBeUndefined();
  });

  test("a phase reports its task count even while collapsed", () => {
    // The expand announcement needs it before the tasks exist as rows.
    const rows = flattenRows(makePlan(1, 15), new Set());
    expect(rows[0].taskCount).toBe(15);
  });
});

describe("initialExpanded", () => {
  test("a small plan opens expanded", () => {
    const plan = makePlan(3, 4); // 3 + 12 = 15 rows
    expect(initialExpanded(plan).size).toBe(3);
  });

  test("a large plan opens collapsed", () => {
    // 80 phases x 15 tasks would open 1,280 rows deep — unreadable, and a
    // second of layout before anything appears.
    const plan = makePlan(80, 15);
    expect(initialExpanded(plan).size).toBe(0);
  });

  test("the boundary is the row count, not the phase count", () => {
    const justUnder = makePlan(2, (AUTO_EXPAND_ROW_LIMIT - 2) / 2 - 1);
    const wayOver = makePlan(2, AUTO_EXPAND_ROW_LIMIT);
    expect(initialExpanded(justUnder).size).toBeGreaterThan(0);
    expect(initialExpanded(wayOver).size).toBe(0);
  });
});

describe("computeWindow", () => {
  test("the scrollbar is sized by the whole dataset, not the rendered slice", () => {
    // Otherwise the scrollbar claims a 1,200-row plan is 30 rows long.
    const w = computeWindow(1200, 32, 0, 600);
    expect(w.totalHeight).toBe(1200 * 32);
  });

  test("only a slice is rendered regardless of dataset size", () => {
    const small = computeWindow(50, 32, 0, 600);
    const huge = computeWindow(12000, 32, 0, 600);
    expect(huge.endIndex - huge.startIndex).toBe(small.endIndex - small.startIndex);
  });

  test("the spacer keeps rendered rows at their true position", () => {
    const w = computeWindow(1200, 32, 3200, 600);
    expect(w.offsetTop).toBe(w.startIndex * 32);
  });

  test("overscan renders beyond the viewport so fast scrolling shows no blanks", () => {
    const w = computeWindow(1200, 32, 3200, 600);
    const firstVisible = Math.floor(3200 / 32);
    expect(w.startIndex).toBeLessThan(firstVisible);
  });

  test("the window never runs past either end", () => {
    const top = computeWindow(1200, 32, 0, 600);
    expect(top.startIndex).toBe(0);

    const bottom = computeWindow(1200, 32, 1200 * 32, 600);
    expect(bottom.endIndex).toBeLessThanOrEqual(1200);
  });

  test("a dataset smaller than the viewport renders entirely", () => {
    const w = computeWindow(5, 32, 0, 600);
    expect(w.startIndex).toBe(0);
    expect(w.endIndex).toBe(5);
  });
});

describe("moveCursor", () => {
  test("it clamps rather than wrapping", () => {
    // Arrowing off the end of a 1,200-row plan and landing back at row 1
    // loses the user's place completely.
    expect(moveCursor(0, -1, 100)).toBe(0);
    expect(moveCursor(99, 1, 100)).toBe(99);
  });

  test("it moves within range", () => {
    expect(moveCursor(10, 1, 100)).toBe(11);
    expect(moveCursor(10, -5, 100)).toBe(5);
  });
});

describe("scrollToRow", () => {
  test("an already-visible row does not scroll", () => {
    // A scroll on every cursor move makes the canvas twitch when nothing
    // needed to happen.
    expect(scrollToRow(5, 32, 0, 600)).toBeNull();
  });

  test("a row above the viewport scrolls to its top", () => {
    expect(scrollToRow(2, 32, 500, 600)).toBe(64);
  });

  test("a row below the viewport scrolls it just into view", () => {
    // Bottom-aligned, not centred: centring throws away half the context the
    // user was reading.
    expect(scrollToRow(30, 32, 0, 600)).toBe(31 * 32 - 600);
  });
});
