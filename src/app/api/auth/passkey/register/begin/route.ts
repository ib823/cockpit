import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  generateRegistrationOptions,
  rpName,
  rpID,
  challenges,
} from '@/lib/webauthn';

// POST /api/auth/passkey/register/begin - Start passkey registration
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
      include: {
        Authenticator: {
          select: {
            id: true,
            counter: true,
            publicKey: true,
            transports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name || user.email,
      // Exclude existing authenticators to prevent re-registration
      excludeCredentials: user.Authenticator.map((auth) => ({
        id: Buffer.from(auth.publicKey).toString('base64url'),
        transports: auth.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    // Store challenge for verification
    await challenges.set(user.id, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey registration begin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
