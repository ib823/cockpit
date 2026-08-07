"use client";

/**
 * Design system — DataTable (layer 3, Composites)
 *
 * A real `<table>` with real `<th scope>`, because that is what makes a screen
 * reader able to say "Day rate, 1,240" instead of just "1,240" — and no
 * div-grid reproduces it without reimplementing the entire table model.
 *
 * The rules it encodes, each because it is a correctness decision rather than
 * a styling one:
 *
 *  - **Sort is announced through `aria-sort`, and the active column shows an
 *    arrow as well as accent colour** — never colour alone.
 *  - **The header checkbox selects the loaded page only, and says so**, since
 *    "select all" over a paginated set is a promise the table cannot keep.
 *  - **The bulk bar replaces the toolbar** rather than stacking beneath it, so
 *    selecting a row never shortens the table.
 *  - **Empty and error states render inside the table body**, keeping header
 *    and toolbar operational so the user can undo the filter that emptied it.
 */

import { cx } from "./cx";
import React, { type ReactNode } from "react";
import { Checkbox } from "./Choice";
import styles from "./DataTable.module.css";

export type SortDirection = "asc" | "desc";

export interface Column<Row> {
  /** Stable key; also the sort key reported to `onSort`. */
  key: string;
  header: string;
  /** Right-aligns and applies tabular figures. Use for every figure. */
  numeric?: boolean;
  sortable?: boolean;
  render: (row: Row) => ReactNode;
  width?: string;
}

export interface DataTableProps<Row> {
  /** Names the table for assistive technology. Required. */
  caption: string;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;

  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;

  /** Enables the selection column. */
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;

  /** Filters and actions. Replaced by the bulk bar while rows are selected. */
  toolbar?: ReactNode;
  /** Actions shown when rows are selected. */
  bulkActions?: ReactNode;

  /** Rendered inside the body when `rows` is empty. */
  emptyState?: ReactNode;
  loading?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  sortKey,
  sortDirection = "asc",
  onSort,
  selectedKeys,
  onSelectionChange,
  toolbar,
  bulkActions,
  emptyState,
  loading,
  footer,
  className,
}: DataTableProps<Row>) {
  const selectable = Boolean(selectedKeys && onSelectionChange);
  const selectedCount = selectedKeys?.size ?? 0;

  const pageKeys = rows.map(rowKey);
  const allOnPageSelected =
    pageKeys.length > 0 && pageKeys.every((key) => selectedKeys?.has(key));
  const someOnPageSelected =
    pageKeys.some((key) => selectedKeys?.has(key)) && !allOnPageSelected;

  const toggleAllOnPage = () => {
    if (!selectedKeys || !onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (allOnPageSelected) pageKeys.forEach((key) => next.delete(key));
    else pageKeys.forEach((key) => next.add(key));
    onSelectionChange(next);
  };

  const toggleRow = (key: string) => {
    if (!selectedKeys || !onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  const handleSort = (column: Column<Row>) => {
    if (!column.sortable || !onSort) return;
    const nextDirection: SortDirection =
      sortKey === column.key && sortDirection === "asc" ? "desc" : "asc";
    onSort(column.key, nextDirection);
  };

  return (
    <div className={cx(styles.wrap, className)}>
      {/* The bulk bar replaces the toolbar; it never stacks on top of it. */}
      {selectable && selectedCount > 0 ? (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount} role="status" aria-live="polite">
            {selectedCount} selected
          </span>
          <span className={styles.toolbarSpacer} />
          {bulkActions}
        </div>
      ) : (
        toolbar && <div className={styles.toolbar}>{toolbar}</div>
      )}

      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className={styles.caption}>{caption}</caption>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className={cx(styles.headerCell, styles.checkboxCell)}>
                  <Checkbox
                    // "Select all" over a paginated set is a promise the table
                    // cannot keep, so the label states the real scope.
                    label={`Select all ${rows.length} rows on this page`}
                    hideLabel
                    checked={allOnPageSelected}
                    indeterminate={someOnPageSelected}
                    onChange={toggleAllOnPage}
                  />
                </th>
              )}
              {columns.map((column) => {
                const active = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={cx(
                      styles.headerCell,
                      column.numeric && styles.headerCellNumeric
                    )}
                    // The machine-readable half of the sort signal. Without it
                    // a screen-reader user cannot tell which column is sorted.
                    aria-sort={
                      active
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : column.sortable
                          ? "none"
                          : undefined
                    }
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        className={cx(styles.sortButton, active && styles.sortActive)}
                        onClick={() => handleSort(column)}
                      >
                        {column.header}
                        {active && (
                          <svg
                            className={styles.sortArrow}
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d={sortDirection === "asc" ? "M2.5 6.5 5 4l2.5 2.5" : "M2.5 4 5 6.5 7.5 4"}
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody aria-busy={loading || undefined}>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={styles.stateCell}
                >
                  {emptyState}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = rowKey(row);
                const selected = selectedKeys?.has(key) ?? false;
                return (
                  <tr
                    key={key}
                    className={cx(styles.row, selected && styles.rowSelected)}
                    aria-selected={selectable ? selected : undefined}
                  >
                    {selectable && (
                      <td className={cx(styles.cell, styles.checkboxCell)}>
                        <Checkbox
                          label={`Select row ${key}`}
                          hideLabel
                          checked={selected}
                          onChange={() => toggleRow(key)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cx(styles.cell, column.numeric && styles.cellNumeric)}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
