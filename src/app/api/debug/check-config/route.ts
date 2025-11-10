import { NextRequest, NextResponse } from "next/server";
import { rpID, origin } from "@/lib/webauthn";

/**
 * Debug endpoint to check WebAuthn configuration in production
 *
 * Usage: GET /api/debug/check-config
 *
 * Shows the actual WebAuthn configuration being used by the server.
 * This helps diagnose RP ID and Origin mismatch issues.
 */
export async function GET(request: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

    return NextResponse.json(
      {
        environment: {
          NODE_ENV: process.env.NODE_ENV || "undefined",
          isProduction,
        },
        webauthn: {
          rpID: rpID,
          origin: origin,
          rpIdFromEnv: process.env.WEBAUTHN_RP_ID || "NOT SET",
          originFromEnv: process.env.WEBAUTHN_ORIGIN || "NOT SET",
        },
        auth: {
          nextAuthUrl: process.env.NEXTAUTH_URL || "NOT SET",
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        },
        storage: {
          hasRedis,
          redisUrl: hasRedis ? process.env.UPSTASH_REDIS_REST_URL : "NOT SET",
        },
        request: {
          host: request.headers.get("host"),
          protocol: request.headers.get("x-forwarded-proto") || "http",
          userAgent: request.headers.get("user-agent"),
        },
        diagnosis: {
          configComplete: isProduction
            ? !!process.env.WEBAUTHN_RP_ID && !!process.env.WEBAUTHN_ORIGIN
            : true,
          warnings: [
            ...(isProduction && !process.env.WEBAUTHN_RP_ID
              ? ["WEBAUTHN_RP_ID not set in production - passkeys will fail"]
              : []),
            ...(isProduction && !process.env.WEBAUTHN_ORIGIN
              ? ["WEBAUTHN_ORIGIN not set in production - passkeys will fail"]
              : []),
            ...(!hasRedis
              ? ["Redis not configured - using in-memory storage (not recommended for production)"]
              : []),
            ...(!process.env.NEXTAUTH_SECRET
              ? ["NEXTAUTH_SECRET not set - sessions will fail"]
              : []),
          ],
        },
        instructions: {
          fixWebAuthn:
            isProduction && (!process.env.WEBAUTHN_RP_ID || !process.env.WEBAUTHN_ORIGIN)
              ? [
                  "Go to your hosting dashboard (Vercel, Railway, etc.)",
                  `Set WEBAUTHN_RP_ID to: ${request.headers.get("host")}`,
                  `Set WEBAUTHN_ORIGIN to: ${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host")}`,
                  "Redeploy your application",
                  "Clear and re-register any existing passkeys",
                ]
              : null,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Config check failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
