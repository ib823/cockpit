import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  validatePasswordComplexity,
  checkPasswordBreach,
  calculatePasswordExpiry,
} from "@/lib/security/password";
import { generateTOTPSecret, encryptTOTPSecret } from "@/lib/security/totp";
import { generateBackupCodes, saveBackupCodes } from "@/lib/security/backup-codes";
import { Role } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Complete Registration Flow
 *
 * POST /api/auth/register-complete
 *
 * Step 1: Validate email + access code
 * Step 2: Validate password (complexity + HIBP)
 * Step 3: Generate TOTP secret
 * Step 4: Generate backup codes
 * Step 5: Create user account
 * Step 6: Return TOTP QR code + backup codes
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const code = body.code;
    const password = body.password;

    // ============================================
    // 1. Validate Email & Code
    // ============================================
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json({ ok: false, message: "Invalid email format." }, { status: 400 });
    }

    if (!code || code.length !== 6) {
      return NextResponse.json({ ok: false, message: "Invalid access code." }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ ok: false, message: "Password is required." }, { status: 400 });
    }

    // Check if email approval exists and is valid
    const approval = await prisma.emailApproval.findUnique({ where: { email } });

    if (!approval) {
      return NextResponse.json(
        { ok: false, message: "This email has not been approved for access." },
        { status: 403 }
      );
    }

    if (approval.usedAt) {
      return NextResponse.json(
        { ok: false, message: "This access code has already been used." },
        { status: 403 }
      );
    }

    if (approval.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, message: "This access code has expired." },
        { status: 403 }
      );
    }

    const codeIsValid = await compare(code, approval.tokenHash);
    if (!codeIsValid) {
      return NextResponse.json({ ok: false, message: "Incorrect access code." }, { status: 401 });
    }

    // ============================================
    // 2. Validate Password
    // ============================================

    // Check complexity
    const complexityCheck = validatePasswordComplexity(password);
    if (!complexityCheck.valid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Password does not meet security requirements.",
          errors: complexityCheck.errors,
        },
        { status: 400 }
      );
    }

    // Check if password has been breached
    const breachCheck = await checkPasswordBreach(password);
    if (breachCheck.breached) {
      return NextResponse.json(
        {
          ok: false,
          message: `This password has been found in ${breachCheck.count.toLocaleString()} data breaches. Please choose a different password.`,
          breached: true,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. Generate TOTP Secret
    // ============================================
    const totpData = await generateTOTPSecret(email);
    const encryptedTOTPSecret = encryptTOTPSecret(totpData.secret);

    // ============================================
    // 4. Generate Backup Codes
    // ============================================
    const backupCodesData = await generateBackupCodes();

    // ============================================
    // 5. Create User Account (Transaction)
    // ============================================
    const passwordHash = await hashPassword(password);
    const passwordExpiresAt = calculatePasswordExpiry();

    type UserResult = { id: string; email: string; role: "USER" | "MANAGER" | "ADMIN" };
    const user: UserResult = await (prisma.$transaction as any)(async (tx: any) => {
      // Create user
      const newUser = await tx.users.create({
        data: {
          id: randomUUID(),
          email,
          role: Role.USER,
          passwordHash,
          passwordChangedAt: new Date(),
          passwordExpiresAt,
          passwordHistory: [passwordHash], // First password in history
          totpSecret: encryptedTOTPSecret,
          totpEnabledAt: new Date(),
          maxConcurrentSessions: 1, // Default to 1 for security
          accessExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
          firstLoginAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Save backup codes
      await saveBackupCodes(newUser.id, backupCodesData.hashes);

      // Mark approval as used
      await tx.emailApproval.update({
        where: { email },
        data: { usedAt: new Date() },
      });

      // Log audit event
      await tx.auditEvent.create({
        data: {
          id: randomUUID(),
          userId: newUser.id,
          type: "ACCOUNT_CREATED",
          createdAt: new Date(),
          meta: {
            email,
            method: "password_totp_registration",
            passwordExpiry: passwordExpiresAt,
          },
        },
      });

      return { id: newUser.id, email: newUser.email, role: newUser.role };
    }) as UserResult;

    // ============================================
    // 6. Send Welcome Email
    // ============================================
    try {
      const { sendSecurityEmail } = await import("@/lib/email");
      const { welcomeEmailTemplate } = await import("@/lib/email-templates");

      const emailContent = welcomeEmailTemplate({
        email: user.email,
        passwordExpiryDate: passwordExpiresAt,
      });

      await sendSecurityEmail(user.email, emailContent.subject, emailContent.html);
    } catch (emailError) {
      // Don't fail registration if email fails
      console.error("[Registration] Failed to send welcome email:", emailError);
    }

    // ============================================
    // 7. Return Success with TOTP & Backup Codes
    // ============================================
    return NextResponse.json({
      ok: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      totp: {
        secret: totpData.secret,
        qrCode: totpData.qrCode,
        manualEntry: totpData.manualEntry,
      },
      backupCodes: {
        codes: backupCodesData.codes,
        downloadContent: backupCodesData.downloadContent,
      },
    });
  } catch (e) {
    console.error("Registration failed:", e);
    return NextResponse.json(
      {
        ok: false,
        message: "An internal server error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
