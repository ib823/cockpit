/**
 * Gantt Tool API - Data Recovery Endpoint
 *
 * PATCH /api/gantt-tool/projects/[projectId]/recover
 *
 * Recovers specific resource fields from IndexedDB that may have been lost.
 * Only updates the specified fields, preserving all other data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RecoverResourceSchema = z.object({
  id: z.string(),
  companyName: z.string().nullable().optional(),
  managerResourceId: z.string().nullable().optional(),
});

const RecoverySchema = z.object({
  resources: z.array(RecoverResourceSchema).optional(),
});

async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.ganttProject.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      OR: [
        { userId: userId },
        {
          collaborators: {
            some: {
              userId: userId,
              role: { in: ["EDITOR", "OWNER"] },
            },
          },
        },
      ],
    },
  });
  return project !== null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const hasAccess = await checkProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = RecoverySchema.parse(body);

    const results = {
      resourcesUpdated: 0,
      errors: [] as string[],
    };

    // Recover resource data
    if (data.resources && data.resources.length > 0) {
      for (const resourceData of data.resources) {
        try {
          // Only update fields that are explicitly provided
          const updateData: Record<string, any> = {};

          if (resourceData.companyName !== undefined) {
            updateData.companyName = resourceData.companyName;
          }
          if (resourceData.managerResourceId !== undefined) {
            updateData.managerResourceId = resourceData.managerResourceId;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.ganttResource.update({
              where: {
                id: resourceData.id,
                projectId: projectId,
              },
              data: updateData,
            });
            results.resourcesUpdated++;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          results.errors.push(`Resource ${resourceData.id}: ${errorMsg}`);
        }
      }
    }

    // Update project timestamp
    await prisma.ganttProject.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: results.errors.length === 0,
      ...results,
    });
  } catch (error) {
    console.error("[API Recovery] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Recovery failed" },
      { status: 500 }
    );
  }
}
