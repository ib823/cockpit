import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

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
