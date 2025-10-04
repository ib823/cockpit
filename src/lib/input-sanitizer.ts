// src/lib/input-sanitizer.ts
/**
 * Input sanitization and validation utilities
 * Prevents XSS, DoS, and other malicious inputs
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML/script tags from user input
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";

  // Use DOMPurify for comprehensive XSS protection
  if (typeof window !== "undefined") {
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [], // Strip all attributes
      KEEP_CONTENT: true, // Keep text content
    });

    // Additional sanitization for protocol-based attacks
    return sanitized
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/data:/gi, "");
  }

  // Fallback for server-side (shouldn't occur in client-only app)
  return (
    input
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/on\w+\s*=\s*[^\s>]*/gi, "")
      // Remove javascript: protocol
      .replace(/javascript:/gi, "")
      // Remove data: protocol
      .replace(/data:text\/html/gi, "")
      // Remove iframe
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      // Trim
      .trim()
  );
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number {
  if (typeof input === "number") {
    // Handle edge cases
    if (!isFinite(input)) return 0;
    if (input < 0) return 0;
    if (input > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
    return input;
  }

  const parsed = parseFloat(String(input).replace(/[^0-9.-]/g, ""));

  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;

  return parsed;
}

/**
 * Validate and sanitize chip value
 */
export function sanitizeChipValue(value: string, type: string): string {
  // Always sanitize HTML first
  let sanitized = sanitizeHtml(value);

  // Type-specific validation
  switch (type) {
    case "employees":
    case "users":
    case "revenue":
    case "data_volume":
      // For numeric types, ensure it's a valid number
      const num = sanitizeNumber(sanitized);
      sanitized = num.toString();
      break;

    case "timeline":
      // Remove potentially malicious content but keep valid timeline text
      sanitized = sanitized.substring(0, 100); // Max 100 chars
      break;

    default:
      // For other types, limit length
      sanitized = sanitized.substring(0, 200); // Max 200 chars
  }

  return sanitized;
}

/**
 * Validate RFP text before processing
 */
export function validateRfpText(text: string): {
  valid: boolean;
  error?: string;
  sanitized: string;
} {
  if (!text || typeof text !== "string") {
    return { valid: false, error: "Text is required", sanitized: "" };
  }

  // Sanitize
  const sanitized = sanitizeHtml(text);

  // Check length
  if (sanitized.length === 0) {
    return { valid: false, error: "Text cannot be empty after sanitization", sanitized: "" };
  }

  if (sanitized.length > 100000) {
    return {
      valid: false,
      error: "Text is too long (max 100,000 characters)",
      sanitized: sanitized.substring(0, 100000),
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, error: "Text contains suspicious code patterns", sanitized: "" };
    }
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    if (typeof value === "string") {
      result[key] = sanitizeHtml(value) as any;
    } else if (typeof value === "number") {
      result[key] = sanitizeNumber(value) as any;
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value);
    }
  }

  return result;
}
