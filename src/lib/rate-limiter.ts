// src/lib/rate-limiter.ts
// Client-side rate limiting to prevent abuse
// SECURITY: Prevents DoS attacks from rapid submissions

export class RateLimiter {
  private attempts = new Map<string, number[]>();

  /**
   * Check if action is allowed under rate limit
   * @param key - Unique identifier for the action (e.g., 'rfp-processing', 'timeline-generation')
   * @param maxAttempts - Maximum number of attempts allowed (default: 10)
   * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
   * @returns true if allowed, false if rate limit exceeded
   */
  check(key: string, maxAttempts = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove attempts outside the time window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.attempts.clear();
  }

  /**
   * Get remaining attempts for a key
   */
  getRemaining(key: string, maxAttempts = 10, windowMs = 60000): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs);
    return Math.max(0, maxAttempts - recentAttempts.length);
  }
}

// Singleton instance for global use
export const globalRateLimiter = new RateLimiter();
