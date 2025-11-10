/**
 * Working Days Utility
 *
 * Handles working day calculations for Gantt Tool:
 * - Auto-shifts dates to next working day if they fall on weekend/holiday
 * - Calculates duration in working days only
 * - Excludes weekends (Saturday, Sunday) and holidays
 */

import { addDays, differenceInDays, format, parseISO } from "date-fns";
import type { GanttHoliday } from "@/types/gantt-tool";

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, holidays: GanttHoliday[]): boolean {
  // Guard against invalid dates
  if (!date || isNaN(date.getTime())) {
    return false;
  }
  const dateStr = format(date, "yyyy-MM-dd");
  return holidays.some((holiday) => holiday.date === dateStr);
}

/**
 * Check if a date is a working day (not weekend and not holiday)
 */
export function isWorkingDay(date: Date, holidays: GanttHoliday[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Get the next working day from a given date
 * If the date is already a working day, returns the same date
 */
export function getNextWorkingDay(date: Date, holidays: GanttHoliday[]): Date {
  let current = new Date(date);

  while (!isWorkingDay(current, holidays)) {
    current = addDays(current, 1);
  }

  return current;
}

/**
 * Get the previous working day from a given date
 * If the date is already a working day, returns the same date
 */
export function getPreviousWorkingDay(date: Date, holidays: GanttHoliday[]): Date {
  let current = new Date(date);

  while (!isWorkingDay(current, holidays)) {
    current = addDays(current, -1);
  }

  return current;
}

/**
 * Calculate working days between two dates (exclusive of end date)
 */
export function calculateWorkingDays(
  startDate: Date | string,
  endDate: Date | string,
  holidays: GanttHoliday[]
): number {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

  let workingDays = 0;
  let current = new Date(start);

  while (current < end) {
    if (isWorkingDay(current, holidays)) {
      workingDays++;
    }
    current = addDays(current, 1);
  }

  return workingDays;
}

/**
 * Calculate working days including both start and end dates
 */
export function calculateWorkingDaysInclusive(
  startDate: Date | string,
  endDate: Date | string,
  holidays: GanttHoliday[]
): number {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

  let workingDays = 0;
  let current = new Date(start);

  while (current <= end) {
    if (isWorkingDay(current, holidays)) {
      workingDays++;
    }
    current = addDays(current, 1);
  }

  return workingDays;
}

/**
 * Add working days to a date (skips weekends and holidays)
 */
export function addWorkingDays(
  startDate: Date | string,
  workingDaysToAdd: number,
  holidays: GanttHoliday[]
): Date {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;

  // Guard against invalid dates
  if (!start || isNaN(start.getTime())) {
    throw new Error("Invalid start date provided to addWorkingDays");
  }

  let current = new Date(start);
  let addedDays = 0;

  while (addedDays < workingDaysToAdd) {
    current = addDays(current, 1);
    if (isWorkingDay(current, holidays)) {
      addedDays++;
    }
  }

  return current;
}

/**
 * Adjust start and end dates to working days
 * - Start date: if not working day, shift to next working day
 * - End date: if not working day, shift to previous working day
 * This ensures that tasks/phases always start and end on working days
 */
export function adjustDatesToWorkingDays(
  startDate: string,
  endDate: string,
  holidays: GanttHoliday[]
): { startDate: string; endDate: string } {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // Guard against invalid dates
  if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
    throw new Error("Invalid date provided to adjustDatesToWorkingDays");
  }

  const adjustedStart = getNextWorkingDay(start, holidays);
  const adjustedEnd = getPreviousWorkingDay(end, holidays);

  // If adjusted end is before adjusted start, set end = start
  if (adjustedEnd < adjustedStart) {
    return {
      startDate: format(adjustedStart, "yyyy-MM-dd"),
      endDate: format(adjustedStart, "yyyy-MM-dd"),
    };
  }

  return {
    startDate: format(adjustedStart, "yyyy-MM-dd"),
    endDate: format(adjustedEnd, "yyyy-MM-dd"),
  };
}

/**
 * Format working days duration for display - Steve Jobs standard
 * Example: "5d" or "1d"
 */
export function formatWorkingDaysDuration(workingDays: number): string {
  return `${workingDays}d`;
}
