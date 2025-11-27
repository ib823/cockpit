/**
 * DEPRECATED: This file has been superseded by enhanced allocations API
 *
 * The new implementation provides:
 * - User-selectable week numbering (PROJECT_RELATIVE, ISO_WEEK, CALENDAR_WEEK)
 * - Mandays field (0.00-5.00) as alternative to allocation percentage
 * - Version tracking with projectVersionId
 * - Integration with /src/lib/team-capacity/week-numbering.ts utilities
 *
 * Migration path:
 * - API endpoint /api/gantt-tool/team-capacity/allocations has been updated
 * - This file is kept for reference only
 * - DO NOT use this for new development
 *
 * Team Capacity - Weekly Allocation Generator (LEGACY)
 *
 * Generates week-by-week resource allocations from phase-level assignments
 *
 * Patterns:
 * - STEADY: Constant percentage throughout the phase duration
 * - CUSTOM: Week-by-week manual allocation (future enhancement)
 *
 * ISO 8601 Week Format: "2025-W03" (Year-W-WeekNumber)
 * - Week starts on Monday, ends on Sunday
 * - First week of year contains first Thursday
 *
 * Security: Validates allocation percentages (0-100) and date ranges
 * Performance: Batch generation with minimal database queries
 */

import { startOfWeek, endOfWeek, eachWeekOfInterval, format, parseISO, addDays } from "date-fns";
import type { AllocationPattern, ResourceWeeklyAllocation } from "@/types/gantt-tool";

// ============================================================================
// Input Types
// ============================================================================

export interface PhaseAllocationInput {
  phaseId: string;
  resourceId: string;
  phaseStartDate: string; // ISO 8601: "2025-01-15"
  phaseEndDate: string; // ISO 8601: "2025-03-31"
  allocationPercentage: number; // 0-100 (baseline percentage)
  pattern: AllocationPattern; // "STEADY" | "CUSTOM"

  // For CUSTOM pattern (future)
  customWeeklyAllocations?: {
    weekIdentifier: string; // "2025-W03"
    allocationPercent: number; // 0-100 (can differ from baseline)
  }[];
}

export interface WeeklyAllocationGeneratorInput {
  projectId: string;
  phaseAllocations: PhaseAllocationInput[];

  // Audit fields
  createdBy?: string;
}

export interface WeeklyAllocationGeneratorOutput {
  allocations: ResourceWeeklyAllocation[];
  summary: {
    totalWeeks: number;
    totalResources: number;
    totalWorkingDays: number;
    patternBreakdown: {
      steady: number;
      custom: number;
    };
  };
}

// ============================================================================
// Core Generator
// ============================================================================

/**
 * Generate weekly allocations from phase-level assignments
 */
export function generateWeeklyAllocations(
  input: WeeklyAllocationGeneratorInput
): WeeklyAllocationGeneratorOutput {
  const allocations: ResourceWeeklyAllocation[] = [];
  let totalWeeks = 0;
  const resourceSet = new Set<string>();
  let totalWorkingDays = 0;
  let steadyCount = 0;
  let customCount = 0;

  for (const phaseAllocation of input.phaseAllocations) {
    // Validate input
    validatePhaseAllocation(phaseAllocation);

    // Generate allocations based on pattern
    let weeklyAllocations: ResourceWeeklyAllocation[];

    if (phaseAllocation.pattern === "STEADY") {
      weeklyAllocations = generateSteadyAllocations(phaseAllocation, input.projectId, input.createdBy);
      steadyCount += weeklyAllocations.length;
    } else if (phaseAllocation.pattern === "CUSTOM") {
      weeklyAllocations = generateCustomAllocations(phaseAllocation, input.projectId, input.createdBy);
      customCount += weeklyAllocations.length;
    } else {
      throw new Error(`Unknown allocation pattern: ${phaseAllocation.pattern}`);
    }

    // Add to result
    allocations.push(...weeklyAllocations);

    // Update summary
    totalWeeks += weeklyAllocations.length;
    resourceSet.add(phaseAllocation.resourceId);
    totalWorkingDays += weeklyAllocations.reduce((sum, w) => sum + w.workingDays, 0);
  }

  return {
    allocations,
    summary: {
      totalWeeks,
      totalResources: resourceSet.size,
      totalWorkingDays,
      patternBreakdown: {
        steady: steadyCount,
        custom: customCount,
      },
    },
  };
}

