/**
 * Unit Tests for Gantt Tool Formatters
 *
 * Testing all formatting utilities to ensure:
 * 1. No floating point precision errors
 * 2. Consistent number formatting
 * 3. Proper edge case handling
 * 4. Jobs/Ive single-format principle compliance
 */

import { describe, it, expect } from "vitest";
import {
  formatPercentage,
  formatDecimal,
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatDuration,
  formatDurationWithContext,
} from "../formatters";

describe("formatPercentage", () => {
  describe("Basic Functionality", () => {
    it("should format decimal to percentage with 1 decimal place by default", () => {
      expect(formatPercentage(0.9167)).toBe("91.7%");
    });

    it("should handle the infamous floating point bug case", () => {
      const result = formatPercentage(22 / 24);
      expect(result).toBe("91.7%");
      expect(result).not.toBe("91.66666666666666%"); // The bug we fixed!
    });

    it("should format with custom decimal places", () => {
      expect(formatPercentage(0.9167, 0)).toBe("92%");
      expect(formatPercentage(0.9167, 1)).toBe("91.7%");
      expect(formatPercentage(0.9167, 2)).toBe("91.67%");
      expect(formatPercentage(0.9167, 3)).toBe("91.670%");
    });

    it("should handle values already in percentage form (>1)", () => {
      expect(formatPercentage(91.7)).toBe("91.7%");
      expect(formatPercentage(100)).toBe("100.0%");
    });

    it("should handle 0%", () => {
      expect(formatPercentage(0)).toBe("0.0%");
      expect(formatPercentage(0, 0)).toBe("0%");
    });

    it("should handle 100%", () => {
      expect(formatPercentage(1)).toBe("100.0%");
      expect(formatPercentage(100)).toBe("100.0%");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null as 0%", () => {
      expect(formatPercentage(null as any)).toBe("0%");
    });

    it("should handle undefined as 0%", () => {
      expect(formatPercentage(undefined as any)).toBe("0%");
    });

    it("should handle NaN as 0%", () => {
      expect(formatPercentage(NaN)).toBe("0%");
    });

    it("should handle very small numbers", () => {
      expect(formatPercentage(0.001)).toBe("0.1%");
      expect(formatPercentage(0.0001)).toBe("0.0%");
    });

    it("should handle very large numbers", () => {
      expect(formatPercentage(999.99)).toBe("1000.0%");
    });

    it("should handle negative numbers", () => {
      expect(formatPercentage(-0.5)).toBe("-50.0%");
    });
  });

  describe("Real-world Mission Control Values", () => {
    it("should format budget utilization", () => {
      expect(formatPercentage(453000 / 1000000)).toBe("45.3%");
    });

    it("should format schedule progress", () => {
      expect(formatPercentage(58 / 314)).toBe("18.5%");
    });

    it("should format task completion", () => {
      expect(formatPercentage(4 / 19)).toBe("21.1%");
    });

    it("should format resource utilization", () => {
      expect(formatPercentage(22 / 24)).toBe("91.7%");
    });
  });
});

describe("formatDecimal", () => {
  it("should format number with 1 decimal place by default", () => {
    expect(formatDecimal(91.666666)).toBe("91.7");
  });

  it("should format with custom decimal places", () => {
    expect(formatDecimal(91.666666, 0)).toBe("92");
    expect(formatDecimal(91.666666, 2)).toBe("91.67");
    expect(formatDecimal(91.666666, 3)).toBe("91.667");
  });

  it("should handle edge cases", () => {
    expect(formatDecimal(null as any)).toBe("0");
    expect(formatDecimal(undefined as any)).toBe("0");
    expect(formatDecimal(NaN)).toBe("0");
  });

  it("should handle integers", () => {
    expect(formatDecimal(100)).toBe("100.0");
    expect(formatDecimal(100, 0)).toBe("100");
  });
});

