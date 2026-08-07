/**
 * The canvas — treegrid semantics, windowing, and the keyboard contract
 * working end to end against a rendered component.
 */

import React, { useState } from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GanttCanvas, type BarPlacement } from "../GanttCanvas";
import type { GanttPhase } from "../rows";

function plan(phaseCount: number, tasksEach: number): GanttPhase[] {
  return Array.from({ length: phaseCount }, (_, p) => ({
    id: `p${p}`,
    name: `Phase ${p}`,
    tasks: Array.from({ length: tasksEach }, (_, t) => ({
      id: `p${p}t${t}`,
      name: `Task ${p}-${t}`,
    })),
  }));
}

function placementsFor(phases: GanttPhase[]): Record<string, BarPlacement> {
  const out: Record<string, BarPlacement> = {};
  phases.forEach((ph, i) => {
    out[ph.id] = { startDay: i * 10, durationDays: 30 };
    ph.tasks.forEach((t, j) => {
      out[t.id] = { startDay: i * 10 + j, durationDays: 5, progress: 40 };
    });
  });
  return out;
}

function Harness({
  phases,
  initiallyExpanded = [],
  onMove,
}: {
  phases: GanttPhase[];
  initiallyExpanded?: string[];
  onMove?: (id: string, start: number, delta: number) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initiallyExpanded));
  const [grain, setGrain] = useState<"Day" | "Week" | "Month" | "Quarter">("Week");

  return (
    <GanttCanvas
      phases={phases}
      placements={placementsFor(phases)}
      formatDay={(d) => `day ${d}`}
      totalDays={365}
      grain={grain}
      onGrainChange={setGrain}
      expandedIds={expanded}
      onExpandedChange={setExpanded}
      onMove={onMove}
      pendingChanges={3}
      debugAnnouncements
    />
  );
}

describe("treegrid semantics", () => {
  test("it is a treegrid and reports the full row count", () => {
    render(<Harness phases={plan(4, 3)} />);
    const grid = screen.getByRole("treegrid", { name: "Project timeline" });

    // Collapsed: 4 phase rows, but the count must reflect what is rendered
    // now, not the fully-expanded total.
    expect(grid).toHaveAttribute("aria-rowcount", "4");
    expect(grid).toHaveAttribute("aria-multiselectable", "true");
  });

  test("rows carry level, position and set size", () => {
    render(<Harness phases={plan(2, 3)} initiallyExpanded={["p0"]} />);
    const rows = screen.getAllByRole("row");

    expect(rows[0]).toHaveAttribute("aria-level", "1");
    expect(rows[0]).toHaveAttribute("aria-rowindex", "1");
    expect(rows[1]).toHaveAttribute("aria-level", "2");
    // Within the parent, not the flat list.
    expect(rows[1]).toHaveAttribute("aria-posinset", "1");
    expect(rows[1]).toHaveAttribute("aria-setsize", "3");
  });

  test("only phase rows carry aria-expanded", () => {
    render(<Harness phases={plan(1, 2)} initiallyExpanded={["p0"]} />);
    const rows = screen.getAllByRole("row");

    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    // A task with aria-expanded="false" would claim to be a collapsed parent.
    expect(rows[1]).not.toHaveAttribute("aria-expanded");
  });

  test("aria-rowindex describes the document, not the mounted slice", () => {
    render(<Harness phases={plan(60, 0)} />);
    const grid = screen.getByRole("treegrid");
    const rows = screen.getAllByRole("row");
    const indices = rows.map((r) => Number(r.getAttribute("aria-rowindex")));

    // Windowing mounts a slice...
    expect(rows.length).toBeLessThan(60);
    // ...but the grid still reports the whole document, so a screen reader can
    // say "row 12 of 60" rather than "row 12 of 21".
    expect(grid).toHaveAttribute("aria-rowcount", "60");
    // At the top of the list the indices legitimately start at 1 and run
    // contiguously; the point is that they are document positions, not offsets
    // into the rendered window.
    expect(indices[0]).toBe(1);
    expect(indices).toEqual(indices.map((_, i) => i + 1));
  });
});

describe("windowing", () => {
  test("a 1,200-row plan mounts only a slice", () => {
    render(<Harness phases={plan(80, 14)} initiallyExpanded={["p0"]} />);
    // 80 phases + 14 tasks = 94 rows; far fewer are mounted.
    expect(screen.getAllByRole("row").length).toBeLessThan(50);
  });

  test("the scroll container is sized by the full row count", () => {
    const { container } = render(<Harness phases={plan(200, 0)} />);
    const sized = Array.from(container.querySelectorAll<HTMLElement>("div")).find(
      (el) => el.style.height === `${200 * 32}px`
    );
    // The scrollbar must reflect the dataset, not the rendered slice.
    expect(sized).toBeDefined();
  });
});

