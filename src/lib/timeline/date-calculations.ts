// Simple date calculations without external dependencies

export function getProjectStartDate(phases: any[]): Date {
  return new Date('2024-01-01');
}

export function getProjectEndDate(phases: any[]): Date {
  if (!phases || phases.length === 0) {
    return new Date('2024-12-31');
  }
  
  const start = new Date('2024-01-01');
  const totalWorkingDays = phases.reduce((sum, p) => sum + (p.workingDays || p.duration || 30), 0);
  
  // Simple calculation: assume 5 working days per week
  const weeks = Math.floor(totalWorkingDays / 5);
  const remainingDays = totalWorkingDays % 5;
  const totalDays = (weeks * 7) + remainingDays;
  
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + totalDays);
  
  return endDate;
}

export function formatDateElegant(date: Date | null): string {
  if (!date || isNaN(date.getTime())) {
    return 'TBD';
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

export function businessDayToDate(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  const weeks = Math.floor(businessDays / 5);
  const remainingDays = businessDays % 5;
  const totalDays = (weeks * 7) + remainingDays;
  
  result.setDate(result.getDate() + totalDays);
  return result;
}

export interface Holiday {
  date: string;
  name: string;
}

export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: '2024-01-01', name: 'New Year' },
  { date: '2024-02-10', name: 'Chinese New Year' },
  { date: '2024-05-01', name: 'Labour Day' },
  { date: '2024-08-31', name: 'Merdeka Day' }
];
