import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/email";
import { SignJWT } from "jose";

import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Admin Approve Recovery Request
 *
 * POST /api/admin/recovery/:requestId/approve
 *
 * Approves a user's account recovery request after identity verification
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const body = await req.json().catch(() => ({}));
    const { notes } = body;

    // ============================================
    // 1. Verify Admin via Session
    // ============================================
    const session = await requireAdmin();
    const adminEmail = session.user.email!;

    const admin = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      return NextResponse.json({ ok: false, message: "Admin user not found" }, { status: 404 });
    }

    const adminId = admin.id;

    // ============================================
    // 2. Get Recovery Request
    // ============================================
    const recoveryRequest = await prisma.accountRecoveryRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            sessions: {
              where: {
                expires: { gt: new Date() },
                revokedAt: null,
              },
            },
          },
        },
      },
    });

    if (!recoveryRequest) {
      return NextResponse.json(
        { ok: false, message: "Recovery request not found" },
        { status: 404 }
      );
    }

    if (recoveryRequest.status !== "pending") {
      return NextResponse.json(
        { ok: false, message: `Request already ${recoveryRequest.status}` },
        { status: 400 }
      );
    }

    const user = recoveryRequest.user;

    // ============================================
    // 3. Generate Recovery Token
    // ============================================
          const secret = new TextEncoder().encode(env.JWT_SECRET_KEY);
    const recoveryToken = await new SignJWT({
      userId: user.id,
      action: "account_recovery",
      requestId,
      timestamp: Date.now(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("48h") // 48 hours to complete recovery
      .setIssuedAt()
      .sign(secret);

    // ============================================
    // 4. Execute Recovery Actions
    // ============================================
    await prisma.$transaction([
      // 4a. Approve the request
      prisma.accountRecoveryRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          approvedBy: adminId,
          approvedAt: new Date(),
          notes: notes || null,
        },
      }),

      // 4b. Revoke all active sessions
      prisma.sessions.updateMany({
        where: {
          userId: user.id,
          expires: { gt: new Date() },
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "account_recovery_approved",
        },
      }),

      // 4c. Reset TOTP (user will re-enroll)
      prisma.users.update({
        where: { id: user.id },
        data: {
          totpSecret: null,
          totpEnabledAt: null,
          passwordExpiresAt: new Date(), // Force password change immediately
          accountLockedAt: null, // Unlock account
          accountLockedReason: null,
          failedLoginAttempts: 0,
        },
      }),

      // 4d. Delete all passkeys
      prisma.authenticator.deleteMany({
        where: { userId: user.id },
      }),

      // 4e. Invalidate all unused backup codes (optional - keep them for now)
      // They can still use backup codes if they have them

      // 4f. Log audit event
      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          type: "ACCOUNT_RECOVERY_APPROVED",
          createdAt: new Date(),
          meta: {
            requestId,
            approvedBy: adminId,
            adminEmail: admin.email,
            sessionsRevoked: user.sessions.length,
          },
        },
      }),
    ]);

    // ============================================
    // 5. Send Recovery Email to User
    // ============================================
    try {
      const recoveryEmailContent = {
        subject: "Account Recovery Approved - Action Required",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">✅ Account Recovery Approved</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${user.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Your account recovery request has been approved by our security team. You can now regain access to your account.
      </p>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">What Was Done:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
          <li>All active sessions were terminated</li>
          <li>Two-factor authentication was reset</li>
          <li>Passkeys were revoked</li>
          <li>Account has been unlocked</li>
          <li>Password reset is required</li>
        </ul>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">Recovery Steps:</h4>
        <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
          <li>Click the button below to start recovery</li>
          <li>Reset your password</li>
          <li>Set up two-factor authentication (TOTP)</li>
          <li>Download new backup codes</li>
          <li>Your account will be fully restored</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/recovery?token=${recoveryToken}"
           style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
          Start Account Recovery
        </a>
      </div>

      <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
        This link expires in 48 hours
      </p>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600;">⚠️ Security Notice</h4>
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          If you didn't request this recovery, contact support immediately at <strong>support@example.com</strong>.
          Your account may be compromised.
        </p>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        Reference ID: ${requestId}<br>
        © ${new Date().getFullYear()} Bound. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
        `,
      };

      await sendSecurityEmail(user.email, recoveryEmailContent.subject, recoveryEmailContent.html);
    } catch (emailError) {
      console.error("[RecoveryApprove] Failed to send recovery email:", emailError);
      // Don't fail the approval
    }

    return NextResponse.json({
      ok: true,
      message: "Recovery request approved successfully",
      recoveryToken, // For testing - in production, only send via email
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "unauthorized") {
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "forbidden") {
        return NextResponse.json(
          { ok: false, message: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("[RecoveryApprove] Error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to approve recovery request" },
      { status: 500 }
    );
  }
}
