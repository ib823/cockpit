import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "../../../../lib/db";
import { establishSession } from "@/lib/auth/session";
import { challenges, verifyRegistrationResponse, rpID } from "../../../../lib/webauthn";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { badRequest, conflict, serverError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

type AuthenticatorTransport = "ble" | "internal" | "nfc" | "usb" | "hybrid";
export const runtime = "nodejs";

/** Raised when first-passkey enrolment targets an account that already has one. */
class PasskeyAlreadyEnrolledError extends Error {
  constructor() {
    super("Account already has a passkey enrolled");
    this.name = "PasskeyAlreadyEnrolledError";
  }
}

export async function POST(req: Request) {
  const expectedOrigin =
    process.env.WEBAUTHN_ORIGIN ?? new URL(process.env.NEXTAUTH_URL ?? req.url).origin;
  let email = "";
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    email = String((body as Record<string, unknown>).email ?? "")
      .trim()
      .toLowerCase();
    const response = (body as Record<string, unknown>).response as RegistrationResponseJSON | undefined;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return badRequest("Invalid email format.");
    }

    if (!response) {
      return badRequest("Missing required fields.");
    }

    const expectedChallenge = await challenges.get(`reg:${email}`);
    if (!expectedChallenge) {
      return NextResponse.json(
        {
          error: "Session expired. Please enter your code again.",
          challengeExpired: true,
        },
        { status: 408 }
      );
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return badRequest("Passkey verification failed.");
    }

    const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;

    // Use a transaction to ensure all or nothing
    type UserResult = { id: string; email: string; role: "USER" | "MANAGER" | "ADMIN"; name: string | null };
    const user: UserResult = await (prisma.$transaction as unknown as (fn: (tx: typeof prisma) => Promise<UserResult>) => Promise<UserResult>)(async (tx) => {
      // SECURITY: this route enrols a user's *first* passkey and is reachable
      // without a session. Adding further passkeys goes through the
      // session-guarded /api/auth/passkey/register/* pair, so an account that
      // already has an authenticator must never be enrolled here — otherwise a
      // leaked or replayed challenge would be enough to bind an attacker's
      // credential to an established account.
      const existingCredential = await tx.authenticator.findFirst({
        where: { users: { email } },
        select: { id: true },
      });
      if (existingCredential) {
        throw new PasskeyAlreadyEnrolledError();
      }

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
          transports: credential.transports as AuthenticatorTransport[],
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
        },
      });

      await tx.emailApproval.update({
        where: { email },
        data: { usedAt: new Date() },
      });

      return newUser;
    }) as UserResult;

    await challenges.del(`reg:${email}`);

    // Fixed: V-014 - Preserve all roles (USER, MANAGER, ADMIN) in sessions
    const jsonResponse = NextResponse.json({
      ok: true,
      user: { name: user.name, role: user.role },
    });

    await establishSession(jsonResponse, {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return jsonResponse;
  } catch (e) {
    if (e instanceof PasskeyAlreadyEnrolledError) {
      logger.warn("Rejected first-passkey enrolment for an account that already has one", {
        email,
      });
      return conflict("This account already has a passkey. Sign in to add another.");
    }
    logger.error("Finish registration failed", { error: e });
    if (e instanceof Error && e.message.includes("Unique constraint failed")) {
      return conflict("This passkey is already registered.");
    }
    return serverError();
  }
}
