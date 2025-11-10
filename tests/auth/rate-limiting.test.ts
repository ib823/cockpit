/**
 * Rate Limiting Tests
 * Tests for middleware rate limiting functionality
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../src/middleware";
import { sleep } from "./helpers/auth-helpers";

// Helper to create Next.js request
function createNextRequest(options: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}): NextRequest {
  const url = new URL(options.url);
  const request = new NextRequest(url, {
    method: options.method || "GET",
    headers: options.headers || {},
  });

  return request;
}

describe("Rate Limiting", () => {
  beforeEach(async () => {
    // Wait a bit between tests to avoid cross-test contamination
    await sleep(100);
  });

  describe("Login endpoint rate limiting", () => {
    it("should allow up to 20 login attempts within 5 minutes", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const userAgent = `test-allow20-${Date.now()}-${randomId}`;

      // Make 20 POST requests to login endpoint
      for (let i = 0; i < 20; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/api/auth/begin-login",
          method: "POST",
          headers: {
            "user-agent": userAgent,
          },
        });

        const response = await middleware(request);

        // Should not be rate limited
        expect(response.status).not.toBe(429);

        const remaining = response.headers.get("X-RateLimit-Remaining");
        expect(parseInt(remaining || "0")).toBeGreaterThanOrEqual(0);
      }
    });

    it("should block 21st login attempt within 5 minutes", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const userAgent = `test-block21-${Date.now()}-${randomId}`;

      // Make 20 successful requests
      for (let i = 0; i < 20; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/api/auth/begin-login",
          method: "POST",
          headers: {
            "user-agent": userAgent,
          },
        });

        await middleware(request);
      }

      // 21st request should be blocked
      const request = createNextRequest({
        url: "http://localhost:3000/api/auth/begin-login",
        method: "POST",
        headers: {
          "user-agent": userAgent,
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBeDefined();

      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.message).toContain("Too many requests");
    });

    it("should NOT rate limit GET requests to /login page", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const userAgent = `test-loginget-${Date.now()}-${randomId}`;

      // Make many GET requests to /login page
      for (let i = 0; i < 25; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/login",
          method: "GET",
          headers: {
            "user-agent": userAgent,
          },
        });

        const response = await middleware(request);

        // Should use standard rate limit (60/min), not login limit
        expect(response.status).not.toBe(429);
      }
    });

    it("should separate rate limits for different user agents", async () => {
      // Add random component to ensure uniqueness across test runs
      // NOTE: User agents must differ in the first ~10 characters because middleware
      // truncates base64-encoded user-agent to 16 chars (src/middleware.ts:150)
      const randomId = Math.random().toString(36).substring(7);
      const userAgent1 = `AAA-${randomId}-${Date.now()}`;
      const userAgent2 = `BBB-${randomId}-${Date.now()}`;

      // User 1: Make 20 requests
      for (let i = 0; i < 20; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/api/auth/begin-login",
          method: "POST",
          headers: {
            "user-agent": userAgent1,
          },
        });

        const response = await middleware(request);
        expect(response.status).not.toBe(429);
      }

      // User 2: Should still have full limit available
      const request = createNextRequest({
        url: "http://localhost:3000/api/auth/begin-login",
        method: "POST",
        headers: {
          "user-agent": userAgent2,
        },
      });

      const response = await middleware(request);
      expect(response.status).not.toBe(429);

      const remaining = response.headers.get("X-RateLimit-Remaining");
      expect(parseInt(remaining || "0")).toBeGreaterThan(15);
    });

    it("should ignore spoofed IP headers in development mode (SECURITY)", async () => {
      // SECURITY: In development mode, x-forwarded-for headers should be IGNORED
      // to prevent IP spoofing attacks. This test verifies that security fix.
      const randomSuffix = Math.floor(Math.random() * 200) + 50;
      const ip1 = `192.168.${randomSuffix}.100`;
      const ip2 = `192.168.${randomSuffix}.101`;

      // Make 20 requests with IP1 header
      for (let i = 0; i < 20; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/api/auth/begin-login",
          method: "POST",
          headers: {
            "x-forwarded-for": ip1,
          },
        });

        await middleware(request);
      }

      // Try with different IP header - should still be rate limited because
      // headers are ignored in dev mode (falls back to user-agent)
      const request = createNextRequest({
        url: "http://localhost:3000/api/auth/begin-login",
        method: "POST",
        headers: {
          "x-forwarded-for": ip2,
        },
      });

      const response = await middleware(request);

      // EXPECTED: Rate limited (429) because x-forwarded-for is IGNORED in dev mode
      // This proves the security fix is working correctly
      expect(response.status).toBe(429);
    });
  });

  describe("General API rate limiting", () => {
    it("should allow up to 60 requests per minute", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const userAgent = `test-api60-${Date.now()}-${randomId}`;

      // Make 60 requests to public endpoint (not protected, not login)
      for (let i = 0; i < 60; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/login",
          method: "GET",
          headers: {
            "user-agent": userAgent,
          },
        });

        const response = await middleware(request);
        expect(response.status).not.toBe(429);
      }
    });

    it("should block 61st request within 1 minute", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const userAgent = `test-api61-${Date.now()}-${randomId}`;

      // Make 60 requests to public endpoint
      for (let i = 0; i < 60; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/login",
          method: "GET",
          headers: {
            "user-agent": userAgent,
          },
        });

        await middleware(request);
      }

      // 61st request should be blocked
      const request = createNextRequest({
        url: "http://localhost:3000/login",
        method: "GET",
        headers: {
          "user-agent": userAgent,
        },
      });

      const response = await middleware(request);
      expect(response.status).toBe(429);
    });
  });

  describe("Rate limit headers", () => {
    it("should include rate limit headers in all responses", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const request = createNextRequest({
        url: "http://localhost:3000/login",
        method: "GET",
        headers: {
          "user-agent": `test-headers-${Date.now()}-${randomId}`,
        },
      });

      const response = await middleware(request);

      expect(response.headers.get("X-RateLimit-Limit")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
    });

    it("should include Retry-After header when rate limited", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const userAgent = `test-retry-${Date.now()}-${randomId}`;

      // Exhaust rate limit
      for (let i = 0; i < 20; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/api/auth/begin-login",
          method: "POST",
          headers: {
            "user-agent": userAgent,
          },
        });

        await middleware(request);
      }

      // Next request should be rate limited
      const request = createNextRequest({
        url: "http://localhost:3000/api/auth/begin-login",
        method: "POST",
        headers: {
          "user-agent": userAgent,
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBeDefined();

      const retryAfter = parseInt(response.headers.get("Retry-After") || "0");
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(300); // Should be <= 5 minutes
    });
  });

  describe("Static assets exemption", () => {
    it("should not rate limit static assets", async () => {
      const randomId = Math.random().toString(36).substring(7);
      const userAgent = `test-static-${Date.now()}-${randomId}`;

      // Make many requests to static assets
      for (let i = 0; i < 100; i++) {
        const request = createNextRequest({
          url: "http://localhost:3000/_next/static/chunks/main.js",
          method: "GET",
          headers: {
            "user-agent": userAgent,
          },
        });

        const response = await middleware(request);
        expect(response.status).not.toBe(429);
      }
    });
  });
});
