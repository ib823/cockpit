import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/with-auth";
import { prisma, withRetry } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/stats
 *
 * Returns admin dashboard statistics:
 * - Total users count
 * - Active projects count (APPROVED status)
 * - Proposals count (DRAFT + IN_REVIEW status)
 */
export const GET = withAdmin(async () => {
  try {
    // Fetch statistics in parallel with retry logic for connection errors
    const [totalUsers, activeProjects, proposals] = await withRetry(() =>
      Promise.all([
        prisma.users.count(),
        prisma.projects.count({ where: { status: "APPROVED" } }),
        prisma.projects.count({ where: { status: { in: ["DRAFT", "IN_REVIEW"] } } }),
      ])
    );

    return NextResponse.json({ totalUsers, activeProjects, proposals });
  } catch (error) {
    logger.error("[Admin Stats] Error fetching statistics", { error });
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
});
