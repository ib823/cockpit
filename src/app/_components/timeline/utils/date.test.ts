/**
 * Business Day Utilities Tests
 * Tests edge cases: 0, weekends-only spans, holidays, time zones
 */

import { describe, it, expect } from "vitest";
import {
  parseISODate,
  formatISODate,
  isWeekend,
  isHoliday,
  isBusinessDay,
  addBusinessDays,
  diffBusinessDays,
  getNextBusinessDay,
  snapToBusinessDay,
  getDateRange,
} from "./date";

describe("parseISODate & formatISODate", () => {
  it("should parse and format correctly", () => {
    const iso = "2025-01-06";
    const date = parseISODate(iso);
    expect(formatISODate(date)).toBe(iso);
  });

  it("should handle different months", () => {
    const iso = "2024-12-25";
    const date = parseISODate(iso);
    expect(formatISODate(date)).toBe(iso);
  });
});

describe("isWeekend", () => {
  it("should identify Saturday as weekend", () => {
    const sat = parseISODate("2025-01-04"); // Saturday
    expect(isWeekend(sat)).toBe(true);
  });

  it("should identify Sunday as weekend", () => {
    const sun = parseISODate("2025-01-05"); // Sunday
    expect(isWeekend(sun)).toBe(true);
  });

  it("should identify Monday as not weekend", () => {
    const mon = parseISODate("2025-01-06"); // Monday
    expect(isWeekend(mon)).toBe(false);
  });
});

describe("isHoliday", () => {
  it("should identify holidays", () => {
    const holidays = ["2025-01-01", "2025-12-25"];
    const date = parseISODate("2025-01-01");
    expect(isHoliday(date, holidays)).toBe(true);
  });

  it("should return false for non-holidays", () => {
    const holidays = ["2025-01-01"];
    const date = parseISODate("2025-01-06");
    expect(isHoliday(date, holidays)).toBe(false);
  });
});

describe("isBusinessDay", () => {
  it("should return true for weekday non-holiday", () => {
    const mon = parseISODate("2025-01-06"); // Monday
    expect(isBusinessDay(mon, [])).toBe(true);
  });

  it("should return false for weekend", () => {
    const sat = parseISODate("2025-01-04"); // Saturday
    expect(isBusinessDay(sat, [])).toBe(false);
  });

  it("should return false for holiday on weekday", () => {
    const mon = parseISODate("2025-01-06"); // Monday
    expect(isBusinessDay(mon, ["2025-01-06"])).toBe(false);
  });
});

describe("addBusinessDays", () => {
  it("should handle 0 business days", () => {
    const start = "2025-01-06"; // Monday
    const result = addBusinessDays(start, 0);
    expect(result).toBe(start);
  });

  it("should add 1 business day", () => {
    const start = "2025-01-06"; // Monday
    const result = addBusinessDays(start, 1);
    expect(result).toBe("2025-01-07"); // Tuesday
  });

  it("should skip weekends", () => {
    const start = "2025-01-03"; // Friday
    const result = addBusinessDays(start, 1);
    expect(result).toBe("2025-01-06"); // Monday
  });

  it("should skip holidays", () => {
    const start = "2025-01-06"; // Monday
    const holidays = ["2025-01-07"];
    const result = addBusinessDays(start, 1, holidays);
    expect(result).toBe("2025-01-08"); // Wednesday
  });

  it("should handle negative business days", () => {
    const start = "2025-01-08"; // Wednesday
    const result = addBusinessDays(start, -1);
    expect(result).toBe("2025-01-07"); // Tuesday
  });

  it("should skip weekends when going backward", () => {
    const start = "2025-01-06"; // Monday
    const result = addBusinessDays(start, -1);
    expect(result).toBe("2025-01-03"); // Friday
  });

  it("should handle multi-day spans across weekends", () => {
    const start = "2025-01-03"; // Friday
    const result = addBusinessDays(start, 5);
    expect(result).toBe("2025-01-10"); // Friday next week
  });

  it("should handle weekend-only spans", () => {
    const start = "2025-01-04"; // Saturday
    const result = addBusinessDays(start, 1);
    expect(result).toBe("2025-01-06"); // Monday
  });
});

describe("diffBusinessDays", () => {
  it("should return 0 for same day", () => {
    const start = "2025-01-06";
    const end = "2025-01-06";
    expect(diffBusinessDays(start, end)).toBe(0);
  });

  it("should count business days", () => {
    const start = "2025-01-06"; // Monday
    const end = "2025-01-08"; // Wednesday
    expect(diffBusinessDays(start, end)).toBe(2);
  });

  it("should skip weekends", () => {
    const start = "2025-01-03"; // Friday
    const end = "2025-01-06"; // Monday
    expect(diffBusinessDays(start, end)).toBe(1);
  });

  it("should handle negative diff", () => {
    const start = "2025-01-08"; // Wednesday
    const end = "2025-01-06"; // Monday
    expect(diffBusinessDays(start, end)).toBe(-2);
  });

  it("should skip holidays", () => {
    const start = "2025-01-06"; // Monday
    const end = "2025-01-09"; // Thursday
    const holidays = ["2025-01-07"];
    expect(diffBusinessDays(start, end, holidays)).toBe(2); // Skip Tue
  });
});

describe("getNextBusinessDay", () => {
  it("should return same day if business day", () => {
    const mon = "2025-01-06"; // Monday
    expect(getNextBusinessDay(mon)).toBe(mon);
  });

  it("should return Monday for Saturday", () => {
    const sat = "2025-01-04"; // Saturday
    expect(getNextBusinessDay(sat)).toBe("2025-01-06"); // Monday
  });

  it("should return Monday for Sunday", () => {
    const sun = "2025-01-05"; // Sunday
    expect(getNextBusinessDay(sun)).toBe("2025-01-06"); // Monday
  });

  it("should skip holiday on Monday", () => {
    const sat = "2025-01-04"; // Saturday
    const holidays = ["2025-01-06"];
    expect(getNextBusinessDay(sat, holidays)).toBe("2025-01-07"); // Tuesday
  });
});

describe("snapToBusinessDay", () => {
  it("should return same day if business day", () => {
    const mon = "2025-01-06"; // Monday
    expect(snapToBusinessDay(mon)).toBe(mon);
  });

  it("should snap forward by default", () => {
    const sat = "2025-01-04"; // Saturday
    expect(snapToBusinessDay(sat)).toBe("2025-01-06"); // Monday
  });

  it("should snap backward", () => {
    const sat = "2025-01-04"; // Saturday
    expect(snapToBusinessDay(sat, [], "backward")).toBe("2025-01-03"); // Friday
  });

  it("should snap to nearest", () => {
    const sat = "2025-01-04"; // Saturday (1 day to Fri, 2 days to Mon)
    expect(snapToBusinessDay(sat, [], "nearest")).toBe("2025-01-03"); // Friday
  });
});

describe("getDateRange", () => {
  it("should return all dates in range", () => {
    const start = "2025-01-06";
    const end = "2025-01-08";
    const range = getDateRange(start, end);
    expect(range).toEqual(["2025-01-06", "2025-01-07", "2025-01-08"]);
  });

  it("should handle single day", () => {
    const start = "2025-01-06";
    const end = "2025-01-06";
    const range = getDateRange(start, end);
    expect(range).toEqual(["2025-01-06"]);
  });
});
