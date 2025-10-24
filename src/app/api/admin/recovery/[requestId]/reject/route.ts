import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { sendSecurityEmail } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * Admin Reject Recovery Request
 *
 * POST /api/admin/recovery/:requestId/reject
 *
 * Rejects a user's account recovery request
 */
export async function POST(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;
    const body = await req.json().catch(() => ({}));
    const { adminId, rejectionReason, notes } = body;

    // ============================================
    // 1. Verify Admin
    // ============================================
    if (!adminId) {
      return NextResponse.json(
        { ok: false, message: 'Admin ID required' },
        { status: 401 }
      );
    }

    const admin = await prisma.users.findUnique({
      where: { id: adminId }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // ============================================
    // 2. Get Recovery Request
    // ============================================
    const recoveryRequest = await prisma.accountRecoveryRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true
      }
    });

    if (!recoveryRequest) {
      return NextResponse.json(
        { ok: false, message: 'Recovery request not found' },
        { status: 404 }
      );
    }

    if (recoveryRequest.status !== 'pending') {
      return NextResponse.json(
        { ok: false, message: `Request already ${recoveryRequest.status}` },
        { status: 400 }
      );
    }

    const user = recoveryRequest.user;

    // ============================================
    // 3. Reject the Request
    // ============================================
    await prisma.$transaction([
      prisma.accountRecoveryRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          rejectedBy: adminId,
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || 'Unable to verify identity',
          notes: notes || null
        }
      }),

      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          type: 'ACCOUNT_RECOVERY_REJECTED',
          createdAt: new Date(),
          meta: {
            requestId,
            rejectedBy: adminId,
            adminEmail: admin.email,
            reason: rejectionReason || 'Unable to verify identity'
          }
        }
      })
    ]);

    // ============================================
    // 4. Send Rejection Email to User
    // ============================================
    try {
      const rejectionEmailContent = {
        subject: 'Account Recovery Request - Update',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Account Recovery Update</h1>
    </div>

    <div style="padding: 40px 32px;">
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        Hi <strong>${user.email}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
        We've reviewed your account recovery request and unfortunately we were unable to approve it at this time.
      </p>

      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600;">Reason:</h4>
        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
          ${rejectionReason || 'Unable to verify identity'}
        </p>
      </div>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">What You Can Do:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
          <li>Contact our support team at <strong>support@example.com</strong></li>
          <li>Provide additional identity verification documents</li>
          <li>Submit a new recovery request with more information</li>
          <li>If you have any remaining backup codes, use them to regain access</li>
        </ul>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 32px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">Need Help?</h4>
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          Our support team is here to help you regain access to your account.
          Please reply to this email or contact us at <strong>support@example.com</strong> with your request ID below.
        </p>
      </div>
    </div>

    <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        Reference ID: ${requestId}<br>
        © ${new Date().getFullYear()} Cockpit. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
        `
      };

      await sendSecurityEmail(
        user.email,
        rejectionEmailContent.subject,
        rejectionEmailContent.html
      );
    } catch (emailError) {
      console.error('[RecoveryReject] Failed to send rejection email:', emailError);
      // Don't fail the rejection
    }

    return NextResponse.json({
      ok: true,
      message: 'Recovery request rejected successfully'
    });

  } catch (error: any) {
    console.error('[RecoveryReject] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to reject recovery request' },
      { status: 500 }
    );
  }
}
