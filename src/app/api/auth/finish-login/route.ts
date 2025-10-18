import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { createAuthSession } from '@/lib/nextauth-helpers';
import { randomUUID } from 'crypto';
import { challenges, verifyAuthenticationResponse, rpID } from '../../../../lib/webauthn';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const expectedOrigin = process.env.WEBAUTHN_ORIGIN ?? new URL(process.env.NEXTAUTH_URL ?? req.url).origin;
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const response = body.response;

    if (!email || !response) {
      return NextResponse.json({ ok: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const expectedChallenge = await challenges.get(`auth:${email}`);
    if (!expectedChallenge) {
      return NextResponse.json({
        ok: false,
        message: 'Session expired. Please try logging in again.',
        challengeExpired: true
      }, { status: 408 });
    }

    // Delete challenge immediately to prevent duplicate requests from processing
    await challenges.del(`auth:${email}`);

    const user = await prisma.users.findUnique({
      where: { email },
      include: { Authenticator: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const authenticator = user.Authenticator.find(auth => auth.id === response.id);
    if (!authenticator) {
      return NextResponse.json({ ok: false, message: 'This passkey is not registered for this account.' }, { status: 404 });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.id,
        publicKey: new Uint8Array(authenticator.publicKey),
        counter: authenticator.counter,
        transports: authenticator.transports as any,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return NextResponse.json({ ok: false, message: 'Passkey verification failed.' }, { status: 401 });
    }

    const { newCounter } = verification.authenticationInfo;

    const now = new Date();
    await prisma.$transaction([
      prisma.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: newCounter, lastUsedAt: now },
      }),
      prisma.users.update({
        where: { id: user.id },
        data: {
          lastLoginAt: now,
          firstLoginAt: user.firstLoginAt ?? now, // Set firstLoginAt if null
        },
      }),
      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          type: 'login',
          meta: {
            ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
          },
        },
      }),
    ]);

    // Challenge already deleted earlier to prevent duplicate processing
    // Map MANAGER to USER for session purposes
    const sessionRole = user.role === 'ADMIN' ? 'ADMIN' : 'USER';
    await createAuthSession(user.id, user.email, sessionRole);

    return NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });

  } catch (e) {
    console.error('Finish login failed:', e);
    return NextResponse.json(
      { ok: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
