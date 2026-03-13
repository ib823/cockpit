import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { challenges, generateAuthenticationOptions, rpID } from "../../../../lib/webauthn";
import { badRequest, forbidden, notFound, serverError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

type AuthenticatorTransport = "ble" | "internal" | "nfc" | "usb" | "hybrid";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    const email = String((body as Record<string, unknown>).email ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      return badRequest("Email is required.");
    }

    // Validate email format to prevent injection attacks
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return badRequest("Invalid email format.");
    }

    const user = await prisma.users.findUnique({
      where: { email },
      include: { Authenticator: true },
    });

    // Check if user exists and is approved
    if (!user) {
      return notFound("Email not found. Please contact your administrator for access.");
    }

    // Check if user's access has expired
    const isExpired = !user.exception && user.accessExpiresAt && user.accessExpiresAt <= new Date();
    if (isExpired) {
      return forbidden("Your access has expired. Please contact your administrator.");
    }

    // If user has no passkeys, they need to go through registration.
    // Check if they have a pending approval (EmailApproval record)
    if (user.Authenticator.length === 0) {
      const approval = await prisma.emailApproval.findUnique({
        where: { email },
      });

      if (!approval) {
        return notFound("Invalid. Contact Admin.");
      }

      // User is approved but hasn't registered passkey yet
      return NextResponse.json({ ok: true, pendingPasskey: false, needsRegistration: true });
    }

    // User has passkeys, so generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials: user.Authenticator.map((a) => ({
        id: a.id,
        type: "public-key",
        transports: a.transports as AuthenticatorTransport[],
      })),
    });

    await challenges.set(`auth:${email}`, options.challenge);

    return NextResponse.json({ ok: true, pendingPasskey: true, options });
  } catch (e) {
    logger.error("Begin login failed", { error: e });
    return serverError();
  }
}
