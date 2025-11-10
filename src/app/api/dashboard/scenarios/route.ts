/**
 * Dashboard Scenarios API
 * Manage what-if scenarios
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/dashboard/scenarios
 * Retrieve scenarios for a project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    // Get user ID
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch scenarios
    const scenarios = await prisma.dashboardScenario.findMany({
      where: {
        projectId,
        userId: user.id,
      },
      orderBy: {
        isBaseline: "desc", // Baseline first
      },
    });

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json({ error: "Failed to fetch scenarios" }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/scenarios
 * Create a new scenario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get user ID
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If setting as baseline, unset other baselines
    if (isBaseline) {
      await prisma.dashboardScenario.updateMany({
        where: {
          userId: user.id,
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
        userId: user.id,
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
    console.error("Error creating scenario:", error);
    return NextResponse.json({ error: "Failed to create scenario" }, { status: 500 });
  }
}

/**
 * DELETE /api/dashboard/scenarios/[id]
 * Delete a scenario
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Scenario ID required" }, { status: 400 });
    }

    // Get user ID
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete scenario (only if user owns it)
    const deleted = await prisma.dashboardScenario.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Scenario not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
  }
}
