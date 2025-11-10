/**
 * Dashboard Snapshots API
 * Save and retrieve dashboard states
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/dashboard/snapshots
 * Retrieve user's dashboard snapshots
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Get user ID from email
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch snapshots
    const snapshots = await prisma.dashboardSnapshot.findMany({
      where: {
        userId: user.id,
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
    console.error("Error fetching snapshots:", error);
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/snapshots
 * Create a new dashboard snapshot
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, description, costBreakdown, margins, revenue, metrics, isDefault } =
      body;

    // Validation
    if (!projectId || !name || !costBreakdown || !margins || revenue === undefined) {
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

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.dashboardSnapshot.updateMany({
        where: {
          userId: user.id,
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
        userId: user.id,
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
    console.error("Error creating snapshot:", error);
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
}
