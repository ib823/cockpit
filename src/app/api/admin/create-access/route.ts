import { prisma } from "@/lib/db";
import { randomUUID, randomInt } from "crypto";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { sendAccessCode } from "@/lib/email";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { sanitizeHtml } from "@/lib/input-sanitizer";
export const runtime = "nodejs";

// SECURITY FIX: DEFECT-20251027-006
// Replaced Math.random() with crypto.randomInt() for cryptographically secure random code generation
function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    const session = await requireAdmin();

    const { email: rawEmail } = await req.json().catch(() => ({}));

    // SECURITY FIX: DEFECT-20251027-002
    // Sanitize email input to prevent XSS attacks
    const email = sanitizeHtml(rawEmail || "")
      .trim()
      .toLowerCase();

    // Validate email format and length
    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Valid email required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit code
    const code = generateCode();
    // SECURITY FIX: DEFECT-20251027-012
    // Increased bcrypt cost factor from 10 to 12 for industry-standard security (2024)
    const tokenHash = await hash(code, 12);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update user
    await prisma.users.upsert({
      where: { email },
      update: {
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        id: randomUUID(),
        email,
        role: "USER",
        exception: false,
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    // Upsert email approval
    await prisma.emailApproval.upsert({
      where: { email },
      update: {
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: session.user.id,
        usedAt: null,
      },
      create: {
        email,
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: session.user.id,
      },
    });

    // Send email
    const emailResult = await sendAccessCode(email, code);

    return NextResponse.json(
      {
        ok: true,
        code,
        emailSent: emailResult.success,
        devMode: emailResult.devMode || false,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json(
        { ok: false, error: "Admin access required" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("create-access error", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
