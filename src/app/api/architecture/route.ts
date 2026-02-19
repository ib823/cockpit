/**
 * Architecture V3 API - Main endpoint
 * GET: List all architecture projects
 * POST: Create new architecture project
 */

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/nextauth-helpers";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

/**
 * GET /api/architecture
 * List all architecture projects for current user
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's architecture projects (not soft-deleted)
    const projects = await prisma.architectureProject.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1, // Only latest version
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[Architecture API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/architecture
 * Create new architecture project
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create project with initial empty data
    const project = await prisma.architectureProject.create({
      data: {
        userId: user.id,
        name: body.name,
        description: body.description || null,
        version: body.version || "1.0",
        businessContext: body.businessContext || {
          entities: [],
          actors: [],
          capabilities: [],
          painPoints: "",
        },
        currentLandscape: body.currentLandscape || {
          systems: [],
          integrations: [],
          externalSystems: [],
        },
        proposedSolution: body.proposedSolution || {
          phases: [],
          systems: [],
          integrations: [],
          retainedExternalSystems: [],
        },
        diagramSettings: body.diagramSettings || {
          visualStyle: "bold",
          actorDisplay: "cards",
          layoutMode: "swim-lanes",
          showLegend: true,
          showIcons: true,
        },
        lastEditedBy: user.id,
      },
      include: {
        versions: true,
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Create initial version
    await prisma.architectureProjectVersion.create({
      data: {
        projectId: project.id,
        versionNumber: 1,
        name: "Initial version",
        description: "Project created",
        businessContext: project.businessContext as Prisma.InputJsonValue,
        currentLandscape: project.currentLandscape as Prisma.InputJsonValue,
        proposedSolution: project.proposedSolution as Prisma.InputJsonValue,
        diagramSettings: project.diagramSettings as Prisma.InputJsonValue,
        createdBy: user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[Architecture API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
