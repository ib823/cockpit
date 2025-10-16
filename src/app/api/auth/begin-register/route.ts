import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { challenges, generateRegistrationOptions, rpID } from '../../../../lib/webauthn';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json().catch(() => ({}));

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { ok: false, message: 'Invalid email format.' },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { ok: false, message: 'Invalid code format.' },
        { status: 400 }
      );
    }

    const approval = await prisma.emailApproval.findUnique({ where: { email } });

    if (!approval) {
      return NextResponse.json(
        { ok: false, message: 'This email has not been approved for access.' },
        { status: 403 }
      );
    }

    if (approval.usedAt) {
      return NextResponse.json(
        { ok: false, message: 'This access code has already been used.' },
        { status: 403 }
      );
    }

    if (approval.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, message: 'This access code has expired.' },
        { status: 403 }
      );
    }

    const codeIsValid = await compare(code, approval.tokenHash);
    if (!codeIsValid) {
      // Note: To prevent timing attacks, you might consider adding a small random delay here
      return NextResponse.json({ ok: false, message: 'The provided code is incorrect.' }, { status: 401 });
    }

    const options = await generateRegistrationOptions({
      rpName: 'Cockpit',
      rpID,
      userName: email,
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      attestationType: 'none',
      // It's a good practice to exclude credentials of existing users with the same email
      // to prevent re-registration on a device that already has a passkey for this user.
      excludeCredentials: (await prisma.authenticator.findMany({ where: { users: { email } } })).map((auth: any) => ({
        id: auth.id,
        type: 'public-key',
        transports: auth.transports as any,
      })),
    });

    await challenges.set(`reg:${email}`, options.challenge);

    return NextResponse.json({ ok: true, options });
  } catch (e) {
    console.error('Begin registration failed:', e);
    return NextResponse.json(
      { ok: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
