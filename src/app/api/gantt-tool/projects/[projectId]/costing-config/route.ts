/**
 * Project Costing Configuration API
 *
 * SECURITY: Finance-only access required for all operations
 * - GET: Retrieve costing configuration for a project
 * - PUT: Update costing configuration
 * - POST: Create costing configuration (if doesn't exist)
 *
 * This manages INPUT parameters (RR%, OPE defaults) not calculated values.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

// Input validation schema
const CostingConfigSchema = z.object({
  realizationRatePercent: z.number().min(0).max(1).optional(),
  internalCostPercent: z.number().min(0).max(1).optional(),
  opeAccommodationPerDay: z.number().min(0).optional(),
  opeMealsPerDay: z.number().min(0).optional(),
  opeTransportPerDay: z.number().min(0).optional(),
  opeTotalDefaultPerDay: z.number().min(0).optional(),
  intercompanyMarkupPercent: z.number().min(1).max(2).optional(), // 1.0 = no markup, 1.5 = 50% markup
  baseCurrency: z.string().length(3).optional(),
  costVisibilityLevel: z.enum(["PUBLIC", "PRESALES_AND_FINANCE", "FINANCE_ONLY"]).optional(),
});

/**
 * GET /api/gantt-tool/projects/[projectId]/costing-config
 * Retrieve costing configuration for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify user has access to project
    const project = await prisma.ganttProject.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: session.user.id },
          { sharedWith: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true, userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has finance access (owner or admin)
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isOwner = project.userId === session.user.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Finance access required to view costing configuration" },
        { status: 403 }
      );
    }

    // Get or create costing config
    let config = await prisma.projectCostingConfig.findUnique({
      where: { projectId },
    });

    if (!config) {
      // Auto-create with defaults if doesn't exist
      config = await prisma.projectCostingConfig.create({
        data: {
          projectId,
          createdBy: session.user.id,
        },
      });
    }

    // Convert Decimal to number for JSON response
    return NextResponse.json({
      id: config.id,
      projectId: config.projectId,
      realizationRatePercent: config.realizationRatePercent.toNumber(),
      internalCostPercent: config.internalCostPercent.toNumber(),
      opeAccommodationPerDay: config.opeAccommodationPerDay.toNumber(),
      opeMealsPerDay: config.opeMealsPerDay.toNumber(),
      opeTransportPerDay: config.opeTransportPerDay.toNumber(),
      opeTotalDefaultPerDay: config.opeTotalDefaultPerDay.toNumber(),
      intercompanyMarkupPercent: config.intercompanyMarkupPercent.toNumber(),
      baseCurrency: config.baseCurrency,
      costVisibilityLevel: config.costVisibilityLevel,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("[CostingConfig] GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve costing configuration" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gantt-tool/projects/[projectId]/costing-config
 * Update costing configuration for a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = CostingConfigSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Verify user has access to project
    const project = await prisma.ganttProject.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: session.user.id },
          { sharedWith: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true, userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has finance access (owner or admin)
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isOwner = project.userId === session.user.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Finance access required to update costing configuration" },
        { status: 403 }
      );
    }

    const data = validationResult.data;

    // Build update object (only include fields that were provided)
    const updateData: Record<string, unknown> = {
      updatedBy: session.user.id,
    };

    if (data.realizationRatePercent !== undefined) {
      updateData.realizationRatePercent = new Decimal(data.realizationRatePercent);
    }
    if (data.internalCostPercent !== undefined) {
      updateData.internalCostPercent = new Decimal(data.internalCostPercent);
    }
    if (data.opeAccommodationPerDay !== undefined) {
      updateData.opeAccommodationPerDay = new Decimal(data.opeAccommodationPerDay);
    }
    if (data.opeMealsPerDay !== undefined) {
      updateData.opeMealsPerDay = new Decimal(data.opeMealsPerDay);
    }
    if (data.opeTransportPerDay !== undefined) {
      updateData.opeTransportPerDay = new Decimal(data.opeTransportPerDay);
    }
    if (data.opeTotalDefaultPerDay !== undefined) {
      updateData.opeTotalDefaultPerDay = new Decimal(data.opeTotalDefaultPerDay);
    }
    if (data.intercompanyMarkupPercent !== undefined) {
      updateData.intercompanyMarkupPercent = new Decimal(data.intercompanyMarkupPercent);
    }
    if (data.baseCurrency !== undefined) {
      updateData.baseCurrency = data.baseCurrency;
    }
    if (data.costVisibilityLevel !== undefined) {
      updateData.costVisibilityLevel = data.costVisibilityLevel;
    }

    // Upsert (create if doesn't exist, update if does)
    const config = await prisma.projectCostingConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        ...updateData,
        createdBy: session.user.id,
      },
      update: updateData,
    });

    // Convert Decimal to number for JSON response
    return NextResponse.json({
      id: config.id,
      projectId: config.projectId,
      realizationRatePercent: config.realizationRatePercent.toNumber(),
      internalCostPercent: config.internalCostPercent.toNumber(),
      opeAccommodationPerDay: config.opeAccommodationPerDay.toNumber(),
      opeMealsPerDay: config.opeMealsPerDay.toNumber(),
      opeTransportPerDay: config.opeTransportPerDay.toNumber(),
      opeTotalDefaultPerDay: config.opeTotalDefaultPerDay.toNumber(),
      intercompanyMarkupPercent: config.intercompanyMarkupPercent.toNumber(),
      baseCurrency: config.baseCurrency,
      costVisibilityLevel: config.costVisibilityLevel,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("[CostingConfig] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update costing configuration" },
      { status: 500 }
    );
  }
}
