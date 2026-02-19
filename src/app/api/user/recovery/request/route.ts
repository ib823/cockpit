import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Account Recovery Request (User-initiated)
 *
 * POST /api/user/recovery/request
 *
 * Last resort for users who have lost:
 * - TOTP device
 * - All backup codes
 * - Passkeys
 *
 * Requires admin approval with identity verification
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, reason, notes } = body;

    // ============================================
    // 1. Validate Input
    // ============================================
    if (!email || !reason) {
      return NextResponse.json(
        { ok: false, message: "Email and reason are required" },
        { status: 400 }
      );
    }

    const validReasons = ["lost_totp", "lost_all", "lost_passkey", "account_locked"];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ ok: false, message: "Invalid reason" }, { status: 400 });
    }

    // ============================================
    // 2. Find User
    // ============================================
    const user = await prisma.users.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        recoveryRequests: {
          where: {
            status: "pending",
          },
        },
      },
    });

    if (!user) {
      // Don't reveal whether user exists
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({
        ok: true,
        message:
          "Recovery request submitted. If your email is registered, you will receive further instructions.",
      });
    }

    // ============================================
    // 3. Check for Existing Pending Request
    // ============================================
    if (user.recoveryRequests.length > 0) {
      const existingRequest = user.recoveryRequests[0];
      return NextResponse.json(
        {
          ok: false,
          message: `You already have a pending recovery request submitted on ${existingRequest.submittedAt.toLocaleDateString()}. Please wait for admin review.`,
        },
        { status: 409 }
      );
    }

    // ============================================
    // 4. Create Recovery Request
    // ============================================
    const recoveryRequest = await prisma.accountRecoveryRequest.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        reason,
        notes: notes || null,
        status: "pending",
        submittedAt: new Date(),
      },
    });

    // ============================================
    // 5. Log Audit Event
    // ============================================
    await prisma.auditEvent.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        type: "RECOVERY_REQUEST_SUBMITTED",
        createdAt: new Date(),
        meta: {
          requestId: recoveryRequest.id,
          reason,
        },
      },
    });

    // ============================================
    // 6. Send Confirmation Email to User
    // ============================================
    try {
      const confirmationEmail = {
        subject: "Account Recovery Request Received",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Recovery Request Received</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${user.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        We received your account recovery request. Our security team will review it and contact you within 1-2 business days.
      </p>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Request Details</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Request ID:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-family: monospace;">${recoveryRequest.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Reason:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${reason.replace("_", " ")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Submitted:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">Pending Review</td>
          </tr>
        </table>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What Happens Next?</h4>
        <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
          <li>Admin reviews your request</li>
          <li>We may contact you for identity verification (government ID, security questions)</li>
          <li>If approved, you'll receive recovery instructions via email</li>
          <li>Your account will be secured and you'll be able to set up 2FA again</li>
        </ol>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600;">⚠️ Security Notice</h4>
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          If you didn't submit this request, please contact support immediately at <strong>support@example.com</strong>.
          Your account may be compromised.
        </p>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        Reference ID: ${recoveryRequest.id}<br>
        © ${new Date().getFullYear()} Cockpit. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
        `,
      };

      await sendSecurityEmail(user.email, confirmationEmail.subject, confirmationEmail.html);
    } catch (emailError) {
      console.error("[Recovery] Failed to send confirmation email:", emailError);
      // Don't fail the request
    }

    // ============================================
    // 7. Notify Admins
    // ============================================
    try {
      // Get all admin users
      const admins = await prisma.users.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });

      const adminNotificationEmail = {
        subject: `New Account Recovery Request - ${user.email}`,
        html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
  <h1>🔐 New Account Recovery Request</h1>
  <p><strong>User:</strong> ${user.email}</p>
  <p><strong>Reason:</strong> ${reason.replace("_", " ")}</p>
  <p><strong>Request ID:</strong> ${recoveryRequest.id}</p>
  <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
  ${notes ? `<p><strong>User Notes:</strong> ${notes}</p>` : ""}
  <p>Please review this request in the admin panel and verify the user's identity before approving.</p>
  <p><a href="${process.env.NEXTAUTH_URL}/admin/recovery-requests/${recoveryRequest.id}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Review Request</a></p>
</div>
        `,
      };

      for (const admin of admins) {
        await sendSecurityEmail(
          admin.email,
          adminNotificationEmail.subject,
          adminNotificationEmail.html
        );
      }
    } catch (emailError) {
      console.error("[Recovery] Failed to send admin notifications:", emailError);
      // Don't fail the request
    }

    return NextResponse.json({
      ok: true,
      message:
        "Recovery request submitted successfully. You will receive an email confirmation shortly.",
      requestId: recoveryRequest.id,
    });
  } catch (error: unknown) {
    console.error("[Recovery] Request error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to submit recovery request" },
      { status: 500 }
    );
  }
}
