import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { users } from "@prisma/client";

export type SessionRole = "USER" | "MANAGER" | "ADMIN";

export interface AuthContext {
  userId: string;
  email: string;
  role: SessionRole;
}

/** App Router's second handler argument (dynamic routes carry `params`). */
export type RouteContext = { params?: Promise<Record<string, string>> };

type AuthedHandler<C extends RouteContext> = (
  req: NextRequest,
  auth: AuthContext,
  ctx: C
) => Promise<Response> | Response;

/**
 * Wrap a route handler with authentication (and optional role) enforcement.
 *
 * Replaces the repeated `getServerSession` / `requireAdmin()` + `try/catch`
 * 401/403 boilerplate scattered across routes with one guard. The wrapped
 * handler receives the resolved {@link AuthContext} as its second argument and
 * the original App Router context (with `params`) as its third.
 *
 * Authentication is read from the NextAuth JWT session; revocation is enforced
 * upstream in `middleware.ts`, so it is intentionally not re-checked here.
 */
export function withAuth<C extends RouteContext = RouteContext>(
  handler: AuthedHandler<C>,
  opts?: { role?: SessionRole }
) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user.role ?? "USER") as SessionRole;
    if (opts?.role && role !== opts.role) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    return handler(req, { userId: session.user.id, email: session.user.email, role }, ctx);
  };
}

/** Convenience wrapper for admin-only routes. */
export function withAdmin<C extends RouteContext = RouteContext>(handler: AuthedHandler<C>) {
  return withAuth(handler, { role: "ADMIN" });
}

type UserHandler<C extends RouteContext> = (
  req: NextRequest,
  user: users,
  ctx: C
) => Promise<Response> | Response;

/**
 * Like {@link withAuth}, but also loads the full `users` row (by id) once and
 * passes it to the handler. Removes the ubiquitous
 * `getServerSession` + `prisma.users.findUnique({ where: { email } })` pair.
 * Returns 401 if the row no longer exists (e.g. deleted account).
 */
export function withUser<C extends RouteContext = RouteContext>(
  handler: UserHandler<C>,
  opts?: { role?: SessionRole }
) {
  return withAuth<C>(async (req, auth, ctx) => {
    const user = await prisma.users.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, user, ctx);
  }, opts);
}
