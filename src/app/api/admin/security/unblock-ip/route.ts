import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/with-auth";
import { unblockIP } from "@/lib/security/ip-blocker";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * POST /api/admin/security/unblock-ip
 *
 * Unblocks an IP address
 * Requires ADMIN role
 */
export const POST = withAdmin(async (req) => {
  try {
    const { ip } = await req.json();

    if (!ip) {
      return NextResponse.json({ ok: false, message: "IP address required" }, { status: 400 });
    }

    await unblockIP(ip);

    return NextResponse.json({ ok: true, message: `IP ${ip} has been unblocked` });
  } catch (error) {
    logger.error("[UNBLOCK IP API] Error", { error });
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
});
