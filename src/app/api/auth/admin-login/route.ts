import { prisma } from '@/lib/db';
import { setSession } from '@/lib/session';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json().catch(() => ({}));
    if (!email || !code) {
      return NextResponse.json(
        { ok: false, error: 'Email and code required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check access expiry (unless exception)
    if (!user.exception && user.accessExpiresAt <= new Date()) {
      return NextResponse.json(
        { ok: false, error: 'Access expired' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify code
    const approval = await prisma.emailApproval.findUnique({ where: { email } });
    if (!approval || approval.usedAt || approval.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired code' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const codeValid = await compare(code, approval.tokenHash);
    if (!codeValid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid code' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await prisma.emailApproval.update({
      where: { email },
      data: { usedAt: new Date() },
    });

    // Create session
    await prisma.auditEvent.create({
      data: { userId: user.id, type: 'admin_login' },
    });

    await setSession({ sub: user.id, role: user.role as 'USER' | 'ADMIN' });

    return NextResponse.json(
      { ok: true },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('admin-login error', e);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