/**
 * Generate STEADY pattern allocations (constant percentage)
 */
function generateSteadyAllocations(
  phaseAllocation: PhaseAllocationInput,
  projectId: string,
  createdBy?: string
): ResourceWeeklyAllocation[] {
  const allocations: ResourceWeeklyAllocation[] = [];

  // Parse phase dates
  const phaseStart = parseISO(phaseAllocation.phaseStartDate);
  const phaseEnd = parseISO(phaseAllocation.phaseEndDate);

  // Get all weeks in the phase date range
  const weeks = getWeeksInDateRange(phaseStart, phaseEnd);

  // Generate allocation for each week
  const now = new Date();

  for (const week of weeks) {
    // Calculate working days for this allocation
    const workingDays = calculateWorkingDays(phaseAllocation.allocationPercentage);

    const allocation: ResourceWeeklyAllocation = {
      id: generateAllocationId(),
      projectId,
      resourceId: phaseAllocation.resourceId,

      weekIdentifier: week.weekIdentifier,
      weekStartDate: week.weekStartDate,
      weekEndDate: week.weekEndDate,

      allocationPercent: phaseAllocation.allocationPercentage,
      workingDays,

      sourcePhaseId: phaseAllocation.phaseId,
      sourcePattern: "STEADY",
      isManualOverride: false,

      createdAt: now.toISOString(),
      createdBy: createdBy || undefined,
      updatedAt: now.toISOString(),
      updatedBy: undefined,
    };

    allocations.push(allocation);
  }

  return allocations;
}

/**
 * Generate CUSTOM pattern allocations (week-by-week manual)
 */
function generateCustomAllocations(
  phaseAllocation: PhaseAllocationInput,
  projectId: string,
  createdBy?: string
): ResourceWeeklyAllocation[] {
  if (!phaseAllocation.customWeeklyAllocations || phaseAllocation.customWeeklyAllocations.length === 0) {
    throw new Error(
      `CUSTOM pattern requires customWeeklyAllocations for phase ${phaseAllocation.phaseId}, ` +
      `resource ${phaseAllocation.resourceId}`
    );
  }

  const allocations: ResourceWeeklyAllocation[] = [];
  const now = new Date();

  // Parse phase dates to validate custom allocations are within range
  const phaseStart = parseISO(phaseAllocation.phaseStartDate);
  const phaseEnd = parseISO(phaseAllocation.phaseEndDate);

  for (const customAlloc of phaseAllocation.customWeeklyAllocations) {
    // Validate allocation percentage
    if (customAlloc.allocationPercent < 0 || customAlloc.allocationPercent > 100) {
      throw new Error(
        `Allocation percentage must be between 0-100, got: ${customAlloc.allocationPercent} ` +
        `for week ${customAlloc.weekIdentifier}`
      );
    }

    // Parse week to get start/end dates
    const weekDates = parseWeekIdentifier(customAlloc.weekIdentifier);

    // Validate week is within phase date range
    if (weekDates.weekStartDate < phaseStart.toISOString().split("T")[0] ||
        weekDates.weekEndDate > phaseEnd.toISOString().split("T")[0]) {
      throw new Error(
        `Week ${customAlloc.weekIdentifier} is outside phase date range ` +
        `(${phaseAllocation.phaseStartDate} to ${phaseAllocation.phaseEndDate})`
      );
    }

    // Calculate working days for this allocation
    const workingDays = calculateWorkingDays(customAlloc.allocationPercent);

    const allocation: ResourceWeeklyAllocation = {
      id: generateAllocationId(),
      projectId,
      resourceId: phaseAllocation.resourceId,

      weekIdentifier: customAlloc.weekIdentifier,
      weekStartDate: weekDates.weekStartDate,
      weekEndDate: weekDates.weekEndDate,

      allocationPercent: customAlloc.allocationPercent,
      workingDays,

      sourcePhaseId: phaseAllocation.phaseId,
      sourcePattern: "CUSTOM",
      isManualOverride: false,

      createdAt: now.toISOString(),
      createdBy: createdBy || undefined,
      updatedAt: now.toISOString(),
      updatedBy: undefined,
    };

    allocations.push(allocation);
  }

  return allocations;
}

