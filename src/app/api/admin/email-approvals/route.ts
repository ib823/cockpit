import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { randomInt } from "crypto";
import { sendSecurityEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Admin Email Approvals Management
 *
 * POST /api/admin/email-approvals - Create new email approval
 * GET /api/admin/email-approvals - List all approvals
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    // ============================================
    // 1. Validate Admin via Session
    // ============================================
    const session = await requireAdmin();
    const adminId = session.user.id;

    // ============================================
    // 2. Validate Email
    // ============================================
    if (!email) {
      return NextResponse.json({ ok: false, message: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, message: "Invalid email format" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ============================================
    // 3. Check if User Already Exists
    // ============================================
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // ============================================
    // 4. Check if Approval Already Exists
    // ============================================
    const existingApproval = await prisma.emailApproval.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingApproval) {
      // Check if it's expired or used
      if (existingApproval.usedAt) {
        return NextResponse.json(
          { ok: false, message: "This email approval has already been used" },
          { status: 409 }
        );
      }

      if (existingApproval.tokenExpiresAt < new Date()) {
        // Delete expired approval and create new one
        await prisma.emailApproval.delete({
          where: { email: normalizedEmail },
        });
      } else {
        return NextResponse.json(
          { ok: false, message: "Active approval already exists for this email" },
          { status: 409 }
        );
      }
    }

    // ============================================
    // 5. Generate 6-Digit Code
    // ============================================
    // SECURITY FIX: DEFECT-20251027-006 & REGRESSION-001
    // Replaced Math.random() with crypto.randomInt() for cryptographically secure random code generation
    const code = randomInt(100000, 1000000).toString();
    const tokenHash = await hash(code, 12);

    // ============================================
    // 6. Create Email Approval
    // ============================================
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.emailApproval.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: adminId,
        codeSent: false, // Will be set to true when email is sent
        createdAt: new Date(),
      },
    });

    // ============================================
    // 7. Send Email with Code
    // ============================================
    let codeSent = false;
    try {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Your Registration Code</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        You've been approved to register for an account. Use the code below to complete your registration.
      </p>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <div style="font-size: 36px; font-weight: bold; font-family: monospace; letter-spacing: 8px; color: #0f172a;">
          ${code}
        </div>
      </div>

      <p style="margin: 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
        Visit the registration page and enter this code along with your email address to create your account.
      </p>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>This code expires in 7 days.</strong> If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        © ${new Date().getFullYear()} Bound. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `;

      await sendSecurityEmail(normalizedEmail, "Your Registration Code", emailHtml);
      codeSent = true;

      await prisma.emailApproval.update({
        where: { email: normalizedEmail },
        data: { codeSent: true },
      });
    } catch (emailError) {
      console.error("[EmailApproval] Failed to send email:", emailError);
      // Don't fail the approval - admin can share the code manually
    }

    return NextResponse.json({
      ok: true,
      message: codeSent
        ? "Email approval created and code sent to user"
        : "Email approval created (email not sent - share code manually)",
      code, // Return code for admin to share
      email: normalizedEmail,
      expiresAt: tokenExpiresAt,
      codeSent,
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
    console.error("[EmailApprovals] POST error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to create email approval" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // ============================================
    // 1. Verify Admin via Session
    // ============================================
    await requireAdmin();

    // ============================================
    // 2. Fetch Approvals with Optional Filtering
    // ============================================
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // 'active', 'used', 'expired', 'all'

    let where: { usedAt?: { not: null } | null; tokenExpiresAt?: { gt: Date } | { lt: Date } } = {};

    if (status === "active") {
      where = {
        usedAt: null,
        tokenExpiresAt: { gt: new Date() },
      };
    } else if (status === "used") {
      where = { usedAt: { not: null } };
    } else if (status === "expired") {
      where = {
        usedAt: null,
        tokenExpiresAt: { lt: new Date() },
      };
    }

    const approvals = await prisma.emailApproval.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Format response (hide sensitive token hash)
    const formattedApprovals = approvals.map((approval) => ({
      email: approval.email,
      tokenExpiresAt: approval.tokenExpiresAt.toISOString(),
      approvedByUserId: approval.approvedByUserId,
      usedAt: approval.usedAt?.toISOString() || null,
      createdAt: approval.createdAt.toISOString(),
      codeSent: approval.codeSent,
    }));

    return NextResponse.json({
      ok: true,
      approvals: formattedApprovals,
      total: formattedApprovals.length,
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
    console.error("[EmailApprovals] GET error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch email approvals" },
      { status: 500 }
    );
  }
}
