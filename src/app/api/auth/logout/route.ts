import { NextResponse } from "next/server";
import { destroyAuthSession } from "@/lib/nextauth-helpers";

export const runtime = "nodejs";

/**
 * POST /api/auth/logout
 * SECURITY: Proper logout with server-side session revocation
 * Supports both passkey and magic link sessions
 */
export async function POST() {
  try {
    // SECURITY: Destroy NextAuth session
    await destroyAuthSession();

    const response = NextResponse.json({
      ok: true,
      message: "Logged out successfully",
    });

    // CRITICAL: Prevent caching of logout response
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Clear session cookie explicitly
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Logout failed",
      },
      { status: 500 }
    );
  }
}
