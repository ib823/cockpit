import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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
    console.error("[GEO ANALYSIS API] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
