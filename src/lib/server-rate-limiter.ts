// src/lib/server-rate-limiter.ts
// Server-side rate limiting using Upstash Redis (with in-memory fallback)
// SECURITY: Prevents brute force attacks on authentication endpoints
// Fixed: V-002 - OTP Brute Force vulnerability

import { Redis } from "@upstash/redis";

// Try to initialize Redis, fallback to in-memory storage
let redis: Redis | null = null;
try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && /^https:\/\//i.test(url)) {
    redis = new Redis({ url, token });
  }
} catch (error) {
  console.warn(
    "[server-rate-limiter] Redis initialization failed, using in-memory fallback:",
    error
  );
  redis = null;
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Server-side rate limiter with Redis persistence and in-memory fallback
 */
export class ServerRateLimiter {
  private prefix: string;
  private limit: number;
  private windowMs: number;

  /**
   * @param prefix - Unique identifier for this limiter (e.g., 'otp-verify', 'login')
   * @param limit - Maximum number of attempts allowed in the window
   * @param windowMs - Time window in milliseconds (default: 15 minutes)
   */
  constructor(prefix: string, limit: number, windowMs = 15 * 60 * 1000) {
    this.prefix = prefix;
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Check if the identifier (email, IP, etc.) is within rate limits
   * Automatically increments the counter
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `ratelimit:${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (redis) {
      try {
        // Use Redis sorted set to track attempts with timestamps
        const multi = redis.multi();

        // Remove old entries outside the time window
        multi.zremrangebyscore(key, 0, windowStart);

        // Count current attempts
        multi.zcard(key);

        // Add current attempt
        multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });

        // Set expiry on the key
        multi.expire(key, Math.ceil(this.windowMs / 1000));

        const results = await multi.exec();
        const count = (results[1] as number) || 0;

        const remaining = Math.max(0, this.limit - count - 1);
        const success = count < this.limit;

        return {
          success,
          limit: this.limit,
          remaining,
          reset: now + this.windowMs,
          retryAfter: success ? undefined : Math.ceil(this.windowMs / 1000),
        };
      } catch (error) {
        console.error("[server-rate-limiter] Redis error, falling back to in-memory:", error);
        // Fall through to in-memory implementation
      }
    }

    // In-memory fallback
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetAt) {
      // Create new window
      memoryStore.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: now + this.windowMs,
      };
    }

    // Increment counter
    entry.count++;
    const remaining = Math.max(0, this.limit - entry.count);
    const success = entry.count <= this.limit;

    return {
      success,
      limit: this.limit,
      remaining,
      reset: entry.resetAt,
      retryAfter: success ? undefined : Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `ratelimit:${this.prefix}:${identifier}`;

    if (redis) {
      try {
        await redis.del(key);
        return;
      } catch (error) {
        console.error("[server-rate-limiter] Redis reset error:", error);
      }
    }

    memoryStore.delete(key);
  }
}

// Pre-configured rate limiters for common use cases

/**
 * OTP verification: 5 attempts per 15 minutes per email
 * Prevents brute force attacks on 6-digit OTP codes
 */
export const otpVerifyLimiter = new ServerRateLimiter("otp-verify", 5, 15 * 60 * 1000);

/**
 * OTP sending: 3 attempts per 15 minutes per email
 * Prevents email flooding and DoS attacks
 */
export const otpSendLimiter = new ServerRateLimiter("otp-send", 3, 15 * 60 * 1000);

/**
 * Login attempts: 10 attempts per hour per email
 * Prevents brute force attacks on passwords
 */
export const loginLimiter = new ServerRateLimiter("login", 10, 60 * 60 * 1000);

/**
 * WebAuthn verification: 10 attempts per 15 minutes per email
 * More lenient than OTP due to device-based authentication
 */
export const webauthnLimiter = new ServerRateLimiter("webauthn", 10, 15 * 60 * 1000);
