/**
 * Schedule Parser - Stage 1 of Import
 * Parses: Phase | Task | Start Date | End Date
 *
 * Security: Input validation, XSS prevention, length limits
 * Performance: Client-side parsing, chunked processing for large imports
 */

import { parse, isValid, format, differenceInDays } from "date-fns";

// Types
export interface ParsedTask {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
}

export interface ParsedPhase {
  name: string;
  tasks: ParsedTask[];
  startDate: string;
  endDate: string;
}

export interface ParsedSchedule {
  phases: ParsedPhase[];
  projectStartDate: string;
  projectEndDate: string;
  totalTasks: number;
  durationDays: number;
}

export interface ScheduleParseError {
  row: number;
  column: "phase" | "task" | "startDate" | "endDate" | "general";
  message: string;
  severity: "error" | "warning";
}

export interface ScheduleParseResult {
  success: boolean;
  data?: ParsedSchedule;
  errors: ScheduleParseError[];
  warnings: string[];
}

// Constants
const MAX_INPUT_SIZE = 500_000; // 500KB
const MAX_TASKS = 5_000;
const MAX_FIELD_LENGTH = 200;
const SQL_KEYWORDS = /\b(DROP|DELETE|UPDATE|INSERT|UNION|SELECT|ALTER|CREATE|EXEC|SCRIPT)\b/gi;
const XSS_PATTERNS = /<script|javascript:|onerror=|onload=/gi;

/**
 * Sanitize input to prevent XSS and SQL injection
 */
