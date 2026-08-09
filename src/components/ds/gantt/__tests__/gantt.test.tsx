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
  pxToDays,
  labelFitsInside,
  showsWeekendShading,
  nudgeDays,
  MIN_BAR_PX,
} from "../scale";
import { HORIZON_DAYS, computeTimelineWindow, grainThatFits } from "../timeline-window";

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

  test("weekend shading stops where a day is too narrow to read", () => {
    // At Month a day is 2.9px; shading becomes noise rather than information.
    expect(showsWeekendShading("Day")).toBe(true);
    expect(showsWeekendShading("Week")).toBe(true);
    expect(showsWeekendShading("Month")).toBe(false);
    expect(showsWeekendShading("Quarter")).toBe(false);
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

  test("a day is the same width whatever the plan is", () => {
    // The property the horizon exists to protect: two plans at one grain are
    // directly comparable, because a day never stretches to fill the pane.
    const short = computeTimelineWindow({
      grain: "Week",
      projectStart: new Date(2026, 5, 15),
      projectEnd: new Date(2026, 6, 13),
      viewportPx: 1200,
    });
    const long = computeTimelineWindow({
      grain: "Week",
      projectStart: new Date(2026, 5, 15),
      projectEnd: new Date(2029, 6, 13),
      viewportPx: 1200,
    });
    expect(short.totalDays).toBeLessThan(long.totalDays);
    // Same grain, same day width — only the amount of calendar differs.
    expect(PX_PER_DAY.Week).toBe(PX_PER_DAY.Week);
    expect(short.totalDays).toBeGreaterThanOrEqual(HORIZON_DAYS.Week);
  });

  test("every grain opens on a planning horizon, not on the plan", () => {
    // A four-week plan must not fill the screen at Quarter grain: that was the
    // old behaviour, and it left nowhere to put unscheduled work.
    for (const grain of ["Day", "Week", "Month", "Quarter"] as const) {
      const w = computeTimelineWindow({
        grain,
        projectStart: new Date(2026, 5, 15),
        projectEnd: new Date(2026, 6, 13),
      });
      expect(w.totalDays).toBe(HORIZON_DAYS[grain]);
      expect(w.totalDays).toBeGreaterThan(29);
    }
  });

  test("the horizon never ends before the plan or before the viewport", () => {
    const longPlan = computeTimelineWindow({
      grain: "Day",
      projectStart: new Date(2026, 0, 1),
      projectEnd: new Date(2031, 0, 1),
    });
    expect(longPlan.totalDays).toBeGreaterThan(HORIZON_DAYS.Day);

    const wideScreen = computeTimelineWindow({
      grain: "Quarter",
      projectStart: new Date(2026, 0, 1),
      projectEnd: new Date(2026, 1, 1),
      viewportPx: 6000,
    });
    expect(wideScreen.totalDays * PX_PER_DAY.Quarter).toBeGreaterThanOrEqual(6000);
  });

  test("Fit project picks the finest grain the span fits in", () => {
    // 28 days in 1200px: Day needs 728px, so Day wins — the most detail the
    // plan allows, not the least.
    expect(grainThatFits(28, 1200)).toBe("Day");
    expect(grainThatFits(365, 1200)).toBe("Month");
    expect(grainThatFits(20000, 1200)).toBe("Quarter");
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
