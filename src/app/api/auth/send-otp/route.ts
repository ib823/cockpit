import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sendAccessCode } from '@/lib/email';

export const runtime = 'nodejs';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: 'No account found with this email. Please contact your administrator.' },
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

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database using magic_tokens table (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const tokenId = randomBytes(16).toString('hex');

    // Delete any existing OTP for this email
    await prisma.magic_tokens.deleteMany({
      where: { email: user.email },
    });

    // Create new OTP record
    await prisma.magic_tokens.create({
      data: {
        id: tokenId,
        email: user.email,
        token: otp, // Store OTP as token
        expiresAt,
      },
    });

    // Send OTP via email
    const emailResult = await sendAccessCode(user.email, otp);

    if (!emailResult.success && !emailResult.devMode) {
      console.error('[send-otp] Failed to send email:', emailResult.error);
      return NextResponse.json(
        { ok: false, message: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    // In dev mode, log the OTP to console
    if (emailResult.devMode) {
      console.log('\n' + '='.repeat(80));
      console.log('🔢 OTP CODE (Development Mode)');
      console.log('='.repeat(80));
      console.log('Email:', user.email);
      console.log('OTP Code:', otp);
      console.log('Expires:', expiresAt.toISOString());
      console.log('='.repeat(80) + '\n');
    }

    return NextResponse.json({
      ok: true,
      message: 'Verification code sent! Check your email.',
      devMode: emailResult.devMode,
      // Only include OTP in dev mode for easy testing
      ...(emailResult.devMode && { otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
