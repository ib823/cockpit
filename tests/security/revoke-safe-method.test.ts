/**
 * Regression test for the destructive GET on /api/security/revoke (V-7).
 *
 * The "This Wasn't Me" link in a security alert email performed the full
 * account lockdown on a bare GET: terminate every session, delete every
 * passkey, clear TOTP, lock the account, bump the session epoch. Anything that
 * follows links without a human — mail-client prefetch, corporate URL scanners,
 * browser prerendering — would silently brick the account.
 *
 * GET must now be side-effect free and render a confirmation form; only POST
 * may mutate.
 */

import { describe, test, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const mutations: string[] = [];

function trackedModel(name: string) {
  const track = (op: string) => () => {
    mutations.push(`${name}.${op}`);
    return Promise.resolve({ count: 0 });
  };
  return {
    update: track("update"),
    updateMany: track("updateMany"),
    delete: track("delete"),
    deleteMany: track("deleteMany"),
    create: track("create"),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
  };
}

vi.mock("@/lib/db", () => ({
  prisma: {
    securityAction: trackedModel("securityAction"),
    sessions: trackedModel("sessions"),
    authenticator: trackedModel("authenticator"),
    users: trackedModel("users"),
    auditEvent: trackedModel("auditEvent"),
    $transaction: (ops: unknown) => {
      mutations.push("$transaction");
      return Promise.resolve(Array.isArray(ops) ? ops : []);
    },
  },
}));

vi.mock("@/lib/email", () => ({ sendSecurityEmail: vi.fn().mockResolvedValue({ success: true }) }));
vi.mock("@/lib/auth/revocation", () => ({ setUserEpoch: vi.fn().mockResolvedValue(undefined) }));

// `@/lib/env` runs full zod validation at module import and throws when the
// process environment is incomplete, which it is under vitest.
vi.mock("@/lib/env", () => ({
  env: {
    JWT_SECRET_KEY: "test-jwt-secret-key-for-ci-only-32-chars",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

describe("security/revoke: destructive action requires POST (V-7)", () => {
  test("GET with a token performs no mutation", async () => {
    mutations.length = 0;

    const { GET } = await import("@/app/api/security/revoke/route");
    const res = await GET(
      new NextRequest("http://localhost:3000/api/security/revoke?token=some.jwt.token")
    );

    expect(res.status).toBe(200);
    // The whole point: a prefetch of this URL must change nothing.
    expect(mutations).toEqual([]);
  });

  test("GET renders a confirmation form that POSTs, rather than acting", async () => {
    const { GET } = await import("@/app/api/security/revoke/route");
    const res = await GET(
      new NextRequest("http://localhost:3000/api/security/revoke?token=some.jwt.token")
    );
    const html = await res.text();

    expect(html).toContain('method="POST"');
    expect(html).toContain("<form");
  });

  test("the confirmation page is not cacheable and not indexable", async () => {
    const { GET } = await import("@/app/api/security/revoke/route");
    const res = await GET(
      new NextRequest("http://localhost:3000/api/security/revoke?token=some.jwt.token")
    );

    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  test("the token is escaped before being embedded in the form", async () => {
    const { GET } = await import("@/app/api/security/revoke/route");
    const res = await GET(
      new NextRequest(
        `http://localhost:3000/api/security/revoke?token=${encodeURIComponent('a"><script>alert(1)</script>')}`
      )
    );
    const html = await res.text();

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("a missing token renders an error page without mutating", async () => {
    mutations.length = 0;

    const { GET } = await import("@/app/api/security/revoke/route");
    const res = await GET(new NextRequest("http://localhost:3000/api/security/revoke"));

    expect(res.status).toBe(400);
    expect(mutations).toEqual([]);
  });

  test("POST is exported so the confirmed action still has a handler", async () => {
    const mod = await import("@/app/api/security/revoke/route");
    expect(typeof mod.POST).toBe("function");
  });
});
