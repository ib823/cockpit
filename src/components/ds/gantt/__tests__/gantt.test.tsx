/**
 * Layer 4 atoms — the geometric and perceptual rules.
 *
 * These are all rules that fail silently: a bar too small to click still
 * renders, a label straddling the progress edge still appears, an
 * over-allocated cell still shows a number. Nothing crashes, so only an
 * assertion catches them.
 */

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GanttBar } from "../GanttBar";
import { AllocationCell } from "../AllocationCell";
import {
  PX_PER_DAY,
  daysToPx,
  effectivePxPerDay,
  pxToDays,
  labelFitsInside,
  showsDayShading,
  nudgeDays,
  MIN_BAR_PX,
} from "../scale";

describe("scale", () => {
  test("pixels and days round-trip at every grain", () => {
    for (const grain of ["Day", "Week", "Month", "Quarter"] as const) {
      expect(pxToDays(daysToPx(30, grain), grain)).toBeCloseTo(30, 6);
    }
  });

  test("zooming out never increases the pixels per day", () => {
    // A grain that widened as you zoomed out would make the whole canvas
    // arithmetic wrong in a way no single test would catch.
    expect(PX_PER_DAY.Day).toBeGreaterThan(PX_PER_DAY.Week);
    expect(PX_PER_DAY.Week).toBeGreaterThan(PX_PER_DAY.Month);
    expect(PX_PER_DAY.Month).toBeGreaterThan(PX_PER_DAY.Quarter);
  });

  test("day shading stops where a day is too narrow to read", () => {
    // At Month a day is 2.9px; shading becomes noise rather than information.
    expect(showsDayShading("Day")).toBe(true);
    expect(showsDayShading("Week")).toBe(true);
    expect(showsDayShading("Month")).toBe(false);
    expect(showsDayShading("Quarter")).toBe(false);
  });

  test("a keyboard nudge moves by one unit of the visible grain", () => {
    // Nudging by one day at Quarter zoom would move the bar 1.15px — a
    // keystroke with no visible effect.
    expect(nudgeDays("Day")).toBe(1);
    expect(nudgeDays("Week")).toBe(7);
    expect(nudgeDays("Quarter")).toBe(90);
  });

  test("label fit scales with the label, not just the bar", () => {
    expect(labelFitsInside("Sign-off", 200)).toBe(true);
    expect(labelFitsInside("Sign-off", 20)).toBe(false);
    // A longer label needs a wider bar at the same width.
    const width = 100;
    expect(labelFitsInside("Build", width)).toBe(true);
    expect(labelFitsInside("Chart of accounts workshop", width)).toBe(false);
  });

  test("a plan shorter than the pane stretches to fill it end to end", () => {
    // 28 days at Week density is 235px; in a 1200px pane the day widens so
    // the chart spans the pane exactly, at every grain — zooming out must
    // never leave dead canvas to the right of a short plan.
    for (const grain of ["Day", "Week", "Month", "Quarter"] as const) {
      expect(effectivePxPerDay(grain, 28, 1200) * 28).toBeGreaterThanOrEqual(1200);
    }
  });

  test("a plan longer than the pane keeps the grain's density and scrolls", () => {
    // 3 years at Day zoom must NOT compress to fit — that is what the grain
    // switch is for. The spec density is a floor, not a target.
    expect(effectivePxPerDay("Day", 1095, 1200)).toBe(PX_PER_DAY.Day);
  });

  test("stretch degrades to the spec density before first measure", () => {
    // paneWidth is 0 until the ResizeObserver fires (and always under jsdom).
    expect(effectivePxPerDay("Week", 28, 0)).toBe(PX_PER_DAY.Week);
    expect(effectivePxPerDay("Week", 0, 1200)).toBe(PX_PER_DAY.Week);
  });
});

