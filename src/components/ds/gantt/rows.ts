/**
 * Design system — Gantt row model (layer 4, Domain surfaces)
 *
 * Flattening a phase/task tree into the rows a `treegrid` renders, and the
 * windowing that keeps 1,200 tasks scrollable.
 *
 * Pure functions, deliberately: the canvas, the export renderer and the
 * keyboard cursor all need the same flat order, and when that logic lived
 * inside the component the three disagreed about what "the next row" meant.
 *
 * The rules here come from the spec and each has a reason:
 *
 *  - **Everything collapses by default.** A plan that opens 1,280 rows deep
 *    cannot be read, and costs a second of layout before the user sees
 *    anything.
 *  - **`aria-rowindex` is absolute, not the index within the window.** A
 *    screen reader must say "row 812 of 1,280"; reporting "row 12 of 30"
 *    because that is what is currently mounted is a lie about the document.
 *  - **The scroll container is sized by the full row count**, so the scrollbar
 *    reflects the real dataset rather than the rendered slice.
 */

export interface GanttPhase {
  id: string;
  name: string;
  tasks: GanttTask[];
}

export interface GanttTask {
  id: string;
  name: string;
}

export type RowKind = "phase" | "task";

export interface FlatRow {
  id: string;
  kind: RowKind;
  name: string;
  /** 1-based, as `aria-level` reports it. Phases are 1, tasks are 2. */
  level: number;
  /** 1-based absolute position in the flattened list, for `aria-rowindex`. */
  rowIndex: number;
  /** Position within the parent, for `aria-posinset`. */
  posInSet: number;
  setSize: number;
  /** Only phases carry `aria-expanded`; a task has no expanded state. */
  expanded?: boolean;
  parentId?: string;
  /** Task count, used by the expand announcement. */
  taskCount?: number;
}

/**
 * Above this many rows, nothing auto-expands.
 *
 * The point is not the exact number — it is that "expand everything on load"
 * must never be the default for a real plan.
 */
export const AUTO_EXPAND_ROW_LIMIT = 40;

/**
 * Flattens the tree into the visible row list.
 *
 * Collapsed phases contribute one row, not zero: the phase is still there and
 * still needs a cursor position, an expand control and a summary bar.
 */
export function flattenRows(
  phases: GanttPhase[],
  expandedIds: ReadonlySet<string>
): FlatRow[] {
  const rows: FlatRow[] = [];

  phases.forEach((phase, phaseIndex) => {
    const expanded = expandedIds.has(phase.id);

    rows.push({
      id: phase.id,
      kind: "phase",
      name: phase.name,
      level: 1,
      rowIndex: rows.length + 1,
      posInSet: phaseIndex + 1,
      setSize: phases.length,
      expanded,
      taskCount: phase.tasks.length,
    });

    if (!expanded) return;

    phase.tasks.forEach((task, taskIndex) => {
      rows.push({
        id: task.id,
        kind: "task",
        name: task.name,
        level: 2,
        rowIndex: rows.length + 1,
        posInSet: taskIndex + 1,
        setSize: phase.tasks.length,
        parentId: phase.id,
      });
    });
  });

  return rows;
}

/**
 * The initial expanded set.
 *
 * Returns empty whenever expanding everything would exceed the limit, so a
 * small plan opens usefully and a large one opens readably. The alternative —
 * always collapsed — makes a five-row project needlessly click-heavy.
 */
export function initialExpanded(phases: GanttPhase[]): Set<string> {
  const totalIfExpanded =
    phases.length + phases.reduce((sum, p) => sum + p.tasks.length, 0);

  if (totalIfExpanded > AUTO_EXPAND_ROW_LIMIT) return new Set();
  return new Set(phases.map((p) => p.id));
}

export interface RowWindow {
  /** Index of the first rendered row, 0-based into the flat list. */
  startIndex: number;
  /** Exclusive end index. */
  endIndex: number;
  /** Spacer height above the rendered rows, in pixels. */
  offsetTop: number;
  /** Full scrollable height, so the scrollbar reflects the real dataset. */
  totalHeight: number;
}

/**
 * Which slice of rows to render for a given scroll position.
 *
 * `overscan` rows are rendered beyond each edge so a fast scroll does not
 * expose blank space before React catches up.
 */
export function computeWindow(
  totalRows: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number,
  overscan = 6
): RowWindow {
  const firstVisible = Math.floor(scrollTop / rowHeight);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(totalRows, firstVisible + visibleCount + overscan);

  return {
    startIndex,
    endIndex,
    offsetTop: startIndex * rowHeight,
    // Sized by the FULL count, not the rendered slice — otherwise the
    // scrollbar claims the plan is 30 rows long.
    totalHeight: totalRows * rowHeight,
  };
}

/**
 * Moves the row cursor.
 *
 * Clamps rather than wrapping: arrowing off the end of a 1,200-row plan and
 * landing back at row 1 loses the user's place completely.
 */
export function moveCursor(current: number, delta: number, total: number): number {
  return Math.max(0, Math.min(total - 1, current + delta));
}

/**
 * The scroll position needed to bring a row into view.
 *
 * Returns null when the row is already visible, so the caller can skip
 * scrolling entirely — a scroll on every cursor move makes the canvas twitch
 * even when nothing needed to happen.
 */
export function scrollToRow(
  rowIndex: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number
): number | null {
  const rowTop = rowIndex * rowHeight;
  const rowBottom = rowTop + rowHeight;

  if (rowTop < scrollTop) return rowTop;
  if (rowBottom > scrollTop + viewportHeight) return rowBottom - viewportHeight;
  return null;
}
