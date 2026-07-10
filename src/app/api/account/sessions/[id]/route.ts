import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { logger } from "@/lib/logger";
import { markSessionRevoked } from "@/lib/auth/revocation";

// DELETE /api/account/sessions/:id - Revoke a session
export const DELETE = withUser<{ params: Promise<{ id: string }> }>(
  async (req, user, { params }) => {
    try {
      const { id } = await params;

      // Identify the caller's current session by its `sid` (embedded in the JWT).
      const token = await getToken({ req });
      const currentSid = token?.sid as string | undefined;

      // Find the session to revoke
      const sessionToRevoke = await prisma.sessions.findUnique({
        where: { id },
      });

      if (!sessionToRevoke) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // Verify the session belongs to the user
      if (sessionToRevoke.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Prevent revoking current session
      if (sessionToRevoke.id === currentSid) {
        return NextResponse.json(
          { error: "Cannot revoke current session. Please logout instead." },
          { status: 400 }
        );
      }

      // Delete the session and enforce revocation at the guard.
      await prisma.sessions.delete({
        where: { id },
      });
      await markSessionRevoked(
        id,
        Math.ceil((sessionToRevoke.expires.getTime() - Date.now()) / 1000)
      );

      // Audit log the revocation
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: "DELETE",
          entity: "SESSION",
          entityId: id,
          changes: {
            revokedSession: {
              id: sessionToRevoke.id,
              ipAddress: sessionToRevoke.ipAddress,
            },
          },
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error("Session revoke error", { error: error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
