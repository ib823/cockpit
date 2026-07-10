import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/account/passkeys - List all passkeys
export const GET = withUser(async (_req, user) => {
  try {
    // Fetch all passkeys (authenticators) for the user
    const passkeys = await prisma.authenticator.findMany({
      where: { userId: user.id },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        nickname: true,
        deviceType: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    // Format for response
    const formattedPasskeys = passkeys.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      deviceType: p.deviceType,
      createdAt: p.createdAt.toISOString(),
      lastUsedAt: p.lastUsedAt.toISOString(),
    }));

    return NextResponse.json(formattedPasskeys);
  } catch (error) {
    logger.error("Passkeys fetch error", { error: error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
