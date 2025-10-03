// src/lib/timeline/date-validation.ts

/**
 * Validates that start date is at least 1 month in the future
 */
export function validateStartDate(startDate: Date): { valid: boolean; error?: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day for comparison

  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  if (startDate < now) {
    return {
      valid: false,
      error: 'Start date cannot be in the past'
    };
  }

  if (startDate < oneMonthFromNow) {
    return {
      valid: false,
      error: 'Start date must be at least 1 month from today. SAP implementations require proper planning time.'
    };
  }

  return { valid: true };
}

/**
 * Get recommended start date (1 month + 1 week from now)
 */
export function getRecommendedStartDate(): Date {
  const recommended = new Date();
  recommended.setMonth(recommended.getMonth() + 1);
  recommended.setDate(recommended.getDate() + 7);
  return recommended;
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
