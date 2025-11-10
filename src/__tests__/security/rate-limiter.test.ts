/**
 * Unit Tests for Rate Limiter
 */

import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitInfo,
  detectBot,
  RATE_LIMITS,
} from "@/lib/security/rate-limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Clear rate limits before each test
    resetRateLimit("test-user-1");
    resetRateLimit("test-user-2");
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const config = { windowMs: 60000, maxRequests: 3 };

      // First 3 requests should be allowed
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit("test-user-1", config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2 - i);
      }
    });

    it("should block requests exceeding limit", () => {
      const config = { windowMs: 60000, maxRequests: 3 };

      // Exceed limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test-user-1", config);
      }

      // 4th request should be blocked
      const result = checkRateLimit("test-user-1", config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should have different limits for different users", () => {
      const config = { windowMs: 60000, maxRequests: 2 };

      // User 1 uses up their limit
      checkRateLimit("test-user-1", config);
      checkRateLimit("test-user-1", config);

      // User 1 blocked
      const user1Result = checkRateLimit("test-user-1", config);
      expect(user1Result.allowed).toBe(false);

      // User 2 still allowed
      const user2Result = checkRateLimit("test-user-2", config);
      expect(user2Result.allowed).toBe(true);
    });

    it("should reset after time window expires", () => {
      const config = { windowMs: 100, maxRequests: 2 }; // 100ms window

      // Use up limit
      checkRateLimit("test-user-1", config);
      checkRateLimit("test-user-1", config);

      // Should be blocked
      expect(checkRateLimit("test-user-1", config).allowed).toBe(false);

      // Wait for window to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = checkRateLimit("test-user-1", config);
          expect(result.allowed).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe("getRateLimitInfo", () => {
    it("should return current rate limit status", () => {
      const config = { windowMs: 60000, maxRequests: 5 };

      // Make 2 requests
      checkRateLimit("test-user-1", config);
      checkRateLimit("test-user-1", config);

      const info = getRateLimitInfo("test-user-1", config);
      expect(info.count).toBe(2);
      expect(info.remaining).toBe(3);
      expect(info.blocked).toBe(false);
    });

    it("should show blocked status after exceeding limit", () => {
      const config = { windowMs: 60000, maxRequests: 2 };

      // Exceed limit
      checkRateLimit("test-user-1", config);
      checkRateLimit("test-user-1", config);
      checkRateLimit("test-user-1", config);

      const info = getRateLimitInfo("test-user-1", config);
      expect(info.count).toBe(3);
      expect(info.remaining).toBe(0);
      expect(info.blocked).toBe(true);
    });
  });

  describe("resetRateLimit", () => {
    it("should clear rate limit for user", () => {
      const config = { windowMs: 60000, maxRequests: 2 };

      // Exceed limit
      checkRateLimit("test-user-1", config);
      checkRateLimit("test-user-1", config);
      checkRateLimit("test-user-1", config);

      // Should be blocked
      expect(checkRateLimit("test-user-1", config).allowed).toBe(false);

      // Reset
      resetRateLimit("test-user-1");

      // Should be allowed again
      const result = checkRateLimit("test-user-1", config);
      expect(result.allowed).toBe(true);
    });
  });

  describe("detectBot", () => {
    it("should detect missing User-Agent as bot", () => {
      const req = new Request("http://localhost", {
        method: "POST",
      });

      const result = detectBot(req);
      expect(result.isBot).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasons).toContain("Missing User-Agent");
    });

    it("should detect bot User-Agent", () => {
      const req = new Request("http://localhost", {
        method: "POST",
        headers: {
          "User-Agent": "python-requests/2.28.0",
        },
      });

      const result = detectBot(req);
      expect(result.isBot).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reasons).toContain("Bot-like User-Agent");
    });

    it("should allow normal browser User-Agent", () => {
      const req = new Request("http://localhost", {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const result = detectBot(req);
      expect(result.isBot).toBe(false);
      expect(result.confidence).toBeLessThan(0.6);
    });

    it("should detect missing common headers", () => {
      const req = new Request("http://localhost", {
        method: "POST",
        headers: {
          "User-Agent": "curl/7.68.0",
        },
      });

      const result = detectBot(req);
      expect(result.isBot).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(1);
    });
  });

  describe("RATE_LIMITS configuration", () => {
    it("should have reasonable limits", () => {
      expect(RATE_LIMITS.PROJECT_CREATE.maxRequests).toBe(10);
      expect(RATE_LIMITS.PROJECT_CREATE.windowMs).toBe(60 * 60 * 1000); // 1 hour

      expect(RATE_LIMITS.API_GENERAL.maxRequests).toBe(100);
      expect(RATE_LIMITS.API_GENERAL.windowMs).toBe(60 * 1000); // 1 minute

      expect(RATE_LIMITS.LOGIN_ATTEMPT.maxRequests).toBe(5);
      expect(RATE_LIMITS.LOGIN_ATTEMPT.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });
  });
});
