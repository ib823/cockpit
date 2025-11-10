import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const session = await getServerSession(authConfig);

    // Check admin authorization
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    // Fetch statistics in parallel for better performance
    const [totalUsers, activeProjects, proposals] = await Promise.all([
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
    ]);

    return NextResponse.json({
      totalUsers,
      activeProjects,
      proposals,
    });
  } catch (error) {
    console.error("[Admin Stats] Error fetching statistics:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
