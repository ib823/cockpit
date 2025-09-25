import { Holiday } from '@/types/core';

// Default holidays
export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: '2024-01-01', name: 'New Year\'s Day', country: 'MY' },
  { date: '2024-04-10', name: 'Hari Raya Aidilfitri', country: 'MY' },
  { date: '2024-04-11', name: 'Hari Raya Aidilfitri', country: 'MY' },
  { date: '2024-05-01', name: 'Labour Day', country: 'MY' },
  { date: '2024-05-22', name: 'Wesak Day', country: 'MY' },
  { date: '2024-06-03', name: 'Yang di-Pertuan Agong Birthday', country: 'MY' },
  { date: '2024-08-31', name: 'Independence Day', country: 'MY' },
  { date: '2024-09-16', name: 'Malaysia Day', country: 'MY' },
  { date: '2024-12-25', name: 'Christmas Day', country: 'MY' },
];

// Base date
export const BUSINESS_DAY_BASE_DATE = new Date('2024-01-01');

// Utility functions
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isHoliday = (date: Date, holidays: Holiday[] = DEFAULT_HOLIDAYS): boolean => {
  const dateString = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.date === dateString);
};

export const isBusinessDay = (date: Date, holidays: Holiday[] = DEFAULT_HOLIDAYS): boolean => {
  return !isWeekend(date) && !isHoliday(date, holidays);
};

// Core date conversion function
export const businessDayToDate = (
  businessDay: number, 
  holidays: Holiday[] = DEFAULT_HOLIDAYS, 
  skipHolidays: boolean = true,
  baseDate: Date = BUSINESS_DAY_BASE_DATE
): Date => {
  const result = new Date(baseDate);
  let currentBusinessDay = 0;
  
  if (businessDay <= 0) return result;
  
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

// Calculate end date properly with holiday integration
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

// Date formatting
export const formatDateElegant = (date: Date | null): string => {
  if (!date) return 'Not set';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateConsistent = (date: Date | null): string => {
  if (!date) return '-';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(date.getDate()).padStart(2, '0');
  const mmm = months[date.getMonth()];
  const yy = String(date.getFullYear()).slice(-2);
  const ddd = days[date.getDay()];
  return `${dd}-${mmm}-${yy} (${ddd})`;
};

// Project date calculations
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
