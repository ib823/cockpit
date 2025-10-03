// Complete working date calculations with business day logic

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
}

export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: '2024-01-01', name: 'New Year' },
  { date: '2024-02-10', name: 'Chinese New Year' },
  { date: '2024-05-01', name: 'Labour Day' },
  { date: '2024-08-31', name: 'Merdeka Day' },
  { date: '2024-12-25', name: 'Christmas' }
];

const BUSINESS_DAY_BASE_DATE = '2024-01-01';

/**
 * Check if date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if date is a holiday
 */
function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(h => h.date === dateStr);
}

/**
 * Convert business day index to actual calendar date
 * @param businessDayIndex - Zero-based index (0 = first business day)
 * @param holidays - Array of holidays to skip
 * @param baseDate - Starting date (default: 2024-01-01)
 */
export function businessDayToDate(
  businessDayIndex: number,
  holidays: Holiday[] = [],
  skipHolidays: boolean = true,
  baseDate: string = BUSINESS_DAY_BASE_DATE
): Date {
  const start = new Date(baseDate);
  
  // If index is 0 or negative, return base date
  if (businessDayIndex <= 0) {
    return start;
  }
  
  let current = new Date(start);
  let count = 0;
  
  // Iterate until we've counted enough business days
  while (count < businessDayIndex) {
    current.setDate(current.getDate() + 1);
    
    // Skip weekends
    if (isWeekend(current)) {
      continue;
    }
    
    // Skip holidays if requested
    if (skipHolidays && isHoliday(current, holidays)) {
      continue;
    }
    
    count++;
  }
  
  return current;
}

/**
 * Convert actual date to business day index
 * @param date - Target date
 * @param holidays - Array of holidays to skip
 * @param baseDate - Starting date (default: 2024-01-01)
 */
export function dateToBusinessDay(
  date: Date,
  holidays: Holiday[] = [],
  skipHolidays: boolean = true,
  baseDate: string = BUSINESS_DAY_BASE_DATE
): number {
  const start = new Date(baseDate);
  const target = new Date(date);
  
  // If target is before or on start date, return 0
  if (target <= start) {
    return 0;
  }
  
  let current = new Date(start);
  let index = 0;
  
  // Count business days between start and target
  while (current < target) {
    current.setDate(current.getDate() + 1);
    
    // Skip weekends
    if (isWeekend(current)) {
      continue;
    }
    
    // Skip holidays if requested
    if (skipHolidays && isHoliday(current, holidays)) {
      continue;
    }
    
    index++;
  }
  
  return index;
}

/**
 * Calculate end date given start date and working days
 */
export function calculateEndDate(
  startDate: Date,
  workingDays: number,
  holidays: Holiday[] = [],
  skipHolidays: boolean = true
): Date {
  // Convert start date to business day index
  const startIndex = dateToBusinessDay(startDate, holidays, skipHolidays);
  
  // Add working days
  const endIndex = startIndex + workingDays;
  
  // Convert back to date
  return businessDayToDate(endIndex, holidays, skipHolidays);
}

/**
 * Format date elegantly (e.g., "15 Jan 2024")
 */
export function formatDateElegant(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'TBD';
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Get project start date from phases
 */
export function getProjectStartDate(phases: any[]): Date | null {
  if (!phases || phases.length === 0) {
    return null;
  }
  
  // Find earliest phase
  const earliestPhase = phases.reduce((earliest, phase) => {
    return phase.startBusinessDay < earliest.startBusinessDay ? phase : earliest;
  }, phases[0]);
  
  return businessDayToDate(earliestPhase.startBusinessDay, DEFAULT_HOLIDAYS);
}

/**
 * Get project end date from phases
 */
export function getProjectEndDate(phases: any[]): Date | null {
  if (!phases || phases.length === 0) {
    return null;
  }
  
  // Find latest phase end
  const latestPhase = phases.reduce((latest, phase) => {
    const currentEnd = phase.startBusinessDay + (phase.workingDays || 0);
    const latestEnd = latest.startBusinessDay + (latest.workingDays || 0);
    return currentEnd > latestEnd ? phase : latest;
  }, phases[0]);
  
  const endBusinessDay = latestPhase.startBusinessDay + (latestPhase.workingDays || 0);
  
  return businessDayToDate(endBusinessDay, DEFAULT_HOLIDAYS);
}

/**
 * Calculate total project duration in calendar days
 */
export function calculateProjectDuration(phases: any[]): number {
  const start = getProjectStartDate(phases);
  const end = getProjectEndDate(phases);
  
  if (!start || !end) {
    return 0;
  }
  
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 to include end date
}