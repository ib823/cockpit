import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sendAccessCode } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateMagicToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 character secure token
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const { email, name } = await req.json().catch(() => ({}));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Valid email required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate code but don't send it yet
    const code = generateCode();
    // SECURITY FIX: Increased bcrypt rounds from 10 to 12 for stronger hashing
    const tokenHash = await hash(code, 12);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update user (pending status)
    await prisma.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        email,
        name: name || null,
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

    // Generate magic token for instant login via email
    const magicToken = generateMagicToken();
    const magicTokenExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes (reduced for email security)

    await prisma.magicToken.create({
      data: {
        email,
        token: magicToken,
        expiresAt: magicTokenExpiry,
      },
    });

    // Try to send email immediately with magic link (optional - won't block on failure)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicUrl = `${baseUrl}/login?token=${magicToken}`;

    sendAccessCode(email, code, magicUrl).catch(err => {
      console.error('Failed to send access code email:', err);
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Email approved. Code will be sent when user tries to login.',
        code, // Return code for clipboard
        email,
        magicUrl, // Magic link URL
        magicLinkExpiry: '2 minutes'
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
    console.error('approve-email error:', e);

    // Provide more specific error messages
    let errorMessage = 'Internal error';
    if (e.message?.includes('connect')) {
      errorMessage = 'Database connection failed. Please check your database configuration.';
    } else if (e.message?.includes('Unique constraint')) {
      errorMessage = 'This email is already registered';
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
