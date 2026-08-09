"use client";

/**
 * The new Gantt canvas, wired to the live store.
 *
 * This is the strangler's replacement half. It renders behind `?canvas=next`
 * only — see `canvas-flag.ts` for why it can never become the default by
 * accident — and it reads and writes the same store as `GanttCanvasV3`, so the
 * two are alternative views of one plan rather than two plans.
 *
 * ## What this slice covers
 *
 * Rows, windowing, the timeline axis, the treegrid keyboard contract, and
 * committing a Move.
 *
 * Move is worth naming as the first slice because of what it is NOT: it does
 * not replace anything. The legacy canvas has no way to change a date from the
 * canvas at all — no drag, no resize, no keyboard nudge; dates are edited by
 * double-clicking through to a modal. So this slice can only add, and the
 * regression risk on the legacy path is nil.
 *
 * Milestones (slice 2) reuse the legacy MilestoneModal verbatim rather than
 * rebuilding it: the modal is the editing surface both canvases share, and
 * porting it belongs to a later slice, if at all. Activating any marker opens
 * it, exactly as the legacy diamond does.
 *
 * ## Parity status
 *
 * Ported: Move, milestones, axis + shading, AMS chevrons, tree detail
 * columns, and the resource capacity panel. Established as never having
 * existed in the legacy canvas, so nothing to port (see
 * docs/REMEDIATION.md 3.1): bar drag/resize, dependency editing, resource
 * drag-assignment, and WBS third-level rendering — the store carries
 * `parentTaskId` but no UI writes it, neither canvas nests it, and the API
 * does not persist it. Deliberately not ported: column resizing, manual
 * capacity overrides. The gate before flipping the default is visual
 * comparison on real plans, not another slice.
 */

import React, { useCallback, useMemo, useState, type ReactNode } from "react";
import { addDays, differenceInDays, format } from "date-fns";
import { GanttCanvas } from "@/components/ds/gantt/GanttCanvas";
import { MilestoneModal } from "@/components/gantt-tool/MilestoneModal";
import { EditPhaseModal } from "@/components/gantt-tool/EditPhaseModal";
import { EditTaskModal } from "@/components/gantt-tool/EditTaskModal";
import type { MilestoneFormData } from "@/types/gantt-tool";
import { logger } from "@/lib/logger";
import type { ZoomGrain } from "@/components/ds/gantt/scale";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { toCanvasMilestones, toCanvasModel } from "./adapter";
import { computeTimelineWindow } from "@/components/ds/gantt/timeline-window";
import { buildWorkingCalendar } from "@/lib/gantt-tool/working-calendar";
import { buildRowDetails } from "./details";
import { toCapacityMatrix } from "./capacity";
import { GanttCapacityPanel } from "@/components/ds/gantt/GanttCapacityPanel";
import { calculateResourceCapacity } from "@/lib/gantt-tool/resource-capacity-calculator";

/**
 * The grain the canvas OPENS at, chosen from the plan's span — a two-month
 * plan at Quarter opens nearly empty, a three-year programme at Day opens in
 * an endless corridor. It decides the first frame only: from then on the
 * grain is the user's, and the horizon each one shows is a planning window
 * that extends well past the plan (see `timeline-window.ts`).
 */
function openingGrain(durationDays: number): ZoomGrain {
  if (durationDays <= 180) return "Week";
  if (durationDays <= 730) return "Month";
  return "Quarter";
}

export interface GanttCanvasNextProps {
  height?: number;
  /** Page actions for the canvas toolbar, after the zoom control. */
  toolbar?: ReactNode;
  /**
   * The page owns "open the milestone modal" (its toolbar button sets it), so
   * the next canvas honours the same pair of props the legacy one takes —
   * otherwise that button silently stops working behind `?canvas=next`.
   */
  showMilestoneModal?: boolean;
  onShowMilestoneModalChange?: (open: boolean) => void;
  /**
   * Shows the resource capacity matrix under the canvas — the same page
   * toggle the legacy canvas takes. Manual per-week overrides (a legacy
   * feature held in that component's local state) are not ported yet; the
   * matrix shows calculated allocations only.
   */
  showResourceCapacity?: boolean;
}

