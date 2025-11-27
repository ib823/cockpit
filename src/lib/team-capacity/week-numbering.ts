/**
 * Week Numbering System Utilities
 *
 * Supports user-selectable week numbering:
 * - PROJECT_RELATIVE: Week 1, 2, 3... from project start
 * - ISO_WEEK: ISO 8601 week numbering (W01-W53)
 * - CALENDAR_WEEK: Sequential weeks from January 1
 */

import { WeekNumberingType } from "@prisma/client";
import type { WeekIdentifier, WeekNumberingPreference } from "./types";

/**
 * Calculate week number based on user-selected numbering type
 */
export function calculateWeekNumber(
  date: Date,
  type: WeekNumberingType,
  projectStartDate?: Date
): number {
  switch (type) {
    case "PROJECT_RELATIVE":
      if (!projectStartDate) {
        throw new Error("Project start date required for PROJECT_RELATIVE week numbering");
      }
      return calculateProjectRelativeWeek(date, projectStartDate);

    case "ISO_WEEK":
      return getISOWeekNumber(date);

    case "CALENDAR_WEEK":
      return getCalendarWeekNumber(date);

    default:
      throw new Error(`Unknown week numbering type: ${type}`);
  }
}

/**
 * Project-relative week (Week 1 = first week of project)
 */
function calculateProjectRelativeWeek(date: Date, projectStartDate: Date): number {
  const diffTime = date.getTime() - projectStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1; // Week 1, 2, 3...
}

/**
 * ISO 8601 week numbering (W01-W53)
 * Week 1 is the first week with at least 4 days in the new year
 */
function getISOWeekNumber(date: Date): number {
  const target = new Date(date);
  // Set to Thursday of the current week (ISO week definition)
  target.setDate(target.getDate() + (4 - (target.getDay() || 7)));
  // Get first day of year
  const yearStart = new Date(target.getFullYear(), 0, 1);
  // Calculate week number
  const weekNumber = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNumber;
}

/**
 * Calendar week (Week 1 = first week of January)
 */
function getCalendarWeekNumber(date: Date): number {
  const janFirst = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - janFirst.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

/**
 * Get Monday (start) of the week for a given date
 */
export function getWeekStartDate(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get Sunday (end) of the week for a given date
 */
export function getWeekEndDate(date: Date): Date {
  const start = getWeekStartDate(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Generate week identifier with display label
 */
export function getWeekIdentifier(
  weekNumber: number,
  type: WeekNumberingType,
  projectStartDate?: Date
): WeekIdentifier {
  const weekStartDate = getWeekStartDateFromNumber(
    weekNumber,
    type,
    projectStartDate
  );
  const weekEndDate = getWeekEndDate(weekStartDate);

  return {
    weekNumber,
    weekStartDate,
    weekEndDate,
    displayLabel: formatWeekLabel(weekNumber, type),
    type,
  };
}

/**
 * Calculate week start date from week number
 */
function getWeekStartDateFromNumber(
  weekNumber: number,
  type: WeekNumberingType,
  projectStartDate?: Date
): Date {
  switch (type) {
    case "PROJECT_RELATIVE":
      if (!projectStartDate) {
        throw new Error("Project start date required for PROJECT_RELATIVE week numbering");
      }
      const projectStart = getWeekStartDate(projectStartDate);
      const result = new Date(projectStart);
      result.setDate(projectStart.getDate() + (weekNumber - 1) * 7);
      return result;

    case "ISO_WEEK": {
      // Complex ISO week calculation (simplified - use library in production)
      const year = new Date().getFullYear();
      return getISOWeekStartDate(year, weekNumber);
    }

    case "CALENDAR_WEEK": {
      const year = new Date().getFullYear();
      const janFirst = new Date(year, 0, 1);
      const firstMonday = getWeekStartDate(janFirst);
      const result = new Date(firstMonday);
      result.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
      return result;
    }

    default:
      throw new Error(`Unknown week numbering type: ${type}`);
  }
}

/**
 * Get Monday of ISO week number for a given year
 */
function getISOWeekStartDate(year: number, weekNumber: number): Date {
  // Jan 4 is always in week 1 (ISO 8601 definition)
  const jan4 = new Date(year, 0, 4);
  const week1Start = getWeekStartDate(jan4);
  const result = new Date(week1Start);
  result.setDate(week1Start.getDate() + (weekNumber - 1) * 7);
  return result;
}

/**
 * Format week label for display
 */
export function formatWeekLabel(
  weekNumber: number,
  type: WeekNumberingType
): string {
  switch (type) {
    case "PROJECT_RELATIVE":
      return `Week ${weekNumber}`;

    case "ISO_WEEK":
      return `W${weekNumber.toString().padStart(2, "0")}`;

    case "CALENDAR_WEEK":
      return `Week ${weekNumber} of ${new Date().getFullYear()}`;

    default:
      return `Week ${weekNumber}`;
  }
}

/**
 * Generate ISO 8601 week identifier (e.g., "2025-W43")
 */
export function generateISOWeekIdentifier(date: Date): string {
  const year = date.getFullYear();
  const weekNumber = getISOWeekNumber(date);
  return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}

/**
 * Convert week numbering between types
 */
export function convertWeekNumbering(
  weekNumber: number,
  fromType: WeekNumberingType,
  toType: WeekNumberingType,
  projectStartDate?: Date
): number {
  // Get the actual date from the source week number
  const weekStartDate = getWeekStartDateFromNumber(
    weekNumber,
    fromType,
    projectStartDate
  );

  // Calculate week number in target type
  return calculateWeekNumber(weekStartDate, toType, projectStartDate);
}

/**
 * Get all weeks in a date range
 */
export function getWeeksInRange(
  startDate: Date,
  endDate: Date,
  type: WeekNumberingType,
  projectStartDate?: Date
): WeekIdentifier[] {
  const weeks: WeekIdentifier[] = [];
  const current = getWeekStartDate(startDate);
  const end = getWeekEndDate(endDate);

  while (current <= end) {
    const weekNumber = calculateWeekNumber(current, type, projectStartDate);
    weeks.push({
      weekNumber,
      weekStartDate: new Date(current),
      weekEndDate: getWeekEndDate(current),
      displayLabel: formatWeekLabel(weekNumber, type),
      type,
    });

    // Move to next week
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

/**
 * Validate week numbering type
 */
export function isValidWeekNumberingType(type: string): type is WeekNumberingType {
  return ["PROJECT_RELATIVE", "ISO_WEEK", "CALENDAR_WEEK"].includes(type);
}

/**
 * Get user preference with defaults
 */
export function getWeekNumberingPreference(
  userPreference?: WeekNumberingType,
  projectStartDate?: Date
): WeekNumberingPreference {
  return {
    type: userPreference || "PROJECT_RELATIVE",
    projectStartDate,
  };
}
