import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Admin Email Approvals Management
 *
 * POST /api/admin/email-approvals - Create new email approval
 * GET /api/admin/email-approvals - List all approvals
 */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, adminId } = body;

    // ============================================
    // 1. Validate Admin
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
    // 2. Validate Email
    // ============================================
    if (!email) {
      return NextResponse.json(
        { ok: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ============================================
    // 3. Check if User Already Exists
    // ============================================
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // ============================================
    // 4. Check if Approval Already Exists
    // ============================================
    const existingApproval = await prisma.emailApproval.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingApproval) {
      // Check if it's expired or used
      if (existingApproval.usedAt) {
        return NextResponse.json(
          { ok: false, message: 'This email approval has already been used' },
          { status: 409 }
        );
      }

      if (existingApproval.tokenExpiresAt < new Date()) {
        // Delete expired approval and create new one
        await prisma.emailApproval.delete({
          where: { email: normalizedEmail }
        });
      } else {
        return NextResponse.json(
          { ok: false, message: 'Active approval already exists for this email' },
          { status: 409 }
        );
      }
    }

    // ============================================
    // 5. Generate 6-Digit Code
    // ============================================
    const code = Math.floor(100000 + Math.random() * 900000).toString();
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
        createdAt: new Date()
      }
    });

    // ============================================
    // 7. Optional: Send Email with Code
    // ============================================
    // TODO: Implement email sending
    // try {
    //   const { sendSecurityEmail } = await import('@/lib/email');
    //   await sendSecurityEmail(
    //     normalizedEmail,
    //     'Your Registration Code',
    //     `Your 6-digit code is: ${code}`
    //   );
    //
    //   await prisma.emailApproval.update({
    //     where: { email: normalizedEmail },
    //     data: { codeSent: true }
    //   });
    // } catch (emailError) {
    //   console.error('[EmailApproval] Failed to send email:', emailError);
    // }

    return NextResponse.json({
      ok: true,
      message: 'Email approval created successfully',
      code, // Return code for admin to share
      email: normalizedEmail,
      expiresAt: tokenExpiresAt
    });

  } catch (error: any) {
    console.error('[EmailApprovals] POST error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to create email approval' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // TODO: Verify admin access

    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // 'active', 'used', 'expired', 'all'

    let where: any = {};

    if (status === 'active') {
      where = {
        usedAt: null,
        tokenExpiresAt: { gt: new Date() }
      };
    } else if (status === 'used') {
      where = { usedAt: { not: null } };
    } else if (status === 'expired') {
      where = {
        usedAt: null,
        tokenExpiresAt: { lt: new Date() }
      };
    }

    const approvals = await prisma.emailApproval.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      ok: true,
      approvals,
      total: approvals.length
    });

  } catch (error: any) {
    console.error('[EmailApprovals] GET error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch email approvals' },
      { status: 500 }
    );
  }
}
