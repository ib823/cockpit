/**
 * Regression test for unbounded brute force against admin access codes (V-5).
 *
 * Access codes are 6 digits (10^6 space) and stay valid for 7 days. Before this
 * guard, /api/auth/admin-login carried no per-account limiter and was absent
 * from the middleware's SENSITIVE_PATHS, so it inherited only the general
 * 60-req/min limit — which is keyed by IP in production and therefore
 * parallelises across source addresses. The search space was reachable.
 *
 * This pins the per-account ceiling in place.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { accessCodeLimiter } from "@/lib/server-rate-limiter";

vi.mock("@/lib/db", () => ({
  prisma: {
    // No such admin — every attempt is a miss, which is exactly the shape of a
    // brute-force run. The limiter must stop it regardless.
    users: { findUnique: vi.fn().mockResolvedValue(null) },
    emailApproval: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

const TARGET = "victim-admin@example.com";

function attempt(code: string): Request {
  return new Request("http://localhost:3000/api/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ email: TARGET, code }),
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin-login: per-account access-code rate limit (V-5)", () => {
  beforeEach(async () => {
    process.env.ENABLE_MAGIC_LINKS = "true";
    await accessCodeLimiter.reset(TARGET);
  });

  test("guessing is cut off after the per-account limit, not merely slowed", async () => {
    const { POST } = await import("@/app/api/auth/admin-login/route");

    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await POST(attempt(String(100000 + i)));
      statuses.push(res.status);
    }

    // First few are ordinary auth failures; the rest must be refused outright.
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    expect(statuses[statuses.length - 1]).toBe(429);
  });

  test("a throttled response advertises Retry-After", async () => {
    const { POST } = await import("@/app/api/auth/admin-login/route");

    let throttled: Response | undefined;
    for (let i = 0; i < 8; i++) {
      const res = await POST(attempt(String(200000 + i)));
      if (res.status === 429) {
        throttled = res;
        break;
      }
    }

    expect(throttled).toBeDefined();
    expect(throttled?.headers.get("Retry-After")).toBeTruthy();
  });

  test("the limit is keyed per account, so a different target is unaffected", async () => {
    const { POST } = await import("@/app/api/auth/admin-login/route");

    for (let i = 0; i < 8; i++) {
      await POST(attempt(String(300000 + i)));
    }

    const other = "someone-else@example.com";
    await accessCodeLimiter.reset(other);
    const res = await POST(
      new Request("http://localhost:3000/api/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ email: other, code: "123456" }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(res.status).not.toBe(429);
  });
});
