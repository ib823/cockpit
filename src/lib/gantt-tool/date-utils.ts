/**
 * Date formatting utilities for Gantt Tool
 */

import { format } from 'date-fns';

/**
 * Format date as DD-MMM-YY (Ddd)
 * Example: 14-Oct-25 (Mon)
 */
export function formatGanttDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd-MMM-yy (EEE)');
}

/**
 * Format date as DD-MMM-YYYY (Ddd) for exports
 * Example: 14-Oct-2025 (Mon)
 */
export function formatGanttDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd-MMM-yyyy (EEE)');
}

/**
 * Format duration as "X years Y months Z weeks and W days"
 * Example: 784 days → "2 years 2 months 0 weeks and 4 days"
 */
export function formatDuration(totalDays: number): string {
  if (totalDays === 0) return '0 days';

  // Calculate years (365 days per year)
  const years = Math.floor(totalDays / 365);
  let remainingDays = totalDays % 365;

  // Calculate months (30 days per month)
  const months = Math.floor(remainingDays / 30);
  remainingDays = remainingDays % 30;

  // Calculate weeks from remaining days
  const weeks = Math.floor(remainingDays / 7);
  remainingDays = remainingDays % 7;

  // Build the output string with abbreviations
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years}y`);
  }

  if (months > 0) {
    parts.push(`${months}m`);
  }

  if (weeks > 0) {
    parts.push(`${weeks}w`);
  }

  if (remainingDays > 0 || parts.length === 0) {
    parts.push(`${remainingDays}d`);
  }

  // Join all parts with spaces
  return parts.join(' ');
}

/**
 * Format duration in compact form for phase/task bars
 * Example: 784 days → "2y 2m 4d"
 */
export function formatDurationCompact(totalDays: number): string {
  if (totalDays === 0) return '0d';

  const years = Math.floor(totalDays / 365);
  let remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  remainingDays = remainingDays % 30;

  const parts: string[] = [];

  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays}d`);

  return parts.join(' ');
}

/**
 * Format working days - Steve Jobs standard: just days
 * Example: 120 working days → "120d"
 */
export function formatWorkingDays(days: number): string {
  return `${days}d`;
}

/**
 * Format calendar duration - Steve Jobs standard: breakdown with total
 * Example: 180 calendar days → "6m 2w 3d (180d)"
 */
export function formatCalendarDuration(totalDays: number): string {
  if (totalDays === 0) return '0d (0d)';

  // Calculate breakdown
  const years = Math.floor(totalDays / 365);
  let remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  remainingDays = remainingDays % 30;
  const weeks = Math.floor(remainingDays / 7);
  remainingDays = remainingDays % 7;

  const parts: string[] = [];

  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays}d`);

  // Return format: "Xm Yw Zd (totalDays)"
  return `${parts.join(' ')} (${totalDays}d)`;
}
