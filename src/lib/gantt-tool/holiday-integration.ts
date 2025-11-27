/**
 * Holiday Integration - Unified Holiday Management
 *
 * CRITICAL FIX: Unify holiday data source
 *
 * Problem: Timeline markers used hardcoded data, working days used project.holidays (empty)
 * Solution: Single source of truth that merges both
 *
 * Design: Apple's "Single Source of Truth" principle
 */

import type { GanttHoliday } from "@/types/gantt-tool";
import { getHolidaysInRange as getHardcodedHolidays } from "@/data/holidays";

/**
 * Get unified holiday list for a project
 *
 * Merges:
 * 1. Project-specific custom holidays (from database)
 * 2. Regional public holidays (hardcoded)
 *
 * Jobs: "One source of truth, always consistent"
 */
export function getUnifiedHolidays(
  startDate: Date,
  endDate: Date,
  projectHolidays: GanttHoliday[] = [],
  region: "ABMY" | "ABSG" | "ABVN" = "ABMY"
): GanttHoliday[] {
  // Get regional public holidays
  const publicHolidays = getHardcodedHolidays(startDate, endDate, region);

  // Convert to GanttHoliday format
  const publicHolidaysFormatted: GanttHoliday[] = publicHolidays.map(h => ({
    id: `public-${h.date}`,
    name: h.name,
    date: h.date,
    region: region,
    type: "public" as const,
  }));

  // Merge with project-specific holidays
  // Remove duplicates (project-specific overrides public if same date)
  const holidayMap = new Map<string, GanttHoliday>();

  // Add public holidays first
  publicHolidaysFormatted.forEach(h => {
    holidayMap.set(h.date, h);
  });

  // Add/override with project-specific holidays
  projectHolidays.forEach(h => {
    holidayMap.set(h.date, h);
  });

  // Return sorted by date
  return Array.from(holidayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Get holidays for display on timeline
 * Includes position calculation for rendering
 */
export function getHolidaysForTimeline(
  startDate: Date,
  endDate: Date,
  durationDays: number,
  projectHolidays: GanttHoliday[] = [],
  region: "ABMY" | "ABSG" | "ABVN" = "ABMY"
): Array<{
  date: Date;
  name: string;
  position: number;
  isWeekend: boolean;
  type: "public" | "company" | "custom";
}> {
  const holidays = getUnifiedHolidays(startDate, endDate, projectHolidays, region);

  return holidays.map(holiday => {
    const holidayDate = new Date(holiday.date);
    const dayOfWeek = holidayDate.getDay();
    const offset = Math.floor((holidayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const position = (offset / durationDays) * 100;

    return {
      date: holidayDate,
      name: holiday.name,
      position,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      type: holiday.type,
    };
  });
}

/**
 * Initialize default holidays for a new project
 * Adds regional public holidays for the next 5 years
 *
 * Ive: "Sensible defaults that just work"
 */
export function getDefaultHolidaysForProject(
  projectStartDate: Date,
  region: "ABMY" | "ABSG" | "ABVN" = "ABMY"
): GanttHoliday[] {
  // Get holidays for 5 years from project start
  const startDate = projectStartDate;
  const endDate = new Date(projectStartDate);
  endDate.setFullYear(endDate.getFullYear() + 5);

  const publicHolidays = getHardcodedHolidays(startDate, endDate, region);

  return publicHolidays.map(h => ({
    id: `public-${h.date}-${region}`,
    name: h.name,
    date: h.date,
    region: region,
    type: "public" as const,
  }));
}
