/**
 * Security Module
 *
 * Central export for all security-related functionality
 */

export * from "./validation";
export * from "./secrets";

// Re-export commonly used functions for convenience
export {
  sanitizeString,
  sanitizeNumber,
  sanitizeArray,
  sanitizeObjectKeys,
  checkRateLimit,
  resetRateLimit,
  sanitizeError,
} from "./validation";

export {
  getSecret,
  hasSecret,
  validateRequiredSecrets,
  maskSecret,
  redactSecrets,
  isDevelopment,
  isProduction,
} from "./secrets";
