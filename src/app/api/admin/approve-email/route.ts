import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const { email } = await req.json().catch(() => ({}));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Valid email required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate code but don't send it yet
    const code = generateCode();
    const tokenHash = await hash(code, 10);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update user (pending status)
    await prisma.user.upsert({
      where: { email },
      update: {
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        email,
        role: 'USER',
        exception: false,
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Store approval (code ready but not sent)
    await prisma.emailApproval.upsert({
      where: { email },
      update: {
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: session.sub,
        usedAt: null,
      },
      create: {
        email,
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: session.sub,
      },
    });

    return NextResponse.json(
      { ok: true, message: 'Email approved. Code will be sent when user tries to login.' },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    if (e.message === 'forbidden') {
      return NextResponse.json(
        { ok: false, error: 'Admin access required' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('approve-email error', e);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
