import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sendAccessCode } from "@/lib/email";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.ENABLE_MAGIC_LINKS !== "true") {
    return NextResponse.json({ ok: false, message: "Disabled" }, { status: 404 });
  }
  try {
    const body = await req.json();
    
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      
      return NextResponse.json({ ok: false, message: "Valid email is required" }, { status: 400 });
    }

    

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "No account found with this email. Please contact your administrator.",
        },
        { status: 404 }
      );
    }

    // Check if user access has expired
    if (user.accessExpiresAt && new Date() > user.accessExpiresAt && !user.exception) {
      return NextResponse.json(
        { ok: false, message: "Your access has expired. Please contact your administrator." },
        { status: 403 }
      );
    }

    // Generate random token (32 bytes = 64 hex chars)
    const token = randomBytes(32).toString("hex");

    // Create magic link (valid for 2 minutes)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // SECURITY: never build an emailed login URL from request headers. An
    // attacker who can reach this origin with a forged Host / X-Forwarded-Proto
    // would otherwise have a valid, unused magic token mailed to the victim
    // pointing at infrastructure they control. Use configured origin only.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      logger.error("[send-magic-link] No configured app origin (NEXT_PUBLIC_APP_URL/NEXTAUTH_URL)");
      return NextResponse.json(
        { ok: false, message: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }
    const magicLink = `${baseUrl.replace(/\/$/, "")}/login?token=${token}`;

    // Store token in database
    await prisma.magic_tokens.create({
      data: {
        id: randomBytes(16).toString("hex"),
        email: user.email,
        token,
        expiresAt,
      },
    });

    // Send email with magic link (use dummy code "000000" since template expects it)
    const emailResult = await sendAccessCode(user.email, "000000", magicLink);

    if (!emailResult.success && !emailResult.devMode) {
      logger.error("[send-magic-link] Failed to send email", { error: emailResult.error });
      return NextResponse.json(
        { ok: false, message: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    // In dev mode (no email provider), log the magic link to console
    if (emailResult.devMode) {

    }

    return NextResponse.json({
      ok: true,
      message: "Magic link sent! Check your email.",
      devMode: emailResult.devMode,
      // Only include magic link in dev mode for easy testing
      ...(emailResult.devMode && { magicLink }),
    });
  } catch (error) {
    logger.error("Send magic link error", { error: error });
    return NextResponse.json(
      { ok: false, message: "Failed to send magic link. Please try again." },
      { status: 500 }
    );
  }
}