// ============================================================================
// Week Calculation Helpers
// ============================================================================

/**
 * Get all ISO weeks in a date range
 */
export function getWeeksInDateRange(
  startDate: Date,
  endDate: Date
): Array<{ weekIdentifier: string; weekStartDate: string; weekEndDate: string }> {
  const weeks: Array<{ weekIdentifier: string; weekStartDate: string; weekEndDate: string }> = [];

  // Get all weeks in the interval
  const weekStarts = eachWeekOfInterval(
    { start: startDate, end: endDate },
    { weekStartsOn: 1 } // Monday
  );

  for (const weekStart of weekStarts) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Sunday

    // Generate ISO week identifier (YYYY-Www format)
    const weekIdentifier = getISOWeekIdentifier(weekStart);

    // Format dates as ISO strings (YYYY-MM-DD)
    const weekStartDate = format(weekStart, "yyyy-MM-dd");
    const weekEndDate = format(weekEnd, "yyyy-MM-dd");

    weeks.push({
      weekIdentifier,
      weekStartDate,
      weekEndDate,
    });
  }

  return weeks;
}

/**
 * Get ISO week identifier (YYYY-Www format: "2025-W03")
 * ISO 8601 week date system:
 * - Week starts on Monday
 * - First week of year contains first Thursday
 */
export function getISOWeekIdentifier(date: Date): string {
  // Get ISO week number using date-fns format
  // 'I' gives ISO week, 'RRRR' gives ISO week-numbering year
  return format(date, "'W'I", { useAdditionalWeekYearTokens: true });
}

/**
 * Parse ISO week identifier to get start/end dates
 */
export function parseWeekIdentifier(weekIdentifier: string): {
  weekStartDate: string;
  weekEndDate: string;
} {
  // Validate format: "W01" to "W53"
  const weekMatch = weekIdentifier.match(/^W(\d{1,2})$/);

  if (!weekMatch) {
    throw new Error(`Invalid week identifier format: ${weekIdentifier}. Expected format: "W03"`);
  }

  const weekNumber = parseInt(weekMatch[1], 10);

  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error(`Invalid week number: ${weekNumber}. Must be between 1-53.`);
  }

  // Get the current year (in production, this should be passed explicitly)
  const year = new Date().getFullYear();

  // Calculate the start of the week
  // ISO week 1 is the week with the first Thursday
  const jan4 = new Date(year, 0, 4); // January 4th is always in week 1
  const weekStart = startOfWeek(jan4, { weekStartsOn: 1 });
  const targetWeekStart = addDays(weekStart, (weekNumber - 1) * 7);

  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

  return {
    weekStartDate: format(targetWeekStart, "yyyy-MM-dd"),
    weekEndDate: format(targetWeekEnd, "yyyy-MM-dd"),
  };
}

/**
 * Calculate working days from allocation percentage
 * Formula: (allocationPercent / 100) × 5 days
 * Example: 50% = 2.5 days, 100% = 5 days
 */
