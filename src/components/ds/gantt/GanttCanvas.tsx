"use client";

/**
 * Design system — Gantt canvas (layer 4, Domain surfaces)
 *
 * The two-pane timeline: a sticky tree column and a scrollable canvas, wired
 * to the row model, the windowing, the Move-mode keyboard contract and the
 * `#gantt-status` live region.
 *
 * The decisions that make this work at 1,200 tasks:
 *
 *  - **Bars are absolutely-positioned divs, not SVG.** Thirty divs beat one
 *    1,200-node SVG for scroll performance, and — more importantly — each bar
 *    keeps a real DOM node, so it can hold focus and ARIA. An SVG canvas would
 *    make every bar unreachable by keyboard.
 *
 *  - **The timeline pane owns vertical scrolling and drives the tree.** Two
 *    independently scrollable panes drift apart, and a Gantt whose name column
 *    disagrees with its bars is worse than no Gantt.
 *
 *  - **The tree name never wraps.** A wrapped name changes that row's height
 *    in one pane only, which desynchronises the two — the single failure a
 *    split Gantt cannot recover from.
 *
 *  - **`aria-rowcount` is the full flat count and `aria-rowindex` is
 *    absolute**, so a screen reader reports "row 812 of 1,280" even though
 *    only ~30 rows are mounted.
 */

import { cx } from "../cx";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./GanttCanvas.module.css";
import { GanttAmsChevron } from "./GanttAmsChevron";
import { GanttBar } from "./GanttBar";
import { GanttMilestones, type CanvasMilestone } from "./GanttMilestones";
import { GanttStatus } from "./GanttStatus";
import { TimelineAxis, type AxisTick, type NonWorkingDay } from "./TimelineAxis";
import {
  computeWindow,
  flattenRows,
  moveCursor,
  scrollToRow,
  type FlatRow,
  type GanttPhase,
} from "./rows";
import { ROW_HEIGHT, effectivePxPerDay, nudgeDays, showsDayShading, type ZoomGrain } from "./scale";
import {
  sayCursorMove,
  sayExpand,
  saySelection,
  sayMoveModeOn,
  sayNudge,
  sayCommit,
  sayRevert,
  type BarFacts,
} from "./announce";

/**
 * Detail cells for one row of the tree pane, pre-formatted by the caller so
 * the canvas never owns date or duration formatting — the seam does, where it
 * can be asserted.
 *
 * The tree pane renders `dates` in its right column, per the layer-4a spec's
 * two-column pane (name, dates). `calendar` and `working` no longer get
 * columns of their own — the spec's pane is 392px, and the working-day count
 * reaches assistive technology through every bar's accessible description.
 */
export interface RowDetails {
  /** Calendar duration, e.g. "3.2 m". */
  calendar: string;
  /** Working days as displayed, e.g. "42 d". */
  working: string;
  /** Start–end, e.g. "05-Jan-26 (Mon) - 30-Jan-26 (Fri)". */
  dates: string;
  /** The working-day count as a number, for the accessible description. */
  workingDays: number;
}

/** Timing for one bar on the canvas. Days are offsets from the origin. */
export interface BarPlacement {
  startDay: number;
  durationDays: number;
  progress?: number;
  critical?: boolean;
  baselineStartDay?: number;
  baselineDurationDays?: number;
  /**
   * An ongoing contract (AMS). Painted as a fixed-width chevron strip at the
   * start date instead of a duration bar: the timeline bounds deliberately
   * exclude AMS end dates, so a duration bar would overrun the canvas.
   * `durationDays` is ignored for these.
   */
  ams?: boolean;
}

