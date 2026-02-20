/**
 * Team Capacity API - Costing Calculation Endpoint (7-Layer Model)
 *
 * POST /api/gantt-tool/team-capacity/costing - Calculate project costing (7-layer model)
 * GET /api/gantt-tool/team-capacity/costing?projectId=xxx - Get saved costing data
 *
 * 7-LAYER COSTING MODEL (from YTL Cement RP.xlsx):
 * 1. Rate Lookup (region + designation → standard rate/hour)
 * 2. Daily Rate Conversion (hourly × 8)
 * 3. Gross Standard Rate (GSR) (total mandays × standard rate/day)
 * 4. Realization Rate (RR) Application (discount factor)
 * 5. Net Standard Rate (NSR) (actual billable revenue)
 * 6. Internal Cost (35% of standard rate - CONFIDENTIAL)
 * 7. Margin Calculation (NSR - Internal Cost - CONFIDENTIAL)
 *
 * SECURITY CRITICAL: Three-tier visibility
 * - PUBLIC: No cost data
 * - PRESALES_AND_FINANCE: Rates and NSR only
 * - FINANCE_ONLY: Full access including margins
 *
 * Performance: Optimized with rate lookup caching and batch queries
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/db";
import { z } from "zod";
import { hasAnyProjectRole } from "@/lib/gantt-tool/access-control";
import {
  calculateProjectCostingSummary,
} from "@/lib/team-capacity/costing";
import { CostVisibilityLevel } from "@prisma/client";

export const maxDuration = 30;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CalculateCostingRequestSchema = z.object({
  projectId: z.string().min(1),
  versionNumber: z.number().optional(),
  includeSubcontractors: z.boolean().default(true),
  includeOPE: z.boolean().default(true),
  visibilityLevel: z
    .enum(["PUBLIC", "PRESALES_AND_FINANCE", "FINANCE_ONLY"])
    .optional(),
  saveToDatabase: z.boolean().default(false),
});

// ============================================================================
// POST - Calculate Project Costing
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
    const validatedData = CalculateCostingRequestSchema.parse(body);

    // Determine user role first (needed for access check)
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Check project access (OWNER required, but ADMIN bypasses)
    const isAdmin = user?.role === "ADMIN";
    const hasProjectOwnership = await hasAnyProjectRole(
      validatedData.projectId,
      session.user.id,
      ["OWNER"]
    );

    if (!isAdmin && !hasProjectOwnership) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only project owners can access costing data (CONFIDENTIAL)",
        },
        { status: 403 }
      );
    }

    // Determine visibility level based on user role
    // SECURITY: Visibility level is determined server-side based on user role
    // - ADMIN: Full FINANCE_ONLY access (margins, internal costs)
    // - MANAGER: PRESALES_AND_FINANCE (rates and NSR only)
    // - USER: PUBLIC (no cost data)
    let userVisibilityLevel: CostVisibilityLevel;
    if (isAdmin) {
      // Admin can access full finance data including margins
      userVisibilityLevel = "FINANCE_ONLY";
    } else if (user?.role === "MANAGER") {
      // Managers can see rates and NSR but not margins/internal costs
      userVisibilityLevel = "PRESALES_AND_FINANCE";
    } else {
      // Regular users only see basic info
      userVisibilityLevel = "PUBLIC";
    }

    // Log access for audit purposes
    console.warn(
      `[Costing] User ${session.user.id} (role: ${user?.role}) accessing project ${validatedData.projectId} with visibility: ${userVisibilityLevel}`
    );

    // Calculate project costing summary
    const costingSummary = await calculateProjectCostingSummary(
      validatedData.projectId,
      validatedData.versionNumber,
      userVisibilityLevel
    );

    // Save to database if requested
    if (validatedData.saveToDatabase) {
      await withRetry(() =>
        prisma.projectCosting.upsert({
          where: {
            projectId: validatedData.projectId,
          },
          create: {
            projectId: validatedData.projectId,
            grossServiceRevenue: costingSummary.totalGSR,
            realizationRate: 0.43, // Default from config
            commercialRate: costingSummary.totalNSR,
            netServiceRevenue: costingSummary.totalNSR,
            internalCost: costingSummary.totalInternalCost,
            subcontractorCost: costingSummary.totalSubcontractorCost,
            outOfPocketExpense: costingSummary.totalOPE,
            totalCost:
              costingSummary.totalInternalCost +
              costingSummary.totalSubcontractorCost +
              costingSummary.totalOPE,
            grossMargin: costingSummary.grossMargin,
            marginPercentage: costingSummary.marginPercent,
            baseCurrency: "MYR",
            calculatedBy: session.user.id,
            version: costingSummary.versionNumber,
          },
          update: {
            grossServiceRevenue: costingSummary.totalGSR,
            commercialRate: costingSummary.totalNSR,
            netServiceRevenue: costingSummary.totalNSR,
            internalCost: costingSummary.totalInternalCost,
            subcontractorCost: costingSummary.totalSubcontractorCost,
            outOfPocketExpense: costingSummary.totalOPE,
            totalCost:
              costingSummary.totalInternalCost +
              costingSummary.totalSubcontractorCost +
              costingSummary.totalOPE,
            grossMargin: costingSummary.grossMargin,
            marginPercentage: costingSummary.marginPercent,
            calculatedBy: session.user.id,
            calculatedAt: new Date(),
            version: costingSummary.versionNumber,
          },
        })
      );
    }

    // Build response based on visibility level
    // - PUBLIC: Only basic metadata, no cost data
    // - PRESALES_AND_FINANCE: Revenue data only
    // - FINANCE_ONLY: Full access including margins
    const canSeeRevenue =
      userVisibilityLevel === "PRESALES_AND_FINANCE" ||
      userVisibilityLevel === "FINANCE_ONLY";
    const canSeeMargins = userVisibilityLevel === "FINANCE_ONLY";

    return NextResponse.json({
      success: true,
      costing: {
        projectId: costingSummary.projectId,
        versionNumber: costingSummary.versionNumber,
        // Revenue data - visible to PRESALES_AND_FINANCE and FINANCE_ONLY
        grossServiceRevenue: canSeeRevenue ? costingSummary.totalGSR : undefined,
        netServiceRevenue: canSeeRevenue ? costingSummary.totalNSR : undefined,
        // Confidential data - FINANCE_ONLY
        internalCost: canSeeMargins ? costingSummary.totalInternalCost : undefined,
        subcontractorCost: canSeeMargins
          ? costingSummary.totalSubcontractorCost
          : undefined,
        outOfPocketExpense: canSeeMargins ? costingSummary.totalOPE : undefined,
        grossMargin: canSeeMargins ? costingSummary.grossMargin : undefined,
        marginPercentage: canSeeMargins ? costingSummary.marginPercent : undefined,
        visibilityLevel: userVisibilityLevel,
      },
      // Breakdown only visible to users who can see revenue
      breakdown: canSeeRevenue
        ? {
            byRegion: costingSummary.byRegion,
            byDesignation: costingSummary.byDesignation,
          }
        : undefined,
      saved: validatedData.saveToDatabase,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Team Capacity] Error calculating costing:", error);

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
        error: "Failed to calculate costing",
        message: "An internal error occurred",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Retrieve Saved Costing Data
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
    const _visibilityLevel = searchParams.get("visibilityLevel");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    // Determine user role first (needed for access check)
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Check project access (OWNER required, but ADMIN bypasses)
    const isAdmin = user?.role === "ADMIN";
    const hasProjectOwnership = await hasAnyProjectRole(projectId, session.user.id, [
      "OWNER",
    ]);

    if (!isAdmin && !hasProjectOwnership) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only project owners can access costing data (CONFIDENTIAL)",
        },
        { status: 403 }
      );
    }

    // Determine visibility level based on user role (server-side)
    // SECURITY: Never trust client-supplied visibility level
    let userVisibilityLevel: CostVisibilityLevel;
    if (isAdmin) {
      userVisibilityLevel = "FINANCE_ONLY";
    } else if (user?.role === "MANAGER") {
      userVisibilityLevel = "PRESALES_AND_FINANCE";
    } else {
      userVisibilityLevel = "PUBLIC";
    }

    console.warn(
      `[Costing] GET User ${session.user.id} (role: ${user?.role}) accessing project ${projectId} with visibility: ${userVisibilityLevel}`
    );

    // Fetch costing data
    const costing = await withRetry(() =>
      prisma.projectCosting.findUnique({
        where: {
          projectId,
        },
      })
    );

    if (!costing) {
      return NextResponse.json(
        {
          error: "Costing data not found for this project",
        },
        { status: 404 }
      );
    }

    // Apply visibility filter based on user role
    // - PUBLIC: No cost data (only basic metadata)
    // - PRESALES_AND_FINANCE: Rates and NSR only
    // - FINANCE_ONLY: Full access including margins and internal costs
    const response: Record<string, unknown> = {
      id: costing.id,
      projectId: costing.projectId,
      baseCurrency: costing.baseCurrency,
      calculatedAt: costing.calculatedAt.toISOString(),
      version: costing.version,
    };

    // PRESALES_AND_FINANCE: Add revenue data but not costs/margins
    if (
      userVisibilityLevel === "PRESALES_AND_FINANCE" ||
      userVisibilityLevel === "FINANCE_ONLY"
    ) {
      response.grossServiceRevenue = Number(costing.grossServiceRevenue);
      response.netServiceRevenue = Number(costing.netServiceRevenue);
      response.calculatedBy = costing.calculatedBy;
    }

    // FINANCE_ONLY: Add sensitive financial data (costs, margins)
    if (userVisibilityLevel === "FINANCE_ONLY") {
      response.realizationRate = Number(costing.realizationRate);
      response.internalCost = Number(costing.internalCost);
      response.subcontractorCost = Number(costing.subcontractorCost);
      response.outOfPocketExpense = Number(costing.outOfPocketExpense);
      response.totalCost = Number(costing.totalCost);
      response.grossMargin = Number(costing.grossMargin);
      response.marginPercentage = Number(costing.marginPercentage);
    }

    return NextResponse.json({
      costing: response,
      visibilityLevel: userVisibilityLevel,
    });
  } catch (error) {
    console.error("[Team Capacity] Error fetching costing:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch costing data",
        message: "An internal error occurred",
      },
      { status: 500 }
    );
  }
}
