/**
 * The milestone layer's contract, asserted against the rendered component.
 *
 * The properties that matter:
 *
 *  - A marker is a real button whose NAME carries the milestone and its date —
 *    that is the entire accessibility story, because the rule beside it is
 *    decoration and says nothing.
 *  - Out-of-range milestones are dropped per-marker, matching the legacy
 *    canvas, without hiding their in-range neighbours.
 *  - Position is day × PX_PER_DAY for the active grain — the same arithmetic
 *    as the bars, so a milestone and a bar on the same date line up.
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { GanttMilestones, type CanvasMilestone } from "../GanttMilestones";
import { PX_PER_DAY } from "../scale";

const uat: CanvasMilestone = {
  id: "m1",
  name: "UAT sign-off",
  day: 40,
  dateLabel: "14 Jul 26",
  color: "#0B57D0",
};

function renderLayer(
  milestones: CanvasMilestone[],
  onActivate?: (id: string) => void
) {
  return render(
    <GanttMilestones
      milestones={milestones}
      grain="Week"
      totalDays={90}
      onActivate={onActivate}
    />
  );
}

describe("GanttMilestones", () => {
  it("renders a named button per milestone — name and date, not just 'button'", () => {
    renderLayer([uat]);

    expect(
      screen.getByRole("button", { name: "Milestone: UAT sign-off, 14 Jul 26" })
    ).toBeInTheDocument();
  });

  it("positions the marker with the bars' arithmetic: day × px-per-day", () => {
    renderLayer([uat]);

    const marker = screen.getByRole("button", { name: /UAT sign-off/ });
    expect(marker.style.left).toBe(`${40 * PX_PER_DAY.Week}px`);
  });

  it("drops an out-of-range milestone without hiding its in-range neighbours", () => {
    renderLayer([
      uat,
      { id: "before", name: "Before the plan", day: -3, dateLabel: "x" },
      { id: "after", name: "After the plan", day: 91, dateLabel: "x" },
    ]);

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /UAT sign-off/ })).toBeInTheDocument();
  });

  it("keeps a milestone on the plan's last day — the boundary is inclusive", () => {
    // The end date belongs to the plan (durations are inclusive everywhere in
    // this codebase), so a go-live milestone on the final day must render.
    renderLayer([{ id: "golive", name: "Go-live", day: 90, dateLabel: "x" }]);

    expect(screen.getByRole("button", { name: /Go-live/ })).toBeInTheDocument();
  });

  it("reports the activated milestone's id", () => {
    const onActivate = vi.fn();
    renderLayer([uat], onActivate);

    fireEvent.click(screen.getByRole("button", { name: /UAT sign-off/ }));

    expect(onActivate).toHaveBeenCalledWith("m1");
  });

  it("keeps the rule out of the accessibility tree, outside the button", () => {
    const { container } = renderLayer([uat]);

    // CSS Modules hash class names, so the selector matches on the stem. What
    // is asserted is the structure: the rule is aria-hidden AND is not inside
    // the button — an aria-hidden child of a named button would be fine, but
    // an interactive thing inside an aria-hidden rule would not.
    const rule = container.querySelector('span[class*="rule"]') as HTMLElement;
    expect(rule).not.toBeNull();
    expect(rule).toHaveAttribute("aria-hidden", "true");
    expect(rule.closest("button")).toBeNull();
  });

  it("falls back to the legacy default colour so both canvases agree", () => {
    const { container } = renderLayer([{ id: "m", name: "Plain", day: 5, dateLabel: "x" }]);

    const rule = container.querySelector('span[class*="rule"]') as HTMLElement;
    expect(rule.style.backgroundColor).toBe("rgb(255, 59, 48)"); // #FF3B30
  });

  it("renders nothing at all for an empty or fully out-of-range list", () => {
    const { container } = renderLayer([
      { id: "gone", name: "Gone", day: -10, dateLabel: "x" },
    ]);

    expect(container).toBeEmptyDOMElement();
  });
});
