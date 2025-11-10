import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.users.update({
      where: { id },
      data: {
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true }, { headers: { "Content-Type": "application/json" } });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("extend access error", e);
    return NextResponse.json(
      { error: "Failed to extend access" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
