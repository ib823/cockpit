const fs = require('fs');

// Fixed holidays (same date every year)
const FIXED_HOLIDAYS = {
  ABMY: [
    { month: 1, day: 1, name: "New Year's Day" },
    { month: 5, day: 1, name: "Labour Day" },
    { month: 8, day: 31, name: "National Day" },
    { month: 9, day: 16, name: "Malaysia Day" },
    { month: 12, day: 25, name: "Christmas Day" },
  ],
  ABSG: [
    { month: 1, day: 1, name: "New Year's Day" },
    { month: 5, day: 1, name: "Labour Day" },
    { month: 8, day: 9, name: "National Day" },
    { month: 12, day: 25, name: "Christmas Day" },
  ],
  ABVN: [
    { month: 1, day: 1, name: "New Year's Day" },
    { month: 4, day: 30, name: "Reunification Day" },
    { month: 5, day: 1, name: "Labour Day" },
    { month: 9, day: 2, name: "National Day" },
  ],
};

// Variable holidays (approximate - need manual verification for production)
const VARIABLE_HOLIDAYS = {
  ABMY: {
    2025: [
      "2025-01-25|Thaipusam",
      "2025-01-29|Chinese New Year",
      "2025-01-30|Chinese New Year",
      "2025-03-31|Hari Raya Aidilfitri",
      "2025-04-01|Hari Raya Aidilfitri",
      "2025-05-12|Vesak Day",
      "2025-06-02|Agong's Birthday",
      "2025-06-07|Hari Raya Aidiladha",
      "2025-06-28|Awal Muharram",
      "2025-09-06|Maulidur Rasul",
      "2025-10-24|Deepavali",
    ],
    2026: [
      "2026-01-14|Thaipusam",
      "2026-02-17|Chinese New Year",
      "2026-02-18|Chinese New Year",
      "2026-03-21|Hari Raya Aidilfitri",
      "2026-03-22|Hari Raya Aidilfitri",
      "2026-05-01|Vesak Day",
      "2026-05-28|Hari Raya Aidiladha",
      "2026-06-06|Agong's Birthday",
      "2026-06-17|Awal Muharram",
      "2026-08-25|Maulidur Rasul",
      "2026-10-13|Deepavali",
    ],
    2027: [
      "2027-02-03|Thaipusam",
      "2027-02-06|Chinese New Year",
      "2027-02-07|Chinese New Year",
      "2027-03-10|Hari Raya Aidilfitri",
      "2027-03-11|Hari Raya Aidilfitri",
      "2027-05-17|Hari Raya Aidiladha",
      "2027-05-20|Vesak Day",
      "2027-06-05|Agong's Birthday",
      "2027-06-06|Awal Muharram",
      "2027-08-14|Maulidur Rasul",
      "2027-11-02|Deepavali",
    ],
    2028: [
      "2028-01-24|Thaipusam",
      "2028-01-26|Chinese New Year",
      "2028-01-27|Chinese New Year",
      "2028-02-27|Hari Raya Aidilfitri",
      "2028-02-28|Hari Raya Aidilfitri",
      "2028-05-06|Hari Raya Aidiladha",
      "2028-05-08|Vesak Day",
      "2028-05-27|Awal Muharram",
      "2028-06-05|Agong's Birthday",
      "2028-08-03|Maulidur Rasul",
      "2028-10-21|Deepavali",
    ],
    2029: [
      "2029-01-13|Thaipusam",
      "2029-02-13|Chinese New Year",
      "2029-02-14|Chinese New Year",
      "2029-02-16|Hari Raya Aidilfitri",
      "2029-02-17|Hari Raya Aidilfitri",
      "2029-04-25|Hari Raya Aidiladha",
      "2029-05-16|Awal Muharram",
      "2029-05-27|Vesak Day",
      "2029-06-04|Agong's Birthday",
      "2029-07-24|Maulidur Rasul",
      "2029-10-09|Deepavali",
    ],
    2030: [
      "2030-02-01|Thaipusam",
      "2030-02-03|Chinese New Year",
      "2030-02-04|Chinese New Year",
      "2030-02-06|Hari Raya Aidilfitri",
      "2030-02-07|Hari Raya Aidilfitri",
      "2030-04-15|Hari Raya Aidiladha",
      "2030-05-05|Awal Muharram",
      "2030-05-16|Vesak Day",
      "2030-06-01|Agong's Birthday",
      "2030-07-13|Maulidur Rasul",
      "2030-10-28|Deepavali",
    ],
  },
  ABSG: {
    2025: [
      "2025-01-29|Chinese New Year",
      "2025-01-30|Chinese New Year",
      "2025-03-31|Hari Raya Puasa",
      "2025-04-18|Good Friday",
      "2025-05-12|Vesak Day",
      "2025-06-07|Hari Raya Haji",
      "2025-10-20|Deepavali",
    ],
    2026: [
      "2026-02-17|Chinese New Year",
      "2026-02-18|Chinese New Year",
      "2026-03-21|Hari Raya Puasa",
      "2026-04-03|Good Friday",
      "2026-05-01|Vesak Day",
      "2026-05-28|Hari Raya Haji",
      "2026-10-09|Deepavali",
    ],
    2027: [
      "2027-02-06|Chinese New Year",
      "2027-02-07|Chinese New Year",
      "2027-03-10|Hari Raya Puasa",
      "2027-03-26|Good Friday",
      "2027-05-17|Hari Raya Haji",
      "2027-05-20|Vesak Day",
      "2027-10-29|Deepavali",
    ],
    2028: [
      "2028-01-26|Chinese New Year",
      "2028-01-27|Chinese New Year",
      "2028-02-27|Hari Raya Puasa",
      "2028-04-14|Good Friday",
      "2028-05-06|Hari Raya Haji",
      "2028-05-08|Vesak Day",
      "2028-10-17|Deepavali",
    ],
    2029: [
      "2029-02-13|Chinese New Year",
      "2029-02-14|Chinese New Year",
      "2029-02-16|Hari Raya Puasa",
      "2029-03-30|Good Friday",
      "2029-04-25|Hari Raya Haji",
      "2029-05-27|Vesak Day",
      "2029-11-06|Deepavali",
    ],
    2030: [
      "2030-02-03|Chinese New Year",
      "2030-02-04|Chinese New Year",
      "2030-02-06|Hari Raya Puasa",
      "2030-04-15|Hari Raya Haji",
      "2030-04-19|Good Friday",
      "2030-05-16|Vesak Day",
      "2030-10-26|Deepavali",
    ],
  },
  ABVN: {
    2025: [
      "2025-01-28|Lunar New Year Eve",
      "2025-01-29|Lunar New Year",
      "2025-01-30|Lunar New Year",
      "2025-01-31|Lunar New Year",
      "2025-02-01|Lunar New Year",
      "2025-04-10|Hung Kings Festival",
    ],
    2026: [
      "2026-02-16|Lunar New Year Eve",
      "2026-02-17|Lunar New Year",
      "2026-02-18|Lunar New Year",
      "2026-02-19|Lunar New Year",
      "2026-02-20|Lunar New Year",
      "2026-03-30|Hung Kings Festival",
    ],
    2027: [
      "2027-02-05|Lunar New Year Eve",
      "2027-02-06|Lunar New Year",
      "2027-02-07|Lunar New Year",
      "2027-02-08|Lunar New Year",
      "2027-02-09|Lunar New Year",
      "2027-04-18|Hung Kings Festival",
    ],
    2028: [
      "2028-01-25|Lunar New Year Eve",
      "2028-01-26|Lunar New Year",
      "2028-01-27|Lunar New Year",
      "2028-01-28|Lunar New Year",
      "2028-01-29|Lunar New Year",
      "2028-04-06|Hung Kings Festival",
    ],
    2029: [
      "2029-02-12|Lunar New Year Eve",
      "2029-02-13|Lunar New Year",
      "2029-02-14|Lunar New Year",
      "2029-02-15|Lunar New Year",
      "2029-02-16|Lunar New Year",
      "2029-03-26|Hung Kings Festival",
    ],
    2030: [
      "2030-02-02|Lunar New Year Eve",
      "2030-02-03|Lunar New Year",
      "2030-02-04|Lunar New Year",
      "2030-02-05|Lunar New Year",
      "2030-02-06|Lunar New Year",
      "2030-04-14|Hung Kings Festival",
    ],
  },
};

