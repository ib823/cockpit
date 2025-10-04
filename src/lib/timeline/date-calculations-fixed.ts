// src/lib/timeline/date-calculations-fixed.ts
import { addDays, isWeekend, format, parseISO } from "date-fns";

export interface Holiday {
  date: string; // ISO format: "2024-12-25"
  name: string;
  country?: string;
}

export const DEFAULT_PROJECT_START_DATE = new Date("2024-01-01");

/**
 * Convert business day number to actual calendar date
 * @param businessDay - Number of business days from project start (0-indexed)
 * @param holidays - Array of holiday dates to skip
 * @param projectStartDate - Base date for calculations (default: 2024-01-01)
 * @returns Actual calendar date
 */
export function businessDayToDate(
  businessDay: number,
  holidays: Holiday[] = [],
  projectStartDate: Date = DEFAULT_PROJECT_START_DATE
): Date {
  // Validation
  if (businessDay < 0) {
    console.error("businessDay cannot be negative:", businessDay);
    return projectStartDate;
  }

  if (businessDay === 0) {
    return new Date(projectStartDate);
  }

  const MAX_ITERATIONS = 5000; // Safety limit (~10 years)
  let currentDate = new Date(projectStartDate);
  let businessDaysRemaining = businessDay;
  let iterations = 0;

  // Convert holidays to Set for O(1) lookup
  const holidaySet = new Set(
    holidays.map((h) => {
      try {
        return format(parseISO(h.date), "yyyy-MM-dd");
      } catch {
        return h.date; // If already formatted
      }
    })
  );

  // Move forward day by day until we've counted enough business days
  while (businessDaysRemaining > 0) {
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      console.error("businessDayToDate exceeded max iterations", {
        businessDay,
        iterations,
        holidayCount: holidays.length,
      });
      break;
    }

    currentDate = addDays(currentDate, 1);

    // Skip weekends
    if (isWeekend(currentDate)) {
      continue;
    }

    // Skip holidays
    const dateStr = format(currentDate, "yyyy-MM-dd");
    if (holidaySet.has(dateStr)) {
      continue;
    }

    // This is a valid business day
    businessDaysRemaining--;
  }

  return currentDate;
}

/**
 * Calculate project start date from phases
 */
export function getProjectStartDate(phases: any[], holidays: Holiday[] = []): Date {
  if (!phases || phases.length === 0) {
    return DEFAULT_PROJECT_START_DATE;
  }

  // Find earliest phase
  const earliestPhase = phases.reduce(
    (min, phase) => (phase.startBusinessDay < min.startBusinessDay ? phase : min),
    phases[0]
  );

  return businessDayToDate(earliestPhase.startBusinessDay, holidays);
}

/**
 * Calculate project end date from phases
 */
export function getProjectEndDate(phases: any[], holidays: Holiday[] = []): Date {
  if (!phases || phases.length === 0) {
    return DEFAULT_PROJECT_START_DATE;
  }

  // Find latest phase end
  const latestEnd = phases.reduce((max, phase) => {
    const phaseEnd = phase.startBusinessDay + phase.workingDays;
    return phaseEnd > max ? phaseEnd : max;
  }, 0);

  return businessDayToDate(latestEnd, holidays);
}

/**
 * Format date elegantly for display
 */
export function formatDateElegant(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) {
    return "TBD";
  }

  try {
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });

    return `${day} ${month} ${year} (${weekday})`;
  } catch (error) {
    console.error("formatDateElegant error:", error);
    return "TBD";
  }
}

/**
 * Calculate business days between two dates
 */
export function businessDaysBetween(
  startDate: Date,
  endDate: Date,
  holidays: Holiday[] = []
): number {
  let count = 0;
  let currentDate = new Date(startDate);
  const holidaySet = new Set(
    holidays.map((h) => {
      try {
        return format(parseISO(h.date), "yyyy-MM-dd");
      } catch {
        return h.date;
      }
    })
  );

  while (currentDate <= endDate) {
    if (!isWeekend(currentDate)) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      if (!holidaySet.has(dateStr)) {
        count++;
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
}

/**
 * Calculate project duration in days
 */
export function calculateProjectDuration(
  startDate: Date | null,
  endDate: Date | null
): { days: number; formatted: string } {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { days: 0, formatted: "TBD" };
  }

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 7) {
    return { days, formatted: `${days} days` };
  } else if (days < 30) {
    const weeks = Math.ceil(days / 7);
    return { days, formatted: `${weeks} weeks` };
  } else if (days < 365) {
    const months = Math.ceil(days / 30);
    return { days, formatted: `${months} months` };
  } else {
    const years = Math.floor(days / 365);
    const months = Math.ceil((days % 365) / 30);
    return { days, formatted: `${years}y ${months}m` };
  }
}
