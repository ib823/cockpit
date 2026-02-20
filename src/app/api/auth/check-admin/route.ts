import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Check admin status for an email.
 *
 * Security: Uses constant-time response pattern to prevent enumeration.
 * The response delay is the same regardless of whether the email exists
 * or has admin privileges, preventing timing-based information disclosure.
 */
export async function POST(req: Request) {
  const start = Date.now();
  const MIN_RESPONSE_MS = 200;

  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") {
      await delayUntil(start, MIN_RESPONSE_MS);
      return NextResponse.json({ isAdmin: false }, { headers: { "Content-Type": "application/json" } });
    }

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { role: true },
    });
    const isAdmin = !!user && user.role === "ADMIN";

    // Constant-time delay to prevent timing-based enumeration
    await delayUntil(start, MIN_RESPONSE_MS);
    return NextResponse.json({ isAdmin }, { headers: { "Content-Type": "application/json" } });
  } catch {
    await delayUntil(start, MIN_RESPONSE_MS);
    return NextResponse.json(
      { isAdmin: false },
      { headers: { "Content-Type": "application/json" } }
    );
  }
}

async function delayUntil(startMs: number, minMs: number): Promise<void> {
  const elapsed = Date.now() - startMs;
  if (elapsed < minMs) {
    await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
  }
}
