// src/lib/logger.ts
// Production-safe logger utility
// SECURITY: Prevents information disclosure in production builds

export const logger = {
  /**
   * General logging - development only
   * SECURITY: Stripped in production to prevent information disclosure
   */
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },

  /**
   * Info-level logging
   */
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  /**
   * Warning messages - development only
   */
  warn: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  /**
   * Error logging - always logs but sanitized in production
   * SECURITY: Prevents stack trace disclosure in production
   */
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error || '');
    } else {
      // SECURITY: Sanitized error message in production
      console.error(`[ERROR] ${message}`, 'Details hidden in production');
    }

    // In production, send to error tracking (Sentry, etc.)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // window.Sentry?.captureException(error);
    }
  },

  /**
   * Debug-level logging - development only
   */
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};