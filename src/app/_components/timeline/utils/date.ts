/**
 * Business Day Utilities
 * Robust date math to prevent NaN bugs
 * Handles weekends, holidays, edge cases
 */

/**
 * Parse ISO date string to Date object
 * @param isoString - ISO date string 'YYYY-MM-DD'
 * @returns Date object at midnight UTC
 */
export function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Format Date object to ISO string
 * @param date - Date object
 * @returns ISO date string 'YYYY-MM-DD'
 */
export function formatISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param date - Date object
 * @returns true if weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a holiday
 * @param date - Date object
 * @param holidays - Array of ISO date strings
 * @returns true if holiday
 */
export function isHoliday(date: Date, holidays: string[]): boolean {
  const isoStr = formatISODate(date);
  return holidays.includes(isoStr);
}

/**
 * Check if a date is a business day
 * @param date - Date object
 * @param holidays - Array of ISO date strings
 * @returns true if business day
 */
export function isBusinessDay(date: Date, holidays: string[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Add business days to a start date
 * Skips weekends and holidays
 * @param startISO - ISO date string 'YYYY-MM-DD'
 * @param businessDays - Number of business days to add (can be 0 or negative)
 * @param holidays - Array of ISO date strings
 * @returns ISO date string of the resulting date
 */
export function addBusinessDays(
  startISO: string,
  businessDays: number,
  holidays: string[] = []
): string {
  // Handle edge case: 0 business days
  if (businessDays === 0) {
    return startISO;
  }

  let date = parseISODate(startISO);
  const direction = businessDays > 0 ? 1 : -1;
  let remaining = Math.abs(businessDays);

  while (remaining > 0) {
    // Move to next day
    date = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + direction)
    );

    // Count only business days
    if (isBusinessDay(date, holidays)) {
      remaining--;
    }
  }

  return formatISODate(date);
}

/**
 * Calculate difference in business days between two dates
 * @param startISO - ISO date string 'YYYY-MM-DD'
 * @param endISO - ISO date string 'YYYY-MM-DD'
 * @param holidays - Array of ISO date strings
 * @returns Number of business days (positive if end > start)
 */
export function diffBusinessDays(
  startISO: string,
  endISO: string,
  holidays: string[] = []
): number {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);

  // Same day
  if (start.getTime() === end.getTime()) {
    return 0;
  }

  const direction = end > start ? 1 : -1;
  let current = new Date(start);
  let count = 0;

  while (current.getTime() !== end.getTime()) {
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + direction)
    );

    if (isBusinessDay(current, holidays)) {
      count++;
    }
  }

  return direction * count;
}

/**
 * Find the next business day from a given date (inclusive)
 * If the given date is a business day, returns it
 * @param startISO - ISO date string 'YYYY-MM-DD'
 * @param holidays - Array of ISO date strings
 * @returns ISO date string of the next business day
 */
export function getNextBusinessDay(startISO: string, holidays: string[] = []): string {
  let date = parseISODate(startISO);

  while (!isBusinessDay(date, holidays)) {
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  }

  return formatISODate(date);
}

/**
 * Snap a date to the nearest business day
 * @param dateISO - ISO date string 'YYYY-MM-DD'
 * @param holidays - Array of ISO date strings
 * @param direction - 'forward' or 'backward' or 'nearest'
 * @returns ISO date string of the snapped business day
 */
export function snapToBusinessDay(
  dateISO: string,
  holidays: string[] = [],
  direction: "forward" | "backward" | "nearest" = "forward"
): string {
  const date = parseISODate(dateISO);

  if (isBusinessDay(date, holidays)) {
    return dateISO;
  }

  if (direction === "forward") {
    return getNextBusinessDay(dateISO, holidays);
  }

  if (direction === "backward") {
    let current = new Date(date);
    while (!isBusinessDay(current, holidays)) {
      current = new Date(
        Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() - 1)
      );
    }
    return formatISODate(current);
  }

  // Nearest: check both directions
  const forward = getNextBusinessDay(dateISO, holidays);
  let current = new Date(date);
  while (!isBusinessDay(current, holidays)) {
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() - 1)
    );
  }
  const backward = formatISODate(current);

  const forwardDiff = diffBusinessDays(dateISO, forward, holidays);
  const backwardDiff = diffBusinessDays(backward, dateISO, holidays);

  return forwardDiff <= backwardDiff ? forward : backward;
}

/**
 * Get an array of all dates in a range (inclusive)
 * @param startISO - ISO date string 'YYYY-MM-DD'
 * @param endISO - ISO date string 'YYYY-MM-DD'
 * @returns Array of ISO date strings
 */
export function getDateRange(startISO: string, endISO: string): string[] {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const dates: string[] = [];

  let current = new Date(start);
  while (current <= end) {
    dates.push(formatISODate(current));
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 1)
    );
  }

  return dates;
}

/**
 * Check if a date is today
 * @param dateISO - ISO date string 'YYYY-MM-DD'
 * @returns true if today
 */
export function isToday(dateISO: string): boolean {
  const today = formatISODate(new Date());
  return dateISO === today;
}
