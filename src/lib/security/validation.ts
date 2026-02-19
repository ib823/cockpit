/**
 * Security Validation Module
 *
 * Provides comprehensive input validation, sanitization, and security checks
 * for all user inputs and data operations.
 */

import { z } from "zod";
import {
  RicefwItemSchema,
  FormSpecSchema as FormItemSchema,
  IntegrationSpecSchema as IntegrationItemSchema,
  PhaseSchema,
  ChipSchema,
} from "@/data/dal";

// ============================================================================
// Constants
// ============================================================================

const MAX_STRING_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 1000;
const MAX_NUMBER = Number.MAX_SAFE_INTEGER;
const MIN_NUMBER = Number.MIN_SAFE_INTEGER;

// Dangerous protocol prefixes
const DANGEROUS_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:", "about:"];

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Basic HTML sanitization without DOMPurify
 */
function basicHtmlSanitize(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]*/gi, "")
    .replace(/<[^>]*>/g, ""); // Remove all HTML tags
}

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") {
    return String(input || "");
  }

  // Truncate to max length
  const truncated = input.slice(0, MAX_STRING_LENGTH);

  // Use basic sanitization
  const cleaned = basicHtmlSanitize(truncated);

  // Check for dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (cleaned.toLowerCase().includes(protocol)) {
      console.warn(`[Security] Blocked dangerous protocol: ${protocol}`);
      return cleaned.replace(new RegExp(protocol, "gi"), "");
    }
  }

  return cleaned.trim();
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: unknown): number {
  const num = Number(input);

  if (!Number.isFinite(num)) {
    return 0;
  }

  // Clamp to safe range
  return Math.max(MIN_NUMBER, Math.min(MAX_NUMBER, num));
}

/**
 * Sanitize array input
 */
export function sanitizeArray<T>(input: unknown, itemSanitizer: (item: unknown) => T): T[] {
  if (!Array.isArray(input)) {
    return [];
  }

  // Limit array length
  const limited = input.slice(0, MAX_ARRAY_LENGTH);

  return limited.map(itemSanitizer);
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(input: unknown): T {
  if (typeof input !== "object" || input === null) {
    return {} as T;
  }

  const obj = input as Record<string, unknown>;
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Block dangerous keys
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      console.warn(`[Security] Blocked dangerous key: ${key}`);
      continue;
    }

    // Sanitize key
    const safeKey = sanitizeString(key);
    if (safeKey) {
      safe[safeKey] = value;
    }
  }

  return safe as T;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * NOTE: Core entity schemas (RicefwItem, FormItem, IntegrationItem, Phase, Chip, etc.)
 * are now imported from src/data/dal.ts to serve as the single source of truth.
 * This prevents validation inconsistencies across the codebase.
 */

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate and sanitize RICEFW item
 */
export function validateRicefwItem(input: unknown): {
  valid: boolean;
  data?: unknown;
  errors?: z.ZodError;
} {
  try {
    const data = RicefwItemSchema.parse(input);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

/**
 * Validate and sanitize Form item
 */
export function validateFormItem(input: unknown): {
  valid: boolean;
  data?: unknown;
  errors?: z.ZodError;
} {
  try {
    const data = FormItemSchema.parse(input);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

/**
 * Validate and sanitize Integration item
 */
export function validateIntegrationItem(input: unknown): {
  valid: boolean;
  data?: unknown;
  errors?: z.ZodError;
} {
  try {
    const data = IntegrationItemSchema.parse(input);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

/**
 * Validate and sanitize Phase
 */
export function validatePhase(input: unknown): {
  valid: boolean;
  data?: unknown;
  errors?: z.ZodError;
} {
  try {
    const data = PhaseSchema.parse(input);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

/**
 * Validate and sanitize Chip
 */
export function validateChip(input: unknown): {
  valid: boolean;
  data?: unknown;
  errors?: z.ZodError;
} {
  try {
    const data = ChipSchema.parse(input);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

/**
 * Check if an operation should be rate-limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    rateLimits.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + windowMs,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.windowStart + windowMs,
  };
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimits.delete(key);
}

// ============================================================================
// Error Sanitization
// ============================================================================

/**
 * Sanitize error messages before sending to client
 */
export function sanitizeError(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof Error) {
    // Remove sensitive stack traces and file paths
    const message = error.message.replace(/\/[\w\-\.\/]+/g, "[path]");

    return {
      message: sanitizeString(message),
      code: error.name,
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
}
