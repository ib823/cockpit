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
        { ok: false, error: 'This link has expired (valid for 2 minutes)' },
        { status: 401 }
      );
    }

    // Get user with authenticators
    const user = await prisma.user.findUnique({
      where: { email: magicToken.email },
      include: { authenticators: true },
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

    // Get IP address and enhanced fingerprinting for audit
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Enhanced device fingerprint for security
    const enhancedDeviceInfo = {
      ...(deviceInfo ? JSON.parse(deviceInfo) : {}),
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Mark token as used
    await prisma.magicToken.update({
      where: { token },
      data: {
        usedAt: new Date(),
        deviceInfo: JSON.stringify(enhancedDeviceInfo),
        ipAddress: ip,
      },
    });

    // Check if user has a passkey (Authenticator)
    const hasPasskey = await prisma.authenticator.findFirst({
      where: { userId: user.id },
    });

    // Import webauthn utilities
    const { generateRegistrationOptions, generateAuthenticationOptions, challenges, rpID, rpName, origin } = await import('../../../../lib/webauthn');

    // If no passkey, generate registration options for passkey setup
    if (!hasPasskey) {
      const registrationOptions = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: user.email,
        userDisplayName: user.name || user.email,
        timeout: 60000,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      // Store challenge for verification (must match finish-register key)
      await challenges.set(`reg:${user.email}`, registrationOptions.challenge);

      return NextResponse.json({
        ok: true,
        requiresPasskeyRegistration: true,
        options: registrationOptions,
        email: user.email,
        name: user.name,
        message: 'Please set up your passkey to complete login',
      });
    }

    // User has passkey - generate authentication challenge
    const authOptions = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.authenticators.map((auth: any) => ({
        id: auth.id,
        type: 'public-key' as const,
        transports: auth.transports as AuthenticatorTransport[],
      })),
      userVerification: 'preferred',
      timeout: 60000,
    });

    // Store challenge for verification
    await challenges.set(`auth:${user.email}`, authOptions.challenge);

    return NextResponse.json({
      ok: true,
      requiresPasskeyAuth: true,
      options: authOptions,
      email: user.email,
      name: user.name,
      message: 'Please authenticate with your passkey',
    });
  } catch (error) {
    console.error('Magic login error:', error);
    return NextResponse.json(
      { ok: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
