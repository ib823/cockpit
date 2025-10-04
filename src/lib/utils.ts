import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 * @example cn('text-red-500', 'text-blue-500') => 'text-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format duration in weeks to human-readable string
 * @example formatDuration(12) => "12 weeks"
 * @example formatDuration(52) => "12 months"
 */
export function formatDuration(weeks: number): string {
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  const months = Math.round(weeks / 4.33);
  return `${months} ${months === 1 ? "month" : "months"}`;
}

/**
 * Format currency with region-specific formatting
 * @example formatCurrency(1000000, 'MYR') => "MYR 1,000,000"
 */
export function formatCurrency(amount: number, currency: string = "MYR"): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calculate percentage with safe division
 */
export function safePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}
