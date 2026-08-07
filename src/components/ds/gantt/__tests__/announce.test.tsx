/**
 * The announcement contract.
 *
 * What a screen reader hears is a designed artifact, and it is the half nobody
 * notices has regressed — a canvas that says the wrong thing looks identical
 * in a screenshot. These pin the strings the spec specifies.
 */

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import {
  sayCursorMove,
  sayMoveModeOn,
  sayNudge,
  sayCommit,
  sayRevert,
  sayExpand,
  saySelection,
  barAccessibleName,
  describePredecessors,
  type BarFacts,
} from "../announce";
import { useMoveMode } from "../useMoveMode";
import { GanttStatus } from "../GanttStatus";

const BAR: BarFacts = {
  name: "Fit-gap — Finance 6",
  kind: "task",
  level: 2,
  startLabel: "14 Jul 26",
  finishLabel: "27 Jul 26",
  rowIndex: 39,
  rowCount: 95,
};

describe("cursor movement", () => {
  test("states position, because a 1,200-row plan strands you without it", () => {
    expect(sayCursorMove(BAR)).toBe(
      "Fit-gap — Finance 6, task, level 2, 14 Jul 26 to 27 Jul 26, row 39 of 95."
    );
  });

  test("position is omitted when unknown rather than faked", () => {
    expect(sayCursorMove({ ...BAR, rowIndex: undefined, rowCount: undefined })).not.toMatch(
      /row/
    );
  });
});

describe("Move mode", () => {
  test("entering states the grain and BOTH exits", () => {
    // A mode you can enter but cannot discover how to leave is worse than no
    // mode at all.
    const said = sayMoveModeOn(BAR, "Week");
    expect(said).toContain("one week");
    expect(said).toContain("Enter commits");
    expect(said).toContain("Escape reverts");
  });

  test("the grain is spoken as a duration, not a token name", () => {
    expect(sayMoveModeOn(BAR, "Quarter")).toContain("one quarter");
    expect(sayMoveModeOn(BAR, "Quarter")).not.toContain("Quarter grain");
  });

  test("a nudge says the dates ONLY", () => {
    // This is the rule that makes repeated nudging usable. Repeating the name,
    // level and row position on every arrow press means a user nudging ten
    // times hears the same forty words ten times.
    const said = sayNudge("21 Jul 26", "03 Aug 26");
    expect(said).toBe("Start 21 Jul 26, finish 03 Aug 26.");
    expect(said).not.toContain(BAR.name);
    expect(said).not.toContain("row");
  });

  test("commit names the object again, since the mode's context has ended", () => {
    const said = sayCommit(BAR, 7, 3);
    expect(said).toContain("Fit-gap — Finance 6");
    expect(said).toContain("7 days later");
  });

  test("commit reports pending sync rather than claiming saved", () => {
    // A local-first app that says "saved" without saying "not yet synced" is
    // overstating what happened.
    expect(sayCommit(BAR, 7, 3)).toContain("3 changes pending sync");
    expect(sayCommit(BAR, 7, 1)).toContain("1 change pending sync");
    expect(sayCommit(BAR, 7, 0)).toContain("Saved.");
  });

  test("a zero-day commit does not claim movement", () => {
    expect(sayCommit(BAR, 0, 0)).toContain("unchanged");
  });

  test("a backwards move is announced as earlier", () => {
    expect(sayCommit(BAR, -7, 0)).toContain("7 days earlier");
  });

  test("revert names the position restored, so it can be trusted", () => {
    expect(sayRevert(BAR, "14 Jul 26")).toBe(
      "Move cancelled. Fit-gap — Finance 6 returned to 14 Jul 26."
    );
  });
});

describe("expand and select", () => {
  test("expanding reports the count, which is the useful part", () => {
    expect(sayExpand("Realize · Data Migration", true, 15)).toBe(
      "Realize · Data Migration expanded, 15 tasks."
    );
  });

  test("singular and plural are handled", () => {
    expect(sayExpand("Phase", true, 1)).toContain("1 task.");
    expect(saySelection(1)).toBe("1 row selected.");
    expect(saySelection(4)).toBe("4 rows selected.");
    expect(saySelection(0)).toBe("Selection cleared.");
  });
});

describe("bar accessible name", () => {
  test("everything the colour and hatch encode is in the name", () => {
    // Allocation, critical path and progress are visual-only otherwise, which
    // means they do not exist for a screen-reader user.
    const name = barAccessibleName(BAR, {
      phasePath: "Realize · Finance",
      workingDays: 15,
      percentComplete: 60,
      allocationPercent: 120,
      onCriticalPath: true,
    });

    expect(name).toContain("Realize · Finance");
    expect(name).toContain("15 working days");
    expect(name).toContain("60% complete");
    expect(name).toContain("120% allocated");
    expect(name).toContain("on critical path");
  });

  test("absent facts are omitted rather than reported as zero", () => {
    const name = barAccessibleName(BAR);
    expect(name).not.toContain("0% complete");
    expect(name).not.toContain("critical");
  });
});

