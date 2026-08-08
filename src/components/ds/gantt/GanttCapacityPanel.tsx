"use client";

/**
 * Design system — resource capacity panel (layer 4, Domain surfaces)
 *
 * The resource × week allocation matrix under the canvas: one row per
 * resource, one AllocationCell per project week, and the search box that
 * filters the rows. This is the matrix AllocationCell was built for — the
 * cell carries figure + fill + hatch so an over-allocation survives a
 * projector, a printout, and colour-blindness; the panel's job is only to lay
 * the cells out and keep the rows findable.
 *
 * ## One deliberate difference from the legacy panel
 *
 * Legacy positions capacity cells under the timeline, pixel-aligned to the
 * Gantt above. This panel is a self-contained matrix with its own week
 * header and its own horizontal scroll. That is a v1 trade, made openly: at
 * Month and Quarter grains a week is 20px or 8px wide, which cannot hold a
 * figure, so pixel alignment and readable cells are mutually exclusive —
 * and the cell's whole design is that the figure is always readable.
 *
 * ## Search
 *
 * Filters on a caller-provided haystack per row rather than on fields this
 * component knows about, because what is searchable (name, category label,
 * company, project role — legacy's four) is domain knowledge the seam owns.
 * The count announces through a live region so a keyboard user typing a
 * query hears the result without leaving the field.
 */

import React, { useMemo, useState } from "react";
import { AllocationCell } from "./AllocationCell";
import styles from "./GanttCapacityPanel.module.css";

export interface CapacityColumn {
  /** Stable key, e.g. "W07". */
  key: string;
  /** Header label, e.g. "W07" — with a title of the week's dates. */
  label: string;
  /** Full name for hover and assistive text, e.g. "W07, 16 Feb – 22 Feb". */
  title: string;
}

export interface CapacityRow {
  id: string;
  name: string;
  /** Secondary line under the name, e.g. the category label. */
  meta?: string;
  /** Lower-cased haystack the search matches against. */
  searchText: string;
  /** Aligned to the panel's columns, one percentage per week. */
  percents: number[];
}

export interface GanttCapacityPanelProps {
  columns: CapacityColumn[];
  rows: CapacityRow[];
  /** Called with the row and column of an activated cell. */
  onCellSelect?: (resourceId: string, weekKey: string) => void;
}

export function GanttCapacityPanel({
  columns,
  rows,
  onCellSelect,
}: GanttCapacityPanelProps) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.searchText.includes(q));
  }, [rows, query]);

  if (rows.length === 0) return null;

  return (
    <section className={styles.panel} aria-label="Resource capacity">
      <div className={styles.toolbar}>
        <h3 className={styles.title}>Resource capacity</h3>
        <input
          type="search"
          className={styles.search}
          placeholder="Search resources…"
          aria-label="Search resources"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {/* Announced, not just shown: the visual count sits far from the
          * field, and a screen-reader user typing should not have to leave
          * the input to learn whether anything matched. */}
        <span className={styles.count} role="status">
          {query.trim()
            ? `${visible.length} of ${rows.length} resources`
            : `${rows.length} resources`}
        </span>
      </div>

      <div className={styles.scroller}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <th scope="col" className={styles.nameHeader}>
                Resource
              </th>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={styles.weekHeader} title={col.title}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <th scope="row" className={styles.nameCell}>
                  <span className={styles.resourceName} title={row.name}>
                    {row.name}
                  </span>
                  {row.meta && <span className={styles.resourceMeta}>{row.meta}</span>}
                </th>
                {columns.map((col, i) => (
                  <td key={col.key} className={styles.weekCell}>
                    <AllocationCell
                      value={row.percents[i] ?? 0}
                      label={`${row.name}, ${col.title}`}
                      onSelect={
                        onCellSelect ? () => onCellSelect(row.id, col.key) : undefined
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className={styles.empty}>No resources match “{query.trim()}”.</p>
        )}
      </div>
    </section>
  );
}
