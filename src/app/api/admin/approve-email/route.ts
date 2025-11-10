import { prisma } from "@/lib/db";
import { randomUUID, randomBytes, randomInt } from "crypto";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { sendAccessCode } from "@/lib/email";
export const runtime = "nodejs";

// SECURITY FIX: DEFECT-20251027-006 & REGRESSION-001
// Replaced Math.random() with crypto.randomInt() for cryptographically secure random code generation
function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

function generateMagicToken(): string {
  return randomBytes(32).toString("hex"); // 64 character secure token
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const { email, name } = await req.json().catch(() => ({}));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Valid email required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate code but don't send it yet
    const code = generateCode();
    // SECURITY FIX: Increased bcrypt rounds from 10 to 12 for stronger hashing
    const tokenHash = await hash(code, 12);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update user (pending status)
    await prisma.users.upsert({
      where: { email },
      update: {
        name: name || undefined,
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        id: randomUUID(),
        email,
        name: name || null,
        role: "USER",
        exception: false,
        accessExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    // Store approval (code ready but not sent)
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

    // Generate magic token for instant login via email
    const magicToken = generateMagicToken();
    const magicTokenExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes (reduced for email security)

    await prisma.magic_tokens.create({
      data: {
        id: randomUUID(),
        email,
        token: magicToken,
        expiresAt: magicTokenExpiry,
      },
    });

    // Generate magic link URL (manual distribution - no auto-send)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const magicUrl = `${baseUrl}/login?token=${magicToken}`;

    // OPTIONAL: Send email if explicitly requested (sendEmail=true in request)
    const { sendEmail } = await req
      .clone()
      .json()
      .catch(() => ({ sendEmail: false }));
    let emailSent = false;
    if (sendEmail && process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        await sendAccessCode(email, code, magicUrl);
        emailSent = true;
      } catch (err) {
        console.error("Failed to send access code email:", err);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        message: emailSent
          ? "Email approved and access code sent via email."
          : "Email approved. Share the code and magic link manually with the user.",
        code, // Return code for manual distribution
        email,
        magicUrl, // Magic link URL for manual distribution
        magicLinkExpiry: "2 minutes",
        codeExpiry: "7 days",
        emailSent,
        instructions: `1. Send this to the user: "${code}" (6-digit code) OR "${magicUrl}" (magic link)\n2. Code expires in 7 days, magic link expires in 2 minutes\n3. User can register at ${baseUrl}/login`,
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
    console.error("approve-email error:", e);

    // Provide more specific error messages
    let errorMessage = "Internal error";
    if (e instanceof Error) {
      if (e.message?.includes("connect")) {
        errorMessage =
          "Database connection failed. Please check your database configuration.";
      } else if (e.message?.includes("Unique constraint")) {
        errorMessage = "This email is already registered";
      }
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
