import { parseScheduleData } from "../schedule-parser";

describe("Schedule Parser", () => {
  describe("Valid Input", () => {
    it("should parse valid TSV data", () => {
      const input =
        "Discovery\tTask 1\t2026-01-01\t2026-01-15\nDesign\tTask 2\t2026-01-16\t2026-01-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases.length).toBe(2);
      expect(result.data?.totalTasks).toBe(2);
    });

    it("should handle multiple date formats", () => {
      const input =
        "Discovery\tTask 1\t01/01/2026\t2026-01-15\nDesign\tTask 2\t2026-01-16\t31/01/2026";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.totalTasks).toBe(2);
    });

    it("should group tasks by phase", () => {
      const input =
        "Discovery\tTask 1\t2026-01-01\t2026-01-15\nDiscovery\tTask 2\t2026-01-16\t2026-01-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases.length).toBe(1);
      expect(result.data?.phases[0].tasks.length).toBe(2);
    });

    it("should calculate project date range", () => {
      const input =
        "Discovery\tTask 1\t2026-01-01\t2026-01-15\nDesign\tTask 2\t2026-02-01\t2026-03-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.projectStartDate).toBe("2026-01-01");
      expect(result.data?.projectEndDate).toBe("2026-03-31");
    });

    it("should skip header row", () => {
      const input =
        "Phase Name\tTask Name\tStart Date\tEnd Date\nDiscovery\tTask 1\t2026-01-01\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.totalTasks).toBe(1);
    });

    it("should calculate phase date ranges", () => {
      const input =
        "Discovery\tTask 1\t2026-01-01\t2026-01-15\nDiscovery\tTask 2\t2026-01-10\t2026-01-20";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases[0].startDate).toBe("2026-01-01");
      expect(result.data?.phases[0].endDate).toBe("2026-01-20");
    });

    it("should calculate duration in days", () => {
      const input = "Discovery\tTask 1\t2026-01-01\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.durationDays).toBe(15);
    });

    it("should handle same start and end date", () => {
      const input = "Discovery\tTask 1\t2026-01-01\t2026-01-01";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.totalTasks).toBe(1);
    });
  });

  describe("Validation Errors", () => {
    it("should reject empty input", () => {
      const result = parseScheduleData("");

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("No data");
    });

    it("should reject whitespace-only input", () => {
      const result = parseScheduleData("   \n  \n  ");

      expect(result.success).toBe(false);
      // Whitespace-only input gets trimmed to empty, so we get "No data provided"
      expect(result.errors[0].message).toContain("No");
    });

    it("should reject missing phase name", () => {
      const input = "\tTask 1\t2026-01-01\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // The parser should detect empty phase name
      expect(result.errors[0].column).toBe("phase");
      expect(result.errors[0].message).toContain("required");
    });

    it("should reject missing task name", () => {
      const input = "Discovery\t\t2026-01-01\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].column).toBe("task");
      expect(result.errors[0].message).toContain("required");
    });

    it("should reject missing start date", () => {
      const input = "Discovery\tTask 1\t\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].column).toBe("startDate");
      expect(result.errors[0].message).toContain("required");
    });

    it("should reject missing end date", () => {
      const input = "Discovery\tTask 1\t2026-01-01\t";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].column).toBe("endDate");
      expect(result.errors[0].message).toContain("required");
    });

    it("should reject invalid date format", () => {
      const input = "Discovery\tTask 1\t32/01/2026\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].column).toBe("startDate");
      expect(result.errors[0].message).toContain("Invalid");
    });

    it("should reject start date after end date", () => {
      const input = "Discovery\tTask 1\t2026-01-15\t2026-01-01";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("before or equal");
    });

    it("should reject input that is too large", () => {
      const largeInput = "x".repeat(600_000);
      const result = parseScheduleData(largeInput);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("too large");
    });

    it("should reject SQL injection attempts", () => {
      const input = "DROP TABLE\tTask 1\t2026-01-01\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("forbidden");
    });

    it("should reject XSS attempts", () => {
      const input = '<script>alert("xss")</script>\tTask 1\t2026-01-01\t2026-01-15';
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("forbidden");
    });

    it("should reject XSS in task name", () => {
      const input = "Discovery\t<script>alert(1)</script>\t2026-01-01\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("forbidden");
    });

    it("should reject javascript: protocol", () => {
      const input = "javascript:alert(1)\tTask 1\t2026-01-01\t2026-01-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("forbidden");
    });

    it("should reject too many tasks", () => {
      const lines = Array(6000).fill("Discovery\tTask X\t2026-01-01\t2026-01-15");
      const input = lines.join("\n");
      const result = parseScheduleData(input);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("Too many tasks");
    });
  });

  describe("Warnings", () => {
    it("should warn for large projects", () => {
      const lines = Array(1500).fill("Discovery\tTask X\t2026-01-01\t2026-01-15");
      const input = lines.join("\n");
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Large project");
    });

    it("should warn for very long tasks", () => {
      const input = "Discovery\tLong Task\t2026-01-01\t2026-12-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("days long");
    });

    it("should include task name in warning", () => {
      const input = "Discovery\tMy Long Task\t2026-01-01\t2026-12-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.warnings[0]).toContain("My Long Task");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty lines in middle of data", () => {
      const input =
        "Discovery\tTask 1\t2026-01-01\t2026-01-15\n\n\nDesign\tTask 2\t2026-01-16\t2026-01-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.totalTasks).toBe(2);
    });

    it("should handle Windows line endings (CRLF)", () => {
      const input =
        "Discovery\tTask 1\t2026-01-01\t2026-01-15\r\nDesign\tTask 2\t2026-01-16\t2026-01-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.totalTasks).toBe(2);
    });

    it("should trim whitespace from cells", () => {
      const input = "  Discovery  \t  Task 1  \t  2026-01-01  \t  2026-01-15  ";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases[0].name).toBe("Discovery");
      expect(result.data?.phases[0].tasks[0].name).toBe("Task 1");
    });

    it("should sanitize HTML entities", () => {
      const input = 'Discovery & Design\tTask "1"\t2026-01-01\t2026-01-15';
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases[0].name).toContain("&amp;");
      expect(result.data?.phases[0].tasks[0].name).toContain("&quot;");
    });

    it("should truncate very long field names", () => {
      const longName = "A".repeat(300);
      const input = `${longName}\tTask 1\t2026-01-01\t2026-01-15`;
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases[0].name.length).toBeLessThanOrEqual(200);
    });

    it("should handle multiple phases with same name", () => {
      const input =
        "Discovery\tTask 1\t2026-01-01\t2026-01-15\nDiscovery\tTask 2\t2026-01-16\t2026-01-31\nDiscovery\tTask 3\t2026-02-01\t2026-02-15";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases.length).toBe(1);
      expect(result.data?.phases[0].tasks.length).toBe(3);
    });
  });

  describe("Date Format Support", () => {
    it("should parse YYYY-MM-DD format", () => {
      const input = "Discovery\tTask 1\t2026-01-15\t2026-01-31";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases[0].tasks[0].startDate).toBe("2026-01-15");
    });

    it("should parse DD/MM/YYYY format", () => {
      const input = "Discovery\tTask 1\t15/01/2026\t31/01/2026";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.totalTasks).toBe(1);
    });

    it("should parse MM/DD/YYYY format", () => {
      const input = "Discovery\tTask 1\t01/15/2026\t01/31/2026";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.totalTasks).toBe(1);
    });

    it("should normalize all dates to YYYY-MM-DD in output", () => {
      const input = "Discovery\tTask 1\t15/01/2026\t01/31/2026";
      const result = parseScheduleData(input);

      expect(result.success).toBe(true);
      expect(result.data?.phases[0].tasks[0].startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.data?.phases[0].tasks[0].endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