function generateHolidays() {
  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  const regions = ['ABMY', 'ABSG', 'ABVN'];
  
  const output = {
    ABMY: { name: "Malaysia", holidays: [] },
    ABSG: { name: "Singapore", holidays: [] },
    ABVN: { name: "Vietnam", holidays: [] },
  };

  regions.forEach(region => {
    years.forEach(year => {
      // Add fixed holidays
      FIXED_HOLIDAYS[region].forEach(holiday => {
        const date = `${year}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`;
        output[region].holidays.push({ date, name: holiday.name });
      });

      // Add variable holidays
      if (VARIABLE_HOLIDAYS[region][year]) {
        VARIABLE_HOLIDAYS[region][year].forEach(entry => {
          const [date, name] = entry.split('|');
          output[region].holidays.push({ date, name });
        });
      }
    });

    // Sort by date
    output[region].holidays.sort((a, b) => a.date.localeCompare(b.date));
  });

  return output;
}

// Generate TypeScript file
const holidays = generateHolidays();

const tsContent = `/**
 * Holiday Calendar (2025-2030)
 * Generated by scripts/generate-holidays.js
 * 
 * Sources:
 * - Malaysia: https://publicholidays.com.my/
 * - Singapore: https://www.mom.gov.sg/employment-practices/public-holidays
 * - Vietnam: https://publicholidays.vn/
 */

export interface Holiday {
  date: string; // ISO format YYYY-MM-DD
  name: string;
}

export interface HolidayCalendar {
  name: string;
  holidays: Holiday[];
}

export const HOLIDAYS: Record<'ABMY' | 'ABSG' | 'ABVN', HolidayCalendar> = ${JSON.stringify(holidays, null, 2)};

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, region: 'ABMY' | 'ABSG' | 'ABVN'): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return HOLIDAYS[region].holidays.some(h => h.date === dateStr);
}

/**
 * Get holiday name for a date
 */
export function getHolidayName(date: Date, region: 'ABMY' | 'ABSG' | 'ABVN'): string | null {
  const dateStr = date.toISOString().split('T')[0];
  const holiday = HOLIDAYS[region].holidays.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
}

/**
 * Get all holidays in a date range
 */
export function getHolidaysInRange(
  startDate: Date,
  endDate: Date,
  region: 'ABMY' | 'ABSG' | 'ABVN'
): Holiday[] {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  return HOLIDAYS[region].holidays.filter(h => h.date >= start && h.date <= end);
}

/**
 * Calculate working days between two dates (excludes weekends and holidays)
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  region: 'ABMY' | 'ABSG' | 'ABVN'
): number {
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (!isWeekend && !isHoliday(current, region)) {
      workingDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

/**
 * Add working days to a date (skips weekends and holidays)
 */
export function addWorkingDays(
  startDate: Date,
  workingDays: number,
  region: 'ABMY' | 'ABSG' | 'ABVN'
): Date {
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (!isWeekend && !isHoliday(result, region)) {
      daysAdded++;
    }
  }
  
  return result;
}

/**
 * Get next working day
 */
export function getNextWorkingDay(date: Date, region: 'ABMY' | 'ABSG' | 'ABVN'): Date {
  return addWorkingDays(date, 1, region);
}
`;

fs.writeFileSync('src/data/holidays.ts', tsContent);
console.log('✅ Generated src/data/holidays.ts');
console.log(`   - ABMY: ${holidays.ABMY.holidays.length} holidays`);
console.log(`   - ABSG: ${holidays.ABSG.holidays.length} holidays`);
console.log(`   - ABVN: ${holidays.ABVN.holidays.length} holidays`);