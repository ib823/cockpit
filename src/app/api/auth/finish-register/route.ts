import { prisma } from '../../../../lib/db';
import { verifyRegistrationResponse, challenges, rpID, origin } from '../../../../lib/webauthn';
import { setSession } from '../../../../lib/session';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, response } = await req.json().catch(()=>({}));
    const expected = await challenges.get(`reg:${email}`);
    if (!expected) {
      return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: expected,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verification.verified) {
      return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
    }

    const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo!;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, role: Role.USER, accessExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
    });

    await prisma.authenticator.create({
      data: {
        id: credential.id,
        userId: user.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports as any,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    });

    await prisma.emailApproval.update({ where: { email }, data: { usedAt: new Date() } });
    await challenges.del(`reg:${email}`);

    // Update login tracking for first-time registration
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstLoginAt: now,
        lastLoginAt: now,
      },
    });

    await setSession({ sub: user.id, role: user.role as 'USER' | 'ADMIN' });
    return NextResponse.json({ ok: true }, { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('finish-register error', e);
    return NextResponse.json({ ok: false }, { headers: { 'Content-Type': 'application/json' } });
  }
}
