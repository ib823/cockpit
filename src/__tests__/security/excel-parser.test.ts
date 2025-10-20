/**
 * Unit Tests for Excel Parser Date Validation (Issue #12 Fix)
 */

import { parseExcelTemplate } from '@/lib/gantt-tool/excel-template-parser';

describe('Excel Parser - Date Validation (Issue #12 Fix)', () => {
  describe('Valid date formats', () => {
    it('should parse ISO format dates', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26\t9-Feb-26
Discovery\tRequirements\t2026-02-02\t2026-02-09\t5\t5`;

      const result = parseExcelTemplate(tsvData);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].startDate).toBe('2026-02-02');
      expect(result.tasks[0].endDate).toBe('2026-02-09');
    });

    it('should parse human-readable dates with commas', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tRequirements\tMonday, 2 February, 2026\tMonday, 9 February, 2026\t5`;

      const result = parseExcelTemplate(tsvData);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].startDate).toBe('2026-02-02');
    });

    it('should parse human-readable dates without commas', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tRequirements\tMonday, 2 February 2026\tMonday, 9 February 2026\t5`;

      const result = parseExcelTemplate(tsvData);
      expect(result.tasks).toHaveLength(1);
    });
  });

  describe('Invalid date handling (Issue #12 Fix)', () => {
    it('should reject invalid dates with clear error message', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tRequirements\tinvalid-date\t2026-02-09\t5`;

      expect(() => parseExcelTemplate(tsvData)).toThrow(/Invalid date format/);
      expect(() => parseExcelTemplate(tsvData)).toThrow(/invalid-date/);
    });

    it('should reject empty dates', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tRequirements\t\t2026-02-09\t5`;

      expect(() => parseExcelTemplate(tsvData)).toThrow(/Empty date value/);
    });

    it('should reject out-of-range dates', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tRequirements\t2026-13-99\t2026-02-09\t5`;

      expect(() => parseExcelTemplate(tsvData)).toThrow(/Invalid date format/);
    });

    it('should list all invalid dates in error message', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tTask1\tinvalid1\t2026-02-09\t5
Discovery\tTask2\t2026-02-02\tinvalid2\t5
Discovery\tTask3\tinvalid3\tinvalid4\t5`;

      expect(() => parseExcelTemplate(tsvData)).toThrow(/Found 4 invalid date/);
    });

    it('should show which row has the error', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tRequirements\tbad-date\t2026-02-09\t5`;

      expect(() => parseExcelTemplate(tsvData)).toThrow(/Row 2/);
      expect(() => parseExcelTemplate(tsvData)).toThrow(/Requirements/);
    });

    it('should suggest correct date formats', () => {
      const tsvData = `Phase Name\tTask Name\tStart Date\tEnd Date\t2-Feb-26
Discovery\tRequirements\t99/99/9999\t2026-02-09\t5`;

      expect(() => parseExcelTemplate(tsvData)).toThrow(/Expected formats:/);
      expect(() => parseExcelTemplate(tsvData)).toThrow(/2026-02-02/);
      expect(() => parseExcelTemplate(tsvData)).toThrow(/Monday, 2 February, 2026/);
    });
  });

  describe('File size limits (Issue #16 Fix)', () => {
    // Note: These tests would be in ExcelTemplateImport.test.tsx
    // since the size check is at the component level
  });
});
