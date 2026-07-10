import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/with-auth";
import { getRecentFailedAttempts } from "@/lib/monitoring/auth-metrics";
import { getFailureGeoDistribution } from "@/lib/security/geolocation";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security/geo-analysis
 *
 * Returns geographic analysis of failed authentication attempts
 * Requires ADMIN role
 */
export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const minutes = parseInt(searchParams.get("minutes") || "60", 10);

    const failures = await getRecentFailedAttempts(minutes, 500);
    const distribution = await getFailureGeoDistribution(failures);

    const totalCountries = distribution.length;
    const highRiskCountries = distribution.filter((d) => d.risk === "high").length;
    const totalIPs = new Set(failures.map((f) => f.ipAddress).filter(Boolean)).size;

    return NextResponse.json({
      ok: true,
      data: {
        distribution,
        statistics: {
          totalFailures: failures.length,
          totalCountries,
          highRiskCountries,
          totalIPs,
          minutes,
        },
      },
    });
  } catch (error) {
    logger.error("[GEO ANALYSIS API] Error", { error });
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
});
