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
  calculateInternalResourceCost,
  calculateSubcontractorCost,
  calculateProjectCostingSummary,
  applyCostVisibilityFilter,
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

    // Check project access (OWNER required for costing data)
    const hasAccess = await hasAnyProjectRole(
      validatedData.projectId,
      session.user.id,
      ["OWNER"]
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only project owners can access costing data (CONFIDENTIAL)",
        },
        { status: 403 }
      );
    }

    // Determine visibility level based on user role
    // TODO: Add proper user role checking for Finance team
    // For now, default to FINANCE_ONLY for project owners
    const userVisibilityLevel =
      (validatedData.visibilityLevel as CostVisibilityLevel) || "FINANCE_ONLY";

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

    return NextResponse.json({
      success: true,
      costing: {
        projectId: costingSummary.projectId,
        versionNumber: costingSummary.versionNumber,
        grossServiceRevenue: costingSummary.totalGSR,
        netServiceRevenue: costingSummary.totalNSR,
        internalCost:
          userVisibilityLevel === "FINANCE_ONLY"
            ? costingSummary.totalInternalCost
            : undefined,
        subcontractorCost:
          userVisibilityLevel === "FINANCE_ONLY"
            ? costingSummary.totalSubcontractorCost
            : undefined,
        outOfPocketExpense:
          userVisibilityLevel === "FINANCE_ONLY"
            ? costingSummary.totalOPE
            : undefined,
        grossMargin:
          userVisibilityLevel === "FINANCE_ONLY"
            ? costingSummary.grossMargin
            : undefined,
        marginPercentage:
          userVisibilityLevel === "FINANCE_ONLY"
            ? costingSummary.marginPercent
            : undefined,
        visibilityLevel: costingSummary.visibilityLevel,
      },
      breakdown: {
        byRegion: costingSummary.byRegion,
        byDesignation: costingSummary.byDesignation,
      },
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
        message: error instanceof Error ? error.message : "Unknown error",
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
    const visibilityLevel = searchParams.get("visibilityLevel");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    // Check project access (OWNER required for costing data)
    const hasAccess = await hasAnyProjectRole(projectId, session.user.id, [
      "OWNER",
    ]);

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only project owners can access costing data (CONFIDENTIAL)",
        },
        { status: 403 }
      );
    }

    // Determine visibility level
    const userVisibilityLevel =
      (visibilityLevel as CostVisibilityLevel) || "FINANCE_ONLY";

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

    // Apply visibility filter
    const response: any = {
      id: costing.id,
      projectId: costing.projectId,
      grossServiceRevenue: Number(costing.grossServiceRevenue),
      netServiceRevenue: Number(costing.netServiceRevenue),
      baseCurrency: costing.baseCurrency,
      calculatedAt: costing.calculatedAt.toISOString(),
      calculatedBy: costing.calculatedBy,
      version: costing.version,
    };

    // Add sensitive fields only for FINANCE_ONLY
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
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
