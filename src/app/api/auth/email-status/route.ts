import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier } from "@/lib/security/rate-limiter";
import { sanitizeHtml } from "@/lib/input-sanitizer";
import { PrismaClient, Prisma } from "@prisma/client";

type User = Prisma.usersGetPayload<{ select: { id: true; email: true; Authenticator: true } }>;
type Authenticator = Prisma.AuthenticatorGetPayload<object>;
type EmailApproval = Prisma.EmailApprovalGetPayload<object>;

interface UserWithAuthenticators extends User {
  Authenticator: Authenticator[];
}

type Status = {
  registered: boolean;
  hasPasskey: boolean; // best-effort; true if user exists
  invited: boolean;
  inviteMethod: "code" | "link" | null;
  needsAction: "login" | "enter_invite" | "not_found";
};

/** Response used when the address cannot be looked up at all. */
const UNKNOWN_EMAIL_STATUS: Status = {
  registered: false,
  hasPasskey: false,
  invited: false,
  inviteMethod: null,
  needsAction: "not_found",
};

export async function GET(req: Request) {
  // SECURITY FIX: DEFECT-20251027-009
  // Add rate limiting to prevent email enumeration attacks
  const identifier = getRequestIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute per IP
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfter || 60),
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const emailParam = searchParams.get("email") || "";

  // SECURITY FIX: DEFECT-20251027-002
  // Sanitize email input to prevent XSS attacks
  const emailRaw = sanitizeHtml(emailParam).trim().toLowerCase();

  // Validate email format and length
  if (!emailRaw || emailRaw.length > 255) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // Resolve the shared Prisma client. Previously this fell back to
  // `new PrismaClient()` per request, which on serverless opens a fresh pool
  // for every call against a `connection_limit=5` pooler; the fallback is gone
  // and a missing client now takes the conservative-defaults path below.
  let prisma: PrismaClient | null = null;
  try {
    const mod = await import("@/lib/db").catch(() => null);
    if (mod && "prisma" in mod) {
      prisma = (mod as unknown as { prisma: PrismaClient }).prisma;
    } else if (mod && "default" in mod) {
      prisma = (mod as { default: PrismaClient }).default;
    }
    if (!prisma) {
      return NextResponse.json(UNKNOWN_EMAIL_STATUS);
    }
  } catch {
    // Client unavailable — answer conservatively rather than leaking that the
    // lookup failed for this address specifically.
    return NextResponse.json(UNKNOWN_EMAIL_STATUS);
  }

  // Registered?
  let user: UserWithAuthenticators | null = null;
  try {
    user = await prisma.users.findUnique?.({
      where: { email: emailRaw },
      include: { Authenticator: true },
    });
  } catch (_dbError) {
    // Database query may fail if schema is not migrated — proceed with null
  }

  // Invited?
  let invite: EmailApproval | null = null;
  try {
    invite = await prisma.emailApproval.findUnique?.({ where: { email: emailRaw } });
  } catch (_dbError) {
    // Database query may fail if schema is not migrated — proceed with null
  }

  const registered = !!user;
  const hasPasskey = !!(user && user.Authenticator && user.Authenticator.length > 0);
  const invited = !!(
    invite &&
    !invite.usedAt &&
    invite.tokenExpiresAt &&
    new Date(invite.tokenExpiresAt) > new Date()
  );

  // Use magic links if enabled, otherwise use codes
  const useMagicLinks = process.env.ENABLE_MAGIC_LINKS === "true";
  const inviteMethod: "code" | "link" | null = invited ? (useMagicLinks ? "link" : "code") : null;

  const needsAction: Status["needsAction"] =
    registered && hasPasskey ? "login" : invited ? "enter_invite" : "not_found";

  const res: Status = { registered, hasPasskey, invited, inviteMethod, needsAction };
  return NextResponse.json(res);
}
