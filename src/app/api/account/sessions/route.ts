import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig as authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";


// GET /api/account/sessions - List all active sessions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current session token
    const token = await getToken({ req });
    const currentSessionToken = token?.sessionToken as string | undefined;

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
        current: s.sessionToken === currentSessionToken,
      };
    });

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
