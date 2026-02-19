import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { getRecentFailedAttempts } from "@/lib/monitoring/auth-metrics";
import { getFailureGeoDistribution } from "@/lib/security/geolocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security/geo-analysis
 *
 * Returns geographic analysis of failed authentication attempts
 * Requires ADMIN role
 */
export async function GET(req: Request) {
  try {
    // Check admin authorization
    await requireAdmin();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const minutes = parseInt(searchParams.get("minutes") || "60", 10);

    // Get recent failures
    const failures = await getRecentFailedAttempts(minutes, 500);

    // Get geographic distribution
    const distribution = await getFailureGeoDistribution(failures);

    // Calculate statistics
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
    console.error("[GEO ANALYSIS API] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
