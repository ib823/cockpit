import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = withAuth(async (_req, auth) => {
  const startTime = performance.now(); // Performance monitoring

  try {
    // Performance: Track query start time
    const queryStartTime = performance.now();

    // Count timeline projects (Gantt) created by user
    const timelineProjects = await prisma.ganttProject.count({
      where: {
        userId: auth.userId,
        deletedAt: null, // Exclude soft-deleted projects
      },
    });

    // Count architecture diagrams (placeholder - update when architecture DB exists)
    // TODO: Replace with actual architecture diagram count when implemented
    const architectureDiagrams = 0;

    // Count resources across all of this user's projects. Counted in the
    // database rather than by loading every GanttResource row and taking
    // `.length`, which is what this did before.
    const projectsWithResources = await prisma.ganttProject.findMany({
      where: {
        userId: auth.userId,
        deletedAt: null,
      },
      select: {
        _count: { select: { resources: true } },
      },
    });

    const totalResources = projectsWithResources.reduce(
      (sum, project) => sum + project._count.resources,
      0
    );

    const queryDuration = performance.now() - queryStartTime;

    // Analytics: Log dashboard stats view (non-blocking)
    prisma.auditEvent
      .create({
        data: {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: auth.userId,
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
        logger.warn("[Dashboard Stats] Analytics logging failed", { error: err });
        // Don't fail the request if analytics fails
      });

    const totalDuration = performance.now() - startTime;

    // Performance: Log slow queries (>1000ms)
    if (totalDuration > 1000) {
      logger.warn(
        `[Dashboard Stats] Slow query detected: ${Math.round(totalDuration)}ms for user ${auth.userId}`
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
    logger.error("[Dashboard Stats] Error", { error: error });
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
  // NOTE: no $disconnect here. This route used to tear down the pool in a
  // `finally` on every request, which on serverless meant a cold connection per
  // invocation against a `connection_limit=5` pooler. The shared client in
  // @/lib/db owns its lifecycle.
});