describe("predecessors", () => {
  test("the arrow's information is available as text", () => {
    // A screen reader cannot follow an arrow drawn on a canvas.
    expect(
      describePredecessors([{ name: "Sign-off — Finance 8", type: "FS", lagDays: 2 }])
    ).toBe("Predecessors: Sign-off — Finance 8 (finish-to-start, 2-day lag).");
  });

  test("a negative lag is a lead, and is said so", () => {
    expect(describePredecessors([{ name: "Build", type: "SS", lagDays: -3 }])).toContain(
      "3-day lead"
    );
  });

  test("no predecessors is stated, not left silent", () => {
    expect(describePredecessors([])).toBe("No predecessors.");
  });

  test("multiple predecessors are separated readably", () => {
    const said = describePredecessors([
      { name: "A", type: "FS" },
      { name: "B", type: "SS", lagDays: 1 },
    ]);
    expect(said).toBe("Predecessors: A (finish-to-start); B (start-to-start, 1-day lag).");
  });
});

describe("GanttStatus", () => {
  test("the region exists before any message does", () => {
    // A live region created at the moment of its first message is frequently
    // not announced at all — and that failure is silent.
    render(<GanttStatus message="" />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  test("it is hidden without being removed from the accessibility tree", () => {
    const { container } = render(<GanttStatus message="Start 21 Jul 26." />);
    const region = container.firstElementChild as HTMLElement;

    // display:none would silence every announcement.
    expect(region.className).toMatch(/hidden/);
    expect(screen.getByRole("status")).toHaveTextContent("Start 21 Jul 26.");
  });
});

describe("useMoveMode", () => {
  const messages = {
    enter: (grain: "Day" | "Week" | "Month" | "Quarter") => `enter:${grain}`,
    nudge: (bar: { startDay: number; durationDays: number }) =>
      `nudge:${bar.startDay}:${bar.durationDays}`,
    commit: (_bar: unknown, delta: number) => `commit:${delta}`,
    revert: (bar: { startDay: number }) => `revert:${bar.startDay}`,
  };

  function setup(grain: "Day" | "Week" | "Month" | "Quarter" = "Week") {
    const announce = vi.fn();
    const onCommit = vi.fn();
    const hook = renderHook(() =>
      useMoveMode({ startDay: 100, durationDays: 14 }, { grain, onCommit, announce, messages })
    );
    return { hook, announce, onCommit };
  }

  test("M enters Move mode and announces", () => {
    const { hook, announce } = setup();
    act(() => {
      hook.result.current.handleKeyDown({ key: "m" } as KeyboardEvent);
    });

    expect(hook.result.current.state.active).toBe(true);
    expect(announce).toHaveBeenCalledWith("enter:Week");
  });

  test("a nudge moves by one unit of the CURRENT grain", () => {
    // Nudging by one day at Quarter zoom moves the bar 1.15px, which reads as
    // a broken control.
    const { hook } = setup("Quarter");
    act(() => {
      hook.result.current.enter();
    });
    act(() => {
      hook.result.current.nudge(1);
    });
    expect(hook.result.current.state.bar.startDay).toBe(190); // 100 + 90
  });

  test("Shift multiplies the nudge", () => {
    const { hook } = setup("Day");
    act(() => hook.result.current.enter());
    act(() => {
      hook.result.current.handleKeyDown({
        key: "ArrowRight",
        shiftKey: true,
      } as KeyboardEvent);
    });
    expect(hook.result.current.state.bar.startDay).toBe(104);
  });

  test("Escape reverts to the entry position, not the previous nudge", () => {
    // A user who has pressed the arrow eleven times wants out, not an
    // eleven-press undo.
    const { hook, announce } = setup("Day");
    act(() => hook.result.current.enter());
    act(() => {
      for (let i = 0; i < 11; i++) hook.result.current.nudge(1);
    });
    expect(hook.result.current.state.bar.startDay).toBe(111);

    act(() => hook.result.current.revert());
    expect(hook.result.current.state.bar.startDay).toBe(100);
    expect(hook.result.current.state.active).toBe(false);
    expect(announce).toHaveBeenCalledWith("revert:100");
  });

  test("nothing is committed until Enter", () => {
    const { hook, onCommit } = setup("Day");
    act(() => hook.result.current.enter());
    act(() => hook.result.current.nudge(1));

    // The bar has moved on screen, but nothing reached the sync queue.
    expect(onCommit).not.toHaveBeenCalled();

    act(() => hook.result.current.commit());
    expect(onCommit).toHaveBeenCalledWith({ startDay: 101, durationDays: 14 }, 1);
  });

  test("Alt+Arrow resizes the finish only, never below one day", () => {
    const { hook } = setup("Week");
    act(() => hook.result.current.enter());
    act(() => {
      hook.result.current.handleKeyDown({ key: "ArrowLeft", altKey: true } as KeyboardEvent);
    });

    // 14 - 7 = 7; the start is untouched.
    expect(hook.result.current.state.bar).toEqual({ startDay: 100, durationDays: 7 });

    act(() => {
      hook.result.current.handleKeyDown({ key: "ArrowLeft", altKey: true } as KeyboardEvent);
      hook.result.current.handleKeyDown({ key: "ArrowLeft", altKey: true } as KeyboardEvent);
    });
    expect(hook.result.current.state.bar.durationDays).toBeGreaterThanOrEqual(1);
  });

  test("arrow keys are not swallowed when Move mode is off", () => {
    // Otherwise the row cursor would stop working the moment this hook mounts.
    const { hook } = setup();
    let handled = true;
    act(() => {
      handled = hook.result.current.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent);
    });
    expect(handled).toBe(false);
  });

  test("arrow keys ARE swallowed inside Move mode", () => {
    const { hook } = setup();
    act(() => hook.result.current.enter());
    let handled = false;
    act(() => {
      handled = hook.result.current.handleKeyDown({ key: "ArrowRight" } as KeyboardEvent);
    });
    expect(handled).toBe(true);
  });
});
