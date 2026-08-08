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
 * ## What it does not cover yet
 *
 * The resource capacity panel, resource drag-assignment, search
 * and column configuration, AMS chevrons, and the WBS third level. Each is a
 * later slice. Until they land, `?canvas=next` is for comparison, not for use.
 */

import React, { useCallback, useMemo, useState } from "react";
import { addDays, differenceInDays, format } from "date-fns";
import { GanttCanvas } from "@/components/ds/gantt/GanttCanvas";
import { MilestoneModal } from "@/components/gantt-tool/MilestoneModal";
import type { MilestoneFormData } from "@/types/gantt-tool";
import { logger } from "@/lib/logger";
import type { ZoomGrain } from "@/components/ds/gantt/scale";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import type { ZoomMode } from "@/components/gantt-tool/ViewModeSelector";
import { toCanvasMilestones, toCanvasModel } from "./adapter";
import { buildAxisTicks, buildNonWorkingDays } from "./axis";
import { buildRowDetails } from "./details";
import { toCapacityMatrix } from "./capacity";
import { GanttCapacityPanel } from "@/components/ds/gantt/GanttCapacityPanel";
import { calculateResourceCapacity } from "@/lib/gantt-tool/resource-capacity-calculator";

/**
 * The legacy zoom vocabulary has an "auto" and a "year"; the canvas grain has a
 * "Day" and no "year". Mapping rather than widening the canvas keeps the two
 * vocabularies from leaking into each other while both exist.
 *
 * "auto" resolves to Week because that is what the legacy canvas picks for the
 * great majority of plans, and a comparison view that silently chose a
 * different zoom would make every bar look wrong.
 */
const GRAIN_BY_ZOOM: Record<ZoomMode, ZoomGrain> = {
  auto: "Week",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Quarter",
};

export interface GanttCanvasNextProps {
  zoomMode: ZoomMode;
  height?: number;
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
  zoomMode,
  height,
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

  // Controlled by the page when it passes the pair, local otherwise — the
  // same arrangement GanttCanvasV3 uses for the same prop.
  const [milestoneModalLocal, setMilestoneModalLocal] = useState(false);
  const milestoneModalOpen = showMilestoneModal ?? milestoneModalLocal;
  const setMilestoneModalOpen = onShowMilestoneModalChange ?? setMilestoneModalLocal;

  const bounds = getProjectDuration();
  const phases = currentProject?.phases;
  const grain = grainOverride ?? GRAIN_BY_ZOOM[zoomMode];

  const model = useMemo(
    () => (bounds && phases ? toCanvasModel(phases, bounds) : null),
    [phases, bounds]
  );

  const origin = bounds?.startDate;

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
    if (!bounds) return undefined;
    const day = differenceInDays(new Date(), bounds.startDate);
    return day >= 0 && day < bounds.durationDays ? day : undefined;
  }, [bounds]);

  const milestones = useMemo(
    () =>
      bounds && currentProject?.milestones
        ? toCanvasMilestones(currentProject.milestones, bounds, formatDay)
        : [],
    [currentProject?.milestones, bounds, formatDay]
  );

  const axis = useMemo(
    () => (bounds ? buildAxisTicks(bounds, grain) : { majorTicks: [], minorTicks: [] }),
    [bounds, grain]
  );

  // Same holiday source, same "ABMY" region default, as the legacy canvas —
  // so both canvases shade identical days on the same plan.
  const nonWorkingDays = useMemo(
    () => (bounds ? buildNonWorkingDays(bounds, currentProject?.holidays ?? []) : []),
    [bounds, currentProject?.holidays]
  );

  // Same holiday list as the shading, so the "working days" a row reports and
  // the days the axis shades can never disagree.
  const details = useMemo(
    () => (phases ? buildRowDetails(phases, currentProject?.holidays ?? []) : {}),
    [phases, currentProject?.holidays]
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

  if (!model || !bounds) {
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
        totalDays={model.totalDays}
        formatDay={formatDay}
        grain={grain}
        onGrainChange={setGrainOverride}
        majorTicks={axis.majorTicks}
        minorTicks={axis.minorTicks}
        nonWorkingDays={nonWorkingDays}
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
        height={height}
      />

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