describe("formatCurrency", () => {
  describe("Basic Formatting", () => {
    it("should format whole dollar amounts", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000");
      expect(formatCurrency(0)).toBe("$0");
      expect(formatCurrency(100)).toBe("$100");
    });

    it("should format with decimals when specified", () => {
      expect(formatCurrency(1234.56, "USD", 2)).toBe("$1,234.56");
      expect(formatCurrency(1000000.99, "USD", 2)).toBe("$1,000,000.99");
    });

    it("should handle zero as $0", () => {
      expect(formatCurrency(0)).toBe("$0");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined as $0", () => {
      expect(formatCurrency(null as any)).toBe("$0");
      expect(formatCurrency(undefined as any)).toBe("$0");
      expect(formatCurrency(NaN)).toBe("$0");
    });

    it("should handle negative amounts", () => {
      expect(formatCurrency(-1000)).toBe("-$1,000");
    });

    it("should handle very large amounts", () => {
      expect(formatCurrency(999999999)).toBe("$999,999,999");
    });
  });

  describe("Real-world Project Values", () => {
    it("should format project budget", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000");
    });

    it("should format actual costs", () => {
      expect(formatCurrency(453000)).toBe("$453,000");
    });

    it("should format remaining budget", () => {
      expect(formatCurrency(547000)).toBe("$547,000");
    });
  });
});

describe("formatCompactCurrency", () => {
  it("should format thousands with K", () => {
    expect(formatCompactCurrency(1000)).toBe("$1.0K");
    expect(formatCompactCurrency(15000)).toBe("$15.0K");
    expect(formatCompactCurrency(999000)).toBe("$999.0K");
  });

  it("should format millions with M", () => {
    expect(formatCompactCurrency(1000000)).toBe("$1.0M");
    expect(formatCompactCurrency(1500000)).toBe("$1.5M");
    expect(formatCompactCurrency(999000000)).toBe("$999.0M");
  });

  it("should format billions with B", () => {
    expect(formatCompactCurrency(1000000000)).toBe("$1.0B");
    expect(formatCompactCurrency(1500000000)).toBe("$1.5B");
  });

  it("should format small amounts without suffix", () => {
    expect(formatCompactCurrency(100)).toBe("$100.0");
    expect(formatCompactCurrency(999)).toBe("$999.0");
  });

  it("should handle edge cases", () => {
    expect(formatCompactCurrency(0)).toBe("$0.0");
    expect(formatCompactCurrency(null as any)).toBe("$0");
    expect(formatCompactCurrency(undefined as any)).toBe("$0");
  });

  it("should use custom decimal places", () => {
    expect(formatCompactCurrency(1500000, 0)).toBe("$2M");
    expect(formatCompactCurrency(1500000, 2)).toBe("$1.50M");
  });
});

describe("formatNumber", () => {
  it("should format with thousand separators", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(12345)).toBe("12,345");
  });

  it("should handle small numbers", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(100)).toBe("100");
    expect(formatNumber(999)).toBe("999");
  });

  it("should handle edge cases", () => {
    expect(formatNumber(null as any)).toBe("0");
    expect(formatNumber(undefined as any)).toBe("0");
    expect(formatNumber(NaN)).toBe("0");
  });
});

