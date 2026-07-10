/**
 * Dashboard Snapshots API
 * Save and retrieve dashboard states
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/dashboard/snapshots
 * Retrieve user's dashboard snapshots
 */
export const GET = withAuth(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Fetch snapshots
    const snapshots = await prisma.dashboardSnapshot.findMany({
      where: {
        userId: auth.userId,
        ...(projectId && { projectId }),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        projectId: true,
        name: true,
        description: true,
        revenue: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ snapshots });
  } catch (error) {
    logger.error("Error fetching snapshots", { error: error });
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
});

/**
 * POST /api/dashboard/snapshots
 * Create a new dashboard snapshot
 */
export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const { projectId, name, description, costBreakdown, margins, revenue, metrics, isDefault } =
      body;

    // Validation
    if (!projectId || !name || !costBreakdown || !margins || revenue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.dashboardSnapshot.updateMany({
        where: {
          userId: auth.userId,
          projectId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create snapshot
    const snapshot = await prisma.dashboardSnapshot.create({
      data: {
        projectId,
        userId: auth.userId,
        name,
        description,
        costBreakdown,
        margins,
        revenue,
        metrics: metrics || {},
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    logger.error("Error creating snapshot", { error: error });
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
});
