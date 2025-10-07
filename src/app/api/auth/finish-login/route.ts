import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { setSession } from '../../../../lib/session';
import { challenges, origin, rpID, verifyAuthenticationResponse } from '../../../../lib/webauthn';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, response } = await req.json().catch(() => ({}));

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

    const user = await prisma.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const authenticator = user.authenticators.find(auth => auth.id === response.id);
    if (!authenticator) {
      return NextResponse.json({ ok: false, message: 'This passkey is not registered for this account.' }, { status: 404 });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
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
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: now,
          firstLoginAt: user.firstLoginAt ?? now, // Set firstLoginAt if null
        },
      }),
      prisma.auditEvent.create({
        data: {
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
    await setSession({ sub: user.id, role: sessionRole });

    return NextResponse.json({ ok: true, user: { name: user.name } });

  } catch (e) {
    console.error('Finish login failed:', e);
    return NextResponse.json(
      { ok: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
