import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { ok: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { ok: false, message: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    // Find the OTP record in magic_tokens table
    const otpRecord = await prisma.magic_tokens.findFirst({
      where: {
        email: email.toLowerCase(),
        token: otp,
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { ok: false, message: 'Invalid verification code. Please try again.' },
        { status: 401 }
      );
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      // Delete expired OTP
      await prisma.magic_tokens.delete({
        where: { id: otpRecord.id },
      });

      return NextResponse.json(
        { ok: false, message: 'Verification code has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    // Check if OTP was already used
    if (otpRecord.usedAt) {
      return NextResponse.json(
        { ok: false, message: 'This verification code has already been used.' },
        { status: 401 }
      );
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user access has expired
    if (user.accessExpiresAt && new Date() > user.accessExpiresAt && !user.exception) {
      return NextResponse.json(
        { ok: false, message: 'Your access has expired. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Mark the OTP as used
    await prisma.magic_tokens.update({
      where: { id: otpRecord.id },
      data: {
        usedAt: new Date(),
      },
    });

    // Create a secure session token for NextAuth
    const sessionToken = randomBytes(32).toString('hex');
    const sessionId = randomBytes(16).toString('hex');

    // Create session in database
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await prisma.sessions.create({
      data: {
        id: sessionId,
        sessionToken,
        userId: user.id,
        expires: sessionExpiry,
      },
    });

    // Set the session cookie
    const response = NextResponse.json({
      ok: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set session cookie
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { ok: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
