import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { authConfig as authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Single Session Management
 *
 * DELETE /api/user/sessions/:sessionId - Revoke specific session
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;

    // Authenticate user via NextAuth session
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.email) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: authSession.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    const userId = user.id;

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

    return NextResponse.json({
      ok: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("[Session] DELETE error:", error);
    return NextResponse.json({ ok: false, message: "Failed to revoke session" }, { status: 500 });
  }
}