export function calculateWorkingDays(allocationPercent: number): number {
  if (allocationPercent < 0 || allocationPercent > 100) {
    throw new Error(
      `Allocation percentage must be between 0-100, got: ${allocationPercent}`
    );
  }

  const workingDays = (allocationPercent / 100) * 5;

  // Round to 2 decimal places (e.g., 2.50 days)
  return Math.round(workingDays * 100) / 100;
}

/**
 * Calculate allocation percentage from working days
 * Formula: (workingDays / 5) × 100
 * Example: 2.5 days = 50%, 5 days = 100%
 */
export function calculateAllocationPercent(workingDays: number): number {
  if (workingDays < 0 || workingDays > 5) {
    throw new Error(`Working days must be between 0-5, got: ${workingDays}`);
  }

  const allocationPercent = (workingDays / 5) * 100;

  // Round to nearest integer (e.g., 50%, 75%)
  return Math.round(allocationPercent);
}

// ============================================================================
// Validation
// ============================================================================

function validatePhaseAllocation(allocation: PhaseAllocationInput): void {
  // Validate dates
  const startDate = parseISO(allocation.phaseStartDate);
  const endDate = parseISO(allocation.phaseEndDate);

  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid phase start date: ${allocation.phaseStartDate}`);
  }

  if (isNaN(endDate.getTime())) {
    throw new Error(`Invalid phase end date: ${allocation.phaseEndDate}`);
  }

  if (startDate > endDate) {
    throw new Error(
      `Phase start date (${allocation.phaseStartDate}) must be before end date (${allocation.phaseEndDate})`
    );
  }

  // Validate allocation percentage
  if (allocation.allocationPercentage < 0 || allocation.allocationPercentage > 100) {
    throw new Error(
      `Allocation percentage must be between 0-100, got: ${allocation.allocationPercentage}`
    );
  }

  // Validate pattern
  if (allocation.pattern !== "STEADY" && allocation.pattern !== "CUSTOM") {
    throw new Error(`Invalid allocation pattern: ${allocation.pattern}. Must be "STEADY" or "CUSTOM"`);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate unique allocation ID
 */
function generateAllocationId(): string {
  // Using cuid-style ID generation (timestamp + random)
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `alloc_${timestamp}_${randomPart}`;
}

/**
 * Format allocation summary for display
 */
export function formatAllocationSummary(allocation: ResourceWeeklyAllocation): string {
  return (
    `${allocation.weekIdentifier}: ` +
    `${allocation.allocationPercent}% ` +
    `(${allocation.workingDays.toFixed(2)} days)`
  );
}

/**
 * Check if two allocations overlap (same project, resource, and week)
 */
export function doAllocationsConflict(
  alloc1: ResourceWeeklyAllocation,
  alloc2: ResourceWeeklyAllocation
): boolean {
  return (
    alloc1.projectId === alloc2.projectId &&
    alloc1.resourceId === alloc2.resourceId &&
    alloc1.weekIdentifier === alloc2.weekIdentifier
  );
}

/**
 * Merge overlapping allocations (sum allocation percentages)
 * WARNING: Only use for cross-project conflict detection, not for storage
 */
export function mergeAllocations(
  allocations: ResourceWeeklyAllocation[]
): ResourceWeeklyAllocation[] {
  const mergedMap = new Map<string, ResourceWeeklyAllocation>();

  for (const alloc of allocations) {
    const key = `${alloc.resourceId}_${alloc.weekIdentifier}`;
    const existing = mergedMap.get(key);

    if (existing) {
      // Merge by summing allocation percentages
      const mergedPercent = existing.allocationPercent + alloc.allocationPercent;
      const mergedDays = calculateWorkingDays(mergedPercent);

      mergedMap.set(key, {
        ...existing,
        allocationPercent: mergedPercent,
        workingDays: mergedDays,
        // Mark as merged (not tied to single phase)
        sourcePhaseId: undefined,
        sourcePattern: undefined,
        isManualOverride: false,
      });
    } else {
      mergedMap.set(key, { ...alloc });
    }
  }

  return Array.from(mergedMap.values());
}
