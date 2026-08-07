import { prisma } from "@/lib/db";
import { establishSession } from "@/lib/auth/session";
import { compare } from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { accessCodeLimiter } from "@/lib/server-rate-limiter";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.ENABLE_MAGIC_LINKS !== "true") {
    return NextResponse.json({ ok: false, message: "Disabled" }, { status: 404 });
  }
  try {
    let email: string | undefined;
    let code: string | undefined;
    try {
      const body = await req.json();
      email = body.email;
      code = body.code;
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid request body" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!email || !code) {
      return NextResponse.json(
        { ok: false, message: "Email and code required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Accounts are stored lowercase (see finish-register); every other auth
    // flow normalises before lookup and this one did not.
    email = email.toLowerCase();

    // SECURITY: access codes are 6 digits and live for 7 days. The middleware's
    // general limiter is keyed by IP and so is parallelisable across sources;
    // this per-account limit is what actually bounds a brute force. Checked
    // before any DB read so it also blunts enumeration timing.
    const rateLimit = await accessCodeLimiter.check(email);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          ok: false,
          message: `Too many attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter ?? 900),
          },
        }
      );
    }

    // Check if user exists and is admin
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, message: "Invalid credentials" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check access expiry (unless exception)
    if (!user.exception && user.accessExpiresAt <= new Date()) {
      return NextResponse.json(
        { ok: false, message: "Access expired" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify code
    const approval = await prisma.emailApproval.findUnique({ where: { email } });
    if (!approval || approval.usedAt || approval.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired code" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const codeValid = await compare(code, approval.tokenHash);
    if (!codeValid) {
      return NextResponse.json(
        { ok: false, message: "Invalid code" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date();

    // Mark code as used and update login timestamps
    await prisma.$transaction([
      prisma.emailApproval.update({
        where: { email },
        data: { usedAt: now },
      }),
      prisma.users.update({
        where: { id: user.id },
        data: {
          lastLoginAt: now,
          firstLoginAt: user.firstLoginAt ?? now,
        },
      }),
      prisma.auditEvent.create({
        data: { id: randomUUID(), userId: user.id, type: "admin_login" },
      }),
    ]);

    // Only ADMIN accounts reach this point (verified above).
    const response = NextResponse.json({ ok: true });

    await establishSession(response, {
      userId: user.id,
      email: user.email,
      role: "ADMIN",
      name: user.name,
      maxConcurrentSessions: user.maxConcurrentSessions,
    });

    return response;
  } catch (e) {
    logger.error("admin-login error", { error: e });
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
