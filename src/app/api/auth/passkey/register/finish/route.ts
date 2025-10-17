import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  verifyRegistrationResponse,
  rpID,
  origin,
  challenges,
} from '@/lib/webauthn';
import type {
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

// POST /api/auth/passkey/register/finish - Complete passkey registration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { credential, nickname } = body as {
      credential: RegistrationResponseJSON;
      nickname?: string;
    };

    if (!credential) {
      return NextResponse.json(
        { error: 'Missing credential' },
        { status: 400 }
      );
    }

    // Retrieve challenge
    const expectedChallenge = await challenges.get(user.id);

    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    // Verify the registration response
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (err) {
      console.error('Verification error:', err);
      return NextResponse.json(
        { error: 'Passkey verification failed' },
        { status: 400 }
      );
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return NextResponse.json(
        { error: 'Passkey verification failed' },
        { status: 400 }
      );
    }

    const {
      credentialPublicKey,
      credentialID,
      counter,
      credentialBackedUp,
      credentialDeviceType,
    } = registrationInfo;

    // Store the new authenticator
    await prisma.authenticator.create({
      data: {
        id: Buffer.from(credentialID).toString('base64url'),
        userId: user.id,
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        transports: credential.response.transports || [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        nickname: nickname?.trim() || null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    // Clear the challenge
    await challenges.del(user.id);

    // Audit log the passkey creation
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        action: 'CREATE',
        entity: 'PASSKEY',
        entityId: Buffer.from(credentialID).toString('base64url'),
        changes: {
          newPasskey: {
            nickname: nickname?.trim() || null,
            deviceType: credentialDeviceType,
          },
        },
        ipAddress: ip,
        userAgent: userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Passkey registration finish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
