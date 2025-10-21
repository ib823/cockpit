import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sendAccessCode } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (process.env.ENABLE_MAGIC_LINKS !== 'true') {
    return NextResponse.json({ ok: false, message: 'Disabled' }, { status: 404 });
  }
  try {
    const body = await req.json();
    console.log('[send-magic-link] Request body:', body);
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('[send-magic-link] Invalid email:', email);
      return NextResponse.json(
        { ok: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    console.log('[send-magic-link] Processing request for:', email);

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

    // Generate random token (32 bytes = 64 hex chars)
    const token = randomBytes(32).toString('hex');

    // Create magic link (valid for 2 minutes)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Get base URL from request
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3002';
    const baseUrl = `${protocol}://${host}`;
    const magicLink = `${baseUrl}/login?token=${token}`;

    // Store token in database
    await prisma.magic_tokens.create({
      data: {
        id: randomBytes(16).toString('hex'),
        email: user.email,
        token,
        expiresAt,
      },
    });

    // Send email with magic link (use dummy code "000000" since template expects it)
    const emailResult = await sendAccessCode(user.email, '000000', magicLink);

    if (!emailResult.success && !emailResult.devMode) {
      console.error('[send-magic-link] Failed to send email:', emailResult.error);
      return NextResponse.json(
        { ok: false, message: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    // In dev mode (no email provider), log the magic link to console
    if (emailResult.devMode) {
      console.log('\n='.repeat(80));
      console.log('🔗 MAGIC LINK (Development Mode)');
      console.log('='.repeat(80));
      console.log('Email:', user.email);
      console.log('Magic Link:', magicLink);
      console.log('Expires:', expiresAt.toISOString());
      console.log('='.repeat(80) + '\n');
    }

    return NextResponse.json({
      ok: true,
      message: 'Magic link sent! Check your email.',
      devMode: emailResult.devMode,
      // Only include magic link in dev mode for easy testing
      ...(emailResult.devMode && { magicLink }),
    });
  } catch (error) {
    console.error('Send magic link error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to send magic link. Please try again.' },
      { status: 500 }
    );
  }
}
