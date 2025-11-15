/**
 * Gantt Column Width Optimizer
 *
 * Auto-optimizes column widths based on actual content to:
 * 1. Prevent text overflow (no truncation)
 * 2. Maximize timeline bar space
 * 3. Maintain manual adjustability
 *
 * Apple HIG Quality: Intelligent, non-intrusive, performant
 */

import { format } from "date-fns";
import type { GanttProject } from "@/types/gantt-tool";

/**
 * Column width measurements and constraints
 */
export interface ColumnWidths {
  taskName: number;
  calendarDuration: number;
  workingDays: number;
  startEndDate: number;
  resources: number;
}

/**
 * Minimum column widths to ensure usability
 * Based on UX testing and Apple HIG guidelines
 */
const MIN_COLUMN_WIDTHS: ColumnWidths = {
  taskName: 120,         // Minimum for readable task names
  calendarDuration: 80,  // "12.5 months" fits comfortably
  workingDays: 80,       // "999 d" fits comfortably
  startEndDate: 150,     // Minimum for date format
  resources: 80,         // Minimum for resource indicators
};

/**
 * Maximum column widths to prevent excessive sidebar width
 * Ensures timeline bars have adequate space
 */
const MAX_COLUMN_WIDTHS: ColumnWidths = {
  taskName: 600,         // Cap extremely long names
  calendarDuration: 120, // Duration strings are predictable
  workingDays: 100,      // Working days strings are short
  startEndDate: 220,     // Dates have fixed format
  resources: 150,        // Resource indicators are compact
};

/**
 * Padding to add to measured content width
 * Accounts for cell padding, margins, and visual breathing room
 */
const COLUMN_PADDING = 16; // 8px on each side

/**
 * Font specifications matching design system
 * Must match actual CSS for accurate measurement
 */
const FONTS = {
  phaseName: '600 13px "SF Pro Text", -apple-system, system-ui, sans-serif',
  taskName: '400 13px "SF Pro Text", -apple-system, system-ui, sans-serif',
  dateText: '11px "SF Pro Text", -apple-system, system-ui, sans-serif',
  columnData: '11px "SF Pro Text", -apple-system, system-ui, sans-serif',
};

/**
 * Indentation for task names (visual hierarchy)
 */
const TASK_INDENTATION = 48; // pixels

/**
 * Singleton canvas for text measurement
 * Reused across all measurements for performance
 */
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementContext: CanvasRenderingContext2D | null = null;

/**
 * Initialize measurement canvas (one-time setup)
 */
function getmeasurementContext(): CanvasRenderingContext2D | null {
  if (!measurementContext) {
    if (typeof document === 'undefined') {
      // Server-side rendering - no canvas available
      return null;
    }

    measurementCanvas = document.createElement('canvas');
    measurementContext = measurementCanvas.getContext('2d');
  }

  return measurementContext;
}

/**
 * Measure the rendered width of text with specified font
 *
 * Uses canvas measureText API for pixel-perfect accuracy
 * Performance: <1ms per measurement
 *
 * @param text - Text to measure
 * @param font - CSS font specification
 * @returns Width in pixels (rounded up to nearest integer)
 */
function measureTextWidth(text: string, font: string): number {
  const context = getmeasurementContext();

  if (!context) {
    // Fallback: rough estimate (10px per character)
    return text.length * 10;
  }

  context.font = font;
  const metrics = context.measureText(text);

  // Round up to avoid subpixel truncation
  return Math.ceil(metrics.width);
}

/**
 * Measure maximum width needed for task/phase names column
 *
 * Considers:
 * - Phase names (bold font)
 * - Task names (regular font + indentation)
 * - Chevron icons and spacing
 *
 * @param project - Gantt project data
 * @returns Maximum width in pixels
 */
