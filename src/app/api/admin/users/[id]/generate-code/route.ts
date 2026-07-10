import { prisma } from "@/lib/db";
import { randomUUID, randomBytes, randomInt } from "crypto";
import { withAdmin } from "@/lib/auth/with-auth";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// Generate cryptographically secure 6-digit code
function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

// Generate secure magic token
function generateMagicToken(): string {
  return randomBytes(32).toString("hex");
}

export const POST = withAdmin<{ params: Promise<{ id: string }> }>(
  async (_req, auth, { params }) => {
    try {
      const { id: userId } = await params;

      // Find the user
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }

      // Generate new 6-digit code
      const code = generateCode();
      const tokenHash = await hash(code, 12);
      const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update or create email approval
      await prisma.emailApproval.upsert({
        where: { email: user.email },
        update: {
          tokenHash,
          tokenExpiresAt,
          approvedByUserId: auth.userId,
          usedAt: null,
          codeSent: false,
        },
        create: {
          email: user.email,
          tokenHash,
          tokenExpiresAt,
          approvedByUserId: auth.userId,
          codeSent: false,
        },
      });

      // Generate magic token for instant login
      const magicToken = generateMagicToken();
      const magicTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.magic_tokens.create({
        data: {
          id: randomUUID(),
          email: user.email,
          token: magicToken,
          expiresAt: magicTokenExpiry,
        },
      });

      // Generate URLs
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const magicUrl = `${baseUrl}/login?token=${magicToken}`;
      const registrationUrl = `${baseUrl}/login?email=${encodeURIComponent(user.email)}`;

      return NextResponse.json({
        ok: true,
        code,
        email: user.email,
        userName: user.name,
        magicUrl,
        registrationUrl,
        codeExpiry: "7 days",
        magicLinkExpiry: "24 hours",
        instructions: [
          "Share one of the following with the user:",
          `1. 6-digit code: ${code} (valid for 7 days)`,
          `2. Magic link: ${magicUrl} (valid for 24 hours)`,
          `3. Registration URL: ${registrationUrl}`,
        ].join("\n"),
      });
    } catch (e: unknown) {
      logger.error("generate-code error", { error: e });
      return NextResponse.json({ ok: false, error: "Failed to generate code" }, { status: 500 });
    }
  }
);
