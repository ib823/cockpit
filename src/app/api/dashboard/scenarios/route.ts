/**
 * Dashboard Scenarios API
 * Manage what-if scenarios
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/dashboard/scenarios
 * Retrieve scenarios for a project
 */
export const GET = withAuth(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    // Fetch scenarios
    const scenarios = await prisma.dashboardScenario.findMany({
      where: {
        projectId,
        userId: auth.userId,
      },
      orderBy: {
        isBaseline: "desc", // Baseline first
      },
    });

    return NextResponse.json({ scenarios });
  } catch (error) {
    logger.error("Error fetching scenarios", { error: error });
    return NextResponse.json({ error: "Failed to fetch scenarios" }, { status: 500 });
  }
});

/**
 * POST /api/dashboard/scenarios
 * Create a new scenario
 */
export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const {
      projectId,
      name,
      description,
      projectData,
      revenue,
      assumptions,
      costDelta,
      marginDelta,
      timeDelta,
      isBaseline,
    } = body;

    // Validation
    if (!projectId || !name || !projectData || revenue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If setting as baseline, unset other baselines
    if (isBaseline) {
      await prisma.dashboardScenario.updateMany({
        where: {
          userId: auth.userId,
          projectId,
          isBaseline: true,
        },
        data: {
          isBaseline: false,
        },
      });
    }

    // Create scenario
    const scenario = await prisma.dashboardScenario.create({
      data: {
        projectId,
        userId: auth.userId,
        name,
        description,
        projectData,
        revenue,
        assumptions: assumptions || {},
        costDelta,
        marginDelta,
        timeDelta,
        isBaseline: isBaseline || false,
      },
    });

    return NextResponse.json({ scenario }, { status: 201 });
  } catch (error) {
    logger.error("Error creating scenario", { error: error });
    return NextResponse.json({ error: "Failed to create scenario" }, { status: 500 });
  }
});

/**
 * DELETE /api/dashboard/scenarios/[id]
 * Delete a scenario
 */
export const DELETE = withAuth(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Scenario ID required" }, { status: 400 });
    }

    // Delete scenario (only if user owns it)
    const deleted = await prisma.dashboardScenario.deleteMany({
      where: {
        id,
        userId: auth.userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Scenario not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting scenario", { error: error });
    return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
  }
});
