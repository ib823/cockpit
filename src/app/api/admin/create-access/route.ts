import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/nextauth-helpers';
import { sendAccessCode } from '@/lib/email';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    const session = await requireAdmin();

    const { email } = await req.json().catch(() => ({}));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Valid email required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit code
    const code = generateCode();
    const tokenHash = await hash(code, 10);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update user
    await prisma.users.upsert({
      where: { email },
      update: {
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
      id: randomUUID(),
        email,
        role: 'USER',
        exception: false,
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    // Upsert email approval
    await prisma.emailApproval.upsert({
      where: { email },
      update: {
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: session.user.id,
        usedAt: null,
      },
      create: {
        email,
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: session.user.id,
      },
    });

    // Send email
    const emailResult = await sendAccessCode(email, code);

    return NextResponse.json(
      {
        ok: true,
        code,
        emailSent: emailResult.success,
        devMode: emailResult.devMode || false,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    if (e.message === 'forbidden') {
      return NextResponse.json(
        { ok: false, error: 'Admin access required' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('create-access error', e);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