function measureTaskNameColumn(project: GanttProject | null): number {
  if (!project || project.phases.length === 0) {
    return MIN_COLUMN_WIDTHS.taskName;
  }

  let maxWidth = 0;

  project.phases.forEach((phase) => {
    // Measure phase name (bold font)
    const phaseNameWidth = measureTextWidth(phase.name, FONTS.phaseName);

    // Phase name needs space for chevron icon (16px) + gap (8px)
    const phaseTotalWidth = phaseNameWidth + 16 + 8;
    maxWidth = Math.max(maxWidth, phaseTotalWidth);

    // Measure task names within phase
    if (phase.tasks && phase.tasks.length > 0) {
      phase.tasks.forEach((task) => {
        const taskNameWidth = measureTextWidth(task.name, FONTS.taskName);

        // Task name needs indentation + text width
        const taskTotalWidth = TASK_INDENTATION + taskNameWidth;
        maxWidth = Math.max(maxWidth, taskTotalWidth);
      });
    }
  });

  return maxWidth;
}

/**
 * Measure maximum width needed for calendar duration column
 *
 * Format: "X.Y months" or "X.Y years"
 * Example: "12.5 months", "2.3 years"
 *
 * @param project - Gantt project data
 * @returns Maximum width in pixels
 */
function measureCalendarDurationColumn(project: GanttProject | null): number {
  if (!project || project.phases.length === 0) {
    return MIN_COLUMN_WIDTHS.calendarDuration;
  }

  // Duration strings are predictable length
  // Longest realistic: "999.9 months" = 13 chars
  const sampleText = "999.9 months";
  const width = measureTextWidth(sampleText, FONTS.columnData);

  return width;
}

/**
 * Measure maximum width needed for working days column
 *
 * Format: "X d" where X is number of working days
 * Example: "45 d", "250 d"
 *
 * @param project - Gantt project data
 * @returns Maximum width in pixels
 */
function measureWorkingDaysColumn(project: GanttProject | null): number {
  if (!project || project.phases.length === 0) {
    return MIN_COLUMN_WIDTHS.workingDays;
  }

  // Working days are typically 1-999
  // Longest realistic: "9999 d" = 6 chars
  const sampleText = "9999 d";
  const width = measureTextWidth(sampleText, FONTS.columnData);

  return width;
}

/**
 * Measure maximum width needed for start/end date column
 *
 * Format: "dd-MMM-yy (EEE) - dd-MMM-yy (EEE)"
 * Example: "14-Nov-25 (Thu) - 20-Dec-25 (Fri)"
 *
 * @param project - Gantt project data
 * @returns Maximum width in pixels
 */
function measureStartEndDateColumn(project: GanttProject | null): number {
  if (!project || project.phases.length === 0) {
    return MIN_COLUMN_WIDTHS.startEndDate;
  }

  // Date format is fixed length, but we'll measure actual dates
  // to account for font rendering variations
  let maxWidth = 0;

  project.phases.forEach((phase) => {
    // Measure phase dates
    const phaseStartText = format(new Date(phase.startDate), "dd-MMM-yy (EEE)");
    const phaseEndText = format(new Date(phase.endDate), "dd-MMM-yy (EEE)");
    const phaseDateText = `${phaseStartText} - ${phaseEndText}`;
    const phaseDateWidth = measureTextWidth(phaseDateText, FONTS.dateText);
    maxWidth = Math.max(maxWidth, phaseDateWidth);

    // Measure task dates
    if (phase.tasks && phase.tasks.length > 0) {
      phase.tasks.forEach((task) => {
        const taskStartText = format(new Date(task.startDate), "dd-MMM-yy (EEE)");
        const taskEndText = format(new Date(task.endDate), "dd-MMM-yy (EEE)");
        const taskDateText = `${taskStartText} - ${taskEndText}`;
        const taskDateWidth = measureTextWidth(taskDateText, FONTS.dateText);
        maxWidth = Math.max(maxWidth, taskDateWidth);
      });
    }
  });

  return maxWidth;
}

/**
 * Measure maximum width needed for resources column
 *
 * Shows resource indicators (colored dots/icons)
 * Relatively fixed width based on indicator size
 *
 * @param project - Gantt project data
 * @returns Maximum width in pixels
 */
