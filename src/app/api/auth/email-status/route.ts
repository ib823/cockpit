import { NextResponse } from 'next/server';
import { checkRateLimit, getRequestIdentifier } from '@/lib/security/rate-limiter';
import { sanitizeHtml } from '@/lib/input-sanitizer';

type Status = {
  registered: boolean;
  hasPasskey: boolean;  // best-effort; true if user exists
  invited: boolean;
  inviteMethod: 'code' | 'link' | null;
  needsAction: 'login' | 'enter_invite' | 'not_found';
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
        error: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter || 60),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const emailParam = searchParams.get('email') || '';

  // SECURITY FIX: DEFECT-20251027-002
  // Sanitize email input to prevent XSS attacks
  const emailRaw = sanitizeHtml(emailParam).trim().toLowerCase();

  // Validate email format and length
  if (!emailRaw || emailRaw.length > 255) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  // Best-effort Prisma loading without repo-specific path assumptions
  let prisma: any;
  try {
    const mod = await import('@/lib/db').catch(() => null);
    prisma = (mod && (mod as any).prisma) || (mod && (mod as any).default);
    if (!prisma) {
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient();
    }
  } catch {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient();
    } catch {
      // If Prisma truly missing, return conservative defaults
      const fallback: Status = { registered: false, hasPasskey: false, invited: false, inviteMethod: null, needsAction: 'not_found' };
      return NextResponse.json(fallback);
    }
  }

  // Registered?
  let user: any = null;
  try {
    user = await prisma.users.findUnique?.({
      where: { email: emailRaw },
      include: { Authenticator: true }
    });
  } catch {}

  // Invited?
  let invite: any = null;
  try {
    invite = await prisma.emailApproval.findUnique?.({ where: { email: emailRaw } });
  } catch {}

  const registered = !!user;
  const hasPasskey = !!(user && user.Authenticator && user.Authenticator.length > 0);
  const invited = !!(invite && !invite.usedAt && invite.tokenExpiresAt && new Date(invite.tokenExpiresAt) > new Date());

  // Use magic links if enabled, otherwise use codes
  const useMagicLinks = process.env.ENABLE_MAGIC_LINKS === 'true';
  const inviteMethod: 'code' | 'link' | null = invited ? (useMagicLinks ? 'link' : 'code') : null;

  const needsAction: Status['needsAction'] =
    registered && hasPasskey ? 'login' : invited ? 'enter_invite' : 'not_found';

  const res: Status = { registered, hasPasskey, invited, inviteMethod, needsAction };
  return NextResponse.json(res);
}
