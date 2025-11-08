import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'ikmls@hotmail.com';

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        passkeys: true,
        webauthnChallenges: {
          orderBy: { expiresAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        found: false,
        email,
        message: 'User not found in database'
      }, { status: 404 });
    }

    // Check admin approval
    const adminApproval = await prisma.adminApproval.findUnique({
      where: { email }
    });

    const hasExpiredAdminAccess = adminApproval?.expiresAt
      ? new Date(adminApproval.expiresAt) < new Date()
      : false;

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: !!user.emailVerified
      },
      passkeys: {
        count: user.passkeys.length,
        registered: user.passkeys.length > 0,
        details: user.passkeys.map(pk => ({
          id: pk.id.substring(0, 20) + '...',
          deviceName: pk.deviceName,
          createdAt: pk.createdAt,
          lastUsedAt: pk.lastUsedAt,
          counter: pk.counter
        }))
      },
      challenges: {
        count: user.webauthnChallenges.length,
        recent: user.webauthnChallenges.slice(0, 3).map(ch => ({
          type: ch.type,
          createdAt: ch.createdAt,
          expiresAt: ch.expiresAt,
          expired: new Date(ch.expiresAt) < new Date()
        }))
      },
      adminAccess: adminApproval ? {
        hasApproval: true,
        approvedBy: adminApproval.approvedBy,
        approvedAt: adminApproval.approvedAt,
        expiresAt: adminApproval.expiresAt,
        expired: hasExpiredAdminAccess
      } : {
        hasApproval: false
      },
      diagnosis: {
        canLogin: user.passkeys.length > 0 && (!hasExpiredAdminAccess || !adminApproval),
        issues: [
          ...(user.passkeys.length === 0 ? ['No passkeys registered - register at /register-secure'] : []),
          ...(hasExpiredAdminAccess ? ['Admin access expired - request renewal'] : [])
        ]
      }
    });

  } catch (error: any) {
    console.error('Error checking passkey:', error);
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
