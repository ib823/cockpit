/**
 * Gantt Tool API - Collaborator Management
 *
 * DELETE /api/gantt-tool/projects/[projectId]/collaborators/[userId] - Remove collaborator
 * PATCH  /api/gantt-tool/projects/[projectId]/collaborators/[userId] - Update collaborator role
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

const UpdateCollaboratorSchema = z.object({
  role: z.enum(["VIEWER", "EDITOR", "OWNER"]),
});

// DELETE - Remove a collaborator from a project
export const DELETE = withAuth<{ params: Promise<{ projectId: string; userId: string }> }>(
  async (_request, auth, { params }) => {
  try {
    const { projectId, userId } = await params;

    // Check if user is the owner or has OWNER permission
    const project = await prisma.ganttProject.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        OR: [
          { userId: auth.userId },
          {
            collaborators: {
              some: {
                userId: auth.userId,
                role: "OWNER",
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or insufficient permissions" },
        { status: 404 }
      );
    }

    // Cannot remove the project owner
    if (project.userId === userId) {
      return NextResponse.json(
        { error: "Cannot remove the project owner" },
        { status: 400 }
      );
    }

    // Delete the collaborator
    const deleted = await prisma.ganttProjectCollaborator.deleteMany({
      where: {
        projectId,
        userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
    }

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: auth.userId,
        action: "DELETE",
        entity: "gantt_project_collaborator",
        entityId: `${projectId}_${userId}`,
        changes: {
          projectId,
          removedUserId: userId,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error("[API] Failed to remove collaborator", { error: error });
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 });
  }
});

// PATCH - Update collaborator role
export const PATCH = withAuth<{ params: Promise<{ projectId: string; userId: string }> }>(
  async (request, auth, { params }) => {
  try {
    const { projectId, userId } = await params;
    const body = await request.json();
    const validatedData = UpdateCollaboratorSchema.parse(body);

    // Check if user is the owner or has OWNER permission
    const project = await prisma.ganttProject.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        OR: [
          { userId: auth.userId },
          {
            collaborators: {
              some: {
                userId: auth.userId,
                role: "OWNER",
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or insufficient permissions" },
        { status: 404 }
      );
    }

    // Update the collaborator role
    const updated = await prisma.ganttProjectCollaborator.updateMany({
      where: {
        projectId,
        userId,
      },
      data: {
        role: validatedData.role,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
    }

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: auth.userId,
        action: "UPDATE",
        entity: "gantt_project_collaborator",
        entityId: `${projectId}_${userId}`,
        changes: {
          projectId,
          updatedUserId: userId,
          newRole: validatedData.role,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("[API] Failed to update collaborator", { error: error });
    return NextResponse.json({ error: "Failed to update collaborator" }, { status: 500 });
  }
});
