import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { prisma, withRetry } from "@/lib/db";

/**
 * GET /api/admin/stats
 *
 * Returns admin dashboard statistics:
 * - Total users count
 * - Active projects count (APPROVED status)
 * - Proposals count (DRAFT + IN_REVIEW status)
 */
export async function GET() {
  try {
    // Check admin authorization
    await requireAdmin();

    // Fetch statistics in parallel with retry logic for connection errors
    const [totalUsers, activeProjects, proposals] = await withRetry(() =>
      Promise.all([
        // Total users count
        prisma.users.count(),

        // Active projects (APPROVED status)
        prisma.projects.count({
          where: {
            status: "APPROVED",
          },
        }),

        // Proposals (DRAFT or IN_REVIEW status)
        prisma.projects.count({
          where: {
            status: {
              in: ["DRAFT", "IN_REVIEW"],
            },
          },
        }),
      ])
    );

    return NextResponse.json({
      totalUsers,
      activeProjects,
      proposals,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "forbidden") {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
      }
    }
    console.error("[Admin Stats] Error fetching statistics:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
