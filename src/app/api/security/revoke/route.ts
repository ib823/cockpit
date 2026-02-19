import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/email";

import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Security Action Handler - "Not Me" Button
 *
 * GET /api/security/revoke?token=JWT_TOKEN
 *
 * When a user clicks "This Wasn't Me" in a security alert email:
 * 1. Verify JWT token
 * 2. Check token not expired (5 minute window)
 * 3. Terminate ALL sessions
 * 4. Revoke ALL passkeys
 * 5. Reset TOTP secret (force re-enrollment)
 * 6. Force password change on next login
 * 7. Lock account (require admin unlock OR backup code)
 * 8. Log security event
 * 9. Send confirmation email
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invalid Security Token</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #dc2626; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ Invalid Security Token</h1>
    <p>This security action link is invalid or malformed. Please check your email and try again.</p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // ============================================
    // 1. Verify JWT Token
    // ============================================
    let payload: any;
    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET_KEY);
      const { payload: jwtPayload } = await jwtVerify(token, secret);
      payload = jwtPayload;
    } catch (jwtError) {
      console.error("[SecurityAction] JWT verification failed:", jwtError);
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invalid or Expired Token</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #dc2626; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0 0 16px 0; }
    .note { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; color: #991b1b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⏰ Token Expired</h1>
    <p>This security action link has expired (valid for 5 minutes).</p>
    <div class="note">
      If you believe your account is compromised, please contact support immediately at <strong>support@example.com</strong>
    </div>
  </div>
</body>
</html>
        `,
        {
          status: 401,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    const userId = payload.userId as string;
    const action = payload.action as string;

    if (!userId || action !== "revoke_all") {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invalid Action</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #dc2626; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ Invalid Action</h1>
    <p>This security token contains an invalid action type.</p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // ============================================
    // 2. Check if Token Already Used
    // ============================================
    const securityAction = await prisma.securityAction.findUnique({
      where: { token },
    });

    if (securityAction?.usedAt) {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Token Already Used</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #f59e0b; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0 0 16px 0; }
    .note { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; color: #92400e; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚠️ Already Processed</h1>
    <p>This security action has already been processed at <strong>${securityAction.usedAt.toLocaleString()}</strong>.</p>
    <div class="note">
      Your account has already been secured. If you need further assistance, please contact support.
    </div>
  </div>
</body>
</html>
        `,
        {
          status: 409,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // ============================================
    // 3. Get User
    // ============================================
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          where: {
            expires: { gt: new Date() },
            revokedAt: null,
          },
        },
        Authenticator: true,
        recoveryCodes: {
          where: { usedAt: null },
        },
      },
    });

    if (!user) {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>User Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #dc2626; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ User Not Found</h1>
    <p>The user associated with this security token could not be found.</p>
  </div>
</body>
</html>
        `,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // ============================================
    // 4. Execute Security Lockdown
    // ============================================
    const sessionCount = user.sessions.length;
    const passkeyCount = user.Authenticator.length;
    const backupCodesCount = user.recoveryCodes.length;

    await prisma.$transaction([
      // 4a. Mark security action as used
      prisma.securityAction.update({
        where: { token },
        data: { usedAt: new Date() },
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
          revokedReason: "security_breach",
        },
      }),

      // 4c. Delete all passkeys/authenticators
      prisma.authenticator.deleteMany({
        where: { userId: user.id },
      }),

      // 4d. Reset TOTP secret (force re-enrollment)
      // Note: We don't delete it entirely, we just invalidate it
      prisma.users.update({
        where: { id: user.id },
        data: {
          totpSecret: null,
          totpEnabledAt: null,
          accountLockedAt: new Date(),
          accountLockedReason: "security_breach_user_initiated",
          passwordExpiresAt: new Date(), // Force password change immediately
        },
      }),

      // 4e. Log audit event
      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          type: "SECURITY_LOCKDOWN",
          createdAt: new Date(),
          meta: {
            action: "revoke_all",
            sessionsRevoked: sessionCount,
            passkeysDeleted: passkeyCount,
            totpReset: true,
            backupCodesRemaining: backupCodesCount,
            trigger: "user_security_alert",
          },
        },
      }),
    ]);

    // ============================================
    // 5. Send Confirmation Email
    // ============================================
    try {
      const confirmationEmail = {
        subject: "Account Secured - Action Required",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">✅ Account Secured</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${user.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        You successfully triggered a security lockdown on your account. Your account is now secure.
      </p>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Actions Taken:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
          <li>${sessionCount} active session(s) terminated</li>
          <li>${passkeyCount} passkey(s) revoked</li>
          <li>Two-factor authentication reset</li>
          <li>Password change required on next login</li>
          <li>Account temporarily locked</li>
        </ul>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">How to Regain Access</h4>
        <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
          <li>Use one of your ${backupCodesCount} backup recovery codes</li>
          <li>Reset your password</li>
          <li>Re-enroll in two-factor authentication (TOTP)</li>
          <li>Your account will be automatically unlocked after re-enrollment</li>
        </ol>
      </div>

      ${
        backupCodesCount === 0
          ? `
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600;">⚠️ No Backup Codes Available</h4>
        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
          You have no backup codes remaining. Please contact support at <strong>support@example.com</strong> to regain access to your account.
        </p>
      </div>
      `
          : ""
      }
    </div>

    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        This is an automated security notification. If you didn't trigger this action, contact support immediately.
      </p>
    </div>
  </div>
</body>
</html>
        `,
      };

      await sendSecurityEmail(user.email, confirmationEmail.subject, confirmationEmail.html);
    } catch (emailError) {
      console.error("[SecurityAction] Failed to send confirmation email:", emailError);
      // Continue even if email fails
    }

    // ============================================
    // 6. Return Success Page
    // ============================================
    return new Response(
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Secured Successfully</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .card {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .success-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border-radius: 50%;
      margin-bottom: 24px;
    }
    h1 {
      color: #0f172a;
      margin: 0 0 16px 0;
      font-size: 28px;
      text-align: center;
    }
    .subtitle {
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 32px 0;
      text-align: center;
      font-size: 16px;
    }
    .stats {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .stats h3 {
      margin: 0 0 16px 0;
      color: #0f172a;
      font-size: 18px;
    }
    .stats ul {
      margin: 0;
      padding-left: 20px;
      color: #64748b;
      line-height: 1.8;
    }
    .recovery-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .recovery-box h4 {
      margin: 0 0 12px 0;
      color: #1e40af;
      font-size: 16px;
    }
    .recovery-box ol {
      margin: 0;
      padding-left: 20px;
      color: #1e40af;
      line-height: 1.8;
    }
    ${
      backupCodesCount === 0
        ? `
    .warning-box {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .warning-box h4 {
      margin: 0 0 12px 0;
      color: #991b1b;
      font-size: 16px;
    }
    .warning-box p {
      margin: 0;
      color: #991b1b;
      line-height: 1.6;
    }
    `
        : ""
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="success-icon">
        <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
    </div>

    <h1>✅ Account Secured Successfully</h1>
    <p class="subtitle">
      Your account has been locked and all active sessions have been terminated.
      A confirmation email has been sent to <strong>${user.email}</strong>.
    </p>

    <div class="stats">
      <h3>Actions Taken:</h3>
      <ul>
        <li><strong>${sessionCount}</strong> active session(s) terminated</li>
        <li><strong>${passkeyCount}</strong> passkey(s) revoked</li>
        <li>Two-factor authentication reset</li>
        <li>Password change required on next login</li>
        <li>Account temporarily locked</li>
      </ul>
    </div>

    <div class="recovery-box">
      <h4>🔐 How to Regain Access</h4>
      <ol>
        <li>Use one of your <strong>${backupCodesCount} backup recovery codes</strong></li>
        <li>Reset your password</li>
        <li>Re-enroll in two-factor authentication (TOTP)</li>
        <li>Your account will be automatically unlocked after re-enrollment</li>
      </ol>
    </div>

    ${
      backupCodesCount === 0
        ? `
    <div class="warning-box">
      <h4>⚠️ No Backup Codes Available</h4>
      <p>
        You have no backup codes remaining. Please contact support at
        <strong>support@example.com</strong> to regain access to your account.
        You will need to verify your identity.
      </p>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>
        This action was triggered at <strong>${new Date().toLocaleString()}</strong>.<br>
        If you didn't trigger this action, contact support immediately.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("[SecurityAction] Error:", error);
    return new Response(
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Error Processing Security Action</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #dc2626; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚠️ Server Error</h1>
    <p>An error occurred while processing your security action. Please contact support at <strong>support@example.com</strong>.</p>
  </div>
</body>
</html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
