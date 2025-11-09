/**
 * Date formatting utilities for Gantt Tool
 */

import { format } from 'date-fns';

/**
 * Format date in consistent format: "MMM d, yyyy"
 * Example: Oct 14, 2025
 */
export function formatGanttDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Format date in compact format for UI: "MMM d '26"
 * Example: Oct 14 '25
 */
export function formatGanttDateCompact(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "MMM d ''yy");
}

/**
 * Format date with day of week for headers: "MMM d, yyyy (Mon)"
 * Example: Oct 14, 2025 (Mon)
 */
export function formatGanttDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy (EEE)');
}

/**
 * Format duration in human-readable format using single most appropriate unit
 * - < 14 days: Show days only ("12 days")
 * - 14 days - 12 weeks: Show weeks ("8 weeks")
 * - > 12 weeks: Show months ("4 months")
 * Example: 784 days → "26 months" or "112 weeks"
 */
export function formatDuration(totalDays: number): string {
  // Handle null/undefined/NaN
  if (totalDays === null || totalDays === undefined || isNaN(totalDays)) {
    return '0 days';
  }

  if (totalDays === 0) return '0 days';
  if (totalDays === 1) return '1 day';

  // Less than 2 weeks: show days
  if (totalDays < 14) {
    return `${totalDays} days`;
  }

  // 2 weeks to 12 weeks: show weeks
  const weeks = Math.round(totalDays / 7);
  if (weeks <= 12) {
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }

  // More than 12 weeks: show months
  const months = Math.round(totalDays / 30);
  return months === 1 ? '1 month' : `${months} months`;
}

/**
 * Format duration in compact form for phase/task bars
 * Uses single most appropriate unit with abbreviation
 * Example: 784 days → "26mo" or "112wk"
 */
export function formatDurationCompact(totalDays: number): string {
  if (totalDays === 0) return '0d';
  if (totalDays === 1) return '1d';

  // Less than 2 weeks: show days
  if (totalDays < 14) {
    return `${totalDays}d`;
  }

  // 2 weeks to 12 weeks: show weeks
  const weeks = Math.round(totalDays / 7);
  if (weeks <= 12) {
    return `${weeks}wk`;
  }

  // More than 12 weeks: show months
  const months = Math.round(totalDays / 30);
  return `${months}mo`;
}

/**
 * Format working days - Steve Jobs standard: just days
 * Example: 120 working days → "120d"
 */
export function formatWorkingDays(days: number): string {
  return `${days}d`;
}

/**
 * Format calendar duration with total days in parentheses for clarity
 * Example: 180 calendar days → "26 weeks (180 days)"
 */
export function formatCalendarDuration(totalDays: number): string {
  if (totalDays === 0) return '0 days';
  if (totalDays === 1) return '1 day';

  // Get primary format using formatDuration
  const primary = formatDuration(totalDays);

  // Return with total days in parentheses
  return `${primary} (${totalDays} days)`;
}
