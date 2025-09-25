// Basic date calculation utilities for milestone integration

const BASE_DATE = new Date('2024-01-01');

export const businessDayToDate = (businessDay: number): Date => {
  // Simple calculation: add business days to base date
  const date = new Date(BASE_DATE);
  date.setDate(date.getDate() + Math.floor(businessDay * 1.4)); // Account for weekends
  return date;
};

export const dateToBusinessDay = (date: Date): number => {
  const diffTime = date.getTime() - BASE_DATE.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 1.4); // Convert back to business days
};

export const calculateEndDate = (startDate: Date, workingDays: number): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.floor(workingDays * 1.4));
  return endDate;
};
