// src/lib/timeline/date-calculations.ts
// Business day calculation with holiday support

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  region?: string;
}

export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: "2024-01-01", name: "New Year" },
  { date: "2024-02-01", name: "Federal Territory Day" },
  { date: "2024-04-10", name: "Hari Raya Aidilfitri" },
  { date: "2024-04-11", name: "Hari Raya Aidilfitri" },
  { date: "2024-05-01", name: "Labour Day" },
  { date: "2024-05-22", name: "Wesak Day" },
  { date: "2024-06-03", name: "Agong Birthday" },
  { date: "2024-06-17", name: "Hari Raya Aidiladha" },
  { date: "2024-07-07", name: "Awal Muharram" },
  { date: "2024-08-31", name: "Merdeka Day" },
  { date: "2024-09-16", name: "Malaysia Day" },
  { date: "2024-09-16", name: "Prophet Muhammad Birthday" },
  { date: "2024-10-24", name: "Deepavali" },
  { date: "2024-12-25", name: "Christmas" },
];

/**
 * Convert business day index to actual calendar date
 * @param startDate - Project start date (e.g., new Date('2024-01-01'))
 * @param businessDayIndex - Business day number (0 = start date)
 * @param holidays - Array of holiday dates
 * @returns Actual calendar date
 */
export function businessDayToDate(
  startDate: Date,
  businessDayIndex: number,
  holidays: Holiday[] = DEFAULT_HOLIDAYS
): Date {
  // Validation
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    console.error("Invalid startDate:", startDate);
    return new Date(); // Fallback to today
  }

  if (typeof businessDayIndex !== "number" || businessDayIndex < 0) {
    console.error("Invalid businessDayIndex:", businessDayIndex);
    return new Date(startDate); // Fallback to start date
  }

  // Convert holiday strings to Set for O(1) lookup
  const holidaySet = new Set(holidays.map((h) => h.date));

  // Start from the given date
  const result = new Date(startDate);
  let businessDaysAdded = 0;

  // Edge case: if businessDayIndex is 0, return start date
  if (businessDayIndex === 0) {
    return new Date(result);
  }

  // Iterate through calendar days until we've counted enough business days
  while (businessDaysAdded < businessDayIndex) {
    result.setDate(result.getDate() + 1);

    const dayOfWeek = result.getDay();
    const dateStr = result.toISOString().split("T")[0];

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // Skip holidays
    if (holidaySet.has(dateStr)) {
      continue;
    }

    businessDaysAdded++;
  }

  return result;
}

/**
 * Calculate end date given start date and duration in business days
 */
export function calculateEndDate(
  startDate: Date,
  workingDays: number,
  holidays: Holiday[] = DEFAULT_HOLIDAYS
): Date {
  return businessDayToDate(startDate, workingDays - 1, holidays);
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, holidays: Holiday[] = DEFAULT_HOLIDAYS): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return holidays.some((h) => h.date === dateStr);
}

/**
 * Format date elegantly for UI display
 */
export function formatDateElegant(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("formatDateElegant received invalid date:", date);
    return "Invalid Date";
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Generate array of calendar dates for timeline display
 */
export function generateCalendarDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate project start date from phases
 */
export function calculateProjectStartDate(
  phases: any[],
  holidays: Holiday[] = DEFAULT_HOLIDAYS
): Date | null {
  if (!phases || phases.length === 0) return null;

  // Find the phase with the earliest startBusinessDay
  const earliest = phases.reduce((min, p) =>
    (p.startBusinessDay ?? 0) < (min.startBusinessDay ?? 0) ? p : min
  );

  // Convert business day index to calendar date
  const startDate = businessDayToDate(
    new Date("2024-01-01"), // Default project start
    earliest.startBusinessDay ?? 0,
    holidays
  );

  // Validate result
  return isNaN(startDate.getTime()) ? null : startDate;
}

/**
 * Calculate project end date from phases
 */
export function calculateProjectEndDate(
  phases: any[],
  holidays: Holiday[] = DEFAULT_HOLIDAYS
): Date | null {
  if (!phases || phases.length === 0) return null;

  // Find the phase that ends latest
  const latest = phases.reduce((max, p) => {
    const pEnd = (p.startBusinessDay ?? 0) + (p.workingDays ?? 0);
    const maxEnd = (max.startBusinessDay ?? 0) + (max.workingDays ?? 0);
    return pEnd > maxEnd ? p : max;
  });

  // Calculate end business day index
  const endBusinessDay = (latest.startBusinessDay ?? 0) + (latest.workingDays ?? 0);

  // Convert to calendar date
  const endDate = businessDayToDate(new Date("2024-01-01"), endBusinessDay, holidays);

  // Validate result
  return isNaN(endDate.getTime()) ? null : endDate;
}
