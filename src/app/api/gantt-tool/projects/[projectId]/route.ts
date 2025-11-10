/**
 * Gantt Tool API - Single Project Operations
 *
 * GET    /api/gantt-tool/projects/[projectId] - Get project details
 * PATCH  /api/gantt-tool/projects/[projectId] - Update project
 * DELETE /api/gantt-tool/projects/[projectId] - Delete project (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Increase function timeout for save operations (max 10s on Hobby, 60s on Pro)
export const maxDuration = 10; // seconds

// Validation schema for updating a project
const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  viewSettings: z.any().optional(), // JSON field
  budget: z.any().optional(), // JSON field
  orgChart: z.any().optional(), // JSON field - organization chart structure
  phases: z.array(z.any()).optional(), // Full phases array
  milestones: z.array(z.any()).optional(), // Full milestones array
  holidays: z.array(z.any()).optional(), // Full holidays array
  resources: z.array(z.any()).optional(), // Full resources array
});

// Helper to check project ownership
async function checkProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.ganttProject.findFirst({
    where: {
      id: projectId,
      userId: userId,
      deletedAt: null,
    },
  });

  return project !== null;
}

// GET - Get single project
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

    // Check if we should load minimal data (for list previews)
    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    const project = minimal
      ? // Minimal query - only basic info + counts (< 50ms)
        await prisma.ganttProject.findFirst({
          where: {
            id: projectId,
            userId: session.user.id,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            viewSettings: true,
            budget: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                phases: true,
                milestones: true,
                holidays: true,
                resources: true,
              },
            },
          },
        })
      : // Full query - all nested relations (150-600ms depending on data size)
        await prisma.ganttProject.findFirst({
          where: {
            id: projectId,
            userId: session.user.id,
            deletedAt: null,
          },
          include: {
            phases: {
              include: {
                tasks: {
                  include: {
                    resourceAssignments: true,
                  },
                  orderBy: { order: "asc" },
                },
                phaseResourceAssignments: true,
              },
              orderBy: { order: "asc" },
            },
            milestones: {
              orderBy: { date: "asc" },
            },
            holidays: {
              orderBy: { date: "asc" },
            },
            resources: {
              orderBy: { createdAt: "asc" },
            },
          },
        });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Serialize dates to strings for frontend
    const serializedProject = minimal
      ? {
          ...project,
          startDate: (project as any).startDate.toISOString().split("T")[0],
          createdAt: (project as any).createdAt.toISOString(),
          updatedAt: (project as any).updatedAt.toISOString(),
        }
      : {
          ...project,
          startDate: (project as any).startDate.toISOString().split("T")[0],
          createdAt: (project as any).createdAt.toISOString(),
          updatedAt: (project as any).updatedAt.toISOString(),
          deletedAt: (project as any).deletedAt?.toISOString() || null,
          phases: (project as any).phases.map((phase: any) => ({
            ...phase,
            startDate: phase.startDate.toISOString().split("T")[0],
            endDate: phase.endDate.toISOString().split("T")[0],
            tasks: phase.tasks.map((task: any) => ({
              ...task,
              startDate: task.startDate.toISOString().split("T")[0],
              endDate: task.endDate.toISOString().split("T")[0],
              resourceAssignments: task.resourceAssignments.map((ra: any) => ({
                ...ra,
                assignedAt: ra.assignedAt.toISOString(),
              })),
            })),
            phaseResourceAssignments: phase.phaseResourceAssignments.map((pra: any) => ({
              ...pra,
              assignedAt: pra.assignedAt.toISOString(),
            })),
          })),
          milestones: (project as any).milestones.map((m: any) => ({
            ...m,
            date: m.date.toISOString().split("T")[0],
          })),
          holidays: (project as any).holidays.map((h: any) => ({
            ...h,
            date: h.date.toISOString().split("T")[0],
          })),
          resources: (project as any).resources.map((r: any) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          })),
        };

    // Add caching headers to reduce repeated requests
    // Cache for 10 seconds with revalidation (stale-while-revalidate for 60s)
    const response = NextResponse.json({ project: serializedProject }, { status: 200 });
    response.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=60");
    response.headers.set("ETag", `"${project.updatedAt.getTime()}"`);

    return response;
  } catch (error) {
    console.error("[API] Failed to fetch gantt project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PATCH - Update project (full state replacement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV === "development";

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check ownership
    const hasAccess = await checkProjectOwnership(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      if (isDev) console.error("[API] Failed to parse JSON:", jsonError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const validatedData = UpdateProjectSchema.parse(body);

    // Check for duplicate project name if name is being updated
    if (validatedData.name) {
      const existingProject = await prisma.ganttProject.findFirst({
        where: {
          userId: session.user.id,
          name: {
            equals: validatedData.name,
            mode: "insensitive",
          },
          deletedAt: null,
          NOT: {
            id: projectId,
          },
        },
      });

      if (existingProject) {
        return NextResponse.json(
          {
            error: `A project named "${validatedData.name}" already exists. Please choose a different name.`,
          },
          { status: 409 }
        );
      }
    }

    // Update project in transaction
    const txStartTime = Date.now();

    const updatedProject: { id: string; updatedAt: Date } = await (prisma.$transaction as any)(async (tx: any) => {
      // Update main project fields
      const project = await tx.ganttProject.update({
        where: { id: projectId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
          viewSettings: validatedData.viewSettings,
          budget: validatedData.budget,
          orgChart: validatedData.orgChart, // Organization chart structure
        },
        select: { id: true, updatedAt: true },
      });

      // IMPORTANT: Create resources FIRST before phases/tasks that reference them
      if (validatedData.resources) {
        await tx.ganttResource.deleteMany({
          where: { projectId: projectId },
        });

        await tx.ganttResource.createMany({
          data: validatedData.resources.map((r: any) => ({
            id: r.id,
            projectId: projectId,
            name: r.name,
            category: r.category,
            description: r.description || "",
            designation: r.designation,
            managerResourceId: r.managerResourceId || null,
            email: r.email || null,
            department: r.department || null,
            location: r.location || null,
            projectRole: r.projectRole || null,
            rateType: r.rateType || null,
            hourlyRate: r.hourlyRate ? parseFloat(r.hourlyRate.toString()) : null,
            dailyRate: r.dailyRate ? parseFloat(r.dailyRate.toString()) : null,
            currency: r.currency || null,
            utilizationTarget: r.utilizationTarget || null,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          })),
          skipDuplicates: true, // Skip if resource already exists
        });
      }

      // Now create phases (which may reference the resources created above)
      if (validatedData.phases) {
        // Delete existing phases (cascade will delete tasks)
        await tx.ganttPhase.deleteMany({
          where: { projectId: projectId },
        });

        // Create phases with nested tasks in parallel using createMany + manual nested creation
        // This is much faster than sequential for-loop
        if (validatedData.phases.length > 0) {
          // Create all phases first (without nested tasks)
          await tx.ganttPhase.createMany({
            data: validatedData.phases.map((phase: any) => ({
              id: phase.id,
              projectId: projectId,
              name: phase.name,
              description: phase.description,
              color: phase.color,
              startDate: new Date(phase.startDate),
              endDate: new Date(phase.endDate),
              collapsed: phase.collapsed || false,
              order: phase.order || 0,
              dependencies: phase.dependencies || [],
            })),
            skipDuplicates: true, // Skip if phase already exists
          });

          // Collect all tasks for batch creation
          const allTasks: any[] = [];
          const allTaskResourceAssignments: any[] = [];
          const allPhaseResourceAssignments: any[] = [];

          validatedData.phases.forEach((phase: any) => {
            // Collect tasks
            (phase.tasks || []).forEach((task: any, index: number) => {
              allTasks.push({
                id: task.id,
                phaseId: phase.id,
                name: task.name,
                description: task.description,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate),
                progress: task.progress || 0,
                assignee: task.assignee,
                order: task.order !== undefined ? task.order : index,
                dependencies: task.dependencies || [],
              });

              // Collect task resource assignments
              (task.resourceAssignments || []).forEach((ra: any) => {
                allTaskResourceAssignments.push({
                  id: ra.id,
                  taskId: task.id,
                  resourceId: ra.resourceId,
                  assignmentNotes: ra.assignmentNotes,
                  allocationPercentage: ra.allocationPercentage,
                  assignedAt: new Date(ra.assignedAt || Date.now()),
                });
              });
            });

            // Collect phase resource assignments
            (phase.phaseResourceAssignments || []).forEach((pra: any) => {
              allPhaseResourceAssignments.push({
                id: pra.id,
                phaseId: phase.id,
                resourceId: pra.resourceId,
                assignmentNotes: pra.assignmentNotes,
                allocationPercentage: pra.allocationPercentage,
                assignedAt: new Date(pra.assignedAt || Date.now()),
              });
            });
          });

          // Batch create all tasks
          if (allTasks.length > 0) {
            await tx.ganttTask.createMany({
              data: allTasks,
              skipDuplicates: true, // Skip if task already exists
            });
          }

          // Batch create all task resource assignments
          if (allTaskResourceAssignments.length > 0) {
            await tx.ganttTaskResourceAssignment.createMany({
              data: allTaskResourceAssignments,
              skipDuplicates: true, // Skip if assignment already exists
            });
          }

          // Batch create all phase resource assignments
          if (allPhaseResourceAssignments.length > 0) {
            await tx.ganttPhaseResourceAssignment.createMany({
              data: allPhaseResourceAssignments,
              skipDuplicates: true, // Skip if assignment already exists
            });
          }
        }
      }

      // If milestones provided, replace all
      if (validatedData.milestones) {
        await tx.ganttMilestone.deleteMany({
          where: { projectId: projectId },
        });

        if (validatedData.milestones.length > 0) {
          await tx.ganttMilestone.createMany({
            data: validatedData.milestones.map((m: any) => ({
              id: m.id,
              projectId: projectId,
              name: m.name,
              description: m.description,
              date: new Date(m.date),
              icon: m.icon,
              color: m.color,
            })),
            skipDuplicates: true, // Skip if milestone already exists
          });
        }
      }

      // If holidays provided, replace all
      if (validatedData.holidays) {
        await tx.ganttHoliday.deleteMany({
          where: { projectId: projectId },
        });

        if (validatedData.holidays.length > 0) {
          await tx.ganttHoliday.createMany({
            data: validatedData.holidays.map((h: any) => ({
              id: h.id,
              projectId: projectId,
              name: h.name,
              date: new Date(h.date),
              region: h.region,
              type: h.type,
            })),
            skipDuplicates: true, // Skip if holiday already exists
          });
        }
      }

      // Resources are already handled at the beginning of the transaction

      return project;
    }) as { id: string; updatedAt: Date };

    const txDuration = Date.now() - txStartTime;

    // Audit log (non-critical - don't fail the request if it errors)
    try {
      await prisma.audit_logs.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: "UPDATE",
          entity: "gantt_project",
          entityId: projectId,
          changes: validatedData,
        },
      });
    } catch (auditError) {
      // Log the error but don't fail the request (only in development)
      if (process.env.NODE_ENV === "development") {
        console.error("[API] Failed to create audit log (non-critical):", auditError);
      }
    }

    const duration = Date.now() - startTime;

    // Return minimal response - frontend already has the data
    // This saves 30-50% of execution time by avoiding the expensive refetch
    return NextResponse.json(
      {
        success: true,
        project: {
          id: projectId,
          updatedAt: updatedProject.updatedAt.toISOString(),
        },
        meta: {
          txDuration,
          totalDuration: duration,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      if (isDev) console.error("[API] Zod validation failed:", error.issues);
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    // Log detailed error information (only in development)
    if (isDev) {
      console.error("[API] Failed to update gantt project:");
      console.error("Error name:", error instanceof Error ? error.name : "Unknown");
      console.error("Error message:", error instanceof Error ? error.message : error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    }

    // Check for Prisma-specific errors
    if (error && typeof error === "object" && "code" in error) {
      if (isDev) {
        console.error("Prisma error code:", (error as any).code);
        console.error("Prisma error meta:", (error as any).meta);
      }

      // Provide more user-friendly error messages for common Prisma errors
      const prismaCode = (error as any).code;
      if (prismaCode === "P2002") {
        const meta = (error as any).meta;
        const target = meta?.target || [];
        let detailedMessage = "A record with this data already exists.";

        // Provide specific guidance based on constraint
        if (target.includes("taskId") && target.includes("resourceId")) {
          detailedMessage =
            "Duplicate resource assignment detected: The same resource is already assigned to this task. Please refresh the page to sync with the latest data.";
        } else if (target.includes("phaseId") && target.includes("resourceId")) {
          detailedMessage =
            "Duplicate PM resource assignment detected: The same PM resource is already assigned to this phase. Please refresh the page to sync with the latest data.";
        } else if (target.includes("name")) {
          detailedMessage = "A project with this name already exists. Please use a different name.";
        }

        return NextResponse.json(
          {
            error: "Unique constraint violation",
            message: detailedMessage,
            conflictField: target,
            details: meta,
          },
          { status: 409 }
        );
      } else if (prismaCode === "P2003") {
        return NextResponse.json(
          {
            error: "Foreign key constraint violation",
            message: "Referenced record does not exist",
            details: (error as any).meta,
          },
          { status: 400 }
        );
      } else if (prismaCode === "P2025") {
        return NextResponse.json(
          {
            error: "Record not found",
            message: "The requested record was not found",
            details: (error as any).meta,
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to update project",
        message: error instanceof Error ? error.message : "Unknown error",
        details:
          error instanceof Error
            ? { name: error.name, stack: error.stack?.split("\n").slice(0, 3) }
            : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete project
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

    // Check ownership
    const hasAccess = await checkProjectOwnership(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await prisma.ganttProject.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        action: "DELETE",
        entity: "gantt_project",
        entityId: projectId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API] Failed to delete gantt project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