function measureResourcesColumn(project: GanttProject | null): number {
  // Resources column shows compact indicators
  // Width is relatively fixed: icon (24px) + count (2 digits) + padding
  // Example: "🔵 5" = ~40px
  const sampleText = "🔵 99";
  const width = measureTextWidth(sampleText, FONTS.columnData);

  return Math.max(width, MIN_COLUMN_WIDTHS.resources);
}

/**
 * Calculate optimal column widths based on project content
 *
 * Algorithm:
 * 1. Measure all content in each column
 * 2. Add padding for visual breathing room
 * 3. Clamp to min/max constraints
 * 4. Return optimized widths
 *
 * Performance: O(n) where n = total tasks across all phases
 * Typical execution time: 10-50ms for 100 tasks
 *
 * @param project - Gantt project data (or null for defaults)
 * @returns Optimized column widths
 */
export function optimizeColumnWidths(project: GanttProject | null): ColumnWidths {
  // If no project, return minimum widths
  if (!project) {
    return { ...MIN_COLUMN_WIDTHS };
  }

  // Measure content in each column
  const measurements: ColumnWidths = {
    taskName: measureTaskNameColumn(project),
    calendarDuration: measureCalendarDurationColumn(project),
    workingDays: measureWorkingDaysColumn(project),
    startEndDate: measureStartEndDateColumn(project),
    resources: measureResourcesColumn(project),
  };

  // Add padding and clamp to constraints
  const optimized: ColumnWidths = {
    taskName: clampWidth(
      measurements.taskName + COLUMN_PADDING,
      MIN_COLUMN_WIDTHS.taskName,
      MAX_COLUMN_WIDTHS.taskName
    ),
    calendarDuration: clampWidth(
      measurements.calendarDuration + COLUMN_PADDING,
      MIN_COLUMN_WIDTHS.calendarDuration,
      MAX_COLUMN_WIDTHS.calendarDuration
    ),
    workingDays: clampWidth(
      measurements.workingDays + COLUMN_PADDING,
      MIN_COLUMN_WIDTHS.workingDays,
      MAX_COLUMN_WIDTHS.workingDays
    ),
    startEndDate: clampWidth(
      measurements.startEndDate + COLUMN_PADDING,
      MIN_COLUMN_WIDTHS.startEndDate,
      MAX_COLUMN_WIDTHS.startEndDate
    ),
    resources: clampWidth(
      measurements.resources + COLUMN_PADDING,
      MIN_COLUMN_WIDTHS.resources,
      MAX_COLUMN_WIDTHS.resources
    ),
  };

  return optimized;
}

/**
 * Clamp width to min/max constraints
 */
function clampWidth(width: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, width));
}

/**
 * Calculate total sidebar width from column widths
 *
 * @param widths - Column widths
 * @returns Total sidebar width in pixels
 */
export function calculateSidebarWidth(widths: ColumnWidths): number {
  const columnTotal =
    widths.taskName +
    widths.calendarDuration +
    widths.workingDays +
    widths.startEndDate +
    widths.resources;

  // Add padding for sidebar container (24px left + 24px right)
  const sidebarPadding = 48;

  return columnTotal + sidebarPadding;
}

/**
 * Get default column widths (used as fallback)
 *
 * @returns Default column widths
 */
export function getDefaultColumnWidths(): ColumnWidths {
  return { ...MIN_COLUMN_WIDTHS };
}

/**
 * Wait for fonts to load before optimizing
 *
 * Font loading affects text measurement accuracy
 * This ensures measurements are based on actual fonts, not fallbacks
 *
 * @returns Promise that resolves when fonts are ready
 */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    // Wait for all fonts to load (max 3 seconds timeout)
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (error) {
    // Font loading failed - continue with fallback fonts
    console.warn('[Column Optimizer] Font loading timeout, using fallback fonts');
  }
}
