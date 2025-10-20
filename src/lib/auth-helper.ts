// src/lib/auth-helper.ts
// SECURITY: Authentication helper utilities (ready for future implementation)
// This file provides the foundation for adding authentication when needed

import { compare, hash } from "bcryptjs";
import crypto from "crypto";

/**
 * Hash a password securely using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Use cost factor of 12 (recommended for 2025)
  const saltRounds = 12;
  return await hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 12) {
    return { valid: false, error: "Password must be at least 12 characters long" };
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: "Password must contain at least one special character" };
  }

  // Check for common passwords (basic list - expand in production)
  const commonPasswords = ["password123", "admin123", "qwerty123", "123456789"];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    return { valid: false, error: "Password is too common" };
  }

  return { valid: true };
}

/**
 * Generate a secure random token
 * @param length - Length of the token (default: 32)
 * @returns Random hex string
 */
export function generateSecureToken(length: number = 32): string {
  if (typeof window !== "undefined" && window.crypto) {
    // Browser environment
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } else {
    // Node.js environment
    return crypto.randomBytes(length).toString("hex");
  }
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
export function validateEmail(email: string): boolean {
  // RFC 5322 compliant regex (simplified)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Session configuration constants
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required. Please set it to a secure random string of at least 32 characters."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long for security."
    );
  }
  return secret;
}

export const SESSION_CONFIG = {
  cookieName: "app_session",
  password: getSessionSecret(),
  cookieOptions: {
    secure: true, // Always use secure cookies
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
} as const;

/**
 * Check if session is valid (not expired)
 * @param sessionCreatedAt - Timestamp when session was created
 * @param maxAgeSeconds - Maximum session age in seconds (default: 7 days)
 * @returns True if session is still valid
 */
export function isSessionValid(
  sessionCreatedAt: number,
  maxAgeSeconds: number = 7 * 24 * 60 * 60
): boolean {
  const now = Date.now();
  const sessionAge = (now - sessionCreatedAt) / 1000;
  return sessionAge < maxAgeSeconds;
}

/**
 * Sanitize user data for client exposure
 * @param user - User object with potentially sensitive data
 * @returns Sanitized user object safe for client
 */
export function sanitizeUserData<T extends Record<string, any>>(user: T): Partial<T> {
  // Remove sensitive fields
  const { password, hashedPassword, resetToken, sessionToken, ...safeUser } = user as any;
  return safeUser;
}

/**
 * Generate CSRF token
 * @returns CSRF token
 */
export function generateCsrfToken(): string {
  return generateSecureToken(32);
}

/**
 * Validate CSRF token
 * @param token - Token to validate
 * @param expectedToken - Expected token value
 * @returns True if token is valid
 */
export function validateCsrfToken(
  token: string | null | undefined,
  expectedToken: string
): boolean {
  if (!token || !expectedToken) return false;
  return token === expectedToken;
}

// Type definitions for future use
export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  createdAt: number;
  csrfToken: string;
}

/**
 * Example: Basic authentication flow (not implemented - for reference)
 *
 * 1. Registration:
 *    - Validate email and password strength
 *    - Hash password with bcrypt
 *    - Store user in database
 *    - Create session
 *
 * 2. Login:
 *    - Find user by email
 *    - Verify password with bcrypt
 *    - Create session with iron-session
 *    - Set secure HTTP-only cookie
 *
 * 3. Session Management:
 *    - Validate session on each request
 *    - Refresh session periodically
 *    - Implement logout
 *    - Handle session expiration
 *
 * 4. CSRF Protection:
 *    - Generate CSRF token per session
 *    - Validate token on state-changing requests
 *    - Rotate token after sensitive operations
 */
