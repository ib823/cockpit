/**
 * EMERGENCY ADMIN LOGIN ENDPOINT
 *
 * This is a development-only endpoint to bypass passkey registration
 * when WebAuthn doesn't work in your environment.
 *
 * Usage: GET http://localhost:3000/api/admin/force-login
 */

import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { establishSession } from "@/lib/auth/session";
import { NextResponse, NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "This endpoint is disabled in production" }, { status: 403 });
  }

  try {
    const adminEmail = env.ADMIN_EMAIL;
    if (!adminEmail) {
       return NextResponse.json({ error: "ADMIN_EMAIL not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const expectedKey = process.env.CRON_SECRET_KEY;

    if (!expectedKey || key !== expectedKey) {
       return NextResponse.json({ error: "Invalid or missing bypass key" }, { status: 401 });
    }

    // Get admin user
    const user = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        firstLoginAt: user.firstLoginAt ?? new Date(),
      },
    });

    // Mint a real NextAuth session (the previous implementation set a random
    // UUID that the middleware guard could not decode) and redirect.
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const response = NextResponse.redirect(new URL("/dashboard", `${protocol}://${host}`));

    await establishSession(response, {
      userId: user.id,
      email: user.email,
      role: "ADMIN",
      name: user.name,
      userAgent: request.headers.get("user-agent"),
    });

    return response;
  } catch (error) {
    logger.error("[Force Login] Error", { error: error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
