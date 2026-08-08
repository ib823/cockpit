/**
 * Strangler seam — per-row detail columns.
 *
 * The legacy tree pane is a data grid: name, calendar duration, working days,
 * start–end dates. This computes those three cells per row, with the same
 * three functions the legacy canvas calls and the same formats it renders —
 * "3.2 m", "42 d", "05-Jan-26 (Mon) - 30-Jan-26 (Fri)" — so the two canvases
 * show identical numbers for the same plan.
 *
 * Working days are holiday-aware, which is why this takes the project's
 * holidays: a two-week task over Chinese New Year has fewer working days than
 * the same two weeks in March, and a column that ignored that would disagree
 * with every cost calculation in the app.
 *
 * AMS rows get the same treatment as everything else. Their end dates are
 * contract ends the *timeline* deliberately excludes, but the legacy grid
 * computes their durations uniformly — the cell describes the contract, the
 * canvas describes the plan, and those are allowed to differ.
 */

import { format } from "date-fns";
import type { GanttHoliday, GanttPhase } from "@/types/gantt-tool";
import {
  calculateCalendarDaysInclusive,
  calculateWorkingDaysInclusive,
  formatCalendarDaysAsMonths,
} from "@/lib/gantt-tool/working-days";
import type { RowDetails } from "@/components/ds/gantt/GanttCanvas";

function detailsFor(
  startDate: string,
  endDate: string,
  holidays: GanttHoliday[]
): RowDetails {
  const workingDays = calculateWorkingDaysInclusive(startDate, endDate, holidays);
  const dateLabel = (iso: string) => format(new Date(iso), "dd-MMM-yy (EEE)");

  return {
    calendar: formatCalendarDaysAsMonths(
      calculateCalendarDaysInclusive(startDate, endDate)
    ),
    working: `${workingDays} d`,
    dates: `${dateLabel(startDate)} - ${dateLabel(endDate)}`,
    workingDays,
  };
}

export function buildRowDetails(
  phases: GanttPhase[],
  holidays: GanttHoliday[]
): Record<string, RowDetails> {
  const details: Record<string, RowDetails> = {};

  for (const phase of phases) {
    details[phase.id] = detailsFor(phase.startDate, phase.endDate, holidays);
    for (const task of phase.tasks ?? []) {
      details[task.id] = detailsFor(task.startDate, task.endDate, holidays);
    }
  }

  return details;
}
