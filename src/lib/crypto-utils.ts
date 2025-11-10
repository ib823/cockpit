// src/lib/crypto-utils.ts
// Cryptographic utilities for secure data handling
// Fixed: V-003 - OTP hashing to prevent plaintext storage

import { createHash, timingSafeEqual } from "crypto";

/**
 * Hash an OTP using SHA-256
 * @param otp - The OTP to hash
 * @returns Hex-encoded hash
 */
export function hashOTP(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

/**
 * Timing-safe comparison of two strings
 * Prevents timing attacks in authentication flows
 * Fixed: V-004, V-007 - Timing attack vulnerabilities
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    // Convert strings to buffers
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");

    // If lengths differ, compare against dummy buffer to prevent timing leak
    if (bufA.length !== bufB.length) {
      const dummyBuf = Buffer.alloc(bufA.length);
      timingSafeEqual(bufA, dummyBuf);
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
