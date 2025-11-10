import { NextResponse } from "next/server";
import { randomUUID, randomInt } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/email";
import { SignJWT } from "jose";

export const runtime = "nodejs";

/**
 * Email Change Request
 *
 * POST /api/user/email/change-request
 *
 * Flow:
 * 1. User requests email change
 * 2. Send verification code to NEW email
 * 3. Send notification to OLD email with revoke link
 * 4. Store pending change (24-hour window)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, newEmail, password } = body;

    // ============================================
    // 1. Validate Input
    // ============================================
    if (!userId || !newEmail || !password) {
      return NextResponse.json(
        { ok: false, message: "User ID, new email, and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ ok: false, message: "Invalid email format" }, { status: 400 });
    }

    // ============================================
    // 2. Get User & Verify Password
    // ============================================
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    // Verify password (security requirement)
    const { verifyPassword } = await import("@/lib/security/password");
    const passwordValid = await verifyPassword(password, user.passwordHash || "");

    if (!passwordValid) {
      return NextResponse.json({ ok: false, message: "Invalid password" }, { status: 401 });
    }

    // ============================================
    // 3. Check if New Email Already Exists
    // ============================================
    const existingUser = await prisma.users.findUnique({
      where: { email: newEmail.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, message: "This email is already in use" },
        { status: 409 }
      );
    }

    // ============================================
    // 4. Generate Verification Code
    // ============================================
    // SECURITY FIX: Use crypto.randomInt() for cryptographically secure random code generation
    const verificationCode = randomInt(100000, 1000000).toString();
    const codeHash = await hash(verificationCode, 12);

    // Generate revoke token (JWT)
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET_KEY || "default-secret-change-in-production"
    );
    const revokeToken = await new SignJWT({
      userId: user.id,
      action: "revoke_email_change",
      oldEmail: user.email,
      newEmail: newEmail.trim().toLowerCase(),
      timestamp: Date.now(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .setIssuedAt()
      .sign(secret);

    // ============================================
    // 5. Store Pending Email Change
    // ============================================
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.users.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail.trim().toLowerCase(),
        pendingEmailToken: codeHash,
        pendingEmailExpiresAt: expiresAt,
      },
    });

    // ============================================
    // 6. Send Verification Email to NEW Address
    // ============================================
    const verificationEmailContent = {
      subject: "Verify Your New Email Address",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Verify Your Email Change</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        You requested to change your email address to <strong>${newEmail}</strong>.
      </p>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">Your Verification Code:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; font-family: monospace;">
          ${verificationCode}
        </div>
        <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 12px;">
          Valid for 24 hours
        </p>
      </div>

      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
        If you didn't request this change, please ignore this email.
      </p>
    </div>

    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        This is an automated email. © ${new Date().getFullYear()} Cockpit.
      </p>
    </div>
  </div>
</body>
</html>
      `,
    };

    await sendSecurityEmail(
      newEmail.trim().toLowerCase(),
      verificationEmailContent.subject,
      verificationEmailContent.html
    );

    // ============================================
    // 7. Send Notification to OLD Address
    // ============================================
    const notificationEmailContent = {
      subject: "Email Change Request - Action Required",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">⚠️ Email Change Request</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${user.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        A request was made to change your email address to <strong>${newEmail}</strong>.
      </p>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600;">Important:</h4>
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          The change will take effect in 24 hours. If you didn't request this, click the button below to cancel it immediately.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/api/user/email/revoke?token=${revokeToken}"
           style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
          Cancel Email Change
        </a>
      </div>

      <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
        This link expires in 24 hours
      </p>
    </div>

    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        If you requested this change, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
      `,
    };

    await sendSecurityEmail(
      user.email,
      notificationEmailContent.subject,
      notificationEmailContent.html
    );

    // ============================================
    // 8. Log Audit Event
    // ============================================
    await prisma.auditEvent.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        type: "EMAIL_CHANGE_REQUESTED",
        createdAt: new Date(),
        meta: {
          oldEmail: user.email,
          newEmail: newEmail.trim().toLowerCase(),
          expiresAt,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Verification code sent to new email address",
      expiresIn: "24 hours",
    });
  } catch (error: any) {
    console.error("[EmailChange] Request error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to process email change request" },
      { status: 500 }
    );
  }
}
