/**
 * Gantt Tool API - Project Sharing
 *
 * POST   /api/gantt-tool/projects/[projectId]/share - Create invite link
 * GET    /api/gantt-tool/projects/[projectId]/share - List invites and collaborators
 * DELETE /api/gantt-tool/projects/[projectId]/share/[inviteId] - Cancel invite
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const ShareProjectSchema = z.object({
  email: z.string().email(),
  role: z.enum(["VIEWER", "EDITOR", "OWNER"]).default("VIEWER"),
  expiresInDays: z.number().min(1).max(365).optional(),
});

// POST - Create invite link for a project
export const POST = withAuth<{ params: Promise<{ projectId: string }> }>(
  async (request, auth, { params }) => {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const validatedData = ShareProjectSchema.parse(body);

    // Check if user owns the project or has OWNER permission
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
      include: {
        collaborators: {
          where: {
            user: {
              email: validatedData.email,
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or insufficient permissions" },
        { status: 404 }
      );
    }

    // Check if user is already a collaborator
    if (project.collaborators.length > 0) {
      return NextResponse.json(
        { error: "User is already a collaborator on this project" },
        { status: 409 }
      );
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await prisma.ganttProjectInvite.findFirst({
      where: {
        projectId,
        email: validatedData.email,
        acceptedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An active invite already exists for this email" },
        { status: 409 }
      );
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiry date
    const expiresAt = validatedData.expiresInDays
      ? new Date(Date.now() + validatedData.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create invite
    const invite = await prisma.ganttProjectInvite.create({
      data: {
        projectId,
        email: validatedData.email,
        token,
        role: validatedData.role,
        expiresAt,
        createdBy: auth.userId,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: auth.userId,
        action: "SHARE",
        entity: "gantt_project_invite",
        entityId: invite.id,
        changes: {
          email: validatedData.email,
          role: validatedData.role,
          projectId,
        },
      },
    });

    // Generate shareable link
    const shareLink = `${request.nextUrl.origin}/gantt-tool/invite/${token}`;

    return NextResponse.json(
      {
        success: true,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          shareLink,
          expiresAt: invite.expiresAt?.toISOString() || null,
          createdAt: invite.createdAt.toISOString(),
        },
        message: "Invite created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("[API] Failed to create project invite", { error: error });
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
});

// GET - List all invites and collaborators for a project
export const GET = withAuth<{ params: Promise<{ projectId: string }> }>(
  async (_request, auth, { params }) => {
  try {
    const { projectId } = await params;

    // Check if user has access to the project
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
              },
            },
          },
        ],
      },
      include: {
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            inviter: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        invites: {
          where: {
            acceptedAt: null,
          },
          include: {
            creator: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      owner: project.user,
      collaborators: project.collaborators.map((c) => ({
        id: c.id,
        user: c.user,
        role: c.role,
        invitedBy: c.inviter,
        invitedAt: c.invitedAt.toISOString(),
        acceptedAt: c.acceptedAt?.toISOString() || null,
        lastAccessAt: c.lastAccessAt?.toISOString() || null,
      })),
      pendingInvites: project.invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        createdBy: i.creator,
        createdAt: i.createdAt.toISOString(),
        expiresAt: i.expiresAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    logger.error("[API] Failed to fetch project sharing info", { error: error });
    return NextResponse.json({ error: "Failed to fetch sharing information" }, { status: 500 });
  }
});
