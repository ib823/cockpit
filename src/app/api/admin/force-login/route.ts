/**
 * EMERGENCY ADMIN LOGIN ENDPOINT
 *
 * This is a development-only endpoint to bypass passkey registration
 * when WebAuthn doesn't work in your environment.
 *
 * Usage: GET http://localhost:3000/api/admin/force-login
 */

import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'ikmls@hotmail.com';

    // Get admin user
    const user = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Create session token
    const sessionToken = randomUUID();
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create session in database
    await prisma.sessions.create({
      data: {
        id: sessionId,
        sessionToken,
        userId: user.id,
        expires: expiresAt,
      },
    });

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        firstLoginAt: user.firstLoginAt ?? new Date(),
      },
    });

    // Set session cookie and redirect to admin
    const response = NextResponse.redirect(new URL('/admin', 'http://localhost:3000'));

    response.cookies.set({
      name: 'next-auth.session-token',
      value: sessionToken,
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;

  } catch (error) {
    console.error('[Force Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
