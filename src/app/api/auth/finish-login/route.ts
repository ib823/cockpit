import { Prisma as _Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { createSessionToken } from "@/lib/nextauth-helpers";
import { randomUUID } from "crypto";
import { challenges, verifyAuthenticationResponse, rpID } from "../../../../lib/webauthn";
import { logAuthEvent } from "@/lib/monitoring/auth-metrics";
import { isIPBlocked, checkAndBlockIP } from "@/lib/security/ip-blocker";

type AuthenticatorTransport = "ble" | "internal" | "nfc" | "usb" | "hybrid";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const expectedOrigin =
    process.env.WEBAUTHN_ORIGIN ?? new URL(process.env.NEXTAUTH_URL ?? req.url).origin;
  const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  try {
    // Check if IP is blocked
    const blockCheck = await isIPBlocked(ipAddress);
    if (blockCheck.blocked) {
      return NextResponse.json(
        {
          ok: false,
          message: "Access denied. Your IP has been blocked due to suspicious activity.",
          blocked: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const response = body.response;

    if (!email || !response) {
      await logAuthEvent("webauthn_failure", {
        email,
        ipAddress,
        userAgent,
        failureReason: "Missing required fields",
        method: "passkey",
      });
      // Check if this IP should be blocked after failure
      await checkAndBlockIP(ipAddress);
      return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 });
    }

    const expectedChallenge = await challenges.get(`auth:${email}`);
    if (!expectedChallenge) {
      await logAuthEvent("webauthn_failure", {
        email,
        ipAddress,
        userAgent,
        failureReason: "Challenge expired",
        method: "passkey",
      });
      await checkAndBlockIP(ipAddress);
      return NextResponse.json(
        {
          ok: false,
          message: "Session expired. Please try logging in again.",
          challengeExpired: true,
        },
        { status: 408 }
      );
    }

    // Delete challenge immediately to prevent duplicate requests from processing
    await challenges.del(`auth:${email}`);

    const user = await prisma.users.findUnique({
      where: { email },
      include: { Authenticator: true },
    });

    if (!user) {
      await logAuthEvent("webauthn_failure", {
        email,
        ipAddress,
        userAgent,
        failureReason: "User not found",
        method: "passkey",
      });
      await checkAndBlockIP(ipAddress);
      return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
    }

    // Fixed: V-006 - Check access expiry BEFORE passkey verification
    // This check happens early to avoid wasting resources on expired accounts
    const now = new Date();
    if (!user.exception && user.accessExpiresAt && user.accessExpiresAt <= now) {
      await logAuthEvent(
        "webauthn_failure",
        {
          email,
          ipAddress,
          userAgent,
          failureReason: "Access expired",
          method: "passkey",
        },
        user.id
      );
      await checkAndBlockIP(ipAddress);
      return NextResponse.json(
        {
          ok: false,
          message: "Your access has expired. Please contact your administrator.",
        },
        { status: 403 }
      );
    }

    const authenticator = user.Authenticator.find((auth) => auth.id === response.id);
    if (!authenticator) {
      await logAuthEvent(
        "webauthn_failure",
        {
          email,
          ipAddress,
          userAgent,
          failureReason: "Passkey not registered",
          method: "passkey",
        },
        user.id
      );
      await checkAndBlockIP(ipAddress);
      return NextResponse.json(
        { ok: false, message: "This passkey is not registered for this account." },
        { status: 404 }
      );
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.id,
        publicKey: new Uint8Array(authenticator.publicKey),
        counter: authenticator.counter,
        transports: authenticator.transports as AuthenticatorTransport[],
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      await logAuthEvent(
        "webauthn_failure",
        {
          email,
          ipAddress,
          userAgent,
          failureReason: "Passkey verification failed",
          method: "passkey",
        },
        user.id
      );
      await checkAndBlockIP(ipAddress);
      return NextResponse.json(
        { ok: false, message: "Passkey verification failed." },
        { status: 401 }
      );
    }

    const { newCounter } = verification.authenticationInfo;

    // Fixed: V-006 - TOCTOU: Check access expiry atomically in transaction
    // Re-fetch user within transaction to ensure access hasn't expired between check and session creation
    const transactionResult: { role: "USER" | "MANAGER" | "ADMIN" } = await (prisma.$transaction as any)(async (tx: any) => {
      // Re-check access expiry within transaction for atomicity
      const freshUser = await tx.users.findUnique({
        where: { id: user.id },
        select: { accessExpiresAt: true, exception: true, role: true },
      });

      if (!freshUser) {
        throw new Error("User not found");
      }

      const txNow = new Date();
      if (!freshUser.exception && freshUser.accessExpiresAt && freshUser.accessExpiresAt <= txNow) {
        throw new Error("ACCESS_EXPIRED");
      }

      // Update authenticator and user
      await tx.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: newCounter, lastUsedAt: txNow },
      });

      await tx.users.update({
        where: { id: user.id },
        data: {
          lastLoginAt: txNow,
          firstLoginAt: user.firstLoginAt ?? txNow,
        },
      });

      await tx.auditEvent.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          type: "webauthn_success",
          meta: {
            ipAddress,
            userAgent,
            method: "passkey",
            deviceType: authenticator.deviceType,
          },
        },
      });

      return { role: freshUser.role };
    }).catch((e: unknown): never => {
      if (e instanceof Error && e.message === "ACCESS_EXPIRED") {
        throw e;
      }
      throw e;
    }) as { role: "USER" | "MANAGER" | "ADMIN" };

    // Log successful authentication for analytics
    await logAuthEvent(
      "webauthn_success",
      {
        email,
        ipAddress,
        userAgent,
        method: "passkey",
        deviceType: authenticator.deviceType,
      },
      user.id
    );

    // Challenge already deleted earlier to prevent duplicate processing
    // Fixed: V-014 - Preserve MANAGER role in sessions (don't downgrade to USER)
    // Create session token and set it in response cookie
    const sessionToken = await createSessionToken(
      user.id,
      user.email,
      transactionResult.role,
      user.name
    );

    const jsonResponse = NextResponse.json({
      ok: true,
      user: { name: user.name, role: user.role },
    });

    // Set session cookie in response headers
    // Use __Secure prefix in production (HTTPS) as required by NextAuth
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    jsonResponse.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return jsonResponse;
  } catch (e) {
    console.error("Finish login failed:", e);
    return NextResponse.json(
      { ok: false, message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
