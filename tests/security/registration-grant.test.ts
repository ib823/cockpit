/**
 * Regression tests for the magic-link registration bypass.
 *
 * The vulnerability: POST /api/auth/begin-register accepted a client-supplied
 * `magicLink: true` flag and, when present, skipped access-code validation
 * entirely — checking only that an EmailApproval row existed for the address.
 * Combined with finish-register (which validated only the WebAuthn challenge),
 * two unauthenticated requests were enough to attach an attacker's passkey to
 * any approved account, including an ADMIN, and receive a live session.
 *
 * The fix requires a registration grant that only /api/auth/verify-magic-link
 * can mint, and only after verifying a real emailed magic link.
 *
 * These tests pin the exploit shut. They mock Prisma directly so no live
 * database is needed.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

const findUniqueMagicToken = vi.fn();
const findUniqueEmailApproval = vi.fn();
const findManyAuthenticator = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    magic_tokens: { findUnique: (...a: unknown[]) => findUniqueMagicToken(...a) },
    emailApproval: { findUnique: (...a: unknown[]) => findUniqueEmailApproval(...a) },
    authenticator: { findMany: (...a: unknown[]) => findManyAuthenticator(...a) },
  },
}));

vi.mock("@/lib/webauthn", () => ({
  rpID: "localhost",
  rpName: "Test",
  challenges: { set: vi.fn(), get: vi.fn(), del: vi.fn() },
  generateRegistrationOptions: vi.fn().mockResolvedValue({ challenge: "test-challenge" }),
}));

const VICTIM = "admin@example.com";
const GRANT_TYPE = "registration_grant";

function request(body: unknown): Request {
  return new Request("http://localhost:3000/api/auth/begin-register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function liveGrant(overrides: Record<string, unknown> = {}) {
  return {
    token: "valid-grant-token",
    email: VICTIM,
    type: GRANT_TYPE,
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

describe("begin-register: magic-link registration bypass (V-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_MAGIC_LINKS = "true";
    // An approved victim exists — this alone used to be sufficient to register.
    findUniqueEmailApproval.mockResolvedValue({
      email: VICTIM,
      tokenHash: "$2a$10$notarealhash",
      tokenExpiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    findManyAuthenticator.mockResolvedValue([]);
  });

  test("THE EXPLOIT: magicLink:true with no grant is rejected", async () => {
    findUniqueMagicToken.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(request({ email: VICTIM, magicLink: true }));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).not.toHaveProperty("options");
  });

  test("a forged grant that does not exist is rejected", async () => {
    findUniqueMagicToken.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(
      request({ email: VICTIM, magicLink: true, registrationGrant: "forged" })
    );

    expect(res.status).toBe(403);
  });

  test("a grant issued for a different email cannot be replayed at the victim", async () => {
    // Attacker legitimately verifies a magic link for their OWN address, then
    // presents that grant while naming the victim.
    findUniqueMagicToken.mockResolvedValue(liveGrant({ email: "attacker@example.com" }));

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(
      request({ email: VICTIM, magicLink: true, registrationGrant: "valid-grant-token" })
    );

    expect(res.status).toBe(403);
  });

  test("an OTP row cannot be substituted for a registration grant", async () => {
    findUniqueMagicToken.mockResolvedValue(liveGrant({ type: "otp" }));

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(
      request({ email: VICTIM, magicLink: true, registrationGrant: "valid-grant-token" })
    );

    expect(res.status).toBe(403);
  });

  test("an expired grant is rejected", async () => {
    findUniqueMagicToken.mockResolvedValue(
      liveGrant({ expiresAt: new Date(Date.now() - 1_000) })
    );

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(
      request({ email: VICTIM, magicLink: true, registrationGrant: "valid-grant-token" })
    );

    expect(res.status).toBe(403);
  });

  test("a consumed grant is rejected", async () => {
    findUniqueMagicToken.mockResolvedValue(liveGrant({ usedAt: new Date() }));

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(
      request({ email: VICTIM, magicLink: true, registrationGrant: "valid-grant-token" })
    );

    expect(res.status).toBe(403);
  });

  test("the flow is closed entirely when ENABLE_MAGIC_LINKS is off", async () => {
    process.env.ENABLE_MAGIC_LINKS = "false";
    findUniqueMagicToken.mockResolvedValue(liveGrant());

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(
      request({ email: VICTIM, magicLink: true, registrationGrant: "valid-grant-token" })
    );

    expect(res.status).toBe(403);
  });

  test("a genuine grant still completes the legitimate flow", async () => {
    findUniqueMagicToken.mockResolvedValue(liveGrant());

    const { POST } = await import("@/app/api/auth/begin-register/route");
    const res = await POST(
      request({ email: VICTIM, magicLink: true, registrationGrant: "valid-grant-token" })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.options).toBeDefined();
  });
});
