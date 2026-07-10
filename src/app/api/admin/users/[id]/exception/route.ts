import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/auth/with-auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export const POST = withAdmin<{ params: Promise<{ id: string }> }>(
  async (req, _auth, { params }) => {
    try {
      const { id } = await params;
      let exception = false;
      try {
        const body = await req.json();
        exception = body.exception ?? false;
      } catch {
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      await prisma.users.update({
        where: { id },
        data: {
          exception,
          // If setting exception, extend expiry far into future
          ...(exception && {
            accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }),
        },
      });

      return NextResponse.json({ ok: true }, { headers: { "Content-Type": "application/json" } });
    } catch (e: unknown) {
      logger.error("toggle exception error", { error: e });
      return NextResponse.json(
        { error: "Failed to update exception" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
);
