import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const startTime = performance.now(); // Performance monitoring

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from session
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Performance: Track query start time
    const queryStartTime = performance.now();

    // Count timeline projects (Gantt) created by user
    const timelineProjects = await prisma.ganttProject.count({
      where: {
        userId: user.id,
        deletedAt: null, // Exclude soft-deleted projects
      },
    });

    // Count architecture diagrams (placeholder - update when architecture DB exists)
    // TODO: Replace with actual architecture diagram count when implemented
    const architectureDiagrams = 0;

    // Count total unique resources across all projects
    const projectsWithResources = await prisma.ganttProject.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      select: {
        resources: true,
      },
    });

    // Calculate total unique resources
    const allResources = projectsWithResources.flatMap((project) => project.resources || []);
    const totalResources = allResources.length;

    const queryDuration = performance.now() - queryStartTime;

    // Analytics: Log dashboard stats view (non-blocking)
    prisma.auditEvent
      .create({
        data: {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          type: "DASHBOARD_STATS_VIEW",
          meta: {
            timelineProjects,
            architectureDiagrams,
            totalResources,
            queryDurationMs: Math.round(queryDuration),
          },
        },
      })
      .catch((err) => {
        console.warn("[Dashboard Stats] Analytics logging failed:", err);
        // Don't fail the request if analytics fails
      });

    const totalDuration = performance.now() - startTime;

    // Performance: Log slow queries (>1000ms)
    if (totalDuration > 1000) {
      console.warn(
        `[Dashboard Stats] Slow query detected: ${Math.round(totalDuration)}ms for user ${user.id}`
      );
    }

    return NextResponse.json({
      timelineProjects,
      architectureDiagrams,
      totalResources,
      // Include performance metrics in response (for monitoring)
      _meta: {
        queryDurationMs: Math.round(queryDuration),
        totalDurationMs: Math.round(totalDuration),
      },
    });
  } catch (error) {
    console.error("[Dashboard Stats] Error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
