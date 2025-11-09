/**
 * Formatting Utilities for Gantt Tool
 *
 * Centralized formatting functions to ensure consistency across all displays
 * and prevent embarrassing bugs like "91.66666666666666%"
 */

/**
 * Format a number as percentage with specified decimal places
 *
 * @param value - Number between 0 and 1 (e.g., 0.9167 for 91.67%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "91.7%")
 *
 * @example
 * formatPercentage(0.9167) // "91.7%"
 * formatPercentage(0.9167, 2) // "91.67%"
 * formatPercentage(22 / 24) // "91.7%"
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  // Handle values already in percentage form (>1)
  const percentValue = value > 1 ? value : value * 100;

  return `${percentValue.toFixed(decimals)}%`;
};

/**
 * Format a decimal number with specified decimal places
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 *
 * @example
 * formatDecimal(91.66666666666666) // "91.7"
 * formatDecimal(91.66666666666666, 2) // "91.67"
 */
export const formatDecimal = (
  value: number,
  decimals: number = 1
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toFixed(decimals);
};

/**
 * Format currency amount
 *
 * @param value - Number to format as currency
 * @param currency - Currency code (default: 'USD')
 * @param decimals - Number of decimal places (default: 0 for whole dollars)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1000000) // "$1,000,000"
 * formatCurrency(1234.56, 'USD', 2) // "$1,234.56"
 * formatCurrency(0) // "$0"
 */
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  decimals: number = 0
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format currency in compact form (K, M, B)
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted compact currency string
 *
 * @example
 * formatCompactCurrency(1000) // "$1K"
 * formatCompactCurrency(1500000) // "$1.5M"
 * formatCompactCurrency(1000000000) // "$1B"
 */
export const formatCompactCurrency = (
  value: number,
  decimals: number = 1
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }

  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(decimals)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(decimals)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(decimals)}K`;
  } else {
    return `$${value.toFixed(decimals)}`;
  }
};

/**
 * Format large numbers with commas
 *
 * @param value - Number to format
 * @returns Formatted number string with commas
 *
 * @example
 * formatNumber(1000000) // "1,000,000"
 * formatNumber(12345) // "12,345"
 */
export const formatNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format duration in single, human-readable format
 *
 * Follows Jobs/Ive principle: One format, clear and consistent
 * Aligned with date-utils.ts formatDuration for consistency
 *
 * @param days - Number of working days
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(3) // "3 days"
 * formatDuration(10) // "2 weeks"
 * formatDuration(19) // "4 weeks"
 * formatDuration(100) // "5 months"
 */
export const formatDuration = (days: number): string => {
  if (days === null || days === undefined || isNaN(days) || days === 0) {
    return '0 days';
  }

  // Use 7-day week for standard calendar alignment
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);

  // < 14 days: show in days
  if (days < 14) {
    return days === 1 ? '1 day' : `${days} days`;
  }

  // 14-84 days: show in weeks (2-12 weeks)
  if (days < 85) {
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }

  // >= 85 days: show in months
  return months === 1 ? '1 month' : `${months} months`;
};

/**
 * Format duration with both working days and calendar days context
 *
 * @param workingDays - Number of working days
 * @param calendarDays - Number of calendar days
 * @returns Formatted duration string with context
 *
 * @example
 * formatDurationWithContext(5, 7) // "5 days (1 week)"
 * formatDurationWithContext(20, 28) // "4 weeks"
 */
export const formatDurationWithContext = (
  workingDays: number,
  calendarDays: number
): string => {
  const baseDuration = formatDuration(workingDays);

  // Only add calendar days if significantly different (weekends/holidays)
  if (calendarDays > workingDays * 1.4) {
    return `${baseDuration} (${calendarDays}cd)`;
  }

  return baseDuration;
};
