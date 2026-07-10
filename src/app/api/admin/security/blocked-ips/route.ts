import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/with-auth";
import { getBlockedIPs } from "@/lib/security/ip-blocker";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security/blocked-ips
 *
 * Returns list of all currently blocked IPs
 * Requires ADMIN role
 */
export const GET = withAdmin(async () => {
  try {
    const blockedIPs = await getBlockedIPs();
    return NextResponse.json({ ok: true, blockedIPs, count: blockedIPs.length });
  } catch (error) {
    logger.error("[BLOCKED IPS API] Error", { error });
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
});