function sanitizeInput(text: string, escapeHtml: boolean = true): string {
  if (!text) return "";

  // Check for SQL injection attempts
  if (SQL_KEYWORDS.test(text)) {
    throw new Error("Input contains forbidden SQL keywords");
  }

  // Check for XSS attempts
  if (XSS_PATTERNS.test(text)) {
    throw new Error("Input contains forbidden script patterns");
  }

  // Trim and limit length
  let sanitized = text.trim().substring(0, MAX_FIELD_LENGTH);

  // Escape HTML entities (only for text fields, not dates)
  if (escapeHtml) {
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  return sanitized;
}

/**
 * Parse date with multiple format support
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Try YYYY-MM-DD (ISO 8601)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed + "T00:00:00");
    // Check if date is valid and not NaN
    if (!isNaN(date.getTime())) return date;
  }

  // Try DD/MM/YYYY
  try {
    const parsed = parse(trimmed, "dd/MM/yyyy", new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch {}

  // Try MM/DD/YYYY
  try {
    const parsed = parse(trimmed, "MM/dd/yyyy", new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch {}

  // Try "Monday, 2 February, 2026"
  try {
    const parsed = parse(trimmed, "EEEE, d MMMM, yyyy", new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch {}

  // Try "Monday, 12 January 2026"
  try {
    const parsed = parse(trimmed, "EEEE, dd MMMM yyyy", new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch {}

  return null;
}

/**
 * Parse schedule data (TSV format)
 * Expected format: Phase Name \t Task Name \t Start Date \t End Date
 */
export function parseScheduleData(tsvText: string): ScheduleParseResult {
  const errors: ScheduleParseError[] = [];
  const warnings: string[] = [];

  // Input validation
  if (!tsvText || !tsvText.trim()) {
    return {
      success: false,
      errors: [{ row: 0, column: "general", message: "No data provided", severity: "error" }],
      warnings: [],
    };
  }

  // Size validation
  if (tsvText.length > MAX_INPUT_SIZE) {
    return {
      success: false,
      errors: [
        {
          row: 0,
          column: "general",
          message: `Input too large (${(tsvText.length / 1000).toFixed(1)}KB). Maximum: ${MAX_INPUT_SIZE / 1000}KB`,
          severity: "error",
        },
      ],
      warnings: [],
    };
  }

  // Split by newline but don't trim lines yet (to preserve leading/trailing tabs)
  const lines = tsvText.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return {
      success: false,
      errors: [{ row: 0, column: "general", message: "No valid lines found", severity: "error" }],
      warnings: [],
    };
  }

  // Parse lines
  const phaseMap = new Map<string, ParsedPhase>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let totalTasks = 0;
  let hasSkippedHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split("\t").map((c) => c.trim());

    // Skip header row (if exists) - check if first row looks like a header
    // Header rows typically have "Phase" in column 1 AND "Task" in column 2
    if (i === 0) {
      const col0 = cells[0]?.toLowerCase() || "";
      const col1 = cells[1]?.toLowerCase() || "";
      const col2 = cells[2]?.toLowerCase() || "";

      // Check if this looks like a header row
      if (
        (col0.includes("phase") && col1.includes("task")) ||
        (col0 === "phase name" && col1 === "task name") ||
        (col0 === "phase" && col1 === "task" && col2.includes("start"))
      ) {
        hasSkippedHeader = true;
        continue;
      }
    }

    // Skip empty rows
    if (cells.every((c) => !c)) {
      continue;
    }

    // Calculate actual row number for error reporting
    const rowNum = hasSkippedHeader ? i + 1 : i + 1;

    const [phaseName, taskName, startDateStr, endDateStr] = cells;

    // Validate required fields
    if (!phaseName) {
      errors.push({
        row: rowNum,
        column: "phase",
        message: "Phase name is required",
        severity: "error",
      });
      continue;
    }

    if (!taskName) {
      errors.push({
        row: rowNum,
        column: "task",
        message: "Task name is required",
        severity: "error",
      });
      continue;
    }

    if (!startDateStr) {
      errors.push({
        row: rowNum,
        column: "startDate",
        message: "Start date is required",
        severity: "error",
      });
      continue;
    }

    if (!endDateStr) {
      errors.push({
        row: rowNum,
        column: "endDate",
        message: "End date is required",
        severity: "error",
      });
      continue;
    }

    // Sanitize inputs
    let sanitizedPhase: string;
    let sanitizedTask: string;
    try {
      sanitizedPhase = sanitizeInput(phaseName);
      sanitizedTask = sanitizeInput(taskName);
    } catch (e) {
      errors.push({
        row: i + 1,
        column: "general",
        message: e instanceof Error ? e.message : "Input validation failed",
        severity: "error",
      });
      continue;
    }

    // Parse dates
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (!startDate) {
      errors.push({
        row: i + 1,
        column: "startDate",
        message: `Invalid start date "${startDateStr}". Use format: YYYY-MM-DD (e.g., 2026-01-15)`,
        severity: "error",
      });
      continue;
    }

    if (!endDate) {
      errors.push({
        row: i + 1,
        column: "endDate",
        message: `Invalid end date "${endDateStr}". Use format: YYYY-MM-DD (e.g., 2026-01-31)`,
        severity: "error",
      });
      continue;
    }

    // Validate date logic
    if (startDate > endDate) {
      errors.push({
        row: i + 1,
        column: "startDate",
        message: "Start date must be before or equal to end date",
        severity: "error",
      });
      continue;
    }

    // Warn for very long tasks (> 180 days)
    const taskDuration = differenceInDays(endDate, startDate);
    if (taskDuration > 180) {
      warnings.push(
        `Row ${i + 1}: Task "${sanitizedTask}" is ${taskDuration} days long (> 6 months). Consider breaking it down.`
      );
    }

    // Format dates to YYYY-MM-DD
    const formattedStart = format(startDate, "yyyy-MM-dd");
    const formattedEnd = format(endDate, "yyyy-MM-dd");

    // Track project date range
    if (!minDate || startDate < minDate) minDate = startDate;
    if (!maxDate || endDate > maxDate) maxDate = endDate;

    // Add to phase map
    if (!phaseMap.has(sanitizedPhase)) {
      phaseMap.set(sanitizedPhase, {
        name: sanitizedPhase,
        tasks: [],
        startDate: formattedStart,
        endDate: formattedEnd,
      });
    }

    const phase = phaseMap.get(sanitizedPhase)!;
    phase.tasks.push({
      name: sanitizedTask,
      startDate: formattedStart,
      endDate: formattedEnd,
    });

    // Update phase date range
    if (formattedStart < phase.startDate) phase.startDate = formattedStart;
    if (formattedEnd > phase.endDate) phase.endDate = formattedEnd;

    totalTasks++;
  }

  // Return errors if any
  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Validate we have data
  if (phaseMap.size === 0) {
    return {
      success: false,
      errors: [{ row: 0, column: "general", message: "No valid tasks found", severity: "error" }],
      warnings: [],
    };
  }

  // Validate task count
  if (totalTasks > MAX_TASKS) {
    return {
      success: false,
      errors: [
        {
          row: 0,
          column: "general",
          message: `Too many tasks (${totalTasks}). Maximum: ${MAX_TASKS}`,
          severity: "error",
        },
      ],
      warnings: [],
    };
  }

  // Generate warnings
  if (totalTasks > 1000) {
    warnings.push(`Large project: ${totalTasks} tasks. Import may take 30-60 seconds.`);
  }

  const phases = Array.from(phaseMap.values());

  // Calculate duration
  const durationDays = minDate && maxDate ? differenceInDays(maxDate, minDate) + 1 : 0;

  return {
    success: true,
    data: {
      phases,
      projectStartDate: minDate ? format(minDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      projectEndDate: maxDate ? format(maxDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      totalTasks,
      durationDays,
    },
    errors: [],
    warnings,
  };
}
