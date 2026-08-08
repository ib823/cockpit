/**
 * The capacity panel's contract, asserted against the rendered component:
 * a real table (row and column headers reach assistive technology for free),
 * search that filters on the provided haystack with an announced count, and
 * cells whose accessible names come through AllocationCell fully spelled out.
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  GanttCapacityPanel,
  type CapacityColumn,
  type CapacityRow,
} from "../GanttCapacityPanel";

const columns: CapacityColumn[] = [
  { key: "W01", label: "W01", title: "W01, 5 Jan – 11 Jan 26" },
  { key: "W02", label: "W02", title: "W02, 12 Jan – 18 Jan 26" },
];

const rows: CapacityRow[] = [
  {
    id: "r1",
    name: "Ada Lovelace",
    meta: "Technical",
    searchText: "ada lovelace technical abeam integration lead",
    percents: [40, 120],
  },
  {
    id: "r2",
    name: "Grace Hopper",
    meta: "Functional",
    searchText: "grace hopper functional",
    percents: [95, 0],
  },
];

describe("GanttCapacityPanel", () => {
  it("renders a real table with resource and week headers", () => {
    render(<GanttCapacityPanel columns={columns} rows={rows} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "W01" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: /Ada Lovelace/ })).toBeInTheDocument();
  });

  it("spells out each cell through AllocationCell, over-allocation included", () => {
    render(<GanttCapacityPanel columns={columns} rows={rows} />);

    expect(
      screen.getByRole("button", {
        name: "Ada Lovelace, W02, 12 Jan – 18 Jan 26: 120% allocated, over-allocated",
      })
    ).toBeInTheDocument();
  });

  it("filters rows on the haystack and announces the count", () => {
    render(<GanttCapacityPanel columns={columns} rows={rows} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search resources" }), {
      target: { value: "integration" },
    });

    // "integration lead" is in Ada's haystack only — the field itself is not
    // visible anywhere, which is the point: search reaches what the eye
    // cannot.
    expect(screen.getByRole("rowheader", { name: /Ada Lovelace/ })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: /Grace Hopper/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 of 2 resources");
  });

  it("says so when nothing matches, rather than showing a bare table", () => {
    render(<GanttCapacityPanel columns={columns} rows={rows} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search resources" }), {
      target: { value: "nobody" },
    });

    expect(screen.getByText(/No resources match/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0 of 2 resources");
  });

  it("reports the activated cell's resource and week", () => {
    const onCellSelect = vi.fn();
    render(
      <GanttCapacityPanel columns={columns} rows={rows} onCellSelect={onCellSelect} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Grace Hopper, W01.*95% allocated/ })
    );

    expect(onCellSelect).toHaveBeenCalledWith("r2", "W01");
  });

  it("renders nothing at all with no rows — the toggle owns visibility", () => {
    const { container } = render(<GanttCapacityPanel columns={[]} rows={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
