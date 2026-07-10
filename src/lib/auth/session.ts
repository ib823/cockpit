import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { setUserEpoch } from "./revocation";

export type SessionRole = "USER" | "MANAGER" | "ADMIN";

/** 30 days, matching the NextAuth JWT `maxAge` in `authConfig`. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * The cookie name NextAuth (and `getToken`) expects.
 *
 * When secure cookies are in use (production/HTTPS), NextAuth reads the
 * `__Secure-`-prefixed name. The mint side MUST match, or the session is
 * invisible to the middleware guard — the class of bug that left several
 * login flows returning `ok: true` while the user stayed logged out.
 */
export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

export interface EstablishSessionParams {
  userId: string;
  email: string;
  role: SessionRole;
  name?: string | null;
  /** Best-effort request context recorded on the session row. */
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  /**
   * When set (> 0), enforce the user's concurrent-session cap by revoking the
   * oldest active session rows before creating the new one. Salvaged from the
   * retired `login-secure` flow.
   */
  maxConcurrentSessions?: number | null;
}

export interface EstablishedSession {
  /** The signed NextAuth JWT written to the session cookie. */
  sessionToken: string;
  /** The DB `sessions.id`, embedded in the JWT as `sid` for revocation. */
  sid: string;
}

/**
 * Single source of truth for establishing an authenticated session.
 *
 * Every login flow routes through here so that cookie name, lifetime, JWT
 * payload, and the backing `sessions` row are produced identically:
 *
 *  1. (optional) enforce the concurrent-session cap.
 *  2. create a DB `sessions` row so every login is visible to session
 *     management and can be revoked (its id becomes the JWT `sid`).
 *  3. mint a NextAuth-compatible JWT carrying `userId/email/role/sid`.
 *  4. set the session cookie on the provided response with the correct name.
 *
 * The caller passes the `NextResponse` it will return; the cookie is set on it.
 */
export async function establishSession(
  response: NextResponse,
  params: EstablishSessionParams
): Promise<EstablishedSession> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");

  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // 1. Concurrent-session enforcement (best-effort — never blocks login).
  if (params.maxConcurrentSessions && params.maxConcurrentSessions > 0) {
    try {
      const active = await prisma.sessions.findMany({
        where: { userId: params.userId, expires: { gt: new Date() }, revokedAt: null },
        orderBy: { lastActivity: "desc" },
        select: { id: true },
      });
      const overflow = active.slice(params.maxConcurrentSessions - 1).map((s) => s.id);
      if (overflow.length > 0) {
        await prisma.sessions.updateMany({
          where: { id: { in: overflow } },
          data: { revokedAt: new Date(), revokedReason: "concurrent_limit" },
        });
      }
    } catch (e) {
      logger.error("[session] concurrent-session enforcement failed", { error: e });
    }
  }

  // 2. Create the revocable session row. `sid` links the JWT to this row.
  const sid = randomUUID();
  await prisma.sessions.create({
    data: {
      id: sid,
      sessionToken: randomUUID(), // opaque; the JWT is the real credential
      userId: params.userId,
      expires,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
      deviceFingerprint: params.deviceFingerprint ?? undefined,
      lastActivity: new Date(),
    },
  });

  // Read the user's session epoch so the JWT can be invalidated en masse by a
  // "sign out everywhere" (which bumps this value). Defaults to 0.
  const dbUser = await prisma.users.findUnique({
    where: { id: params.userId },
    select: { sessionEpoch: true },
  });
  const epoch = dbUser?.sessionEpoch ?? 0;

  // 3. Mint the NextAuth JWT (verified by middleware via `getToken`).
  const sessionToken = await encode({
    token: {
      userId: params.userId,
      email: params.email,
      role: params.role,
      sub: params.userId,
      name: params.name || params.email.split("@")[0],
      sid,
      epoch,
    },
    secret,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // 4. Set the cookie with the environment-correct name.
  response.cookies.set(sessionCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // Keep the Redis epoch cache warm and consistent with the minted token.
  await setUserEpoch(params.userId, epoch);

  return { sessionToken, sid };
}
