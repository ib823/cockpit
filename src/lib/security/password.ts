/**
 * Password Security Utilities
 *
 * Implements enterprise-grade password security:
 * - Bcrypt hashing with cost factor 12
 * - HIBP (Have I Been Pwned) breach database check
 * - Complexity validation (12+ chars, upper, lower, number, symbol)
 * - Password history to prevent reuse of last 5 passwords
 * - 90-day password rotation enforcement
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';

const BCRYPT_COST = 12;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_HISTORY_LIMIT = 5;
const PASSWORD_EXPIRY_DAYS = 90;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
}

/**
 * Hash a password using bcrypt with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password complexity
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
  }

  // Check for sequential characters (abc, 123, etc.)
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const subseq = seq.substring(i, i + 3);
      if (password.toLowerCase().includes(subseq)) {
        errors.push('Password should not contain sequential characters');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if password has been breached using HIBP API (k-anonymity model)
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
export async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    // Hash the password with SHA-1
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();

    // Use k-anonymity: send only first 5 chars of hash
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Query HIBP API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true' // Security enhancement
      }
    });

    if (!response.ok) {
      console.error('[HIBP] API request failed:', response.status);
      return { breached: false, count: 0 }; // Fail open (don't block user on API failure)
    }

    const text = await response.text();
    const lines = text.split('\n');

    // Check if our suffix appears in the results
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix === suffix) {
        return { breached: true, count: parseInt(countStr, 10) };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    console.error('[HIBP] Error checking password:', error);
    return { breached: false, count: 0 }; // Fail open
  }
}

/**
 * Check if password was used in history (prevent reuse of last 5 passwords)
 */
export async function checkPasswordHistory(
  password: string,
  passwordHistory: string[]
): Promise<boolean> {
  for (const oldHash of passwordHistory.slice(0, PASSWORD_HISTORY_LIMIT)) {
    const matches = await verifyPassword(password, oldHash);
    if (matches) {
      return true; // Password was used before
    }
  }
  return false;
}

/**
 * Calculate password expiry date (90 days from now)
 */
export function calculatePasswordExpiry(fromDate: Date = new Date()): Date {
  const expiry = new Date(fromDate);
  expiry.setDate(expiry.getDate() + PASSWORD_EXPIRY_DAYS);
  return expiry;
}

/**
 * Check if password is expired
 */
export function isPasswordExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > expiryDate;
}

/**
 * Calculate days until password expires
 */
export function daysUntilExpiry(expiryDate: Date | null): number {
  if (!expiryDate) return 0;
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get password strength score and feedback
 */
export function assessPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  // Length
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (password.length >= 16) {
    score++;
    feedback.push('✓ Strong length');
  }
  if (password.length >= 20) {
    score++;
    feedback.push('✓ Excellent length');
  }

  // Character diversity
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score++;
    feedback.push('✓ Mixed case');
  }
  if (/[0-9]/.test(password)) {
    feedback.push('✓ Contains numbers');
  }
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
    feedback.push('✓ Contains special characters');
  }

  // Entropy check (unique characters)
  const uniqueChars = new Set(password).size;
  if (uniqueChars > password.length * 0.7) {
    feedback.push('✓ High character diversity');
  }

  return { score: Math.min(score, 5), feedback };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'; // No i, l, o
  const numbers = '23456789'; // No 0, 1
  const symbols = '!@#$%^&*_+-=';

  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';

  // Ensure at least one of each required type
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}
