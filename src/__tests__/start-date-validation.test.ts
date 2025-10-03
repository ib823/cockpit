// src/__tests__/start-date-validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateStartDate, getRecommendedStartDate } from '@/lib/timeline/date-validation';

describe('Start Date Validation', () => {
  it('rejects past dates', () => {
    const pastDate = new Date('2020-01-01');
    const result = validateStartDate(pastDate);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('past');
  });

  it('rejects dates less than 1 month away', () => {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    const result = validateStartDate(twoWeeksFromNow);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('1 month');
  });

  it('accepts dates 1+ months away', () => {
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
    const result = validateStartDate(twoMonthsFromNow);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('recommended start date is at least 1 month away', () => {
    const recommended = getRecommendedStartDate();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    expect(recommended.getTime()).toBeGreaterThan(oneMonthFromNow.getTime());
  });
});
