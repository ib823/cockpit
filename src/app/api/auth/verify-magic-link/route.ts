import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (process.env.ENABLE_MAGIC_LINKS !== 'true') {
    return NextResponse.json({ ok: false, message: 'Disabled' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the magic token in database
    const magicToken = await prisma.magic_tokens.findUnique({
      where: { token },
    });

    if (!magicToken) {
      return NextResponse.json(
        { ok: false, message: 'Invalid or expired magic link' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (new Date() > magicToken.expiresAt) {
      // Delete expired token
      await prisma.magic_tokens.delete({
        where: { id: magicToken.id },
      });

      return NextResponse.json(
        { ok: false, message: 'This magic link has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    // Check if token was already used
    if (magicToken.usedAt) {
      return NextResponse.json(
        { ok: false, message: 'This magic link has already been used' },
        { status: 410 }
      );
    }

    // Mark token as used
    await prisma.magic_tokens.update({
      where: { id: magicToken.id },
      data: { usedAt: new Date() },
    });

    // Return the email associated with this token
    return NextResponse.json({
      ok: true,
      email: magicToken.email,
      message: 'Magic link verified successfully',
    });
  } catch (error) {
    console.error('Verify magic link error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to verify magic link' },
      { status: 500 }
    );
  }
}
