import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '../../../../lib/db';
import { createAuthSession } from '@/lib/nextauth-helpers';
import { challenges, origin, rpID, verifyRegistrationResponse } from '../../../../lib/webauthn';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, response } = await req.json().catch(() => ({}));

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
      expectedOrigin: origin,
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

    // Map MANAGER to USER for session purposes
    const sessionRole = user.role === 'ADMIN' ? 'ADMIN' : 'USER';
    await createAuthSession(user.id, user.email, sessionRole);

    return NextResponse.json({ ok: true, user: { name: user.name } });

  } catch (e) {
    console.error('Finish registration failed:', e);
    const message = e instanceof Error && e.message.includes('Unique constraint failed')
      ? 'This passkey is already registered.'
      : 'An internal server error occurred.';
    const status = e instanceof Error && e.message.includes('Unique constraint failed') ? 409 : 500;
    
    return NextResponse.json({ ok: false, message }, { status });
  }
}
