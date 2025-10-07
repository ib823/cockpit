/**
 * Security Validation Module
 *
 * Provides comprehensive input validation, sanitization, and security checks
 * for all user inputs and data operations.
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

const MAX_STRING_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 1000;
const MAX_NUMBER = Number.MAX_SAFE_INTEGER;
const MIN_NUMBER = Number.MIN_SAFE_INTEGER;

// Dangerous protocol prefixes
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return String(input || '');
  }

  // Truncate to max length
  const truncated = input.slice(0, MAX_STRING_LENGTH);

  // Use DOMPurify for HTML sanitization
  const cleaned = DOMPurify.sanitize(truncated, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [],
  });

  // Check for dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (cleaned.toLowerCase().includes(protocol)) {
      console.warn(`[Security] Blocked dangerous protocol: ${protocol}`);
      return cleaned.replace(new RegExp(protocol, 'gi'), '');
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
export function sanitizeArray<T>(
  input: unknown,
  itemSanitizer: (item: unknown) => T
): T[] {
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
export function sanitizeObjectKeys<T extends Record<string, any>>(
  input: unknown
): T {
  if (typeof input !== 'object' || input === null) {
    return {} as T;
  }

  const obj = input as Record<string, any>;
  const safe: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Block dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
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
 * Schema for RICEFW item validation
 */
export const RicefwItemSchema = z.object({
  id: z.string().max(100),
  projectId: z.string().max(100),
  type: z.enum(['report', 'interface', 'conversion', 'enhancement', 'form', 'workflow']),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  complexity: z.enum(['S', 'M', 'L']),
  count: z.number().int().min(1).max(1000),
  effortPerItem: z.number().min(0).max(1000),
  totalEffort: z.number().min(0).max(100000),
  phase: z.enum(['explore', 'realize', 'deploy']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Schema for Form item validation
 */
export const FormItemSchema = z.object({
  id: z.string().max(100),
  projectId: z.string().max(100),
  name: z.string().min(1).max(200),
  type: z.enum(['po', 'invoice', 'deliveryNote', 'custom']),
  languages: z.array(z.string().max(10)).max(50),
  complexity: z.enum(['S', 'M', 'L']),
  effort: z.number().min(0).max(10000),
  createdAt: z.date().optional(),
});

/**
 * Schema for Integration item validation
 */
export const IntegrationItemSchema = z.object({
  id: z.string().max(100),
  projectId: z.string().max(100),
  name: z.string().min(1).max(200),
  type: z.enum(['api', 'file', 'database', 'realtime', 'batch']),
  source: z.string().max(200),
  target: z.string().max(200),
  complexity: z.enum(['S', 'M', 'L']),
  volume: z.enum(['low', 'medium', 'high', 'very-high']),
  effort: z.number().min(0).max(10000),
  createdAt: z.date().optional(),
});

/**
 * Schema for Phase validation
 */
export const PhaseSchema = z.object({
  id: z.string().max(100),
  name: z.string().min(1).max(200),
  category: z.string().max(100),
  startBusinessDay: z.number().int().min(0).max(10000),
  workingDays: z.number().int().min(0).max(1000),
  effort: z.number().min(0).max(10000).optional(),
  color: z.string().max(20).optional(),
  skipHolidays: z.boolean().optional(),
  dependencies: z.array(z.string().max(100)).max(100).optional(),
  status: z.enum(['idle', 'active', 'complete']).optional(),
});

/**
 * Schema for Chip validation
 */
export const ChipSchema = z.object({
  id: z.string().max(100).optional(),
  type: z.string().max(50),
  value: z.union([z.string().max(5000), z.number()]),
  confidence: z.number().min(0).max(1),
  source: z.enum(['paste', 'upload', 'voice', 'manual', 'photo_ocr', 'test']),
  validated: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.date().optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate and sanitize RICEFW item
 */
export function validateRicefwItem(input: unknown): {
  valid: boolean;
  data?: any;
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
  data?: any;
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
  data?: any;
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
  data?: any;
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
  data?: any;
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
    const message = error.message.replace(/\/[\w\-\.\/]+/g, '[path]');

    return {
      message: sanitizeString(message),
      code: error.name,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}
