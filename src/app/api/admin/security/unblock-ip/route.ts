import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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
    console.error("[UNBLOCK IP API] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