describe("GanttBar — minimum size", () => {
  test("a sub-minimum bar is still clickable", async () => {
    const onSelect = vi.fn();
    render(
      <GanttBar
        kind="task"
        label="Sign-off"
        left={100}
        width={1}
        description="Sign-off, 1 day, 14 Sep 2026"
        onSelect={onSelect}
      />
    );

    // A 1px-wide target is unhittable in practice; the hit area is widened
    // invisibly rather than the bar being drawn misleadingly large.
    await userEvent.click(screen.getByRole("button", { name: /Sign-off/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("a sub-minimum bar moves its label outside", () => {
    render(
      <GanttBar
        kind="task"
        label="Sign-off"
        left={100}
        width={1}
        canvasRemainingPx={500}
        description="Sign-off, 1 day"
      />
    );

    // Present, but not clipped inside a 4px bar where it would be invisible.
    expect(screen.getByText("Sign-off")).toBeInTheDocument();
  });

  test("with no room to the right, the label is dropped rather than clipped", () => {
    render(
      <GanttBar
        kind="task"
        label="Sign-off"
        left={100}
        width={1}
        canvasRemainingPx={10}
        description="Sign-off, 1 day"
      />
    );

    // The tree column remains the reliable place to read a name; a label
    // painted over the next bar would be worse than none.
    expect(screen.queryByText("Sign-off")).not.toBeInTheDocument();
    // The fact survives in the accessible name regardless.
    expect(screen.getByRole("button", { name: /Sign-off/ })).toBeInTheDocument();
  });
});

describe("GanttBar — the accessible name carries the whole fact", () => {
  test("dates and duration are announced even when the label is hidden", () => {
    render(
      <GanttBar
        kind="task"
        label="Sign-off"
        left={0}
        width={1}
        canvasRemainingPx={0}
        description="Sign-off, 1 day, 14 Sep 2026, Finance workstream"
      />
    );

    expect(
      screen.getByRole("button", { name: "Sign-off, 1 day, 14 Sep 2026, Finance workstream" })
    ).toBeInTheDocument();
  });

  test("selection state is exposed", () => {
    render(
      <GanttBar kind="task" label="Build" left={0} width={200} description="Build" selected />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("GanttBar — label contrast at the progress boundary", () => {
  test("a labelled bar draws the label twice, clipped either side of the fill", () => {
    // One copy in content/inverse over the filled accent, one in
    // content/primary over the unfilled remainder. A single label crossing
    // that edge is unreadable for part of its length.
    render(
      <GanttBar
        kind="task"
        label="Chart of accounts workshop"
        left={0}
        width={400}
        progress={40}
        description="Chart of accounts workshop"
      />
    );

    expect(screen.getAllByText("Chart of accounts workshop")).toHaveLength(2);
  });

  test("a bar too narrow for an inside label draws it once, outside", () => {
    render(
      <GanttBar
        kind="task"
        label="Chart of accounts workshop"
        left={0}
        width={30}
        canvasRemainingPx={400}
        description="Chart of accounts workshop"
      />
    );

    expect(screen.getAllByText("Chart of accounts workshop")).toHaveLength(1);
  });
});

describe("GanttBar — critical path", () => {
  test("critical is an outline and a caret, not a fill", () => {
    const { container } = render(
      <GanttBar kind="task" label="Build" left={0} width={200} critical description="Build" />
    );

    // A red fill would collide with the danger colour used for lateness, and
    // would put the meaning in colour alone.
    expect(container.querySelector("[class*='critical']")).not.toBeNull();
    expect(container.textContent).toContain("▲");
  });
});

describe("GanttBar — baseline", () => {
  test("a baseline renders as a separate bar", () => {
    const { container } = render(
      <GanttBar
        kind="task"
        label="Build"
        left={100}
        width={200}
        baseline={{ left: 80, width: 180 }}
        description="Build"
      />
    );

    // Offset below the current bar, so drift reads as a physical displacement
    // rather than requiring two screens to compare.
    expect(container.querySelector("[class*='baseline']")).not.toBeNull();
  });
});

describe("AllocationCell", () => {
  test("the figure is announced with its unit and its meaning", () => {
    render(<AllocationCell value={80} label="Ada Lovelace, week 32" />);
    expect(
      screen.getByRole("button", { name: "Ada Lovelace, week 32: 80% allocated" })
    ).toBeInTheDocument();
  });

  test("over-allocation is stated, not left to the colour", () => {
    render(<AllocationCell value={120} label="Ada Lovelace, week 32" />);
    expect(
      screen.getByRole("button", { name: /120% allocated, over-allocated/ })
    ).toBeInTheDocument();
  });

  test("over-allocation adds a hatch as a third channel", () => {
    // Figure + fill + hatch, so it survives a monochrome print.
    const { container } = render(<AllocationCell value={120} label="A, week 32" />);
    expect(container.querySelector("[class*='hatch']")).not.toBeNull();
  });

  test("at or below 100 there is no hatch", () => {
    const { container } = render(<AllocationCell value={100} label="A, week 32" />);
    expect(container.querySelector("[class*='hatch']")).toBeNull();
  });

  test("zero renders as an em dash, not a bare 0", () => {
    // An unstaffed week and a week staffed at 0% are different facts, and a
    // grid full of zeroes reads as noise.
    render(<AllocationCell value={0} label="A, week 32" />);
    expect(screen.getByRole("button")).toHaveTextContent("—");
  });

  test("a redacted cell says it is deliberate and names the level", () => {
    // An empty cell reads as a data error, or worse as zero.
    render(
      <AllocationCell
        value={80}
        label="Ada Lovelace, week 32"
        redactedReason="Needs cost visibility level 2."
      />
    );

    const cell = screen.getByRole("button");
    expect(cell).toHaveAccessibleName(
      "Ada Lovelace, week 32: restricted. Needs cost visibility level 2."
    );
    // And the real figure never reaches the DOM.
    expect(cell).not.toHaveTextContent("80");
  });

  test("a redacted cell cannot be activated", async () => {
    render(<AllocationCell value={80} label="A" redactedReason="Needs level 2." />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });
});

describe("the minimum bar constant is meaningful", () => {
  test("it is small enough to be honest and large enough to see", () => {
    expect(MIN_BAR_PX).toBeGreaterThan(0);
    expect(MIN_BAR_PX).toBeLessThan(PX_PER_DAY.Day);
  });
});
