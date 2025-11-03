import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Single Session Management
 *
 * DELETE /api/user/sessions/:sessionId - Revoke specific session
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // TODO: Get userId from session/auth
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: 'User ID required' },
        { status: 401 }
      );
    }

    // Find the session
    const session = await prisma.sessions.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.userId !== userId) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if already revoked
    if (session.revokedAt) {
      return NextResponse.json(
        { ok: false, message: 'Session already revoked' },
        { status: 400 }
      );
    }

    // Revoke the session
    await prisma.$transaction([
      prisma.sessions.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          revokedReason: 'user_action'
        }
      }),
      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId,
          type: 'SESSION_REVOKED',
          createdAt: new Date(),
          meta: {
            sessionId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent
          }
        }
      })
    ]);

    return NextResponse.json({
      ok: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('[Session] DELETE error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