export interface GanttCanvasProps {
  phases: GanttPhase[];
  /** Timing for every phase and task, keyed by id. */
  placements: Record<string, BarPlacement>;
  /** Turns a day offset into a human date, e.g. "14 Jul 26". */
  formatDay: (day: number) => string;
  totalDays: number;
  grain: ZoomGrain;
  onGrainChange: (grain: ZoomGrain) => void;
  expandedIds: Set<string>;
  onExpandedChange: (next: Set<string>) => void;
  /** Called when a move is committed. Nothing else persists anything. */
  onMove?: (id: string, startDay: number, deltaDays: number) => void;
  /** Queued local changes, reported in the commit announcement. */
  pendingChanges?: number;
  majorTicks?: AxisTick[];
  minorTicks?: AxisTick[];
  nonWorkingDays?: NonWorkingDay[];
  todayDay?: number;
  /**
   * Per-row detail columns. When present the tree pane becomes the four-column
   * grid the legacy canvas renders (name, duration, work days, dates); when
   * absent it stays a name-only tree, which is what the showcase and every
   * pre-existing caller get.
   */
  details?: Record<string, RowDetails>;
  /** Milestones, in the same day-offset space as placements. */
  milestones?: CanvasMilestone[];
  /** Opens milestone editing. Markers render inert without it. */
  onMilestoneActivate?: (id: string) => void;
  /** Opens the row's editor: Enter on the grid cursor, double-click a bar. */
  onRowActivate?: (id: string) => void;
  /** Extra toolbar content, e.g. filters. */
  toolbar?: ReactNode;
  height?: number;
  /** Shows the live region on screen. For the showcase and for debugging. */
  debugAnnouncements?: boolean;
}

const GRAINS: ZoomGrain[] = ["Day", "Week", "Month", "Quarter"];

