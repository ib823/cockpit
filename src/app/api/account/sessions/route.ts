import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { logger } from "@/lib/logger";

// GET /api/account/sessions - List all active sessions
export const GET = withUser(async (req, user) => {
  try {
    // Identify the caller's current session by its `sid` (embedded in the JWT).
    const token = await getToken({ req });
    const currentSid = token?.sid as string | undefined;

    // Fetch all sessions for the user
    const sessions = await prisma.sessions.findMany({
      where: {
        userId: user.id,
        expires: { gt: new Date() }, // Only active sessions
      },
      orderBy: {
        lastActivity: "desc",
      },
    });

    // Format sessions for response
    const formattedSessions = sessions.map((s) => {
      let deviceInfo = null;

      // Parse deviceInfo if it exists
      if (s.deviceInfo && typeof s.deviceInfo === "object") {
        const info = s.deviceInfo as { browser?: string; os?: string; device?: string };
        deviceInfo = {
          browser: info.browser || "Unknown",
          os: info.os || "Unknown",
          device: info.device || "Unknown",
        };
      }

      return {
        id: s.id,
        deviceInfo,
        ipAddress: s.ipAddress,
        lastActivity: s.lastActivity.toISOString(),
        current: s.id === currentSid,
      };
    });

    return NextResponse.json(formattedSessions);
  } catch (error) {
    logger.error("Sessions fetch error", { error: error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
