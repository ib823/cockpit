import { prisma } from '@/lib/db';
import { setSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { token, deviceInfo } = await req.json();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Token required' },
        { status: 400 }
      );
    }

    // Find magic token
    const magicToken = await prisma.magicToken.findUnique({
      where: { token },
    });

    if (!magicToken) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired link' },
        { status: 401 }
      );
    }

    // Check if already used
    if (magicToken.usedAt) {
      return NextResponse.json(
        { ok: false, error: 'This link has already been used' },
        { status: 401 }
      );
    }

    // Check expiry
    if (new Date() > magicToken.expiresAt) {
      return NextResponse.json(
        { ok: false, error: 'This link has expired (valid for 5 minutes)' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: magicToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user access has expired
    if (user.accessExpiresAt && new Date() > user.accessExpiresAt && !user.exception) {
      return NextResponse.json(
        { ok: false, error: 'Your access has expired. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Get IP address for audit
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';

    // Mark token as used
    await prisma.magicToken.update({
      where: { token },
      data: {
        usedAt: new Date(),
        deviceInfo,
        ipAddress: ip,
      },
    });

    // Update user login stats
    await prisma.user.update({
      where: { email: magicToken.email },
      data: {
        lastLoginAt: new Date(),
        firstLoginAt: user.firstLoginAt || new Date(),
      },
    });

    // Create session (map MANAGER to USER for session purposes)
    const sessionRole = user.role === 'ADMIN' ? 'ADMIN' : 'USER';
    await setSession({ sub: user.id, role: sessionRole });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        type: 'MAGIC_LINK_LOGIN',
        meta: {
          ip,
          deviceInfo,
          tokenExpiry: magicToken.expiresAt,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Magic login error:', error);
    return NextResponse.json(
      { ok: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