export function GanttCanvasNext({
  height,
  toolbar,
  showMilestoneModal,
  onShowMilestoneModalChange,
  showResourceCapacity = false,
}: GanttCanvasNextProps) {
  const currentProject = useGanttToolStore((s) => s.currentProject);
  const getProjectDuration = useGanttToolStore((s) => s.getProjectDuration);
  const updateTask = useGanttToolStore((s) => s.updateTask);
  const updatePhase = useGanttToolStore((s) => s.updatePhase);
  const addMilestone = useGanttToolStore((s) => s.addMilestone);
  const updateMilestone = useGanttToolStore((s) => s.updateMilestone);
  const deleteMilestone = useGanttToolStore((s) => s.deleteMilestone);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [grainOverride, setGrainOverride] = useState<ZoomGrain | null>(null);

  // Row activation (Enter, double-click) opens the row's editor — rename,
  // dates, delete. The editors are store-wired, so nothing threads back up.
  const [editing, setEditing] = useState<
    | { kind: "phase"; phaseId: string }
    | { kind: "task"; phaseId: string; taskId: string }
    | null
  >(null);

  // Controlled by the page when it passes the pair, local otherwise.
  const [milestoneModalLocal, setMilestoneModalLocal] = useState(false);
  const milestoneModalOpen = showMilestoneModal ?? milestoneModalLocal;
  const setMilestoneModalOpen = onShowMilestoneModalChange ?? setMilestoneModalLocal;

  const bounds = getProjectDuration();
  const phases = currentProject?.phases;
  const grain = grainOverride ?? openingGrain(bounds?.durationDays ?? 0);

  /**
   * The canvas measures its own scrolling pane and reports it here, so the
   * horizon can be extended past a wide monitor. Without it a 4K screen would
   * run out of calendar before it ran out of pane.
   */
  const [viewportPx, setViewportPx] = useState(0);
  const handleViewportWidth = useCallback((px: number) => setViewportPx(px), []);

  /**
   * The window is the calendar the canvas draws — a planning horizon per
   * grain, anchored just before the plan, NOT the plan's own span. Every
   * offset below is measured from its origin: bars, milestones, today, the
   * header bands and the shading, so none of them can disagree.
   */
  const timelineWindow = useMemo(
    () =>
      computeTimelineWindow({
        grain,
        projectStart: bounds?.startDate,
        projectEnd: bounds?.endDate,
        viewportPx,
      }),
    [grain, bounds?.startDate, bounds?.endDate, viewportPx]
  );

  /** The window in the shape the placement adapter takes. */
  const windowBounds = useMemo(
    () => ({
      startDate: timelineWindow.origin,
      endDate: addDays(timelineWindow.origin, Math.max(0, timelineWindow.totalDays - 1)),
      durationDays: timelineWindow.totalDays,
    }),
    [timelineWindow]
  );

  const model = useMemo(
    () => (phases ? toCanvasModel(phases, windowBounds) : null),
    [phases, windowBounds]
  );

  const origin = timelineWindow.origin;

  const formatDay = useCallback(
    (day: number) => (origin ? format(addDays(origin, day), "d MMM yy") : ""),
    [origin]
  );

  /**
   * Today's marker, in the same day-offset space as the bars.
   *
   * Undefined when today falls outside the plan, rather than clamped to an
   * edge: a "today" line pinned to the start of a plan that finished last year
   * is a lie that reads as a bug in the data.
   */
  const todayDay = useMemo(() => {
    const day = differenceInDays(new Date(), timelineWindow.origin);
    return day >= 0 && day < timelineWindow.totalDays ? day : undefined;
  }, [timelineWindow]);

  const milestones = useMemo(
    () =>
      currentProject?.milestones
        ? toCanvasMilestones(currentProject.milestones, windowBounds, formatDay)
        : [],
    [currentProject?.milestones, windowBounds, formatDay]
  );

  /**
   * The one working-calendar read. Everything non-working on screen comes from
   * here — and so does the holiday list the duration columns are computed
   * with, which is the point: before this, the axis shaded the region's public
   * holidays while the working-day counts had only ever seen the project's
   * own, so a bar over Hari Raya was shaded and counted as a working day.
   */
  const calendar = useMemo(
    () =>
      buildWorkingCalendar(
        timelineWindow.origin,
        timelineWindow.totalDays,
        currentProject?.holidays ?? []
      ),
    [timelineWindow, currentProject?.holidays]
  );

  const details = useMemo(
    () => (phases ? buildRowDetails(phases, calendar.holidayList) : {}),
    [phases, calendar.holidayList]
  );

  /** The plan's own span — used by "Fit project" and nothing else. */
  const fitDates = useMemo(
    () => (bounds ? { start: bounds.startDate, end: bounds.endDate } : undefined),
    [bounds]
  );

  const resources = currentProject?.resources;

  // The same calculator with the same inputs as the legacy panel, so the two
  // can never show different allocations for one plan. Guarded on the toggle:
  // for a large plan this walks every task × week, and computing it while the
  // panel is closed is pure waste.
  const capacity = useMemo(() => {
    if (!showResourceCapacity || !bounds || !phases || !resources?.length) {
      return { columns: [], rows: [] };
    }
    return toCapacityMatrix(
      calculateResourceCapacity({
        phases,
        resources,
        projectStartDate: bounds.startDate,
        projectEndDate: bounds.endDate,
      }),
      resources
    );
  }, [showResourceCapacity, phases, resources, bounds]);

  /**
   * Commits a Move to the store.
   *
   * The canvas reports `(id, startDay, deltaDays)` — where the bar started and
   * how far it moved — and this shifts BOTH ends by the delta, so a move
   * changes when work happens without changing how long it takes. Resizing is
   * a separate gesture and a separate slice.
   *
   * Dates are written back as `yyyy-MM-dd`, matching what the edit modals
   * write. Writing a full ISO timestamp instead would work until something
   * compared two dates as strings.
   */
  const handleMove = useCallback(
    (id: string, _startDay: number, deltaDays: number) => {
      if (!currentProject || deltaDays === 0) return;

      const phase = currentProject.phases.find((p) => p.id === id);
      if (phase) {
        void updatePhase(id, {
          startDate: format(addDays(new Date(phase.startDate), deltaDays), "yyyy-MM-dd"),
          endDate: format(addDays(new Date(phase.endDate), deltaDays), "yyyy-MM-dd"),
        });
        return;
      }

      for (const candidate of currentProject.phases) {
        const task = (candidate.tasks ?? []).find((t) => t.id === id);
        if (!task) continue;

        void updateTask(id, candidate.id, {
          startDate: format(addDays(new Date(task.startDate), deltaDays), "yyyy-MM-dd"),
          endDate: format(addDays(new Date(task.endDate), deltaDays), "yyyy-MM-dd"),
        });
        return;
      }
    },
    [currentProject, updatePhase, updateTask]
  );

  if (!model) {
    return (
      <div style={{ padding: "var(--ds-space-6, 24px)" }}>
        <p>No plan loaded.</p>
      </div>
    );
  }

  return (
    <>
      <GanttCanvas
        phases={model.phases}
        placements={model.placements}
        originDate={timelineWindow.origin}
        totalDays={model.totalDays}
        formatDay={formatDay}
        grain={grain}
        onGrainChange={setGrainOverride}
        weekendDays={calendar.weekendDays}
        holidays={calendar.holidays}
        fitDates={fitDates}
        onViewportWidthChange={handleViewportWidth}
        details={details}
        expandedIds={expandedIds}
        onExpandedChange={setExpandedIds}
        onMove={handleMove}
        todayDay={todayDay}
        milestones={milestones}
        // Legacy behaviour exactly: any marker opens the milestone modal,
        // which lists and edits all of them. A per-milestone editor would be
        // an improvement, but parity first — improvements after the flip.
        onMilestoneActivate={() => setMilestoneModalOpen(true)}
        onRowActivate={(id) => {
          if (!currentProject) return;
          const phase = currentProject.phases.find((p) => p.id === id);
          if (phase) {
            setEditing({ kind: "phase", phaseId: id });
            return;
          }
          for (const candidate of currentProject.phases) {
            if ((candidate.tasks ?? []).some((t) => t.id === id)) {
              setEditing({ kind: "task", phaseId: candidate.id, taskId: id });
              return;
            }
          }
        }}
        toolbar={toolbar}
        height={height}
      />

      {editing?.kind === "phase" &&
        (() => {
          const phase = currentProject?.phases.find((p) => p.id === editing.phaseId);
          return phase ? (
            <EditPhaseModal
              isOpen
              onClose={() => setEditing(null)}
              phase={phase}
              phaseId={editing.phaseId}
            />
          ) : null;
        })()}
      {editing?.kind === "task" &&
        (() => {
          const phase = currentProject?.phases.find((p) => p.id === editing.phaseId);
          const task = (phase?.tasks ?? []).find((t) => t.id === editing.taskId);
          return task ? (
            <EditTaskModal
              isOpen
              onClose={() => setEditing(null)}
              task={task}
              taskId={editing.taskId}
              phaseId={editing.phaseId}
            />
          ) : null;
        })()}

      {showResourceCapacity && (
        <GanttCapacityPanel columns={capacity.columns} rows={capacity.rows} />
      )}

      {/* The same modal, the same store wiring, as GanttCanvasV3 — including
        * the alert() on failure, which is not this slice's to redesign. */}
      <MilestoneModal
        open={milestoneModalOpen}
        onOpenChange={setMilestoneModalOpen}
        onSave={async (data) => {
          try {
            if (data.id) {
              await updateMilestone(data.id, data);
            } else {
              await addMilestone(data as MilestoneFormData);
            }
          } catch (error) {
            logger.error("Error saving milestone:", { error });
            alert("Failed to save milestone. Please try again.");
          }
        }}
        onDelete={async (id) => {
          try {
            await deleteMilestone(id);
          } catch (error) {
            logger.error("Error deleting milestone:", { error });
            alert("Failed to delete milestone. Please try again.");
          }
        }}
        milestones={currentProject?.milestones || []}
      />
    </>
  );
}
