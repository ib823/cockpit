import { prisma } from '../../../../lib/db';
import { generateRegistrationOptions, challenges, rpID } from '../../../../lib/webauthn';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json().catch(()=>({}));
    if (!email || !code) {
      return NextResponse.json(
        { ok: true, pendingPasskey: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const appr = await prisma.emailApproval.findUnique({ where: { email } });
    if (!appr || appr.usedAt || appr.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: true, pendingPasskey: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    const ok = await compare(code, appr.tokenHash);
    if (!ok) {
      return NextResponse.json(
        { ok: true, pendingPasskey: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const options = await generateRegistrationOptions({
      rpName: 'Cockpit',
      rpID,
      userName: email,
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      attestationType: 'none',
    });

    await challenges.set(`reg:${email}`, options.challenge);
    return NextResponse.json(
      { ok: true, pendingPasskey: true, options },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('begin-register error', e);
    return NextResponse.json(
      { ok: true, pendingPasskey: false },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
