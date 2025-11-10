import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getBlockedIPs } from "@/lib/security/ip-blocker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security/blocked-ips
 *
 * Returns list of all currently blocked IPs
 * Requires ADMIN role
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const blockedIPs = await getBlockedIPs();

    return NextResponse.json({
      ok: true,
      blockedIPs,
      count: blockedIPs.length,
    });
  } catch (error) {
    console.error("[BLOCKED IPS API] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
