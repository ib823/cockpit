import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { markSessionRevoked } from "@/lib/auth/revocation";

export const runtime = "nodejs";

/**
 * Single Session Management
 *
 * DELETE /api/user/sessions/:sessionId - Revoke specific session
 */
export const DELETE = withAuth<{ params: Promise<{ sessionId: string }> }>(
  async (_req, auth, { params }) => {
  try {
    const { sessionId } = await params;
    const userId = auth.userId;

    // Find the target session to revoke
    const targetSession = await prisma.sessions.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession) {
      return NextResponse.json({ ok: false, message: "Session not found" }, { status: 404 });
    }

    // Verify ownership - user can only revoke their own sessions
    if (targetSession.userId !== userId) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
    }

    // Check if already revoked
    if (targetSession.revokedAt) {
      return NextResponse.json({ ok: false, message: "Session already revoked" }, { status: 400 });
    }

    // Revoke the session
    await prisma.$transaction([
      prisma.sessions.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          revokedReason: "user_action",
        },
      }),
      prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          userId,
          type: "SESSION_REVOKED",
          createdAt: new Date(),
          meta: {
            sessionId,
            ipAddress: targetSession.ipAddress,
            userAgent: targetSession.userAgent,
          },
        },
      }),
    ]);

    // Enforce at the guard: reject this session's JWT on the next request.
    await markSessionRevoked(
      sessionId,
      Math.ceil((targetSession.expires.getTime() - Date.now()) / 1000)
    );

    return NextResponse.json({
      ok: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    logger.error("[Session] DELETE error", { error: error });
    return NextResponse.json({ ok: false, message: "Failed to revoke session" }, { status: 500 });
  }
});
