import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/auth/with-auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export const POST = withAdmin<{ params: Promise<{ id: string }> }>(
  async (_req, _auth, { params }) => {
    try {
      const { id } = await params;

      await prisma.users.update({
        where: { id },
        data: {
          accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({ ok: true }, { headers: { "Content-Type": "application/json" } });
    } catch (e: unknown) {
      logger.error("extend access error", { error: e });
      return NextResponse.json(
        { error: "Failed to extend access" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
);
