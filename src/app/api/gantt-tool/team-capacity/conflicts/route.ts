/**
 * Team Capacity API - Conflict Detection Endpoint (ENHANCED)
 *
 * POST /api/gantt-tool/team-capacity/conflicts - Detect cross-project resource conflicts
 * GET /api/gantt-tool/team-capacity/conflicts?resourceId=xxx - Get resource utilization summary
 *
 * ENHANCEMENTS:
 * - Support for new week numbering types (PROJECT_RELATIVE, ISO_WEEK, CALENDAR_WEEK)
 * - Mandays-based conflict detection (>5.0 mandays per week = conflict)
 * - Version-aware conflict detection
 * - Enhanced conflict severity classification
 *
 * Security: Only returns conflicts for projects user has access to
 * Performance: Uses optimized composite index (resourceId, weekStartDate)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/db";
import { z } from "zod";

export const maxDuration = 30;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ConflictDetectionRequestSchema = z.object({
  resourceId: z.string().min(1).optional(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  criticalThreshold: z.number().min(0).max(200).default(100), // % allocation
  warningThreshold: z.number().min(0).max(200).default(80), // % allocation
  includeProjects: z.array(z.string()).optional(), // Limit to specific projects
  versionId: z.string().optional(), // Filter by project version
});

// ============================================================================
// TYPES
// ============================================================================

interface ConflictResult {
  resourceId: string;
  resourceName?: string;
  resourceDesignation?: string;
  weekStartDate: string;
  weekEndDate: string;
  totalAllocation: number; // Sum of all allocations for this week
  totalMandays: number; // Sum of mandays for this week
  severity: "CRITICAL" | "WARNING" | "INFO";
  projectAllocations: {
    projectId: string;
    projectName?: string;
    allocationPercent: number;
    mandays: number | null;
    weekNumberingType: string;
    weekNumber: number | null;
  }[];
}

// ============================================================================
// POST - Detect Conflicts
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
    const validatedData = ConflictDetectionRequestSchema.parse(body);

    // Get all projects user has access to (for security filtering)
    const userOwnedProjects = await withRetry(() =>
      prisma.ganttProject.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      })
    );

    const collaboratedProjects = await withRetry(() =>
      prisma.ganttProjectCollaborator.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          projectId: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      })
    );

    const accessibleProjectIds = [
      ...userOwnedProjects.map((p) => p.id),
      ...collaboratedProjects.map((c) => c.projectId),
    ];

    const projectMap = new Map<string, string>([
      ...userOwnedProjects.map((p) => [p.id, p.name] as [string, string]),
      ...collaboratedProjects.map((c) => [c.projectId, c.project.name] as [string, string]),
    ]);

    // If includeProjects specified, intersect with accessible projects
    let projectIds = accessibleProjectIds;
    if (
      validatedData.includeProjects &&
      validatedData.includeProjects.length > 0
    ) {
      projectIds = accessibleProjectIds.filter((id) =>
        validatedData.includeProjects!.includes(id)
      );
    }

    if (projectIds.length === 0) {
      return NextResponse.json({
        hasConflicts: false,
        conflicts: [],
        summary: {
          totalConflicts: 0,
          criticalConflicts: 0,
          warningConflicts: 0,
          infoConflicts: 0,
          affectedResources: 0,
          affectedWeeks: 0,
        },
      });
    }

    // Build query filters
    const where: Record<string, unknown> = {
      projectId: {
        in: projectIds,
      },
    };

    if (validatedData.resourceId) {
      where.resourceId = validatedData.resourceId;
    }

    if (validatedData.versionId) {
      where.projectVersionId = validatedData.versionId;
    }

    if (validatedData.weekStart || validatedData.weekEnd) {
      const weekDateFilter: { gte?: Date; lte?: Date } = {};
      if (validatedData.weekStart) {
        weekDateFilter.gte = new Date(validatedData.weekStart);
      }
      if (validatedData.weekEnd) {
        weekDateFilter.lte = new Date(validatedData.weekEnd);
      }
      where.weekStartDate = weekDateFilter;
    }

    // Query all allocations (optimized with composite index)
    const allocations = await withRetry(() =>
      prisma.resourceWeeklyAllocation.findMany({
        where,
        select: {
          id: true,
          projectId: true,
          resourceId: true,
          weekStartDate: true,
          weekEndDate: true,
          weekNumberingType: true,
          weekNumber: true,
          weekIdentifier: true,
          allocationPercent: true,
          workingDays: true,
          mandays: true,
          projectVersionId: true,
          resource: {
            select: {
              id: true,
              name: true,
              designation: true,
            },
          },
        },
        orderBy: [{ resourceId: "asc" }, { weekStartDate: "asc" }],
      })
    );

    // Group allocations by resource and week
    const groupedAllocations = new Map<
      string,
      Map<string, typeof allocations>
    >();

    for (const allocation of allocations) {
      const resourceKey = allocation.resourceId;
      const weekKey = allocation.weekStartDate.toISOString().split("T")[0];

      if (!groupedAllocations.has(resourceKey)) {
        groupedAllocations.set(resourceKey, new Map());
      }

      const resourceWeeks = groupedAllocations.get(resourceKey)!;
      if (!resourceWeeks.has(weekKey)) {
        resourceWeeks.set(weekKey, []);
      }

      resourceWeeks.get(weekKey)!.push(allocation);
    }

    // Detect conflicts
    const conflicts: ConflictResult[] = [];

    for (const [resourceId, weekMap] of groupedAllocations.entries()) {
      for (const [_weekKey, weekAllocations] of weekMap.entries()) {
        // Calculate total allocation for this week
        const totalAllocation = weekAllocations.reduce(
          (sum, a) => sum + a.allocationPercent,
          0
        );

        const totalMandays = weekAllocations.reduce(
          (sum, a) => sum + (a.mandays ? Number(a.mandays) : 0),
          0
        );

        // Determine severity
        let severity: "CRITICAL" | "WARNING" | "INFO" = "INFO";
        if (
          totalAllocation >= validatedData.criticalThreshold ||
          totalMandays > 5.0
        ) {
          severity = "CRITICAL";
        } else if (totalAllocation >= validatedData.warningThreshold) {
          severity = "WARNING";
        }

        // Only report conflicts if allocation exceeds thresholds or mandays > 5.0
        if (severity !== "INFO") {
          const firstAllocation = weekAllocations[0];

          conflicts.push({
            resourceId,
            resourceName: firstAllocation.resource.name,
            resourceDesignation: firstAllocation.resource.designation || undefined,
            weekStartDate: firstAllocation.weekStartDate
              .toISOString()
              .split("T")[0],
            weekEndDate: firstAllocation.weekEndDate
              .toISOString()
              .split("T")[0],
            totalAllocation,
            totalMandays,
            severity,
            projectAllocations: weekAllocations.map((a) => ({
              projectId: a.projectId,
              projectName: projectMap.get(a.projectId),
              allocationPercent: a.allocationPercent,
              mandays: a.mandays ? Number(a.mandays) : null,
              weekNumberingType: a.weekNumberingType,
              weekNumber: a.weekNumber,
            })),
          });
        }
      }
    }

    // Calculate summary
    const summary = {
      totalConflicts: conflicts.length,
      criticalConflicts: conflicts.filter((c) => c.severity === "CRITICAL")
        .length,
      warningConflicts: conflicts.filter((c) => c.severity === "WARNING")
        .length,
      infoConflicts: conflicts.filter((c) => c.severity === "INFO").length,
      affectedResources: new Set(conflicts.map((c) => c.resourceId)).size,
      affectedWeeks: new Set(conflicts.map((c) => c.weekStartDate)).size,
    };

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
      summary,
    });
  } catch (error) {
    console.error("[Team Capacity] Error detecting conflicts:", error);

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
        error: "Failed to detect conflicts",
        message: "An internal error occurred",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Resource Utilization Summary
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
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId query parameter is required" },
        { status: 400 }
      );
    }

    // Get all projects user has access to
    const userOwnedProjects = await withRetry(() =>
      prisma.ganttProject.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      })
    );

    const collaboratedProjects = await withRetry(() =>
      prisma.ganttProjectCollaborator.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          projectId: true,
        },
      })
    );

    const projectIds = [
      ...userOwnedProjects.map((p) => p.id),
      ...collaboratedProjects.map((c) => c.projectId),
    ];

    // Query allocations for this resource across all accessible projects
    const allocations = await withRetry(() =>
      prisma.resourceWeeklyAllocation.findMany({
        where: {
          resourceId,
          projectId: {
            in: projectIds,
          },
        },
        orderBy: {
          weekStartDate: "asc",
        },
        select: {
          weekStartDate: true,
          weekEndDate: true,
          weekNumberingType: true,
          weekNumber: true,
          allocationPercent: true,
          mandays: true,
          workingDays: true,
        },
      })
    );

    // Get resource name
    const resource = await withRetry(() =>
      prisma.ganttResource.findFirst({
        where: { id: resourceId },
        select: { name: true, designation: true },
      })
    );

    // Calculate utilization statistics
    const totalAllocations = allocations.length;
    const totalMandays = allocations.reduce(
      (sum, a) => sum + (a.mandays ? Number(a.mandays) : 0),
      0
    );
    const totalWorkingDays = allocations.reduce(
      (sum, a) => sum + Number(a.workingDays),
      0
    );
    const averageUtilization =
      totalAllocations > 0
        ? allocations.reduce((sum, a) => sum + a.allocationPercent, 0) /
          totalAllocations
        : 0;

    // Find peak utilization weeks
    const weeklyUtilization = new Map<string, number>();
    const weeklyMandays = new Map<string, number>();

    for (const allocation of allocations) {
      const weekKey = allocation.weekStartDate.toISOString().split("T")[0];
      weeklyUtilization.set(
        weekKey,
        (weeklyUtilization.get(weekKey) || 0) + allocation.allocationPercent
      );
      weeklyMandays.set(
        weekKey,
        (weeklyMandays.get(weekKey) || 0) +
          (allocation.mandays ? Number(allocation.mandays) : 0)
      );
    }

    const peakUtilization = Math.max(...Array.from(weeklyUtilization.values()), 0);
    const peakMandays = Math.max(...Array.from(weeklyMandays.values()), 0);

    return NextResponse.json({
      resourceId,
      resourceName: resource?.name || resourceId,
      resourceDesignation: resource?.designation || undefined,
      statistics: {
        totalAllocations,
        totalMandays,
        totalWorkingDays,
        averageUtilization: Math.round(averageUtilization * 100) / 100,
        peakUtilization: Math.round(peakUtilization * 100) / 100,
        peakMandays: Math.round(peakMandays * 100) / 100,
      },
      weeklyBreakdown: Array.from(weeklyUtilization.entries())
        .map(([weekKey, utilization]) => ({
          weekStartDate: weekKey,
          totalUtilization: Math.round(utilization * 100) / 100,
          totalMandays:
            Math.round((weeklyMandays.get(weekKey) || 0) * 100) / 100,
          status:
            utilization >= 100 || (weeklyMandays.get(weekKey) || 0) > 5
              ? "OVER_ALLOCATED"
              : utilization >= 80
              ? "AT_CAPACITY"
              : "AVAILABLE",
        }))
        .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate)),
    });
  } catch (error) {
    console.error("[Team Capacity] Error calculating utilization:", error);

    return NextResponse.json(
      {
        error: "Failed to calculate utilization",
        message: "An internal error occurred",
      },
      { status: 500 }
    );
  }
}
