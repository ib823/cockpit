/**
 * Architecture V3 API - Individual project endpoint
 * GET: Fetch single project
 * PUT: Update project
 * DELETE: Soft delete project
 */

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/nextauth-helpers";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

/**
 * GET /api/architecture/[projectId]
 * Fetch single architecture project
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const project = await prisma.architectureProject.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          {
            collaborators: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
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

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[Architecture API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/architecture/[projectId]
 * Update architecture project
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();

    // Check if user has edit access
    const existing = await prisma.architectureProject.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          {
            collaborators: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "EDITOR"] },
              },
            },
          },
        ],
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found or no edit access" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Prisma.ArchitectureProjectUpdateInput = {
      lastEditedAt: new Date(),
      lastEditedBy: session.user.id,
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.version !== undefined) updateData.version = body.version;
    if (body.businessContext !== undefined) updateData.businessContext = body.businessContext as Prisma.InputJsonValue;
    if (body.currentLandscape !== undefined) updateData.currentLandscape = body.currentLandscape as Prisma.InputJsonValue;
    if (body.proposedSolution !== undefined) updateData.proposedSolution = body.proposedSolution as Prisma.InputJsonValue;
    if (body.diagramSettings !== undefined) updateData.diagramSettings = body.diagramSettings as Prisma.InputJsonValue;

    // Update project
    const project = await prisma.architectureProject.update({
      where: { id: projectId },
      data: updateData,
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
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

    // Create version snapshot if requested
    if (body.createVersion) {
      const latestVersion = existing.versions[0];
      const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      await prisma.architectureProjectVersion.create({
        data: {
          projectId: project.id,
          versionNumber: nextVersionNumber,
          name: body.versionName || `Version ${nextVersionNumber}`,
          description: body.versionDescription || "Auto-saved version",
          businessContext: project.businessContext as Prisma.InputJsonValue,
          currentLandscape: project.currentLandscape as Prisma.InputJsonValue,
          proposedSolution: project.proposedSolution as Prisma.InputJsonValue,
          diagramSettings: project.diagramSettings as Prisma.InputJsonValue,
          createdBy: session.user.id,
        },
      });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[Architecture API] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/architecture/[projectId]
 * Soft delete project
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if user is owner
    const existing = await prisma.architectureProject.findFirst({
      where: {
        id: projectId,
        userId: session.user.id, // Only owner can delete
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found or not owner" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.architectureProject.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Architecture API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
