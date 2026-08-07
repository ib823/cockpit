/**
 * Registration grants — proof that a magic link was verified server-side.
 *
 * Background: passkey registration (`/api/auth/begin-register`) has two entry
 * paths. The access-code path proves intent by presenting a code that is
 * bcrypt-compared against `EmailApproval.tokenHash`. The magic-link path
 * previously proved nothing at all — it trusted a client-supplied
 * `magicLink: true` flag and skipped code validation entirely, which let an
 * unauthenticated caller mint a registration challenge for any approved email
 * (including an admin) and attach their own passkey to that account.
 *
 * A grant closes that hole. It is a random, single-purpose token that only
 * `/api/auth/verify-magic-link` can create, and only after it has verified and
 * consumed a real emailed magic link. Possession of a grant is therefore
 * equivalent to possession of the victim's inbox.
 *
 * Grants are stored in `magic_tokens` (which already carries a `type`
 * discriminator) so they inherit that table's expiry/usage columns and need no
 * new secret material — notably not `JWT_SECRET_KEY`, which is optional and
 * may be unset in a valid deployment.
 */

import { prisma } from "@/lib/db";

/** Discriminator distinguishing grants from OTP/magic-link rows in `magic_tokens`. */
export const REGISTRATION_GRANT_TYPE = "registration_grant";

/**
 * Grant lifetime. Long enough to survive a user fumbling the platform passkey
 * prompt (and retrying), short enough to bound replay of a leaked grant.
 */
export const REGISTRATION_GRANT_TTL_MS = 10 * 60 * 1000;

/**
 * Returns true only if `grant` is a live registration grant issued for `email`.
 *
 * Fails closed on every unexpected input: wrong type, wrong email, consumed,
 * expired, or absent. Does not consume the grant — registration may legitimately
 * be retried within the TTL window if the authenticator prompt is cancelled.
 */
export async function isValidRegistrationGrant(
  grant: unknown,
  email: string
): Promise<boolean> {
  if (typeof grant !== "string" || grant.length === 0) return false;

  const row = await prisma.magic_tokens.findUnique({ where: { token: grant } });

  if (!row) return false;
  if (row.type !== REGISTRATION_GRANT_TYPE) return false;
  if (row.email !== email) return false;
  if (row.usedAt) return false;
  if (row.expiresAt < new Date()) return false;

  return true;
}
