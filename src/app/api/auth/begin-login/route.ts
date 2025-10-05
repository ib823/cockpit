import { prisma } from '../../../../lib/db';
import { generateAuthenticationOptions, challenges, rpID } from '../../../../lib/webauthn';
import { sendAccessCode } from '../../../../lib/email';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json(
        { ok: true, pendingPasskey: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { authenticators: true } });
    const expired = !!user && !user?.exception && user!.accessExpiresAt <= new Date();

    // If user not found or expired
    if (!user || expired) {
      return NextResponse.json(
        { ok: true, pendingPasskey: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If user has no passkey yet (first time login)
    if (user.authenticators.length === 0) {
      // Check if email is approved
      const approval = await prisma.emailApproval.findUnique({ where: { email } });

      if (approval && !approval.usedAt && approval.tokenExpiresAt > new Date()) {
        // Send code now if not already sent
        if (!approval.codeSent) {
          const { hash: bcryptHash } = await import('bcryptjs');

          // Generate fresh code
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const tokenHash = await bcryptHash(code, 10);

          // Update with new hash and mark as sent
          await prisma.emailApproval.update({
            where: { email },
            data: {
              tokenHash,
              codeSent: true,
            },
          });

          // Send email
          await sendAccessCode(email, code);

          console.log(`[First Login] Code sent to ${email}`);
        }
      }

      return NextResponse.json(
        { ok: true, pendingPasskey: false, needsRegistration: true },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // User has passkey - proceed with authentication
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: user.authenticators.map(a => ({
        id: a.id,
        transports: a.transports as any,
      })),
    });

    await challenges.set(`auth:${email}`, options.challenge);
    return NextResponse.json(
      { ok: true, pendingPasskey: true, options },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('begin-login error', e);
    return NextResponse.json(
      { ok: true, pendingPasskey: false },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
