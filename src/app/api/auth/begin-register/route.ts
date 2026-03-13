import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { Authenticator } from "@prisma/client";
import { challenges, generateRegistrationOptions, rpID } from "../../../../lib/webauthn";
import { badRequest, unauthorized, forbidden, serverError } from "@/lib/api-response";

type AuthenticatorTransport = "ble" | "internal" | "nfc" | "usb" | "hybrid";
import { sanitizeHtml } from "@/lib/input-sanitizer";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    // SECURITY FIX: DEFECT-20251027-002
    // Sanitize email input to prevent XSS attacks
    const email = sanitizeHtml(String(body.email ?? ""))
      .trim()
      .toLowerCase();
    const code = body.code as string | undefined;
    const magicLink = body.magicLink === true;

    // Validate email format and length
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return badRequest("Invalid email format.");
    }

    // Skip code validation if coming from magic link (already verified)
    if (!magicLink) {
      if (!code || code.length !== 6) {
        return badRequest("Invalid code format.");
      }

      const approval = await prisma.emailApproval.findUnique({ where: { email } });

      if (!approval) {
        return forbidden("This email has not been approved for access.");
      }

      if (approval.usedAt) {
        return forbidden("This access code has already been used.");
      }

      if (approval.tokenExpiresAt < new Date()) {
        return forbidden("This access code has expired.");
      }

      const codeIsValid = await compare(code, approval.tokenHash);
      if (!codeIsValid) {
        // Note: To prevent timing attacks, you might consider adding a small random delay here
        return unauthorized("The provided code is incorrect.");
      }
    } else {
      // Magic link flow - still need to verify user has approval
      const approval = await prisma.emailApproval.findUnique({ where: { email } });
      if (!approval) {
        return forbidden("This email has not been approved for access.");
      }
    }

    const options = await generateRegistrationOptions({
      rpName: "Bound",
      rpID,
      userName: email,
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
      attestationType: "none",
      // It's a good practice to exclude credentials of existing users with the same email
      // to prevent re-registration on a device that already has a passkey for this user.
      excludeCredentials: (
        await prisma.authenticator.findMany({ where: { users: { email } } })
      ).map((auth: Authenticator) => ({
        id: auth.id,
        type: "public-key",
        transports: auth.transports as AuthenticatorTransport[],
      })),
    });

    await challenges.set(`reg:${email}`, options.challenge);

    return NextResponse.json({ ok: true, options });
  } catch (e) {
    logger.error("Begin registration failed", { error: e });
    return serverError();
  }
}
