import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import {
  REGISTRATION_GRANT_TYPE,
  REGISTRATION_GRANT_TTL_MS,
} from "@/lib/auth/registration-grant";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.ENABLE_MAGIC_LINKS !== "true") {
    return NextResponse.json({ ok: false, message: "Disabled" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, message: "Token is required" }, { status: 400 });
    }

    // Find the magic token in database
    const magicToken = await prisma.magic_tokens.findUnique({
      where: { token },
    });

    if (!magicToken) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired magic link" },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (new Date() > magicToken.expiresAt) {
      // Delete expired token
      await prisma.magic_tokens.delete({
        where: { id: magicToken.id },
      });

      return NextResponse.json(
        { ok: false, message: "This magic link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Check if token was already used
    if (magicToken.usedAt) {
      return NextResponse.json(
        { ok: false, message: "This magic link has already been used" },
        { status: 410 }
      );
    }

    // Mark token as used
    await prisma.magic_tokens.update({
      where: { id: magicToken.id },
      data: { usedAt: new Date() },
    });

    // Mint a single-use registration grant proving this magic link was verified
    // server-side. `begin-register` requires it before it will issue a passkey
    // registration challenge, so possession of the grant is equivalent to
    // possession of the emailed magic link. It is deliberately short-lived and
    // bound to the token's email — it is never derived from client input.
    const registrationGrant = randomBytes(32).toString("hex");
    await prisma.magic_tokens.create({
      data: {
        id: randomBytes(16).toString("hex"),
        email: magicToken.email,
        token: registrationGrant,
        type: REGISTRATION_GRANT_TYPE,
        expiresAt: new Date(Date.now() + REGISTRATION_GRANT_TTL_MS),
      },
    });

    // Return the email associated with this token
    return NextResponse.json({
      ok: true,
      email: magicToken.email,
      registrationGrant,
      message: "Magic link verified successfully",
    });
  } catch (error) {
    logger.error("Verify magic link error", { error: error });
    return NextResponse.json(
      { ok: false, message: "Failed to verify magic link" },
      { status: 500 }
    );
  }
}
