/**
 * Gantt Tool API - Real-time Presence Tracking
 *
 * POST /api/gantt-tool/projects/[projectId]/presence - Update user presence (heartbeat)
 * GET  /api/gantt-tool/projects/[projectId]/presence - Get active users
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdatePresenceSchema = z.object({
  isEditing: z.boolean().optional(),
  currentFocus: z.string().optional(), // e.g., "task_123", "phase_456"
});

// POST - Update presence (heartbeat from client every 30s)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const validatedData = UpdatePresenceSchema.parse(body);

    // Check if user has access to this project
    const hasAccess = await prisma.ganttProject.findFirst({
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
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Upsert presence session
    const activeSession = await prisma.ganttProjectActiveSession.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
      update: {
        lastSeenAt: new Date(),
        isEditing: validatedData.isEditing ?? undefined,
        currentFocus: validatedData.currentFocus ?? undefined,
      },
      create: {
        projectId,
        userId: session.user.id,
        isEditing: validatedData.isEditing ?? false,
        currentFocus: validatedData.currentFocus,
      },
    });

    return NextResponse.json({ success: true, session: activeSession });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[API] Failed to update presence:", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
  }
}

// GET - Get all active users in this project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if user has access to this project
    const hasAccess = await prisma.ganttProject.findFirst({
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
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Clean up stale sessions (older than 5 minutes)
    await prisma.ganttProjectActiveSession.deleteMany({
      where: {
        projectId,
        lastSeenAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });

    // Get active sessions
    const activeSessions = await prisma.ganttProjectActiveSession.findMany({
      where: {
        projectId,
        lastSeenAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Active in last 5 minutes
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        lastSeenAt: "desc",
      },
    });

    return NextResponse.json({
      activeSessions: activeSessions.map((s) => ({
        ...s,
        lastSeenAt: s.lastSeenAt.toISOString(),
        isSelf: s.userId === session.user.id,
      })),
      totalActive: activeSessions.length,
    });
  } catch (error) {
    console.error("[API] Failed to get active sessions:", error);
    return NextResponse.json({ error: "Failed to get active sessions" }, { status: 500 });
  }
}

// DELETE - Remove presence (user left the project)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    await prisma.ganttProjectActiveSession.deleteMany({
      where: {
        projectId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to remove presence:", error);
    return NextResponse.json({ error: "Failed to remove presence" }, { status: 500 });
  }
}
