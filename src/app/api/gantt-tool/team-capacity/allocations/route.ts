/**
 * Team Capacity API - Weekly Allocations Endpoint (ENHANCED)
 *
 * POST /api/gantt-tool/team-capacity/allocations - Create/update weekly allocations
 * GET /api/gantt-tool/team-capacity/allocations?projectId=xxx - Get allocations for a project
 * DELETE /api/gantt-tool/team-capacity/allocations - Delete allocations
 *
 * ENHANCEMENTS (from new schema):
 * - User-selectable week numbering (PROJECT_RELATIVE, ISO_WEEK, CALENDAR_WEEK)
 * - Mandays field (0.00-5.00) as alternative to allocation percentage
 * - Version tracking with projectVersionId
 * - Integration with ProjectCostingConfig
 *
 * Security: Only project collaborators with EDITOR or OWNER role can modify allocations
 * Performance: Batch operations with composite index (projectId, resourceId, weekStartDate)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/db";
import { z } from "zod";
import { hasAnyProjectRole } from "@/lib/gantt-tool/access-control";
import {
  calculateWeekNumber,
  getWeekEndDate,
} from "@/lib/team-capacity/week-numbering";
import { WeekNumberingType } from "@prisma/client";

export const maxDuration = 30;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AllocationInputSchema = z.object({
  resourceId: z.string().min(1),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  mandays: z.number().min(0).max(5).optional(), // 0.0 to 5.0
  allocationPercent: z.number().min(0).max(100).optional(), // 0 to 100
  weekNumberingType: z.enum(["PROJECT_RELATIVE", "ISO_WEEK", "CALENDAR_WEEK"]).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.mandays !== undefined || data.allocationPercent !== undefined,
  {
    message: "Either mandays or allocationPercent must be provided",
    path: ["mandays"],
  }
);

const CreateAllocationsRequestSchema = z.object({
  projectId: z.string().min(1),
  versionId: z.string().optional(), // Optional, defaults to latest version
  allocations: z.array(AllocationInputSchema).min(1),
});

const DeleteAllocationsRequestSchema = z.object({
  projectId: z.string().min(1),
  allocationIds: z.array(z.string()).min(1).optional(),
  resourceId: z.string().optional(),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================================================
// POST - Create/Update Weekly Allocations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = CreateAllocationsRequestSchema.parse(body);

    // Check project access (EDITOR or OWNER required)
    const hasAccess = await hasAnyProjectRole(
      validatedData.projectId,
      session.user.id,
      ["EDITOR", "OWNER"]
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get project details (for week numbering calculation)
    const project = await withRetry(() =>
      prisma.ganttProject.findUnique({
        where: { id: validatedData.projectId },
        select: {
          id: true,
          startDate: true,
          version: true,
        },
      })
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Process allocations
    const upsertPromises = validatedData.allocations.map((allocation) => {
      const weekStartDate = new Date(allocation.weekStartDate);
      const weekEndDate = getWeekEndDate(weekStartDate);

      // Calculate week number based on type
      const weekNumberingType = (allocation.weekNumberingType ||
        "PROJECT_RELATIVE") as WeekNumberingType;
      const weekNumber = calculateWeekNumber(
        weekStartDate,
        weekNumberingType,
        project.startDate
      );

      // Calculate working days (either from mandays or allocationPercent)
      // Note: Zod validation ensures at least one is provided
      const workingDays =
        allocation.mandays !== undefined
          ? allocation.mandays
          : (allocation.allocationPercent! / 100) * 5; // 5 days per week

      // Calculate allocation percentage (either from allocationPercent or mandays)
      const allocationPercent =
        allocation.allocationPercent !== undefined
          ? allocation.allocationPercent
          : (workingDays / 5) * 100;

      // Generate weekIdentifier in correct format
      const year = weekStartDate.getFullYear();
      const weekIdentifier = `${year}-W${weekNumber.toString().padStart(2, "0")}`;

      return prisma.resourceWeeklyAllocation.upsert({
        where: {
          projectId_resourceId_weekIdentifier: {
            projectId: validatedData.projectId,
            resourceId: allocation.resourceId,
            weekIdentifier: weekIdentifier,
          },
        },
        create: {
          projectId: validatedData.projectId,
          resourceId: allocation.resourceId,
          weekStartDate: weekStartDate,
          weekEndDate: weekEndDate,
          weekNumberingType: weekNumberingType,
          weekNumber: weekNumber,
          weekIdentifier: weekIdentifier,
          allocationPercent: allocationPercent,
          workingDays: workingDays,
          mandays: allocation.mandays,
          projectVersionId: validatedData.versionId || null,
          isManualOverride: true,
          createdBy: session.user.id,
        },
        update: {
          weekNumberingType: weekNumberingType,
          weekNumber: weekNumber,
          allocationPercent: allocationPercent,
          workingDays: workingDays,
          mandays: allocation.mandays,
          projectVersionId: validatedData.versionId || null,
          isManualOverride: true,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      });
    });

    // Execute batch upsert
    const createdAllocations = await withRetry(() =>
      prisma.$transaction(upsertPromises)
    );

    // Calculate summary
    const summary = {
      totalAllocations: createdAllocations.length,
      uniqueResources: new Set(
        validatedData.allocations.map((a) => a.resourceId)
      ).size,
      totalWorkingDays: createdAllocations.reduce(
        (sum, a) => sum + Number(a.workingDays),
        0
      ),
      totalMandays: createdAllocations.reduce(
        (sum, a) => sum + (a.mandays ? Number(a.mandays) : 0),
        0
      ),
    };

    return NextResponse.json(
      {
        success: true,
        allocations: createdAllocations.map((a) => ({
          id: a.id,
          projectId: a.projectId,
          resourceId: a.resourceId,
          weekStartDate: a.weekStartDate.toISOString().split("T")[0],
          weekEndDate: a.weekEndDate.toISOString().split("T")[0],
          weekNumberingType: a.weekNumberingType,
          weekNumber: a.weekNumber,
          weekIdentifier: a.weekIdentifier,
          allocationPercent: a.allocationPercent,
          workingDays: Number(a.workingDays),
          mandays: a.mandays ? Number(a.mandays) : null,
          projectVersionId: a.projectVersionId,
          isManualOverride: a.isManualOverride,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
        summary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Team Capacity] Error creating allocations:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create allocations",
        message: "An internal error occurred",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Retrieve Weekly Allocations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const resourceId = searchParams.get("resourceId");
    const weekStart = searchParams.get("weekStart"); // YYYY-MM-DD
    const weekEnd = searchParams.get("weekEnd"); // YYYY-MM-DD
    const versionId = searchParams.get("versionId");
    const weekNumberingType = searchParams.get("weekNumberingType");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    // Check project access (VIEWER, EDITOR, or OWNER can read)
    const hasAccess = await hasAnyProjectRole(
      projectId,
      session.user.id,
      ["VIEWER", "EDITOR", "OWNER"]
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Build query filters
    const where: Record<string, unknown> = {
      projectId,
    };

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (versionId) {
      where.projectVersionId = versionId;
    }

    if (weekNumberingType) {
      where.weekNumberingType = weekNumberingType;
    }

    if (weekStart || weekEnd) {
      const weekDateFilter: { gte?: Date; lte?: Date } = {};
      if (weekStart) {
        weekDateFilter.gte = new Date(weekStart);
      }
      if (weekEnd) {
        weekDateFilter.lte = new Date(weekEnd);
      }
      where.weekStartDate = weekDateFilter;
    }

    // Query allocations
    const allocations = await withRetry(() =>
      prisma.resourceWeeklyAllocation.findMany({
        where,
        include: {
          resource: {
            select: {
              id: true,
              name: true,
              designation: true,
              regionCode: true,
              isSubcontractor: true,
            },
          },
        },
        orderBy: [
          { resourceId: "asc" },
          { weekStartDate: "asc" },
        ],
      })
    );

    // Calculate summary
    const summary = {
      totalAllocations: allocations.length,
      uniqueResources: new Set(allocations.map((a) => a.resourceId)).size,
      uniqueWeeks: new Set(
        allocations.map((a) => a.weekStartDate.toISOString().split("T")[0])
      ).size,
      totalWorkingDays: allocations.reduce(
        (sum, a) => sum + Number(a.workingDays),
        0
      ),
      totalMandays: allocations.reduce(
        (sum, a) => sum + (a.mandays ? Number(a.mandays) : 0),
        0
      ),
      averageUtilization:
        allocations.length > 0
          ? allocations.reduce((sum, a) => sum + a.allocationPercent, 0) /
            allocations.length
          : 0,
    };

    return NextResponse.json({
      allocations: allocations.map((a) => ({
        id: a.id,
        projectId: a.projectId,
        resourceId: a.resourceId,
        weekStartDate: a.weekStartDate.toISOString().split("T")[0],
        weekEndDate: a.weekEndDate.toISOString().split("T")[0],
        weekNumberingType: a.weekNumberingType,
        weekNumber: a.weekNumber,
        weekIdentifier: a.weekIdentifier,
        allocationPercent: a.allocationPercent,
        workingDays: Number(a.workingDays),
        mandays: a.mandays ? Number(a.mandays) : null,
        projectVersionId: a.projectVersionId,
        sourcePhaseId: a.sourcePhaseId,
        sourcePattern: a.sourcePattern,
        isManualOverride: a.isManualOverride,
        createdAt: a.createdAt.toISOString(),
        createdBy: a.createdBy,
        updatedAt: a.updatedAt.toISOString(),
        updatedBy: a.updatedBy,
        resource: a.resource,
      })),
      summary,
    });
  } catch (error) {
    console.error("[Team Capacity] Error fetching allocations:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch allocations",
        message: "An internal error occurred",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove Weekly Allocations
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = DeleteAllocationsRequestSchema.parse(body);

    // Check project access (EDITOR or OWNER required)
    const hasAccess = await hasAnyProjectRole(
      validatedData.projectId,
      session.user.id,
      ["EDITOR", "OWNER"]
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Build delete filter
    const where: Record<string, unknown> = {
      projectId: validatedData.projectId,
    };

    if (validatedData.allocationIds) {
      where.id = { in: validatedData.allocationIds };
    } else {
      // If no specific IDs, require resourceId or weekStartDate for safety
      if (validatedData.resourceId) {
        where.resourceId = validatedData.resourceId;
      }
      if (validatedData.weekStartDate) {
        where.weekStartDate = new Date(validatedData.weekStartDate);
      }
    }

    // Delete allocations
    const result = await withRetry(() =>
      prisma.resourceWeeklyAllocation.deleteMany({
        where,
      })
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("[Team Capacity] Error deleting allocations:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete allocations",
        message: "An internal error occurred",
      },
      { status: 500 }
    );
  }
}
