// Extracted from Timeline MVP - Date and Business Day Calculations

export interface BusinessDay {
  date: Date;
  businessDayNumber: number;
  isToday: boolean;
  isHoliday: boolean;
  label?: {
    line1: string;
    line2: string;
    line3?: string;
  };
}

export interface Holiday {
  date: string;
  name: string;
}

export interface ZoomLevel {
  name: string;
  unit: number;
  minWidth: number;
  label: string;
}

// Malaysia public holidays 2024-2025
export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: '2024-01-25', name: 'Thaipusam' },
  { date: '2024-02-10', name: 'Chinese New Year' },
  { date: '2024-04-10', name: 'Hari Raya Puasa' },
  { date: '2024-05-01', name: 'Labour Day' },
  { date: '2024-05-22', name: 'Wesak Day' },
  { date: '2024-06-03', name: "King's Birthday" },
  { date: '2024-06-17', name: 'Hari Raya Haji' },
  { date: '2024-08-31', name: 'Independence Day' },
  { date: '2024-09-16', name: 'Malaysia Day' },
  { date: '2024-10-31', name: 'Deepavali' },
  { date: '2024-12-25', name: 'Christmas' },
  { date: '2025-01-29', name: 'Chinese New Year' },
  { date: '2025-02-13', name: 'Thaipusam' },
  { date: '2025-03-31', name: 'Hari Raya Puasa' },
  { date: '2025-05-01', name: 'Labour Day' },
  { date: '2025-05-12', name: 'Wesak Day' },
  { date: '2025-06-02', name: "King's Birthday" },
  { date: '2025-06-07', name: 'Hari Raya Haji' },
  { date: '2025-08-31', name: 'Independence Day' },
  { date: '2025-09-16', name: 'Malaysia Day' },
  { date: '2025-10-20', name: 'Deepavali' },
  { date: '2025-12-25', name: 'Christmas' }
];

// Generate business days for timeline
export function generateBusinessDays(
  startDate: Date,
  count: number,
  holidays: Holiday[] = []
): BusinessDay[] {
  const days: BusinessDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const holidayDates = new Set(holidays.map(h => h.date));
  
  let currentDate = new Date(startDate);
  let businessDayCount = 0;
  
  while (days.length < count) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const isHoliday = holidayDates.has(dateStr);
      const isToday = currentDate.getTime() === today.getTime();
      
      days.push({
        date: new Date(currentDate),
        businessDayNumber: businessDayCount++,
        isToday,
        isHoliday,
        label: formatDateLabel(currentDate, days.length)
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

// Format date label for timeline
function formatDateLabel(date: Date, index: number): { line1: string; line2: string; line3?: string } {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  
  if (index === 0 || index % 5 === 0) {
    return {
      line1: day.toString(),
      line2: month,
      line3: weekday
    };
  }
  
  return {
    line1: day.toString(),
    line2: weekday
  };
}

// Format date elegantly
export function formatDateElegant(date: Date | null): string {
  if (!date) return '—';
  
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  
  const suffix = (d: number): string => {
    if (d > 3 && d < 21) return 'th';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = d % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || 'th';
  };
  
  return `${day}${suffix(day)} ${month} ${year}`;
}

// Calculate project duration in readable format
export function calculateProjectDuration(startDate: Date, endDate: Date): {
  total: number;
  formatted: string;
} {
  const msPerDay = 86400000;
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);
  
  if (totalDays < 5) {
    return {
      total: totalDays,
      formatted: `${totalDays} day${totalDays !== 1 ? 's' : ''}`
    };
  }
  
  if (totalDays <= 28) {
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const parts = [];
    
    if (weeks) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
    if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    
    return {
      total: totalDays,
      formatted: parts.join(' ')
    };
  }
  
  const months = Math.floor(totalDays / 30);
  const remainingDays = totalDays % 30;
  const weeks = Math.floor(remainingDays / 7);
  const days = remainingDays % 7;
  
  const parts = [];
  if (months) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (weeks) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
  if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  
  return {
    total: totalDays,
    formatted: parts.join(' ')
  };
}
