import { NextResponse } from 'next/server';

type Status = {
  registered: boolean;
  hasPasskey: boolean;  // best-effort; true if user exists
  invited: boolean;
  inviteMethod: 'code' | 'link' | null;
  needsAction: 'login' | 'enter_invite' | 'not_found';
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const emailRaw = (searchParams.get('email') || '').trim().toLowerCase();
  if (!emailRaw) return NextResponse.json({ error: 'email required' }, { status: 400 });

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
  const inviteMethod: 'code' | 'link' | null = invited ? 'code' : null;

  const needsAction: Status['needsAction'] =
    registered && hasPasskey ? 'login' : invited ? 'enter_invite' : 'not_found';

  const res: Status = { registered, hasPasskey, invited, inviteMethod, needsAction };
  return NextResponse.json(res);
}