export function GanttCanvas({
  phases,
  placements,
  formatDay,
  totalDays,
  grain,
  onGrainChange,
  expandedIds,
  onExpandedChange,
  onMove,
  pendingChanges = 0,
  majorTicks = [],
  minorTicks = [],
  nonWorkingDays = [],
  todayDay,
  details,
  milestones = [],
  onMilestoneActivate,
  onRowActivate,
  toolbar,
  height = 520,
  debugAnnouncements,
}: GanttCanvasProps) {
  const rows = useMemo(() => flattenRows(phases, expandedIds), [phases, expandedIds]);
  const rowHeight = ROW_HEIGHT.standard;

  const [scrollTop, setScrollTop] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  // Move mode is held here rather than in a hook instance per row: only one
  // bar can be in Move mode at a time, and the state has to survive the row
  // being unmounted by windowing while the user scrolls.
  const [moving, setMoving] = useState<{ id: string; startDay: number } | null>(null);
  const moveAnchor = useRef<number>(0);

  const bodyRef = useRef<HTMLDivElement | null>(null);
  // The axis is the spec's two 28px tiers.
  const viewportHeight = height - 56;

  // The timeline pane's inner width. The grain's density is a MINIMUM — a
  // plan shorter than the pane stretches to fill it, so the chart always runs
  // end to end and zooming only changes tick density (see effectivePxPerDay).
  // 0 until first measure (and under test, where ResizeObserver is absent),
  // which falls back to the spec density.
  const [paneWidth, setPaneWidth] = useState(0);
  React.useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setPaneWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const px = effectivePxPerDay(grain, totalDays, paneWidth);

  const window_ = computeWindow(rows.length, rowHeight, scrollTop, viewportHeight);
  const visible = rows.slice(window_.startIndex, window_.endIndex);

  const announce = useCallback((text: string) => setMessage(text), []);

  const factsFor = useCallback(
    (row: FlatRow): BarFacts => {
      const placement = placements[row.id];
      const start = moving?.id === row.id ? moving.startDay : (placement?.startDay ?? 0);
      return {
        name: row.name,
        kind: row.kind,
        level: row.level,
        startLabel: formatDay(start),
        finishLabel: formatDay(start + (placement?.durationDays ?? 0)),
        rowIndex: row.rowIndex,
        rowCount: rows.length,
      };
    },
    [placements, formatDay, rows.length, moving]
  );

  const toggleExpand = useCallback(
    (row: FlatRow) => {
      if (row.kind !== "phase") return;
      const next = new Set(expandedIds);
      const willExpand = !next.has(row.id);
      if (willExpand) next.add(row.id);
      else next.delete(row.id);
      onExpandedChange(next);
      announce(sayExpand(row.name, willExpand, row.taskCount ?? 0));
    },
    [expandedIds, onExpandedChange, announce]
  );

  const moveCursorTo = useCallback(
    (index: number) => {
      const next = moveCursor(cursor, index - cursor, rows.length);
      setCursor(next);

      const target = rows[next];
      if (target) announce(sayCursorMove(factsFor(target)));

      const scroll = scrollToRow(next, rowHeight, scrollTop, viewportHeight);
      if (scroll != null && bodyRef.current) bodyRef.current.scrollTop = scroll;
    },
    [cursor, rows, announce, factsFor, rowHeight, scrollTop, viewportHeight]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const row = rows[cursor];
      if (!row) return;

      // Move mode swallows the arrows that would otherwise move the cursor —
      // which is the point of it being a mode.
      if (moving) {
        const step = nudgeDays(grain) * (event.shiftKey ? 4 : 1);
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const delta = event.key === "ArrowRight" ? step : -step;
          const nextStart = moving.startDay + delta;
          setMoving({ ...moving, startDay: nextStart });
          announce(
            sayNudge(
              formatDay(nextStart),
              formatDay(nextStart + (placements[moving.id]?.durationDays ?? 0))
            )
          );
          return;
        }
        if (event.key === "Enter" || event.key === "m" || event.key === "M") {
          event.preventDefault();
          const delta = moving.startDay - moveAnchor.current;
          onMove?.(moving.id, moving.startDay, delta);
          announce(sayCommit(factsFor(row), delta, pendingChanges));
          setMoving(null);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setMoving(null);
          announce(sayRevert(factsFor(row), formatDay(moveAnchor.current)));
          return;
        }
        return;
      }

      switch (event.key) {
        case "Enter":
          event.preventDefault();
          onRowActivate?.(row.id);
          break;
        case "ArrowDown":
          event.preventDefault();
          moveCursorTo(cursor + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          moveCursorTo(cursor - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          if (row.kind === "phase" && !row.expanded) toggleExpand(row);
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (row.kind === "phase" && row.expanded) toggleExpand(row);
          // On a task, collapse is not meaningful — jump to the parent, which
          // is where the user is trying to get to.
          else if (row.parentId) {
            const parentIndex = rows.findIndex((r) => r.id === row.parentId);
            if (parentIndex >= 0) moveCursorTo(parentIndex);
          }
          break;
        case "m":
        case "M": {
          event.preventDefault();
          const placement = placements[row.id];
          if (!placement) break;
          moveAnchor.current = placement.startDay;
          setMoving({ id: row.id, startDay: placement.startDay });
          announce(sayMoveModeOn(factsFor(row), grain));
          break;
        }
        case " ": {
          event.preventDefault();
          const next = new Set(selected);
          if (next.has(row.id)) next.delete(row.id);
          else next.add(row.id);
          setSelected(next);
          announce(saySelection(next.size));
          break;
        }
        case "+":
        case "=": {
          event.preventDefault();
          const index = GRAINS.indexOf(grain);
          if (index > 0) onGrainChange(GRAINS[index - 1]);
          break;
        }
        case "-": {
          event.preventDefault();
          const index = GRAINS.indexOf(grain);
          if (index < GRAINS.length - 1) onGrainChange(GRAINS[index + 1]);
          break;
        }
        case "t":
        case "T":
          event.preventDefault();
          if (todayDay != null && bodyRef.current) {
            // Horizontal, not vertical: "scroll to today" is about the date
            // axis, and moving the row cursor as well would lose the user's
            // place in the plan.
            bodyRef.current.scrollLeft = Math.max(
              0,
              todayDay * px - bodyRef.current.clientWidth / 2
            );
          }
          break;
        default:
          break;
      }
    },
    [
      rows,
      cursor,
      moving,
      grain,
      placements,
      selected,
      todayDay,
      announce,
      factsFor,
      formatDay,
      moveCursorTo,
      toggleExpand,
      onGrainChange,
      onMove,
      onRowActivate,
      pendingChanges,
      px,
    ]
  );

  const hasMilestones = milestones.length > 0;
  const hasAms = Object.values(placements).some((p) => p.ams);
  const hasHolidays = nonWorkingDays.some((d) => d.name);

  return (
    <div className={styles.frame}>
      <div className={styles.toolbar}>
        {/* The spec's segmented zoom: a radiogroup on a sunken track, the
          * active grain raised white. Finer grains sit left, as on a map. */}
        <div role="radiogroup" aria-label="Zoom" className={styles.zoomGroup}>
          {GRAINS.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={g === grain}
              className={cx(styles.zoomCell, g === grain && styles.zoomCellActive)}
              onClick={() => onGrainChange(g)}
            >
              {g}
            </button>
          ))}
        </div>
        {toolbar && <span className={styles.toolbarDivider} aria-hidden="true" />}
        {toolbar}
        <span className={styles.spacer} />
        {moving && (
          <span className={styles.moveHint} role="presentation">
            Move mode · {grain}
          </span>
        )}
        <span className={styles.rowCount}>
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className={styles.canvas} style={{ height }}>
        {/* The spec's two-column pane: name on the left, dates on the right,
          * 392px. Duration and working days live in each bar's accessible
          * description and the row announcement, not in columns of their own. */}
        <div className={styles.treePane} style={details ? { width: 392 } : undefined}>
          <div className={styles.treeHeader}>
            <span className={styles.treeHeaderLabel}>Phase / task</span>
            {details && <span className={styles.treeHeaderDates}>Dates</span>}
          </div>
          <div
            className={styles.treeBody}
            style={{ height: viewportHeight }}
            // Scrolled programmatically by the timeline pane; the user never
            // scrolls this one directly, so the two cannot drift apart.
            aria-hidden="true"
          >
            <div style={{ height: window_.totalHeight, position: "relative" }}>
              <div style={{ transform: `translateY(${window_.offsetTop}px)` }}>
                {visible.map((row) => (
                  <div
                    key={row.id}
                    className={cx(
                      styles.row,
                      row.kind === "phase" && styles.rowPhase,
                      selected.has(row.id) && styles.rowSelected,
                      rows[cursor]?.id === row.id && styles.rowCursor
                    )}
                    style={{ height: rowHeight, paddingLeft: 8 + (row.level - 1) * 16 }}
                  >
                    {row.kind === "phase" ? (
                      <button
                        type="button"
                        className={styles.twisty}
                        tabIndex={-1}
                        onClick={() => toggleExpand(row)}
                      >
                        <span aria-hidden="true">{row.expanded ? "▾" : "▸"}</span>
                      </button>
                    ) : (
                      <span className={styles.twisty} />
                    )}
                    <span
                      className={cx(
                        styles.treeName,
                        row.kind === "phase" && styles.treeNamePhase
                      )}
                      title={row.name}
                    >
                      {row.name}
                    </span>
                    {details && (
                      <span className={styles.treeDates}>{details[row.id]?.dates}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.timelinePane}>
          <div
            className={styles.timelineBody}
            ref={bodyRef}
            style={{ height }}
            tabIndex={0}
            role="treegrid"
            aria-label="Project timeline"
            aria-multiselectable="true"
            // The FULL count, not the mounted slice.
            aria-rowcount={rows.length}
            onKeyDown={handleKeyDown}
            onScroll={(event) => {
              const top = event.currentTarget.scrollTop;
              setScrollTop(top);
              // The timeline drives the tree, so the panes cannot drift.
              const tree = event.currentTarget
                .closest(`.${styles.canvas}`)
                ?.querySelector(`.${styles.treeBody}`);
              if (tree) (tree as HTMLElement).scrollTop = top;
            }}
          >
            <TimelineAxis
              grain={grain}
              totalDays={totalDays}
              majorTicks={majorTicks}
              minorTicks={minorTicks}
              nonWorkingDays={nonWorkingDays}
              todayDay={todayDay}
              pxPerDay={px}
            />

            <div style={{ height: window_.totalHeight, position: "relative", width: totalDays * px }}>
              {/* Non-working shading spans the full canvas height, not just
                * the axis strip — a weekend is non-working for every row. Same
                * grain gate as the axis: at Month a day is 2.9px and shading
                * becomes texture. Decorative here: the working-day count
                * reaches assistive technology through each bar's description. */}
              <div aria-hidden="true">
                {showsDayShading(grain) &&
                  nonWorkingDays.map((d) => (
                    <span
                      key={`${d.day}-${d.name ?? "weekend"}`}
                      className={cx(
                        styles.shadeBand,
                        d.name ? styles.shadeHoliday : styles.shadeWeekend
                      )}
                      style={{ left: d.day * px, width: px }}
                      title={d.name}
                    />
                  ))}
                {todayDay != null && todayDay >= 0 && todayDay <= totalDays && (
                  <span className={styles.todayRule} style={{ left: todayDay * px }} />
                )}
              </div>
              {/* Milestone rules and markers span the full canvas height, so
                * they sit on the unwindowed container rather than the
                * translated slice below.
                *
                * Known ARIA-structure trade, made on purpose: this container
                * is inside the treegrid, and a strict grid wants only rows as
                * children. The alternative — an overlay outside the treegrid
                * kept in sync with two scroll axes — reintroduces exactly the
                * sync machinery whose drift this canvas was built to avoid.
                * The markers are real named buttons either way; what is
                * compromised is validator purity, not reachability. */}
              <GanttMilestones
                milestones={milestones}
                grain={grain}
                totalDays={totalDays}
                onActivate={onMilestoneActivate}
                pxPerDay={px}
              />
              <div style={{ transform: `translateY(${window_.offsetTop}px)` }}>
                {visible.map((row) => {
                  const placement = placements[row.id];
                  const isMoving = moving?.id === row.id;
                  const startDay = isMoving ? moving.startDay : (placement?.startDay ?? 0);
                  const facts = factsFor(row);

                  return (
                    <div
                      key={row.id}
                      role="row"
                      aria-level={row.level}
                      aria-rowindex={row.rowIndex}
                      aria-posinset={row.posInSet}
                      aria-setsize={row.setSize}
                      aria-selected={selected.has(row.id)}
                      aria-expanded={row.kind === "phase" ? row.expanded : undefined}
                      className={cx(
                        styles.timelineRow,
                        row.kind === "phase" && styles.timelineRowPhase,
                        selected.has(row.id) && styles.timelineRowSelected
                      )}
                      style={{ height: rowHeight }}
                    >
                      <span role="gridcell" className={styles.srOnly}>
                        {row.name}
                      </span>
                      {placement && placement.ams && (
                        <GanttAmsChevron
                          left={startDay * px}
                          description={`${facts.name}, ongoing support contract, starts ${facts.startLabel}`}
                          selected={selected.has(row.id)}
                          onSelect={() => moveCursorTo(row.rowIndex - 1)}
                        />
                      )}
                      {placement && !placement.ams && (
                        <GanttBar
                          kind={row.kind}
                          label={row.name}
                          left={startDay * px}
                          width={placement.durationDays * px}
                          progress={placement.progress}
                          critical={placement.critical}
                          baseline={
                            placement.baselineStartDay != null
                              ? {
                                  left: placement.baselineStartDay * px,
                                  width: (placement.baselineDurationDays ?? 0) * px,
                                }
                              : undefined
                          }
                          canvasRemainingPx={
                            (totalDays - startDay - placement.durationDays) * px
                          }
                          description={
                            // Working days join the accessible name because
                            // the shading that conveys them visually is
                            // aria-hidden — this is where that information
                            // reaches assistive technology (see TimelineAxis).
                            details?.[row.id]
                              ? `${facts.name}, ${facts.kind}, ${facts.startLabel} to ${facts.finishLabel}, ${details[row.id].workingDays} working days`
                              : `${facts.name}, ${facts.kind}, ${facts.startLabel} to ${facts.finishLabel}`
                          }
                          selected={selected.has(row.id)}
                          onSelect={() => moveCursorTo(row.rowIndex - 1)}
                          onActivate={
                            onRowActivate ? () => onRowActivate(row.id) : undefined
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The legend earns its row by listing only what this plan draws — a
        * legend explaining marks that are not on screen is noise. */}
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.legendItem}>
          <span className={cx(styles.legendSwatch, styles.legendPhase)} />
          Phase
        </span>
        <span className={styles.legendItem}>
          <span className={cx(styles.legendSwatch, styles.legendTask)} />
          Task
        </span>
        {hasMilestones && (
          <span className={styles.legendItem}>
            <span className={styles.legendMilestone} />
            Milestone
          </span>
        )}
        {hasAms && (
          <span className={styles.legendItem}>
            <span className={styles.legendAms} />
            Ongoing (AMS)
          </span>
        )}
        {hasHolidays && (
          <span className={styles.legendItem}>
            <span className={cx(styles.legendSwatch, styles.legendHoliday)} />
            Public holiday
          </span>
        )}
        {todayDay != null && (
          <span className={styles.legendItem}>
            <span className={styles.legendToday} />
            Today
          </span>
        )}
      </div>

      <GanttStatus message={message} visible={debugAnnouncements} />
    </div>
  );
}
