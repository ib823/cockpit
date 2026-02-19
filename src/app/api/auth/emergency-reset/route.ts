import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { randomInt } from "crypto";

export const runtime = "nodejs";

// TEMPORARY EMERGENCY RECOVERY ENDPOINT
// DELETE THIS FILE AFTER RECOVERY IS COMPLETE
// This endpoint allows resetting passkeys for locked-out admin accounts

// One-time secret - change this before deploying
const RECOVERY_SECRET = process.env.EMERGENCY_RECOVERY_SECRET;
if (!RECOVERY_SECRET) {
  // If not set, this feature is disabled for security
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, secret } = body;

    // Validate secret
    if (!secret || secret !== RECOVERY_SECRET || RECOVERY_SECRET === "DISABLED") {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, message: "Email required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      include: { Authenticator: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Generate new 6-digit code
    const newCode = String(randomInt(100000, 999999));
    const hashedCode = await hash(newCode, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Transaction: delete authenticators, reset approval, extend access
    await prisma.$transaction(async (tx) => {
      // Delete all existing authenticators for this user
      if (user.Authenticator.length > 0) {
        await tx.authenticator.deleteMany({
          where: { userId: user.id },
        });
      }

      // Upsert EmailApproval with new code
      await tx.emailApproval.upsert({
        where: { email: normalizedEmail },
        update: {
          tokenHash: hashedCode,
          tokenExpiresAt: expiresAt,
          usedAt: null, // Reset usedAt so it can be used again
        },
        create: {
          email: normalizedEmail,
          tokenHash: hashedCode,
          tokenExpiresAt: expiresAt,
          approvedByUserId: user.id,
        },
      });

      // Extend user's access by 1 year
      await tx.users.update({
        where: { id: user.id },
        data: {
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Recovery successful",
      data: {
        email: normalizedEmail,
        recoveryCode: newCode,
        expiresAt: expiresAt.toISOString(),
        deletedAuthenticators: user.Authenticator.length,
        instructions: [
          "1. Go to /register-secure",
          "2. Enter your email: " + normalizedEmail,
          "3. Enter the recovery code shown above",
          "4. Register a new passkey on your device",
          "5. DELETE this emergency-reset endpoint after recovery",
        ],
      },
    });
  } catch (error) {
    console.error("Emergency reset failed:", error);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
