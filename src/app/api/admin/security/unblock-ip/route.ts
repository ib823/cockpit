import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { unblockIP } from "@/lib/security/ip-blocker";

export const runtime = "nodejs";

/**
 * POST /api/admin/security/unblock-ip
 *
 * Unblocks an IP address
 * Requires ADMIN role
 */
export async function POST(req: Request) {
  try {
    // Check admin authorization
    await requireAdmin();

    const { ip } = await req.json();

    if (!ip) {
      return NextResponse.json({ ok: false, message: "IP address required" }, { status: 400 });
    }

    await unblockIP(ip);

    return NextResponse.json({
      ok: true,
      message: `IP ${ip} has been unblocked`,
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
    console.error("[UNBLOCK IP API] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
