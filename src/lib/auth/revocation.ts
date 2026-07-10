/**
 * Session revocation — the enforcement layer that makes "revoke session" and
 * "sign out everywhere" actually terminate access.
 *
 * The app authenticates with a stateless NextAuth JWT, so revocation cannot
 * rely on deleting a database row alone (the guard never reads it). Instead
 * every JWT carries a session id (`sid`) and the user's session `epoch`, and
 * this module maintains a fast Redis view that the middleware guard checks on
 * every authenticated request:
 *
 *   - `revoked:sid:<sid>`   present  → that one session is dead.
 *   - `epoch:user:<userId>` = N      → every JWT with epoch < N is dead
 *                                      (used by "sign out everywhere").
 *
 * Redis is authoritative for the fast-path check; the database `sessions`
 * table and `users.sessionEpoch` remain the durable source of truth and are
 * written alongside these calls by the revoke endpoints.
 *
 * This module is edge-safe: it imports only the Upstash REST client (no
 * Prisma), so `src/middleware.ts` can call `isSessionRevoked` directly.
 * Every operation fails open — a Redis outage must never lock users out.
 */

import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

// Prefer Vercel-managed KV_* vars (current Upstash integration); fall back to
// legacy UPSTASH_* — matching the rest of the codebase's Redis wiring.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis: Redis | null =
  url && token && /^https:\/\//i.test(url) ? new Redis({ url, token }) : null;

/** Per-session revocation TTL — long enough to outlive a 30-day session. */
const REVOKED_SID_TTL_SECONDS = 30 * 24 * 60 * 60;
/** Epoch key TTL — must exceed session lifetime so it can't lapse mid-session. */
const USER_EPOCH_TTL_SECONDS = 60 * 24 * 60 * 60;

const sidKey = (sid: string) => `revoked:sid:${sid}`;
const epochKey = (userId: string) => `epoch:user:${userId}`;

/**
 * Pure decision: is a token's epoch stale relative to the user's current one?
 * Exported for unit testing the "sign out everywhere" comparison.
 */
export function epochRevoked(
  currentEpoch: number | null | undefined,
  tokenEpoch: number | null | undefined
): boolean {
  return (
    typeof currentEpoch === "number" &&
    typeof tokenEpoch === "number" &&
    currentEpoch > tokenEpoch
  );
}

/** True if the session (by `sid`) or the user's epoch has been revoked. */
export async function isSessionRevoked(claims: {
  sid?: unknown;
  userId?: unknown;
  epoch?: unknown;
}): Promise<boolean> {
  if (!redis) return false; // fail open when Redis isn't configured

  const sid = typeof claims.sid === "string" ? claims.sid : undefined;
  const userId = typeof claims.userId === "string" ? claims.userId : undefined;
  const epoch = typeof claims.epoch === "number" ? claims.epoch : undefined;

  if (!sid && userId === undefined) return false;

  try {
    if (sid && userId && epoch !== undefined) {
      const [revoked, current] = await redis.mget<[unknown, number | null]>(
        sidKey(sid),
        epochKey(userId)
      );
      return Boolean(revoked) || epochRevoked(current, epoch);
    }
    if (sid) {
      return Boolean(await redis.get(sidKey(sid)));
    }
    // userId + epoch only
    const current = await redis.get<number>(epochKey(userId as string));
    return epochRevoked(current, epoch);
  } catch (e) {
    logger.warn("[revocation] check failed (failing open)", { error: e });
    return false;
  }
}

/** Revoke a single session so its JWT is rejected on the next request. */
export async function markSessionRevoked(
  sid: string,
  ttlSeconds: number = REVOKED_SID_TTL_SECONDS
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(sidKey(sid), 1, { ex: Math.max(60, Math.ceil(ttlSeconds)) });
  } catch (e) {
    logger.error("[revocation] failed to mark session revoked", { error: e, sid });
  }
}

/** Revoke several sessions at once (e.g. "sign out everywhere except current"). */
export async function markSessionsRevoked(
  sids: string[],
  ttlSeconds: number = REVOKED_SID_TTL_SECONDS
): Promise<void> {
  if (!redis || sids.length === 0) return;
  await Promise.all(sids.map((sid) => markSessionRevoked(sid, ttlSeconds)));
}

/**
 * Publish the user's current session epoch to Redis. Called on every login
 * (to keep the cache warm and consistent with the freshly-minted token) and
 * whenever the epoch is bumped by a full "sign out everywhere".
 */
export async function setUserEpoch(userId: string, epoch: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(epochKey(userId), epoch, { ex: USER_EPOCH_TTL_SECONDS });
  } catch (e) {
    logger.error("[revocation] failed to set user epoch", { error: e, userId });
  }
}
