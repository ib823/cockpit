import { describe, it, expect, vi, beforeEach } from "vitest";

// Avoid pulling the real NextAuth config (and its Prisma/env import chain).
vi.mock("@/lib/auth", () => ({ authConfig: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { users: { findUnique: vi.fn() } } }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { withAuth, withAdmin, withUser } from "@/lib/auth/with-auth";

const mockSession = vi.mocked(getServerSession);
const mockFindUnique = vi.mocked(prisma.users.findUnique);
const req = {} as never;
const ctx = {} as never;

describe("withAuth", () => {
  beforeEach(() => mockSession.mockReset());

  it("returns 401 when there is no session", async () => {
    mockSession.mockResolvedValue(null);
    const handler = vi.fn();
    const res = await withAuth(handler)(req, ctx);
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when the role does not match", async () => {
    mockSession.mockResolvedValue({
      user: { id: "u1", email: "u@x.com", role: "USER" },
    } as never);
    const handler = vi.fn();
    const res = await withAdmin(handler)(req, ctx);
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler with the resolved auth context when authorized", async () => {
    mockSession.mockResolvedValue({
      user: { id: "u1", email: "admin@x.com", role: "ADMIN" },
    } as never);
    const handler = vi.fn().mockResolvedValue(new Response("ok"));
    await withAdmin(handler)(req, ctx);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][1]).toEqual({
      userId: "u1",
      email: "admin@x.com",
      role: "ADMIN",
    });
  });

  it("allows any authenticated user when no role is required", async () => {
    mockSession.mockResolvedValue({
      user: { id: "u2", email: "user@x.com", role: "USER" },
    } as never);
    const handler = vi.fn().mockResolvedValue(new Response("ok"));
    const res = await withAuth(handler)(req, ctx);
    expect(res).toBeInstanceOf(Response);
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe("withUser", () => {
  beforeEach(() => {
    mockSession.mockReset();
    mockFindUnique.mockReset();
  });

  it("loads the user row by id and passes it to the handler", async () => {
    mockSession.mockResolvedValue({
      user: { id: "u1", email: "u@x.com", role: "USER" },
    } as never);
    const userRow = { id: "u1", email: "u@x.com", role: "USER" };
    mockFindUnique.mockResolvedValue(userRow as never);
    const handler = vi.fn().mockResolvedValue(new Response("ok"));

    await withUser(handler)(req, ctx);

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "u1" } });
    expect(handler.mock.calls[0][1]).toBe(userRow);
  });

  it("returns 401 when the user row no longer exists", async () => {
    mockSession.mockResolvedValue({
      user: { id: "gone", email: "g@x.com", role: "USER" },
    } as never);
    mockFindUnique.mockResolvedValue(null as never);
    const handler = vi.fn();

    const res = await withUser(handler)(req, ctx);

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 without a session (never hits the DB)", async () => {
    mockSession.mockResolvedValue(null);
    const handler = vi.fn();

    const res = await withUser(handler)(req, ctx);

    expect(res.status).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});
