/**
 * Timeline Granularity Utilities
 *
 * Provides smart timeline bucketing and Excel column mapping for exports.
 * Extracted from v1.6 export wiring specification.
 */

export type TimelineGranularity = "W" | "2W" | "M" | "Q" | "H";

/**
 * Get bucket size in weeks for a given granularity
 */
export function bucketSizeWeeks(granularity: TimelineGranularity): number {
  switch (granularity) {
    case "W":
      return 1; // Weekly
    case "2W":
      return 2; // Bi-weekly
    case "M":
      return 4; // Monthly (4 weeks)
    case "Q":
      return 13; // Quarterly (13 weeks)
    case "H":
      return 26; // Half-yearly (26 weeks)
    default:
      return 1;
  }
}

/**
 * Choose appropriate timeline granularity based on total project weeks
 *
 * Confirmed thresholds:
 * - ≤52 weeks (1 year) → W (weekly)
 * - ≤104 weeks (2 years) → 2W (bi-weekly)
 * - ≤156 weeks (3 years) → M (monthly)
 * - ≤260 weeks (5 years) → Q (quarterly)
 * - >260 weeks → H (half-yearly)
 */
export function chooseTimelineGranularity(totalWeeks: number): TimelineGranularity {
  if (totalWeeks <= 52) return "W";
  if (totalWeeks <= 104) return "2W";
  if (totalWeeks <= 156) return "M";
  if (totalWeeks <= 260) return "Q";
  return "H";
}

/**
 * Generate timeline bucket labels for Excel columns
 *
 * Examples:
 * - W: W01, W02, W03, ...
 * - 2W: 2W-01, 2W-02, 2W-03, ...
 * - M: M-01, M-02, M-03, ...
 * - Q: Q-01, Q-02, Q-03, ...
 * - H: H-01, H-02, H-03, ...
 */
export function timelineLabels(granularity: TimelineGranularity, totalWeeks: number): string[] {
  const size = bucketSizeWeeks(granularity);
  const buckets = Math.ceil(totalWeeks / size);

  return Array.from({ length: buckets }, (_, i) => {
    const bucketNum = String(i + 1).padStart(2, "0");
    return granularity === "W" ? `W${bucketNum}` : `${granularity}-${bucketNum}`;
  });
}

/**
 * Map a task's week span to Excel column indices
 *
 * Base columns A-G are reserved for metadata (Task, Workstream, Role, etc.)
 * Time columns start at H (index 8)
 *
 * @param startWeek - 1-based week number (e.g., 1 = first week)
 * @param durationWeeks - number of weeks the task spans
 * @param granularity - timeline bucket size
 * @returns [startColumn, endColumn] - 1-based Excel column indices
 */
export function weekSpanToExcelColumns(
  startWeek: number,
  durationWeeks: number,
  granularity: TimelineGranularity = "W"
): [number, number] {
  // Base columns A..G reserved → start at H (index 8)
  const baseCol = 8;
  const size = bucketSizeWeeks(granularity);

  // Calculate which buckets this task spans
  const startBucket = Math.floor((startWeek - 1) / size);
  const endBucket = Math.floor((startWeek - 1 + Math.max(0, durationWeeks - 1)) / size);

  const startCol = baseCol + startBucket;
  const endCol = baseCol + endBucket;

  return [startCol, endCol];
}

/**
 * Calculate total weeks from start and end dates
 */
export function calculateTotalWeeks(startDate: Date, endDate: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / msPerWeek);
}

/**
 * Format column number to Excel letter notation (1=A, 2=B, ..., 27=AA)
 */
export function columnNumberToLetter(colNum: number): string {
  let letter = "";
  let num = colNum;

  while (num > 0) {
    const remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }

  return letter;
}
