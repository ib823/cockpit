import { prisma } from '../../../../lib/db';
import { verifyAuthenticationResponse, challenges, rpID, origin } from '../../../../lib/webauthn';
import { setSession } from '../../../../lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, response } = await req.json().catch(() => ({}));
    const user = await prisma.user.findUnique({ where: { email }, include: { authenticators: true } });
    if (!user || (!user.exception && user.accessExpiresAt <= new Date())) {
      return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
    }

    const expectedChallenge = await challenges.get(`auth:${email}`);
    if (!expectedChallenge) {
      return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
    }

    const credId = (response?.id as string) || '';
    const authr = await prisma.authenticator.findUnique({ where: { id: credId } });
    if (!authr) {
      return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authr.id,
        publicKey: Uint8Array.from(authr.publicKey),
        counter: authr.counter,
        transports: authr.transports as any,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
    }

    const { newCounter } = verification.authenticationInfo;
    await prisma.authenticator.update({
      where: { id: credId },
      data: { counter: newCounter, lastUsedAt: new Date() },
    });
    await challenges.del(`auth:${email}`);

    // Update login tracking
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: now,
        firstLoginAt: user.firstLoginAt || now,
      },
    });

    await prisma.auditEvent.create({ data: { userId: user.id, type: 'login' } });
    await setSession({ sub: user.id, role: user.role as 'USER' | 'ADMIN' });
    return NextResponse.json({ ok: true }, { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('finish-login error', e);
    return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
  }
}
