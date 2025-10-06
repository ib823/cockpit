import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { challenges, generateAuthenticationOptions, rpID } from '../../../../lib/webauthn';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) {
      // Return a 400 Bad Request if email is missing
      return NextResponse.json({ ok: false, message: 'Email is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    // Check if user exists and is approved
    if (!user) {
      console.log(`Login attempt for non-existent user: ${email}`);
      return NextResponse.json({
        ok: false,
        message: 'Email not found. Please contact your administrator for access.',
        notApproved: true
      }, { status: 404 });
    }

    // Check if user's access has expired
    const isExpired = !user.exception && user.accessExpiresAt && user.accessExpiresAt <= new Date();
    if (isExpired) {
      return NextResponse.json({
        ok: false,
        message: 'Your access has expired. Please contact your administrator.'
      }, { status: 403 });
    }

    // If user has no passkeys, they need to go through registration.
    // Check if they have a pending approval (EmailApproval record)
    if (user.authenticators.length === 0) {
      const approval = await prisma.emailApproval.findUnique({
        where: { email }
      });

      if (!approval) {
        return NextResponse.json({
          ok: false,
          message: 'No access code found. Please contact your administrator.',
          notApproved: true
        }, { status: 404 });
      }

      // User is approved but hasn't registered passkey yet
      return NextResponse.json({ ok: true, pendingPasskey: false, needsRegistration: true });
    }

    // User has passkeys, so generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: user.authenticators.map(a => ({
        id: a.id,
        type: 'public-key',
        transports: a.transports as any,
      })),
    });

    await challenges.set(`auth:${email}`, options.challenge);

    return NextResponse.json({ ok: true, pendingPasskey: true, options });

  } catch (e) {
    console.error('Begin login failed:', e);
    return NextResponse.json(
      { ok: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
