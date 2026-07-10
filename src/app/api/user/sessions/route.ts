import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { authConfig as authOptions } from "@/lib/auth";
import { parseUserAgent } from "@/lib/security/device-fingerprint";
import { logger } from "@/lib/logger";
import { markSessionsRevoked } from "@/lib/auth/revocation";

export const runtime = "nodejs";

/**
 * Session Management API
 *
 * GET /api/user/sessions - List all active sessions
 * DELETE /api/user/sessions - Revoke all sessions except current
 */

// ============================================
// GET - List Active Sessions
// ============================================
export async function GET(req: NextRequest) {
  try {
    // Authenticate user via NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // Get current session token from JWT
    const token = await getToken({ req });
    const currentSessionToken = (token?.sessionToken as string) || "";

    const sessions = await prisma.sessions.findMany({
      where: {
        userId,
        expires: { gt: new Date() },
        revokedAt: null,
      },
      orderBy: { lastActivity: "desc" },
    });

    const formattedSessions = sessions.map((session) => {
      const deviceInfo = parseUserAgent(session.userAgent || "Unknown");
      const location =
        session.country && session.city
          ? `${session.city}, ${session.country}`
          : "Unknown Location";

      return {
        id: session.id,
        deviceInfo: `${deviceInfo.browser} on ${deviceInfo.os}`,
        ipAddress: session.ipAddress || "Unknown",
        location,
        lastActivity: session.lastActivity.toISOString(),
        createdAt: session.createdAt?.toISOString() || session.lastActivity.toISOString(),
        isCurrent: session.sessionToken === currentSessionToken,
      };
    });

    return NextResponse.json({
      ok: true,
      sessions: formattedSessions,
      total: sessions.length,
    });
  } catch (error) {
    logger.error("[Sessions] GET error", { error: error });
    return NextResponse.json({ ok: false, message: "Failed to fetch sessions" }, { status: 500 });
  }
}

// ============================================
// DELETE - Revoke All Sessions (Except Current)
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user via NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // Identify the caller's current session by its `sid` (embedded in the JWT).
    const token = await getToken({ req });
    const currentSid = (token?.sid as string) || "";

    // Collect every other active session so we can both revoke them in the DB
    // and enforce it at the guard via Redis.
    const toRevoke = await prisma.sessions.findMany({
      where: {
        userId,
        id: { not: currentSid },
        expires: { gt: new Date() },
        revokedAt: null,
      },
      select: { id: true },
    });
    const revokeIds = toRevoke.map((s) => s.id);

    const result = await prisma.sessions.updateMany({
      where: { id: { in: revokeIds } },
      data: {
        revokedAt: new Date(),
        revokedReason: "user_action",
      },
    });

    await markSessionsRevoked(revokeIds);

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        id: randomUUID(),
        userId,
        type: "SESSIONS_REVOKED",
        createdAt: new Date(),
        meta: {
          count: result.count,
          action: "revoke_all_except_current",
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `${result.count} session(s) revoked successfully`,
      revokedCount: result.count,
    });
  } catch (error) {
    logger.error("[Sessions] DELETE error", { error: error });
    return NextResponse.json({ ok: false, message: "Failed to revoke sessions" }, { status: 500 });
  }
}
