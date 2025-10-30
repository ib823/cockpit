import { prisma } from '@/lib/db';
import { createSessionToken } from '@/lib/nextauth-helpers';
import { compare } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';


export async function POST(req: Request) {
  if (process.env.ENABLE_MAGIC_LINKS !== 'true') {
    return NextResponse.json({ ok: false, message: 'Disabled' }, { status: 404 });
  }
  try {
    const { email, code } = await req.json().catch(() => ({}));
    if (!email || !code) {
      return NextResponse.json(
        { ok: false, message: 'Email and code required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists and is admin
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, message: 'Invalid credentials' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check access expiry (unless exception)
    if (!user.exception && user.accessExpiresAt <= new Date()) {
      return NextResponse.json(
        { ok: false, message: 'Access expired' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify code
    const approval = await prisma.emailApproval.findUnique({ where: { email } });
    if (!approval || approval.usedAt || approval.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, message: 'Invalid or expired code' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const codeValid = await compare(code, approval.tokenHash);
    if (!codeValid) {
      return NextResponse.json(
        { ok: false, message: 'Invalid code' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();

    // Mark code as used and update login timestamps
    await prisma.$transaction([
      prisma.emailApproval.update({
        where: { email },
        data: { usedAt: now },
      }),
      prisma.users.update({
        where: { id: user.id },
        data: {
          lastLoginAt: now,
          firstLoginAt: user.firstLoginAt ?? now,
        },
      }),
      prisma.auditEvent.create({
        data: { id: randomUUID(), userId: user.id, type: 'admin_login' },
      }),
    ]);

    // Map MANAGER to USER for session purposes
    const sessionRole = user.role === 'ADMIN' ? 'ADMIN' : 'USER';
    //await createAuthSession(user.id, user.email, sessionRole);
    const token = await createSessionToken(user.id, user.email, sessionRole);

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        }
      }
    );

    return NextResponse.json(
      { ok: true },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('admin-login error', e);
    return NextResponse.json(
      { ok: false, message: 'Internal error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
