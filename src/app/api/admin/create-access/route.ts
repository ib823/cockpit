import { prisma } from "@/lib/db";
import { randomUUID, randomInt } from "crypto";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { sendAccessCode } from "@/lib/email";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { sanitizeHtml } from "@/lib/input-sanitizer";
import { badRequest, forbidden, serverError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    const { email: rawEmail } = body as { email?: string };

    // SECURITY FIX: DEFECT-20251027-002
    // Sanitize email input to prevent XSS attacks
    const email = sanitizeHtml(rawEmail || "")
      .trim()
      .toLowerCase();

    // Validate email format and length
    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest("Valid email required");
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
      return forbidden("Admin access required");
    }
    logger.error("create-access error", { error: e });
    return serverError();
  }
}
