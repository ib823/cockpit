/**
 * Timeline Granularity Utilities - Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  bucketSizeWeeks,
  chooseTimelineGranularity,
  timelineLabels,
  weekSpanToExcelColumns,
  calculateTotalWeeks,
  columnNumberToLetter,
} from "./timeline-granularity";

describe("Timeline Granularity Utilities", () => {
  describe("bucketSizeWeeks", () => {
    it("returns correct week counts for each granularity", () => {
      expect(bucketSizeWeeks("W")).toBe(1);
      expect(bucketSizeWeeks("2W")).toBe(2);
      expect(bucketSizeWeeks("M")).toBe(4);
      expect(bucketSizeWeeks("Q")).toBe(13);
      expect(bucketSizeWeeks("H")).toBe(26);
    });
  });

  describe("chooseTimelineGranularity", () => {
    it("chooses W for projects ≤52 weeks (1 year)", () => {
      expect(chooseTimelineGranularity(1)).toBe("W");
      expect(chooseTimelineGranularity(26)).toBe("W");
      expect(chooseTimelineGranularity(52)).toBe("W");
    });

    it("chooses 2W for projects >52 and ≤104 weeks (2 years)", () => {
      expect(chooseTimelineGranularity(53)).toBe("2W");
      expect(chooseTimelineGranularity(78)).toBe("2W");
      expect(chooseTimelineGranularity(104)).toBe("2W");
    });

    it("chooses M for projects >104 and ≤156 weeks (3 years)", () => {
      expect(chooseTimelineGranularity(105)).toBe("M");
      expect(chooseTimelineGranularity(130)).toBe("M");
      expect(chooseTimelineGranularity(156)).toBe("M");
    });

    it("chooses Q for projects >156 and ≤260 weeks (5 years)", () => {
      expect(chooseTimelineGranularity(157)).toBe("Q");
      expect(chooseTimelineGranularity(200)).toBe("Q");
      expect(chooseTimelineGranularity(260)).toBe("Q");
    });

    it("chooses H for projects >260 weeks", () => {
      expect(chooseTimelineGranularity(261)).toBe("H");
      expect(chooseTimelineGranularity(300)).toBe("H");
      expect(chooseTimelineGranularity(520)).toBe("H");
    });
  });

  describe("timelineLabels", () => {
    it("generates weekly labels (W01, W02, ...)", () => {
      const labels = timelineLabels("W", 5);
      expect(labels).toEqual(["W01", "W02", "W03", "W04", "W05"]);
    });

    it("generates bi-weekly labels (2W-01, 2W-02, ...)", () => {
      const labels = timelineLabels("2W", 9);
      expect(labels).toEqual(["2W-01", "2W-02", "2W-03", "2W-04", "2W-05"]);
    });

    it("generates monthly labels (M-01, M-02, ...)", () => {
      const labels = timelineLabels("M", 17);
      expect(labels).toEqual(["M-01", "M-02", "M-03", "M-04", "M-05"]);
    });

    it("generates quarterly labels (Q-01, Q-02, ...)", () => {
      const labels = timelineLabels("Q", 26);
      expect(labels).toEqual(["Q-01", "Q-02"]);
    });

    it("pads label numbers with leading zeros", () => {
      const labels = timelineLabels("W", 15);
      expect(labels[0]).toBe("W01");
      expect(labels[8]).toBe("W09");
      expect(labels[9]).toBe("W10");
    });
  });

  describe("weekSpanToExcelColumns", () => {
    it("returns correct column indices for weekly granularity", () => {
      // Week 1, 4 weeks duration → columns 8-11
      expect(weekSpanToExcelColumns(1, 4, "W")).toEqual([8, 11]);

      // Week 3, 2 weeks duration → columns 10-11
      expect(weekSpanToExcelColumns(3, 2, "W")).toEqual([10, 11]);
    });

    it("returns correct column indices for bi-weekly granularity", () => {
      // Week 1, 8 weeks duration (4 buckets) → columns 8-11
      expect(weekSpanToExcelColumns(1, 8, "2W")).toEqual([8, 11]);

      // Week 5, 4 weeks duration (2 buckets) → columns 10-11
      expect(weekSpanToExcelColumns(5, 4, "2W")).toEqual([10, 11]);
    });

    it("handles single-week tasks", () => {
      expect(weekSpanToExcelColumns(1, 1, "W")).toEqual([8, 8]);
      expect(weekSpanToExcelColumns(5, 1, "W")).toEqual([12, 12]);
    });

    it("base column starts at 8 (column H)", () => {
      const [start] = weekSpanToExcelColumns(1, 1, "W");
      expect(start).toBe(8);
    });
  });

  describe("calculateTotalWeeks", () => {
    it("calculates weeks between dates", () => {
      const start = new Date("2024-01-01");
      const end7 = new Date("2024-01-08"); // 7 days = 1 week
      const end14 = new Date("2024-01-15"); // 14 days = 2 weeks
      const end30 = new Date("2024-01-31"); // 30 days = ~4.3 weeks → ceil = 5

      expect(calculateTotalWeeks(start, end7)).toBe(1);
      expect(calculateTotalWeeks(start, end14)).toBe(2);
      expect(calculateTotalWeeks(start, end30)).toBe(5);
    });

    it("handles same-day dates", () => {
      const date = new Date("2024-01-01");
      expect(calculateTotalWeeks(date, date)).toBe(0);
    });
  });

  describe("columnNumberToLetter", () => {
    it("converts single-letter columns", () => {
      expect(columnNumberToLetter(1)).toBe("A");
      expect(columnNumberToLetter(8)).toBe("H");
      expect(columnNumberToLetter(26)).toBe("Z");
    });

    it("converts double-letter columns", () => {
      expect(columnNumberToLetter(27)).toBe("AA");
      expect(columnNumberToLetter(28)).toBe("AB");
      expect(columnNumberToLetter(52)).toBe("AZ");
      expect(columnNumberToLetter(53)).toBe("BA");
    });

    it("converts triple-letter columns", () => {
      expect(columnNumberToLetter(702)).toBe("ZZ");
      expect(columnNumberToLetter(703)).toBe("AAA");
    });
  });

  describe("Integration: Full workflow", () => {
    it("handles a 1-year project correctly", () => {
      const totalWeeks = 52;
      const granularity = chooseTimelineGranularity(totalWeeks);
      const labels = timelineLabels(granularity, totalWeeks);
      const [start, end] = weekSpanToExcelColumns(1, 4, granularity);

      expect(granularity).toBe("W");
      expect(labels.length).toBe(52);
      expect(labels[0]).toBe("W01");
      expect(labels[51]).toBe("W52");
      expect(start).toBe(8); // Column H
      expect(end).toBe(11); // Column K
    });

    it("handles a 2-year project correctly", () => {
      const totalWeeks = 104;
      const granularity = chooseTimelineGranularity(totalWeeks);
      const labels = timelineLabels(granularity, totalWeeks);

      expect(granularity).toBe("2W");
      expect(labels.length).toBe(52); // 104 weeks / 2 = 52 buckets
      expect(labels[0]).toBe("2W-01");
      expect(labels[51]).toBe("2W-52");
    });

    it("handles a 3-year project correctly", () => {
      const totalWeeks = 156;
      const granularity = chooseTimelineGranularity(totalWeeks);
      const labels = timelineLabels(granularity, totalWeeks);

      expect(granularity).toBe("M");
      expect(labels.length).toBe(39); // 156 weeks / 4 = 39 buckets
      expect(labels[0]).toBe("M-01");
      expect(labels[38]).toBe("M-39");
    });
  });
});
