import { Holiday } from '@/types/core';

// Default holidays for Malaysia, Singapore, and Vietnam
export const DEFAULT_HOLIDAYS: Holiday[] = [
  // Malaysia
  { date: '2024-01-01', name: 'New Year\'s Day', country: 'MY' },
  { date: '2024-04-10', name: 'Hari Raya Aidilfitri', country: 'MY' },
  { date: '2024-04-11', name: 'Hari Raya Aidilfitri', country: 'MY' },
  { date: '2024-05-01', name: 'Labour Day', country: 'MY' },
  { date: '2024-05-22', name: 'Wesak Day', country: 'MY' },
  { date: '2024-06-03', name: 'Yang di-Pertuan Agong Birthday', country: 'MY' },
  { date: '2024-08-31', name: 'Independence Day', country: 'MY' },
  { date: '2024-09-16', name: 'Malaysia Day', country: 'MY' },
  { date: '2024-12-25', name: 'Christmas Day', country: 'MY' },
  
  // Singapore
  { date: '2024-01-01', name: 'New Year\'s Day', country: 'SG' },
  { date: '2024-02-10', name: 'Chinese New Year', country: 'SG' },
  { date: '2024-02-11', name: 'Chinese New Year', country: 'SG' },
  { date: '2024-03-29', name: 'Good Friday', country: 'SG' },
  { date: '2024-04-10', name: 'Hari Raya Puasa', country: 'SG' },
  { date: '2024-05-01', name: 'Labour Day', country: 'SG' },
  { date: '2024-05-22', name: 'Vesak Day', country: 'SG' },
  { date: '2024-08-09', name: 'National Day', country: 'SG' },
  { date: '2024-12-25', name: 'Christmas Day', country: 'SG' },
  
  // Vietnam
  { date: '2024-01-01', name: 'New Year\'s Day', country: 'VN' },
  { date: '2024-02-08', name: 'Tet Holiday', country: 'VN' },
  { date: '2024-02-09', name: 'Tet Holiday', country: 'VN' },
  { date: '2024-02-10', name: 'Tet Holiday', country: 'VN' },
  { date: '2024-04-18', name: 'Hung Kings Day', country: 'VN' },
  { date: '2024-04-30', name: 'Liberation Day', country: 'VN' },
  { date: '2024-05-01', name: 'Labour Day', country: 'VN' },
  { date: '2024-09-02', name: 'National Day', country: 'VN' },
];

// Base date for business day calculations
export const BUSINESS_DAY_BASE_DATE = new Date('2024-01-01');

// Check if a date is a weekend (Saturday or Sunday)
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

// Check if a date is a holiday
export const isHoliday = (date: Date, holidays: Holiday[] = DEFAULT_HOLIDAYS): boolean => {
  const dateString = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.date === dateString);
};

// Check if a date is a business day (not weekend or holiday)
export const isBusinessDay = (date: Date, holidays: Holiday[] = DEFAULT_HOLIDAYS): boolean => {
  return !isWeekend(date) && !isHoliday(date, holidays);
};

// Convert business day number to actual date
export const businessDayToDate = (
  businessDay: number, 
  holidays: Holiday[] = DEFAULT_HOLIDAYS, 
  skipHolidays: boolean = true,
  baseDate: Date = BUSINESS_DAY_BASE_DATE
): Date => {
  const result = new Date(baseDate);
  let currentBusinessDay = 0;
  
  while (currentBusinessDay < businessDay) {
    result.setDate(result.getDate() + 1);
    
    if (skipHolidays) {
      if (isBusinessDay(result, holidays)) {
        currentBusinessDay++;
      }
    } else {
      if (!isWeekend(result)) {
        currentBusinessDay++;
      }
    }
  }
  
  return result;
};

// Convert actual date to business day number
export const dateToBusinessDay = (
  date: Date, 
  holidays: Holiday[] = DEFAULT_HOLIDAYS,
  skipHolidays: boolean = true,
  baseDate: Date = BUSINESS_DAY_BASE_DATE
): number => {
  let businessDay = 0;
  const current = new Date(baseDate);
  
  while (current < date) {
    current.setDate(current.getDate() + 1);
    
    if (skipHolidays) {
      if (isBusinessDay(current, holidays)) {
        businessDay++;
      }
    } else {
      if (!isWeekend(current)) {
        businessDay++;
      }
    }
  }
  
  return businessDay;
};

// Calculate end date based on start date and working days
export const calculateEndDate = (
  startDate: Date, 
  workingDays: number,
  holidays: Holiday[] = DEFAULT_HOLIDAYS,
  skipHolidays: boolean = true
): Date => {
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1);
    
    if (skipHolidays) {
      if (isBusinessDay(result, holidays)) {
        daysAdded++;
      }
    } else {
      if (!isWeekend(result)) {
        daysAdded++;
      }
    }
  }
  
  return result;
};

// Generate array of business days between two dates
export const generateBusinessDays = (
  startDate: Date, 
  endDate: Date,
  holidays: Holiday[] = DEFAULT_HOLIDAYS
): Date[] => {
  const businessDays: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isBusinessDay(current, holidays)) {
      businessDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
};

// Format date elegantly (e.g., "Jan 15, 2024")
export const formatDateElegant = (date: Date | null): string => {
  if (!date) return 'Not set';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Calculate project duration in business days
export const calculateProjectDuration = (
  phases: any[],
  holidays: Holiday[] = DEFAULT_HOLIDAYS
): number => {
  if (!phases.length) return 0;
  
  const minStart = Math.min(...phases.map(p => p.startBusinessDay));
  const maxEnd = Math.max(...phases.map(p => p.startBusinessDay + p.workingDays));
  
  return maxEnd - minStart;
};

// Get project start and end dates
export const getProjectStartDate = (phases: any[]): Date | null => {
  if (!phases.length) return null;
  
  const earliestPhase = phases.reduce((earliest, phase) => 
    phase.startBusinessDay < earliest.startBusinessDay ? phase : earliest
  );
  
  return businessDayToDate(earliestPhase.startBusinessDay);
};

export const getProjectEndDate = (phases: any[]): Date | null => {
  if (!phases.length) return null;
  
  const latestEnd = Math.max(...phases.map(p => 
    p.startBusinessDay + p.workingDays
  ));
  
  return businessDayToDate(latestEnd);
};
