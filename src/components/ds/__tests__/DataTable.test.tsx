/**
 * DataTable — the semantics a div-grid loses.
 */

import React, { useState } from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type Column } from "../DataTable";

interface Consultant {
  id: string;
  name: string;
  rate: number;
}

const ROWS: Consultant[] = [
  { id: "a", name: "Ada Lovelace", rate: 1240 },
  { id: "b", name: "Grace Hopper", rate: 1180 },
  { id: "c", name: "Alan Turing", rate: 1310 },
];

const COLUMNS: Column<Consultant>[] = [
  { key: "name", header: "Name", sortable: true, render: (r) => r.name },
  { key: "rate", header: "Day rate", numeric: true, sortable: true, render: (r) => r.rate },
];

function Basic(props: Partial<React.ComponentProps<typeof DataTable<Consultant>>>) {
  return (
    <DataTable
      caption="Consultants and day rates"
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(r) => r.id}
      {...props}
    />
  );
}

describe("table semantics", () => {
  test("it is a real table with an accessible name", () => {
    render(<Basic />);
    expect(screen.getByRole("table", { name: "Consultants and day rates" })).toBeInTheDocument();
  });

  test("headers are column headers, so cells are announced with them", () => {
    render(<Basic />);
    const headers = screen.getAllByRole("columnheader");

    expect(headers.map((h) => h.textContent)).toEqual(["Name", "Day rate"]);
    headers.forEach((header) => expect(header).toHaveAttribute("scope", "col"));
  });

  test("every row renders", () => {
    render(<Basic />);
    // 3 data rows + 1 header row.
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });
});

describe("sorting", () => {
  test("a sortable column announces that it can be sorted", () => {
    render(<Basic onSort={() => {}} />);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "none"
    );
  });

  test("the sorted column reports its direction", () => {
    render(<Basic onSort={() => {}} sortKey="rate" sortDirection="desc" />);

    expect(screen.getByRole("columnheader", { name: /Day rate/ })).toHaveAttribute(
      "aria-sort",
      "descending"
    );
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "none"
    );
  });

  test("clicking a header sorts ascending, then toggles", async () => {
    const onSort = vi.fn();
    const { rerender } = render(<Basic onSort={onSort} />);

    await userEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(onSort).toHaveBeenCalledWith("name", "asc");

    rerender(<Basic onSort={onSort} sortKey="name" sortDirection="asc" />);
    await userEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(onSort).toHaveBeenLastCalledWith("name", "desc");
  });

  test("a non-sortable column has no sort affordance", () => {
    render(
      <DataTable
        caption="Consultants"
        columns={[{ key: "name", header: "Name", render: (r: Consultant) => r.name }]}
        rows={ROWS}
        rowKey={(r) => r.id}
        onSort={() => {}}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort");
    expect(screen.queryByRole("button", { name: /Name/ })).not.toBeInTheDocument();
  });
});

describe("selection", () => {
  function Selectable() {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    return (
      <Basic
        selectedKeys={selected}
        onSelectionChange={setSelected}
        toolbar={<span>Filters</span>}
        bulkActions={<button type="button">Delete</button>}
      />
    );
  }

  test("the header checkbox states the real scope of 'select all'", () => {
    render(<Selectable />);
    // "Select all" over a paginated set is a promise the table cannot keep.
    expect(
      screen.getByRole("checkbox", { name: "Select all 3 rows on this page" })
    ).toBeInTheDocument();
  });

  test("selecting all on the page checks every row", async () => {
    render(<Selectable />);

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Select all 3 rows on this page" })
    );

    const rowBoxes = screen.getAllByRole("checkbox").slice(1);
    rowBoxes.forEach((box) => expect(box).toBeChecked());
  });

  test("a partial selection shows the header checkbox as indeterminate", async () => {
    render(<Selectable />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Select row a" }));
    expect(
      screen.getByRole("checkbox", { name: "Select all 3 rows on this page" })
    ).toBePartiallyChecked();
  });

  test("the bulk bar replaces the toolbar rather than stacking under it", async () => {
    render(<Selectable />);
    expect(screen.getByText("Filters")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "Select row a" }));

    // The table must not lose vertical space when a row is selected.
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  test("the selected count is announced politely", async () => {
    render(<Selectable />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row a" }));

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("1 selected");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  test("a selected row is marked as such", async () => {
    render(<Selectable />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row a" }));

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveAttribute("aria-selected", "true");
    expect(rows[1]).toHaveAttribute("aria-selected", "false");
  });

  test("without a selection handler there is no checkbox column", () => {
    render(<Basic />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("empty state", () => {
  test("it renders inside the body, leaving the header operational", () => {
    render(
      <Basic
        rows={[]}
        toolbar={<button type="button">Clear filters</button>}
        emptyState={<p>No consultants match these filters</p>}
      />
    );

    expect(screen.getByText("No consultants match these filters")).toBeInTheDocument();
    // The user must still be able to undo the filter that emptied the table.
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });
});

describe("figures", () => {
  test("numeric cells are right-aligned via a class, not inline style", () => {
    render(<Basic />);
    const firstRow = screen.getAllByRole("row")[1];
    const cells = within(firstRow).getAllByRole("cell");

    // Column 2 is the rate. Its class carries the tabular-figure treatment so
    // digits line up between rows.
    expect(cells[1].className).toMatch(/cellNumeric/);
  });
});

describe("loading", () => {
  test("the body reports busy", () => {
    const { container } = render(<Basic loading />);
    expect(container.querySelector("tbody")).toHaveAttribute("aria-busy", "true");
  });
});
