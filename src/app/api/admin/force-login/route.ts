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
import { randomUUID } from "crypto";
import { NextResponse, NextRequest } from "next/server";

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

    // Create session token
    const sessionToken = randomUUID();
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create session in database
    await prisma.sessions.create({
      data: {
        id: sessionId,
        sessionToken,
        userId: user.id,
        expires: expiresAt,
      },
    });

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        firstLoginAt: user.firstLoginAt ?? new Date(),
      },
    });

    // Set session cookie and redirect to admin
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const response = NextResponse.redirect(new URL("/admin", `${protocol}://${host}`));

    response.cookies.set({
      name: "next-auth.session-token",
      value: sessionToken,
      httpOnly: true,
      secure: protocol === "https",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("[Force Login] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
