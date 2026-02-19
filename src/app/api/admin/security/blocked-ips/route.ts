import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/nextauth-helpers";
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
    // Check admin authorization
    await requireAdmin();

    const blockedIPs = await getBlockedIPs();

    return NextResponse.json({
      ok: true,
      blockedIPs,
      count: blockedIPs.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "unauthorized") {
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "forbidden") {
        return NextResponse.json(
          { ok: false, message: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("[BLOCKED IPS API] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
