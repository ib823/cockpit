import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Email Change Verification
 *
 * POST /api/user/email/verify
 *
 * Completes the email change after user enters verification code
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, verificationCode } = body;

    // ============================================
    // 1. Validate Input
    // ============================================
    if (!userId || !verificationCode) {
      return NextResponse.json(
        { ok: false, message: 'User ID and verification code are required' },
        { status: 400 }
      );
    }

    if (verificationCode.length !== 6) {
      return NextResponse.json(
        { ok: false, message: 'Verification code must be 6 digits' },
        { status: 400 }
      );
    }

    // ============================================
    // 2. Get User
    // ============================================
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // ============================================
    // 3. Validate Pending Email Change
    // ============================================
    if (!user.pendingEmail || !user.pendingEmailToken || !user.pendingEmailExpiresAt) {
      return NextResponse.json(
        { ok: false, message: 'No pending email change found' },
        { status: 400 }
      );
    }

    // Check expiration
    if (user.pendingEmailExpiresAt < new Date()) {
      // Clean up expired request
      await prisma.users.update({
        where: { id: userId },
        data: {
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailExpiresAt: null
        }
      });

      return NextResponse.json(
        { ok: false, message: 'Verification code has expired. Please request a new email change.' },
        { status: 410 }
      );
    }

    // ============================================
    // 4. Verify Code
    // ============================================
    const codeValid = await compare(verificationCode, user.pendingEmailToken);

    if (!codeValid) {
      return NextResponse.json(
        { ok: false, message: 'Invalid verification code' },
        { status: 401 }
      );
    }

    // ============================================
    // 5. Check if New Email Is Still Available
    // ============================================
    const existingUser = await prisma.users.findUnique({
      where: { email: user.pendingEmail }
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { ok: false, message: 'This email is now in use by another account' },
        { status: 409 }
      );
    }

    // ============================================
    // 6. Complete Email Change
    // ============================================
    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    await prisma.$transaction([
      // Update user email
      prisma.users.update({
        where: { id: userId },
        data: {
          email: newEmail,
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailExpiresAt: null,
          emailVerified: new Date() // Mark as verified
        }
      }),

      // Log audit event
      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId,
          type: 'EMAIL_CHANGED',
          createdAt: new Date(),
          meta: {
            oldEmail,
            newEmail,
            method: 'verification_code'
          }
        }
      })
    ]);

    // ============================================
    // 7. Send Confirmation Emails
    // ============================================
    try {
      const { sendSecurityEmail } = await import('@/lib/email');

      // Confirmation to new email
      await sendSecurityEmail(
        newEmail,
        'Email Changed Successfully',
        `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
  <h1>Email Changed Successfully</h1>
  <p>Your email address has been successfully changed to <strong>${newEmail}</strong>.</p>
  <p>If you didn't make this change, please contact support immediately.</p>
</div>
        `
      );

      // Notification to old email
      await sendSecurityEmail(
        oldEmail,
        'Email Address Changed',
        `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
  <h1>Email Address Changed</h1>
  <p>The email address for your account has been changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
  <p>If you didn't authorize this change, please contact support immediately at support@example.com.</p>
</div>
        `
      );
    } catch (emailError) {
      console.error('[EmailVerify] Failed to send confirmation emails:', emailError);
      // Don't fail the request if emails fail
    }

    return NextResponse.json({
      ok: true,
      message: 'Email changed successfully',
      newEmail
    });

  } catch (error: any) {
    console.error('[EmailVerify] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to verify email change' },
      { status: 500 }
    );
  }
}
