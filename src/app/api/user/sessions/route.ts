import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { parseUserAgent } from '@/lib/security/device-fingerprint';
import { formatLocation } from '@/lib/security/ip-geolocation';

export const runtime = 'nodejs';

/**
 * Session Management API
 *
 * GET /api/user/sessions - List all active sessions
 * DELETE /api/user/sessions - Revoke all sessions except current
 */

// ============================================
// GET - List Active Sessions
// ============================================
export async function GET(req: Request) {
  try {
    // TODO: Get userId from session/auth
    // For now, getting from query param for testing
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: 'User ID required' },
        { status: 401 }
      );
    }

    // Get current session token from headers
    const headersList = await headers();
    const currentSessionToken = headersList.get('x-session-token') || '';

    const sessions = await prisma.sessions.findMany({
      where: {
        userId,
        expires: { gt: new Date() },
        revokedAt: null
      },
      orderBy: { lastActivity: 'desc' }
    });

    const formattedSessions = sessions.map(session => {
      const deviceInfo = parseUserAgent(session.userAgent || 'Unknown');
      const location = session.country && session.city
        ? `${session.city}, ${session.country}`
        : 'Unknown Location';

      return {
        id: session.id,
        deviceInfo: `${deviceInfo.browser} on ${deviceInfo.os}`,
        ipAddress: session.ipAddress || 'Unknown',
        location,
        lastActivity: session.lastActivity.toISOString(),
        createdAt: session.createdAt?.toISOString() || session.lastActivity.toISOString(),
        isCurrent: session.sessionToken === currentSessionToken
      };
    });

    return NextResponse.json({
      ok: true,
      sessions: formattedSessions,
      total: sessions.length
    });

  } catch (error) {
    console.error('[Sessions] GET error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Revoke All Sessions (Except Current)
// ============================================
export async function DELETE(req: Request) {
  try {
    // TODO: Get userId from session/auth
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: 'User ID required' },
        { status: 401 }
      );
    }

    // Get current session token
    const headersList = await headers();
    const currentSessionToken = headersList.get('x-session-token') || '';

    // Revoke all sessions except the current one
    const result = await prisma.sessions.updateMany({
      where: {
        userId,
        sessionToken: { not: currentSessionToken },
        expires: { gt: new Date() },
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'user_action'
      }
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        id: randomUUID(),
        userId,
        type: 'SESSIONS_REVOKED',
        createdAt: new Date(),
        meta: {
          count: result.count,
          action: 'revoke_all_except_current'
        }
      }
    });

    return NextResponse.json({
      ok: true,
      message: `${result.count} session(s) revoked successfully`,
      revokedCount: result.count
    });

  } catch (error) {
    console.error('[Sessions] DELETE error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to revoke sessions' },
      { status: 500 }
    );
  }
}