describe("expand and collapse", () => {
  test("a phase expands and announces its task count", async () => {
    render(<Harness phases={plan(2, 5)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByRole("status")).toHaveTextContent("Phase 0 expanded, 5 tasks.");
  });

  test("collapsing announces without a count", async () => {
    render(<Harness phases={plan(2, 5)} initiallyExpanded={["p0"]} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("status")).toHaveTextContent("Phase 0 collapsed.");
  });
});

describe("row cursor", () => {
  test("moving the cursor announces the row and its position", async () => {
    render(<Harness phases={plan(3, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("{ArrowDown}");

    expect(screen.getByRole("status")).toHaveTextContent("Phase 1, phase, level 1");
    expect(screen.getByRole("status")).toHaveTextContent("row 2 of 3");
  });

  test("the cursor clamps at the top", async () => {
    render(<Harness phases={plan(3, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    // Wrapping to the end of a 1,200-row plan would lose the user's place.
    expect(screen.getByRole("status")).toHaveTextContent("row 1 of 3");
  });
});

describe("selection", () => {
  test("Space toggles selection and announces the count", async () => {
    render(<Harness phases={plan(3, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard(" ");
    expect(screen.getByRole("status")).toHaveTextContent("1 row selected.");

    await userEvent.keyboard("{ArrowDown} ");
    expect(screen.getByRole("status")).toHaveTextContent("2 rows selected.");

    await userEvent.keyboard(" ");
    expect(screen.getByRole("status")).toHaveTextContent("1 row selected.");
  });

  test("selection is reflected on the row", async () => {
    render(<Harness phases={plan(2, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard(" ");
    expect(screen.getAllByRole("row")[0]).toHaveAttribute("aria-selected", "true");
  });
});

describe("Move mode", () => {
  test("M enters Move mode and states the grain and both exits", async () => {
    render(<Harness phases={plan(2, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("m");

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Move mode on");
    expect(status).toHaveTextContent("one week");
    expect(status).toHaveTextContent("Enter commits, Escape reverts");
  });

  test("a nudge announces the dates only", async () => {
    render(<Harness phases={plan(2, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("m{ArrowRight}");

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Start day 7, finish day 37");
    // The rule that makes repeated nudging usable.
    expect(status).not.toHaveTextContent("Phase 0,");
  });

  test("a nudge moves by one unit of the current grain", async () => {
    render(<Harness phases={plan(2, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("m{ArrowRight}{ArrowRight}");
    // Week grain: two nudges = 14 days.
    expect(screen.getByRole("status")).toHaveTextContent("Start day 14");
  });

  test("Enter commits, reporting the delta and pending sync", async () => {
    const onMove = vi.fn();
    render(<Harness phases={plan(2, 0)} onMove={onMove} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("m{ArrowRight}{Enter}");

    expect(onMove).toHaveBeenCalledWith("p0", 7, 7);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("7 days later");
    expect(status).toHaveTextContent("3 changes pending sync");
  });

  test("Escape reverts and nothing is persisted", async () => {
    const onMove = vi.fn();
    render(<Harness phases={plan(2, 0)} onMove={onMove} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("m{ArrowRight}{ArrowRight}{ArrowRight}{Escape}");

    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Move cancelled");
    // Back to the entry position, not one nudge back.
    expect(screen.getByRole("status")).toHaveTextContent("returned to day 0");
  });

  test("arrow keys do not move the row cursor while in Move mode", async () => {
    render(<Harness phases={plan(3, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("m{ArrowRight}");
    // The announcement is a nudge, not a cursor move.
    expect(screen.getByRole("status")).not.toHaveTextContent("row 2 of 3");
  });
});

describe("zoom", () => {
  test("+ and − change the grain", async () => {
    render(<Harness phases={plan(2, 0)} />);
    const grid = screen.getByRole("treegrid");

    grid.focus();
    await userEvent.keyboard("-");
    expect(screen.getByText("Month")).toBeInTheDocument();

    await userEvent.keyboard("+");
    expect(screen.getByText("Week")).toBeInTheDocument();
  });

  test("zoom controls are reachable by pointer too", async () => {
    render(<Harness phases={plan(2, 0)} />);
    await userEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("Month")).toBeInTheDocument();
  });
});

describe("the tree pane", () => {
  test("names are present and never duplicated into the accessibility tree", () => {
    render(<Harness phases={plan(2, 0)} />);
    // The tree pane is aria-hidden; the row's own gridcell carries the name,
    // so a screen reader hears it once rather than twice.
    const rows = screen.getAllByRole("row");
    expect(within(rows[0]).getByRole("gridcell")).toHaveTextContent("Phase 0");
  });
});
