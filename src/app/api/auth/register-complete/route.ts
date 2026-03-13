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
import { badRequest, unauthorized, forbidden, serverError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

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
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    const email = String((body as Record<string, unknown>).email ?? "")
      .trim()
      .toLowerCase();
    const code = (body as Record<string, unknown>).code as string | undefined;
    const password = (body as Record<string, unknown>).password;

    // ============================================
    // 1. Validate Email & Code
    // ============================================
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return badRequest("Invalid email format.");
    }

    if (!code || code.length !== 6) {
      return badRequest("Invalid access code.");
    }

    if (!password || typeof password !== "string") {
      return badRequest("Password is required.");
    }

    // Check if email approval exists and is valid
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
      return unauthorized("Incorrect access code.");
    }

    // ============================================
    // 2. Validate Password
    // ============================================

    // Check complexity
    const complexityCheck = validatePasswordComplexity(password);
    if (!complexityCheck.valid) {
      return badRequest("Password does not meet security requirements.");
    }

    // Check if password has been breached
    const breachCheck = await checkPasswordBreach(password);
    if (breachCheck.breached) {
      return badRequest(`This password has been found in ${breachCheck.count.toLocaleString()} data breaches. Please choose a different password.`);
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
    const user: UserResult = await (prisma.$transaction as unknown as (fn: (tx: typeof prisma) => Promise<UserResult>) => Promise<UserResult>)(async (tx) => {
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
      logger.error("[Registration] Failed to send welcome email", { error: emailError });
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
    logger.error("Registration failed", { error: e });
    return serverError();
  }
}
