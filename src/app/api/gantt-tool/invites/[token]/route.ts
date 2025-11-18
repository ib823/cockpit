/**
 * Gantt Tool API - Accept Project Invite
 *
 * GET  /api/gantt-tool/invites/[token] - Get invite details
 * POST /api/gantt-tool/invites/[token] - Accept invite
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Get invite details (for preview before accepting)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.ganttProjectInvite.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
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

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if invite has expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    // Check if invite has already been accepted
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invite has already been accepted" }, { status: 410 });
    }

    return NextResponse.json({
      project: {
        id: invite.project.id,
        name: invite.project.name,
        description: invite.project.description,
        owner: invite.project.user,
      },
      role: invite.role,
      invitedBy: invite.creator,
      invitedEmail: invite.email,
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("[API] Failed to fetch invite:", error);
    return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 });
  }
}

// POST - Accept invite and add user as collaborator
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    // Find the invite
    const invite = await prisma.ganttProjectInvite.findUnique({
      where: { token },
      include: {
        project: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if invite has expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    // Check if invite has already been accepted
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invite has already been accepted" }, { status: 410 });
    }

    // Verify email matches (case-insensitive)
    if (!session.user.email || session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: "This invite was sent to a different email address",
          invitedEmail: invite.email,
          currentEmail: session.user.email,
        },
        { status: 403 }
      );
    }

    // Check if user is already a collaborator
    const existingCollaborator = await prisma.ganttProjectCollaborator.findUnique({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: session.user.id,
        },
      },
    });

    if (existingCollaborator) {
      return NextResponse.json(
        { error: "You are already a collaborator on this project" },
        { status: 409 }
      );
    }

    // Accept invite and create collaborator in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark invite as accepted
      await tx.ganttProjectInvite.update({
        where: { id: invite.id },
        data: {
          acceptedAt: new Date(),
          acceptedBy: session.user.id,
        },
      });

      // Create collaborator
      const collaborator = await tx.ganttProjectCollaborator.create({
        data: {
          projectId: invite.projectId,
          userId: session.user.id,
          role: invite.role,
          invitedBy: invite.createdBy,
          acceptedAt: new Date(),
        },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: "CREATE",
          entity: "gantt_project_collaborator",
          entityId: collaborator.id,
          changes: {
            projectId: invite.projectId,
            role: invite.role,
            inviteToken: token,
          },
        },
      });

      return { collaborator, project: invite.project };
    });

    return NextResponse.json({
      success: true,
      project: {
        id: result.project.id,
        name: result.project.name,
      },
      role: result.collaborator.role,
      message: "Successfully joined the project",
    });
  } catch (error) {
    console.error("[API] Failed to accept invite:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