describe("formatDuration", () => {
  describe("Jobs/Ive Single Format Principle", () => {
    it("should show days for short durations", () => {
      expect(formatDuration(1)).toBe("1 day");
      expect(formatDuration(2)).toBe("2 days");
      expect(formatDuration(3)).toBe("3 days");
      expect(formatDuration(10)).toBe("10 days");
      expect(formatDuration(13)).toBe("13 days");
    });

    it("should show weeks for medium durations", () => {
      expect(formatDuration(14)).toBe("2 weeks");
      expect(formatDuration(21)).toBe("3 weeks");
      expect(formatDuration(28)).toBe("4 weeks");
      expect(formatDuration(35)).toBe("5 weeks");
      expect(formatDuration(56)).toBe("8 weeks");
      expect(formatDuration(84)).toBe("12 weeks");
    });

    it("should show months for long durations", () => {
      expect(formatDuration(100)).toBe("3 months"); // 100/30 = 3.3 -> 3
      expect(formatDuration(120)).toBe("4 months"); // 120/30 = 4
      expect(formatDuration(240)).toBe("8 months"); // 240/30 = 8
      expect(formatDuration(360)).toBe("12 months"); // 360/30 = 12
    });
  });

  describe("Edge Cases", () => {
    it("should handle 0 days", () => {
      expect(formatDuration(0)).toBe("0 days");
    });

    it("should handle null/undefined", () => {
      expect(formatDuration(null as any)).toBe("0 days");
      expect(formatDuration(undefined as any)).toBe("0 days");
      expect(formatDuration(NaN)).toBe("0 days");
    });

    it("should handle boundary between days and weeks", () => {
      expect(formatDuration(13)).toBe("13 days"); // < 14 days
      expect(formatDuration(14)).toBe("2 weeks"); // >= 14 days
    });

    it("should handle boundary between weeks and months", () => {
      // < 85 days stays in weeks, >= 85 days goes to months
      expect(formatDuration(84)).toBe("12 weeks"); // 84/7 = 12 weeks
      expect(formatDuration(85)).toBe("3 months"); // 85/30 = 2.8 -> 3 months
      expect(formatDuration(90)).toBe("3 months"); // 90/30 = 3 months
      expect(formatDuration(120)).toBe("4 months"); // 120/30 = 4 months
    });
  });

  describe("Real-world Phase Durations", () => {
    it("should format user requirements study (114 days)", () => {
      const result = formatDuration(114);
      expect(result).toBe("4 months"); // 114/30 = 3.8 -> 4
      // Most importantly: NOT "83d • 4 months (114 days)"!
    });

    it("should format pilot implementation (150 days)", () => {
      // 150/30 = 5 months
      expect(formatDuration(150)).toBe("5 months");
    });

    it("should format sprint duration (10 days)", () => {
      expect(formatDuration(10)).toBe("10 days");
    });
  });

  describe("Regression Tests - The Bugs We Fixed", () => {
    it("should NEVER return multiple formats in one string", () => {
      const result = formatDuration(83);
      // Should NOT be: "83d • 4 months (114 days)"
      // Should be: "4 months"
      expect(result).not.toContain("•");
      expect(result).not.toContain("(");
      expect(result).not.toContain(")");
      expect(result.split(" ").length).toBeLessThanOrEqual(2); // "X unit" format only
    });

    it("should maintain consistency across multiple calls", () => {
      const duration = 114;
      const result1 = formatDuration(duration);
      const result2 = formatDuration(duration);
      const result3 = formatDuration(duration);
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});

describe("formatDurationWithContext", () => {
  it("should return base duration when calendar days are similar", () => {
    // 5 working days, 7 calendar days (includes weekend)
    expect(formatDurationWithContext(5, 7)).toBe("5 days");
  });

  it("should add calendar days when significantly different", () => {
    // 20 working days, 35 calendar days (many holidays)
    // 20 days < 85 days, so becomes 3 weeks
    expect(formatDurationWithContext(20, 35)).toBe("3 weeks (35cd)");
  });

  it("should handle edge cases", () => {
    expect(formatDurationWithContext(0, 0)).toBe("0 days");
    expect(formatDurationWithContext(1, 1)).toBe("1 day");
  });

  it("should only add context when calendar days > working days * 1.4", () => {
    // Exactly 1.4x (boundary)
    expect(formatDurationWithContext(10, 14)).toBe("10 days");

    // More than 1.4x (should show context)
    expect(formatDurationWithContext(10, 15)).toBe("10 days (15cd)");
  });
});

/**
 * Integration Tests - Full Workflow
 */
describe("Integration: Mission Control Dashboard", () => {
  it("should format all metrics correctly for realistic project", () => {
    const project = {
      budget: 1000000,
      actualCost: 453000,
      totalDays: 314,
      elapsedDays: 58,
      totalTasks: 19,
      completedTasks: 4,
      totalResources: 24,
      assignedResources: 22,
    };

    // Budget Utilization
    const budgetUtil = formatPercentage(project.actualCost / project.budget);
    expect(budgetUtil).toBe("45.3%");

    // Schedule Progress
    const scheduleProgress = formatPercentage(project.elapsedDays / project.totalDays);
    expect(scheduleProgress).toBe("18.5%");

    // Task Completion
    const taskCompletion = formatPercentage(project.completedTasks / project.totalTasks);
    expect(taskCompletion).toBe("21.1%");

    // Resource Utilization
    const resourceUtil = formatPercentage(project.assignedResources / project.totalResources);
    expect(resourceUtil).toBe("91.7%");

    // Cost Display
    const totalCost = formatCurrency(project.actualCost);
    expect(totalCost).toBe("$453,000");

    const remaining = formatCurrency(project.budget - project.actualCost);
    expect(remaining).toBe("$547,000");
  });
});

/**
 * Performance Tests - Ensure no performance regressions
 */
describe("Performance", () => {
  it("should format 10,000 percentages in under 100ms", () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      formatPercentage(i / 10000);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it("should format 10,000 currencies in under 1000ms", () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      formatCurrency(i * 1000);
    }
    const duration = performance.now() - start;
    // Currency formatting is slower due to Intl.NumberFormat
    // Threshold increased to 1000ms to account for slower CI environments
    // (typically runs in 650-750ms but can vary based on system load)
    expect(duration).toBeLessThan(1000);
  });
});
