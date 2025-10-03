// Comprehensive edge case tests for date calculations
import { describe, it, expect } from 'vitest';
import {
  businessDayToDate,
  calculateEndDate,
  isWeekend,
  isHoliday,
  formatDateElegant,
  generateCalendarDates,
  Holiday,
  DEFAULT_HOLIDAYS
} from '@/lib/timeline/date-calculations';

describe('Date Calculations - Edge Cases', () => {
  describe('Weekend Handling', () => {
    it('skips Saturday when calculating business days', () => {
      // Friday, Jan 5, 2024
      const startDate = new Date('2024-01-05');

      // +1 business day should skip Saturday and land on Monday
      const result = businessDayToDate(startDate, 1);

      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(8); // Jan 8
    });

    it('skips Sunday when calculating business days', () => {
      // Friday, Jan 5, 2024
      const startDate = new Date('2024-01-05');

      // +2 business days = Mon + Tue
      const result = businessDayToDate(startDate, 2);

      expect(result.getDay()).toBe(2); // Tuesday
      expect(result.getDate()).toBe(9); // Jan 9
    });

    it('correctly handles week boundary crossings', () => {
      // Wednesday, Jan 3, 2024
      const startDate = new Date('2024-01-03');

      // +5 business days = Thu, Fri, (skip weekend), Mon, Tue, Wed
      const result = businessDayToDate(startDate, 5);

      expect(result.getDay()).toBe(3); // Wednesday
      expect(result.getDate()).toBe(10); // Jan 10
    });

    it('handles multiple weekend crossings', () => {
      // Monday, Jan 1, 2024
      const startDate = new Date('2024-01-01');

      // +10 business days should cross 2 weekends
      const result = businessDayToDate(startDate, 10);

      // Should be 14 calendar days later (10 business + 4 weekend days)
      expect(result.getDate()).toBe(15); // Jan 15 (Monday)
    });

    it('identifies Saturday correctly', () => {
      const saturday = new Date('2024-01-06');
      expect(isWeekend(saturday)).toBe(true);
    });

    it('identifies Sunday correctly', () => {
      const sunday = new Date('2024-01-07');
      expect(isWeekend(sunday)).toBe(true);
    });

    it('identifies weekdays correctly', () => {
      const monday = new Date('2024-01-08');
      const wednesday = new Date('2024-01-10');
      const friday = new Date('2024-01-12');

      expect(isWeekend(monday)).toBe(false);
      expect(isWeekend(wednesday)).toBe(false);
      expect(isWeekend(friday)).toBe(false);
    });
  });

  describe('Year Boundary Crossings', () => {
    it('correctly crosses from 2024 to 2025', () => {
      // Friday, Dec 27, 2024
      const startDate = new Date('2024-12-27');

      // +3 business days = Mon Dec 30, Tue Dec 31, Wed Jan 1 2025
      // But Jan 1 is a holiday, so skip to Thu Jan 2
      const result = businessDayToDate(startDate, 3, [
        { date: '2025-01-01', name: 'New Year 2025' }
      ]);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
    });

    it('handles December to January transition with weekends', () => {
      // Monday, Dec 30, 2024
      const startDate = new Date('2024-12-30');

      // +5 business days crossing year boundary
      const result = businessDayToDate(startDate, 5, [
        { date: '2025-01-01', name: 'New Year' }
      ]);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getDate()).toBeGreaterThan(1);
    });

    it('correctly handles leap year to non-leap year transition', () => {
      // 2024 is a leap year, 2025 is not
      const startDate = new Date('2024-02-28');

      const result = businessDayToDate(startDate, 1);

      expect(result.getDate()).toBe(29); // Feb 29 exists in 2024
      expect(result.getMonth()).toBe(1); // Still February
    });

    it('handles year-end with consecutive holidays', () => {
      const startDate = new Date('2024-12-23');

      const holidays: Holiday[] = [
        { date: '2024-12-25', name: 'Christmas' },
        { date: '2024-12-26', name: 'Boxing Day' },
        { date: '2025-01-01', name: 'New Year' }
      ];

      // Should skip Christmas, Boxing Day, weekends, and New Year
      const result = businessDayToDate(startDate, 5, holidays);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getDate()).toBeGreaterThan(1);
    });
  });

  describe('Leap Year Handling', () => {
    it('correctly identifies Feb 29 in leap year 2024', () => {
      const feb29_2024 = new Date('2024-02-29');

      // Should be valid
      expect(feb29_2024.getMonth()).toBe(1); // February
      expect(feb29_2024.getDate()).toBe(29);
    });

    it('handles business day calculation crossing Feb 29', () => {
      // Feb 28, 2024 (Wednesday)
      const startDate = new Date('2024-02-28');

      // +1 business day should be Feb 29 (Thursday)
      const result = businessDayToDate(startDate, 1);

      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(1); // February
    });

    it('handles non-leap year February correctly', () => {
      // Feb 28, 2025 (Friday) - non-leap year
      const startDate = new Date('2025-02-28');

      // +1 business day should skip weekend to March 3 (Monday)
      const result = businessDayToDate(startDate, 1);

      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(3);
    });

    it('calculates duration across leap day correctly', () => {
      // Feb 1, 2024 to Mar 15, 2024
      const startDate = new Date('2024-02-01');

      // 30 business days should include Feb 29
      const result = businessDayToDate(startDate, 30);

      expect(result.getMonth()).toBe(2); // March
    });
  });

  describe('Consecutive Public Holidays', () => {
    it('skips multiple consecutive holidays', () => {
      const startDate = new Date('2024-04-09'); // Tuesday before Hari Raya

      // DEFAULT_HOLIDAYS has Apr 10 and Apr 11 as consecutive holidays
      const result = businessDayToDate(startDate, 1, DEFAULT_HOLIDAYS);

      // Should skip Apr 10, Apr 11 and land on Apr 12
      expect(result.getDate()).toBe(12);
    });

    it('handles holiday on Friday followed by weekend', () => {
      const startDate = new Date('2024-04-08'); // Monday

      const holidays: Holiday[] = [
        { date: '2024-04-12', name: 'Friday Holiday' }
      ];

      // +4 business days = Tue, Wed, Thu, (skip Fri holiday + weekend), Mon
      const result = businessDayToDate(startDate, 4, holidays);

      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(15);
    });

    it('handles holiday on Monday after weekend', () => {
      const startDate = new Date('2024-04-05'); // Friday

      const holidays: Holiday[] = [
        { date: '2024-04-08', name: 'Monday Holiday' }
      ];

      // +1 business day = skip weekend, skip Monday holiday, land on Tuesday
      const result = businessDayToDate(startDate, 1, holidays);

      expect(result.getDay()).toBe(2); // Tuesday
      expect(result.getDate()).toBe(9);
    });

    it('handles 3+ consecutive holidays with weekends', () => {
      const startDate = new Date('2024-12-20'); // Friday

      const holidays: Holiday[] = [
        { date: '2024-12-23', name: 'Holiday 1' }, // Monday
        { date: '2024-12-24', name: 'Holiday 2' }, // Tuesday
        { date: '2024-12-25', name: 'Holiday 3' }, // Wednesday
        { date: '2024-12-26', name: 'Holiday 4' }  // Thursday
      ];

      // +1 business day should skip weekend (21-22) and 4 holidays (23-26)
      const result = businessDayToDate(startDate, 1, holidays);

      expect(result.getDate()).toBe(27); // Friday Dec 27
    });

    it('correctly identifies holiday dates', () => {
      const christmas = new Date('2024-12-25');
      const newYear = new Date('2024-01-01');
      const regularDay = new Date('2024-01-15');

      expect(isHoliday(christmas, DEFAULT_HOLIDAYS)).toBe(true);
      expect(isHoliday(newYear, DEFAULT_HOLIDAYS)).toBe(true);
      expect(isHoliday(regularDay, DEFAULT_HOLIDAYS)).toBe(false);
    });
  });

  describe('Invalid Input Handling', () => {
    it('handles invalid start date gracefully', () => {
      const invalidDate = new Date('invalid');

      // Should return current date as fallback
      const result = businessDayToDate(invalidDate, 5);

      expect(result instanceof Date).toBe(true);
      expect(!isNaN(result.getTime())).toBe(true);
    });

    it('handles negative business day index', () => {
      const startDate = new Date('2024-01-15');

      // Should return start date as fallback
      const result = businessDayToDate(startDate, -5);

      expect(result.getFullYear()).toBe(startDate.getFullYear());
      expect(result.getMonth()).toBe(startDate.getMonth());
      expect(result.getDate()).toBe(startDate.getDate());
    });

    it('handles zero business days', () => {
      const startDate = new Date('2024-01-15');

      // 0 business days should return start date
      const result = businessDayToDate(startDate, 0);

      expect(result.getTime()).toBe(startDate.getTime());
    });

    it('handles very large business day index', () => {
      const startDate = new Date('2024-01-01');

      // 500 business days (~2 years)
      const result = businessDayToDate(startDate, 500);

      expect(result.getFullYear()).toBeGreaterThanOrEqual(2025);
    });

    it('handles null/undefined start date', () => {
      // @ts-expect-error Testing invalid input
      const result1 = businessDayToDate(null, 5);
      // @ts-expect-error Testing invalid input
      const result2 = businessDayToDate(undefined, 5);

      expect(result1 instanceof Date).toBe(true);
      expect(result2 instanceof Date).toBe(true);
    });

    it('formats invalid date elegantly', () => {
      const invalidDate = new Date('invalid');

      const result = formatDateElegant(invalidDate);

      expect(result).toBe('Invalid Date');
    });
  });

  describe('calculateEndDate Function', () => {
    it('calculates end date correctly for 1 day duration', () => {
      const startDate = new Date('2024-01-15'); // Monday

      // 1 working day = same day
      const result = calculateEndDate(startDate, 1);

      expect(result.getDate()).toBe(15);
    });

    it('calculates end date correctly for 5 day duration', () => {
      const startDate = new Date('2024-01-15'); // Monday

      // 5 working days = Mon-Fri same week
      const result = calculateEndDate(startDate, 5);

      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(19);
    });

    it('handles duration crossing weekend', () => {
      const startDate = new Date('2024-01-15'); // Monday

      // 10 working days = 2 weeks
      const result = calculateEndDate(startDate, 10);

      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(26);
    });

    it('respects holidays in end date calculation', () => {
      const startDate = new Date('2024-12-23'); // Monday

      const holidays: Holiday[] = [
        { date: '2024-12-25', name: 'Christmas' }
      ];

      // 3 working days should skip Christmas
      const result = calculateEndDate(startDate, 3, holidays);

      expect(result.getDate()).toBeGreaterThan(25);
    });
  });

  describe('formatDateElegant Function', () => {
    it('formats January date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDateElegant(date)).toBe('Jan 15, 2024');
    });

    it('formats December date correctly', () => {
      const date = new Date('2024-12-25');
      expect(formatDateElegant(date)).toBe('Dec 25, 2024');
    });

    it('formats single-digit day correctly', () => {
      const date = new Date('2024-06-03');
      expect(formatDateElegant(date)).toBe('Jun 3, 2024');
    });

    it('formats double-digit day correctly', () => {
      const date = new Date('2024-06-17');
      expect(formatDateElegant(date)).toBe('Jun 17, 2024');
    });

    it('handles all 12 months correctly', () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      months.forEach((monthName, index) => {
        const date = new Date(2024, index, 15);
        const formatted = formatDateElegant(date);
        expect(formatted).toContain(monthName);
        expect(formatted).toContain('15');
        expect(formatted).toContain('2024');
      });
    });
  });

  describe('generateCalendarDates Function', () => {
    it('generates single day range correctly', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-15');

      const result = generateCalendarDates(startDate, endDate);

      expect(result.length).toBe(1);
      expect(result[0].getDate()).toBe(15);
    });

    it('generates week range correctly', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      const result = generateCalendarDates(startDate, endDate);

      expect(result.length).toBe(7); // 7 days
    });

    it('generates month range correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = generateCalendarDates(startDate, endDate);

      expect(result.length).toBe(31); // 31 days in January
    });

    it('includes both start and end dates', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');

      const result = generateCalendarDates(startDate, endDate);

      expect(result[0].getDate()).toBe(15);
      expect(result[result.length - 1].getDate()).toBe(17);
    });

    it('handles month boundary crossing', () => {
      const startDate = new Date('2024-01-30');
      const endDate = new Date('2024-02-02');

      const result = generateCalendarDates(startDate, endDate);

      expect(result.length).toBe(4); // Jan 30, 31, Feb 1, 2
      expect(result[0].getMonth()).toBe(0); // January
      expect(result[result.length - 1].getMonth()).toBe(1); // February
    });

    it('handles year boundary crossing', () => {
      const startDate = new Date('2024-12-30');
      const endDate = new Date('2025-01-02');

      const result = generateCalendarDates(startDate, endDate);

      expect(result.length).toBe(4);
      expect(result[0].getFullYear()).toBe(2024);
      expect(result[result.length - 1].getFullYear()).toBe(2025);
    });
  });

  describe('Edge Cases: Real-world SAP Implementation Scenarios', () => {
    it('handles typical 6-month project with all holidays', () => {
      const startDate = new Date('2024-01-02'); // Tuesday

      // 120 working days (~6 months)
      const result = businessDayToDate(startDate, 120, DEFAULT_HOLIDAYS);

      // Should be around July 2024
      expect(result.getMonth()).toBeGreaterThanOrEqual(5); // June or later
      expect(result.getFullYear()).toBe(2024);
    });

    it('handles 12-month project crossing year boundary', () => {
      const startDate = new Date('2024-06-01');

      // 250 working days (~1 year)
      const result = businessDayToDate(startDate, 250, DEFAULT_HOLIDAYS);

      // Should be around May/June 2025
      expect(result.getFullYear()).toBe(2025);
    });

    it('handles project starting on Friday', () => {
      const startDate = new Date('2024-01-05'); // Friday

      // +10 business days
      const result = businessDayToDate(startDate, 10);

      // Should cross 2 weekends
      expect(result.getDate()).toBe(19); // Friday 2 weeks later
    });

    it('handles project starting on Monday before holiday', () => {
      const startDate = new Date('2024-12-23'); // Monday

      // +5 business days with Christmas holiday
      const result = businessDayToDate(startDate, 5, DEFAULT_HOLIDAYS);

      // Should skip Christmas (Dec 25) and weekend
      expect(result.getDate()).toBeGreaterThan(25);
    });

    it('calculates accurate project duration with all complexity factors', () => {
      // Real scenario: 90-day project starting mid-year
      const startDate = new Date('2024-06-01');

      const endDate = calculateEndDate(startDate, 90, DEFAULT_HOLIDAYS);

      // Should account for multiple holidays and weekends
      expect(endDate.getMonth()).toBeGreaterThanOrEqual(8); // September or later
    });
  });

  describe('Boundary Conditions', () => {
    it('handles start date at beginning of time (1970)', () => {
      const startDate = new Date('1970-01-01');

      const result = businessDayToDate(startDate, 5);

      expect(result.getFullYear()).toBe(1970);
    });

    it('handles far future dates (2100)', () => {
      const startDate = new Date('2100-01-01');

      const result = businessDayToDate(startDate, 10);

      expect(result.getFullYear()).toBe(2100);
    });

    it('handles maximum safe integer for business days', () => {
      const startDate = new Date('2024-01-01');

      // Very large number (but not infinite)
      const result = businessDayToDate(startDate, 1000);

      expect(result.getFullYear()).toBeGreaterThan(2024);
    });
  });

  describe('Timezone Handling', () => {
    it('correctly handles midnight boundary', () => {
      const midnight = new Date('2024-01-15T00:00:00');

      const result = businessDayToDate(midnight, 1);

      expect(result.getDate()).toBe(16);
    });

    it('handles dates with time components', () => {
      const dateWithTime = new Date('2024-01-15T14:30:00');

      const result = businessDayToDate(dateWithTime, 1);

      expect(result.getDate()).toBe(16);
    });

    it('maintains date consistency across operations', () => {
      const startDate = new Date('2024-01-15');

      const result1 = businessDayToDate(startDate, 5);
      const result2 = businessDayToDate(startDate, 5);

      expect(result1.getTime()).toBe(result2.getTime());
    });
  });
});
