/**
 * Axis and dependency rendering.
 *
 * Both are decorative in the accessibility tree by design, so these check the
 * geometry rules and, just as importantly, that neither floods a screen reader
 * with noise the bar names already carry.
 */

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimelineAxis } from "../TimelineAxis";
import { buildAxisBands } from "../axis-bands";
import { PX_PER_DAY, HOLIDAY_MIN_PX, type ZoomGrain } from "../scale";
import { DependencyArrow, DependencyStub } from "../DependencyArrow";

const ORIGIN = new Date(2026, 0, 5); // Monday 5 Jan 2026
const WEEKENDS = [5, 6, 12, 13];
const HOLIDAYS = [{ day: 25, name: "Thaipusam (MY)", label: "30 Jan 2026" }];

function axis(grain: ZoomGrain, totalDays = 60, props: Record<string, unknown> = {}) {
  return (
    <TimelineAxis
      grain={grain}
      totalDays={totalDays}
      pxPerDay={PX_PER_DAY[grain]}
      bands={buildAxisBands(ORIGIN, totalDays, grain)}
      weekendDays={WEEKENDS}
      holidays={HOLIDAYS}
      {...props}
    />
  );
}

describe("TimelineAxis", () => {
  test("weekends shade where a day is wide enough to read", () => {
    const { container } = render(axis("Day"));
    expect(container.querySelectorAll("[class*='weekend']")).toHaveLength(4);
  });

  test("weekend shading is dropped once a day is too narrow", () => {
    // At Month a weekend is 5.8px every 20px — stripes, which hide exactly the
    // exception you were looking for.
    const { container } = render(axis("Month"));
    expect(container.querySelectorAll("[class*='weekend']")).toHaveLength(0);
  });

  test("a holiday survives every zoom, because a named day changes the plan", () => {
    for (const grain of ["Day", "Week", "Month", "Quarter"] as const) {
      const { container, unmount } = render(axis(grain));
      expect(container.querySelectorAll("[class*='holiday']")).toHaveLength(1);
      unmount();
    }
  });

  test("a holiday marks its own day, never the period containing it", () => {
    // The failure this guards: colouring the whole week, month or quarter that
    // contains the holiday, which reads as five days off instead of one.
    const { container } = render(axis("Quarter"));
    const marker = container.querySelector("[class*='holiday']") as HTMLElement;
    const width = parseFloat(marker.style.width);

    expect(width).toBe(HOLIDAY_MIN_PX); // floored, not widened to the quarter
    expect(width).toBeLessThan(30 * PX_PER_DAY.Quarter); // narrower than a month
  });

  test("a holiday carries its name and date for the tooltip", () => {
    const { container } = render(axis("Week"));
    expect(container.querySelector("[class*='holiday']")).toHaveAttribute(
      "title",
      "Thaipusam (MY) — 30 Jan 2026"
    );
  });

  test("the header nests two labelled rows plus unlabelled subdivisions", () => {
    // Week grain: months above, weeks below, days as gridlines.
    const { container } = render(axis("Week", 60));
    expect(container.querySelectorAll("[class*='major']").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[class*='minor']").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[class*='gridline']").length).toBeGreaterThan(0);
  });

  test("the axis is hidden from assistive technology", () => {
    // Three hundred announced tick labels would bury the bars.
    const { container } = render(axis("Day"));
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  test("today renders when inside the window and not otherwise", () => {
    const inside = render(axis("Day", 60, { todayDay: 30 }));
    expect(inside.container.querySelectorAll("[class*='today']").length).toBeGreaterThan(0);

    const outside = render(axis("Day", 60, { todayDay: 900 }));
    expect(outside.container.querySelectorAll("[class*='today']")).toHaveLength(0);
  });

  test("band positions scale with the grain", () => {
    const { container, rerender } = render(axis("Day"));
    const dayLeft = (container.querySelectorAll("[class*='minor']")[3] as HTMLElement)?.style.left;

    rerender(axis("Week"));
    const weekLeft = (container.querySelectorAll("[class*='minor']")[3] as HTMLElement)?.style.left;

    expect(dayLeft).not.toBe(weekLeft);
  });
});

describe("DependencyArrow", () => {
  test("a forward link routes directly", () => {
    const { container } = render(
      <svg>
        <DependencyArrow from={{ x: 10, y: 10 }} to={{ x: 200, y: 40 }} />
      </svg>
    );
    const d = container.querySelector("path")?.getAttribute("d") ?? "";
    // Straight elbow: out, down, in.
    expect(d.split(" ").filter((t) => t === "V")).toHaveLength(1);
  });

  test("a backwards link routes around rather than through the bars", () => {
    // The case a naive straight line gets visibly wrong on any re-planned
    // schedule.
    const { container } = render(
      <svg>
        <DependencyArrow from={{ x: 300, y: 10 }} to={{ x: 60, y: 40 }} />
      </svg>
    );
    const d = container.querySelector("path")?.getAttribute("d") ?? "";
    expect(d.split(" ").filter((t) => t === "V")).toHaveLength(2);
  });

  test("arrows are hidden from assistive technology", () => {
    // A screen reader cannot follow a line; the same fact is on the successor
    // row via aria-describedby.
    const { container } = render(
      <svg>
        <DependencyArrow from={{ x: 0, y: 0 }} to={{ x: 50, y: 20 }} />
      </svg>
    );
    expect(container.querySelector("g")).toHaveAttribute("aria-hidden", "true");
  });

  test("the link type is recorded for styling and debugging", () => {
    const { container } = render(
      <svg>
        <DependencyArrow from={{ x: 0, y: 0 }} to={{ x: 50, y: 20 }} type="SS" />
      </svg>
    );
    expect(container.querySelector("g")).toHaveAttribute("data-link-type", "SS");
  });
});

describe("DependencyStub", () => {
  test("an off-window predecessor is reachable, not just indicated", async () => {
    // An arrow that stops at the canvas edge says a link exists while giving
    // the user no way to follow it.
    const onNavigate = vi.fn();
    render(
      <svg>
        <DependencyStub x={20} y={20} predecessorName="Sign-off — Finance 8" onNavigate={onNavigate} />
      </svg>
    );

    const button = screen.getByRole("button", {
      name: "Go to predecessor Sign-off — Finance 8, outside the visible range",
    });
    await userEvent.click(button);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test("a collapsed predecessor says so, because following it changes the view", () => {
    render(
      <svg>
        <DependencyStub x={20} y={20} predecessorName="Build" collapsed onNavigate={() => {}} />
      </svg>
    );
    expect(
      screen.getByRole("button", { name: "Go to predecessor Build, in a collapsed phase" })
    ).toBeInTheDocument();
  });
});
