import { NextResponse, NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Email Change Revocation
 *
 * GET /api/user/email/revoke?token=JWT_TOKEN
 *
 * Cancels a pending email change request
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invalid Token</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #dc2626; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ Invalid Token</h1>
    <p>This revocation link is invalid or malformed.</p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // ============================================
    // 1. Verify JWT Token
    // ============================================
    let payload: any;
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET_KEY || 'default-secret-change-in-production'
      );
      const { payload: jwtPayload } = await jwtVerify(token, secret);
      payload = jwtPayload;
    } catch (jwtError) {
      console.error('[EmailRevoke] JWT verification failed:', jwtError);
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Expired Link</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #f59e0b; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⏰ Link Expired</h1>
    <p>This revocation link has expired (valid for 24 hours).</p>
  </div>
</body>
</html>
        `,
        {
          status: 401,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    const userId = payload.userId as string;
    const action = payload.action as string;
    const oldEmail = payload.oldEmail as string;
    const newEmail = payload.newEmail as string;

    if (!userId || action !== 'revoke_email_change') {
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
    <p>This token contains an invalid action type.</p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // ============================================
    // 2. Get User
    // ============================================
    const user = await prisma.users.findUnique({
      where: { id: userId }
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
    <p>The user associated with this request could not be found.</p>
  </div>
</body>
</html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // ============================================
    // 3. Check if Pending Change Exists
    // ============================================
    if (!user.pendingEmail) {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>No Pending Change</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
    h1 { color: #f59e0b; margin: 0 0 16px 0; font-size: 24px; }
    p { color: #64748b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚠️ No Pending Change</h1>
    <p>There is no pending email change for this account. It may have already been cancelled or completed.</p>
  </div>
</body>
</html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // ============================================
    // 4. Cancel the Email Change
    // ============================================
    await prisma.$transaction([
      prisma.users.update({
        where: { id: userId },
        data: {
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailExpiresAt: null
        }
      }),

      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId,
          type: 'EMAIL_CHANGE_REVOKED',
          createdAt: new Date(),
          meta: {
            oldEmail,
            newEmail,
            revokedBy: 'user'
          }
        }
      })
    ]);

    // ============================================
    // 5. Send Confirmation Email
    // ============================================
    try {
      const { sendSecurityEmail } = await import('@/lib/email');

      await sendSecurityEmail(
        user.email,
        'Email Change Cancelled',
        `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
  <h1>✅ Email Change Cancelled</h1>
  <p>The email change request to <strong>${newEmail}</strong> has been successfully cancelled.</p>
  <p>Your email address remains <strong>${user.email}</strong>.</p>
  <p>If you didn't cancel this change, please contact support immediately.</p>
</div>
        `
      );
    } catch (emailError) {
      console.error('[EmailRevoke] Failed to send confirmation:', emailError);
      // Don't fail the request
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
  <title>Email Change Cancelled</title>
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
    p {
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .info-box {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align: center;">
      <div class="success-icon">
        <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
    </div>

    <h1>✅ Email Change Cancelled</h1>

    <div class="info-box">
      <p style="margin: 0;"><strong>Status:</strong> Successfully cancelled</p>
      <p style="margin: 8px 0 0 0;"><strong>Your email remains:</strong> ${user.email}</p>
      <p style="margin: 8px 0 0 0;"><strong>Cancelled at:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <p style="text-align: center;">
      The email change request to <strong>${newEmail}</strong> has been cancelled.
      Your account email address remains unchanged.
    </p>

    <p style="text-align: center; color: #94a3b8; font-size: 14px;">
      A confirmation email has been sent to <strong>${user.email}</strong>.
    </p>
  </div>
</body>
</html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );

  } catch (error: any) {
    console.error('[EmailRevoke] Error:', error);
    return new Response(
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Server Error</title>
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
    <p>An error occurred while processing your request. Please contact support.</p>
  </div>
</body>
</html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}
