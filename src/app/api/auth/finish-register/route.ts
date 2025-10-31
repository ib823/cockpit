import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '../../../../lib/db';
import { createSessionToken } from '@/lib/nextauth-helpers';
import { challenges, verifyRegistrationResponse, rpID } from '../../../../lib/webauthn';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const expectedOrigin = process.env.WEBAUTHN_ORIGIN ?? new URL(process.env.NEXTAUTH_URL ?? req.url).origin;
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const response = body.response;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json({ ok: false, message: 'Invalid email format.' }, { status: 400 });
    }

    if (!response) {
      return NextResponse.json({ ok: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const expectedChallenge = await challenges.get(`reg:${email}`);
    if (!expectedChallenge) {
      return NextResponse.json({
        ok: false,
        message: 'Session expired. Please enter your code again.',
        challengeExpired: true
      }, { status: 408 });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ ok: false, message: 'Passkey verification failed.' }, { status: 400 });
    }

    const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;

    // Use a transaction to ensure all or nothing
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.upsert({
        where: { email },
        update: {
          firstLoginAt: new Date(), // Update first login time on passkey registration
        },
        create: {
          id: randomUUID(),
          email,
          role: Role.USER,
          accessExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          firstLoginAt: new Date(), // Set first login time on creation
          updatedAt: new Date(),
        },
      });

      await tx.authenticator.create({
        data: {
          id: credential.id,
          userId: newUser.id,
          publicKey: Buffer.from(credential.publicKey),
          counter: credential.counter,
          transports: credential.transports as any,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
        },
      });

      await tx.emailApproval.update({
        where: { email },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    await challenges.del(`reg:${email}`);

    // Fixed: V-014 - Preserve all roles (USER, MANAGER, ADMIN) in sessions
    // Create session token and set it in response cookie
    const sessionToken = await createSessionToken(user.id, user.email, user.role, user.name);

    const jsonResponse = NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });

    // Set session cookie in response headers
    // Use __Secure prefix in production (HTTPS) as required by NextAuth
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    jsonResponse.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return jsonResponse;

  } catch (e) {
    console.error('Finish registration failed:', e);
    const message = e instanceof Error && e.message.includes('Unique constraint failed')
      ? 'This passkey is already registered.'
      : 'An internal server error occurred.';
    const status = e instanceof Error && e.message.includes('Unique constraint failed') ? 409 : 500;
    
    return NextResponse.json({ ok: false, message }, { status });
  }
}
