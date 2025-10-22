import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomBytes, randomInt } from 'crypto';
import { sendAccessCode } from '@/lib/email';
import { otpSendLimiter } from '@/lib/server-rate-limiter';
import { hashOTP } from '@/lib/crypto-utils';

export const runtime = 'nodejs';

// Generate 6-digit OTP using cryptographically secure random number generator
// Fixed: V-001 - Replaced Math.random() with crypto.randomInt()
function generateOTP(): string {
  // Generate random integer between 100000 and 999999 (inclusive)
  return randomInt(100000, 1000000).toString();
}

export async function POST(req: Request) {
  if (process.env.ENABLE_MAGIC_LINKS !== 'true') {
    return NextResponse.json({ ok: false, message: 'Disabled' }, { status: 404 });
  }
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Fixed: V-002 - Rate limiting to prevent email flooding
    const rateLimitResult = await otpSendLimiter.check(email.toLowerCase());

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          ok: false,
          message: `Too many OTP requests. Please try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 60)} minutes.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
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

    // Fixed: V-003 - Hash OTP before storage (never store plaintext OTPs)
    const hashedOTP = hashOTP(otp);

    // Store OTP in database using magic_tokens table (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const tokenId = randomBytes(16).toString('hex');

    // Delete any existing OTP for this email
    await prisma.magic_tokens.deleteMany({
      where: { email: user.email },
    });

    // Create new OTP record with hashed OTP
    await prisma.magic_tokens.create({
      data: {
        id: tokenId,
        email: user.email,
        token: hashedOTP, // Store HASHED OTP (SHA-256)
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
