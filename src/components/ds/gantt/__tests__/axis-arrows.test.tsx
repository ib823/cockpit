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
import { DependencyArrow, DependencyStub } from "../DependencyArrow";

const TICKS = [{ day: 0, label: "Jan" }, { day: 31, label: "Feb" }];
const NON_WORKING = [
  { day: 3 },
  { day: 4 },
  { day: 25, name: "Thaipusam (MY)" },
];

describe("TimelineAxis", () => {
  test("shading renders where a day is wide enough to read", () => {
    const { container } = render(
      <TimelineAxis
        grain="Day"
        totalDays={60}
        majorTicks={TICKS}
        minorTicks={[]}
        nonWorkingDays={NON_WORKING}
      />
    );
    expect(container.querySelectorAll("[class*='shade']")).toHaveLength(3);
  });

  test("shading is dropped once a day is too narrow", () => {
    // At Month a day is 2.9px and the shading becomes texture, which is what
    // hides the exception you were looking for.
    const { container } = render(
      <TimelineAxis
        grain="Month"
        totalDays={60}
        majorTicks={TICKS}
        minorTicks={[]}
        nonWorkingDays={NON_WORKING}
      />
    );
    expect(container.querySelectorAll("[class*='shade']")).toHaveLength(0);
  });

  test("holidays are distinguishable from weekends by more than hue", () => {
    const { container } = render(
      <TimelineAxis
        grain="Day"
        totalDays={60}
        majorTicks={TICKS}
        minorTicks={[]}
        nonWorkingDays={NON_WORKING}
      />
    );
    expect(container.querySelectorAll("[class*='holiday']")).toHaveLength(1);
    expect(container.querySelectorAll("[class*='weekend']")).toHaveLength(2);
  });

  test("the axis is hidden from assistive technology", () => {
    // Three hundred announced tick labels would bury the bars.
    const { container } = render(
      <TimelineAxis grain="Day" totalDays={60} majorTicks={TICKS} minorTicks={[]} />
    );
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  test("today renders when inside the window and not otherwise", () => {
    const inside = render(
      <TimelineAxis grain="Day" totalDays={60} majorTicks={[]} minorTicks={[]} todayDay={30} />
    );
    expect(inside.container.querySelectorAll("[class*='today']").length).toBeGreaterThan(0);

    const outside = render(
      <TimelineAxis grain="Day" totalDays={60} majorTicks={[]} minorTicks={[]} todayDay={900} />
    );
    expect(outside.container.querySelectorAll("[class*='today']")).toHaveLength(0);
  });

  test("tick positions scale with the grain", () => {
    const { container, rerender } = render(
      <TimelineAxis grain="Day" totalDays={60} majorTicks={TICKS} minorTicks={[]} />
    );
    const dayLeft = (container.querySelector("[class*='major']:nth-of-type(2)") as HTMLElement)
      ?.style.left;

    rerender(<TimelineAxis grain="Week" totalDays={60} majorTicks={TICKS} minorTicks={[]} />);
    const weekLeft = (container.querySelector("[class*='major']:nth-of-type(2)") as HTMLElement)
      ?.style.left;

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
