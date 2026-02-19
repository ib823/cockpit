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
import { validateResourceBatch } from "@/lib/gantt-tool/resource-import-validator";

// Increase function timeout for save operations (max 10s on Hobby, 60s on Pro)
export const maxDuration = 10; // seconds

// Validation schema for updating a project (Unified Model - Phase 3)
const UpdateProjectSchema = z.object({
  // Timeline fields
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

  // Architecture fields (Unified Project Model)
  businessContext: z.any().optional(), // JSON field - BusinessContextData
  currentLandscape: z.any().optional(), // JSON field - CurrentLandscapeData
  proposedSolution: z.any().optional(), // JSON field - ProposedSolutionData
  diagramSettings: z.any().optional(), // JSON field - DiagramSettings
  architectureVersion: z.string().max(50).optional(), // Version string

  // Optimistic locking
  expectedVersion: z.number().optional(), // Version number expected by client
});

// Helper to check project ownership (DEPRECATED - use checkProjectAccess from access-control.ts)
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

// Helper to check project read access (owner or collaborator)
async function checkProjectReadAccess(projectId: string, userId: string) {
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
            },
          },
        },
      ],
    },
  });

  return project !== null;
}

// Helper to check project write access (owner or EDITOR/OWNER collaborator)
async function checkProjectWriteAccess(projectId: string, userId: string) {
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
              role: {
                in: ["EDITOR", "OWNER"],
              },
            },
          },
        },
      ],
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

    // Check if user has read access to this project
    const hasReadAccess = await checkProjectReadAccess(projectId, session.user.id);
    if (!hasReadAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = minimal
      ? // Minimal query - only basic info + counts (< 50ms)
        await prisma.ganttProject.findFirst({
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
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            viewSettings: true,
            budget: true,
            createdAt: true,
            updatedAt: true,
            version: true,
            lastModifiedBy: true,
            lastModifiedAt: true,
            lastModifier: {
              select: {
                name: true,
                email: true,
              },
            },
            // Architecture fields (Unified Model)
            businessContext: true,
            currentLandscape: true,
            proposedSolution: true,
            diagramSettings: true,
            architectureVersion: true,
            lastArchitectureEdit: true,
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
              where: {
                isActive: true,
                deletedAt: null,
              },
              orderBy: { createdAt: "asc" },
            },
            lastModifier: {
              select: {
                name: true,
                email: true,
              },
            },
            activeSessions: {
              where: {
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
            },
          },
        });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Serialize dates to strings for frontend (Unified Model - Phase 3)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const serializedProject = minimal
      ? {
          ...project,
          startDate: (project as any).startDate.toISOString().split("T")[0],
          createdAt: (project as any).createdAt.toISOString(),
          updatedAt: (project as any).updatedAt.toISOString(),
          lastModifiedAt: (project as any).lastModifiedAt?.toISOString() || null,
          lastArchitectureEdit: (project as any).lastArchitectureEdit?.toISOString() || null,
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
          lastModifiedAt: (project as any).lastModifiedAt?.toISOString() || null,
          lastArchitectureEdit: (project as any).lastArchitectureEdit?.toISOString() || null,
          activeSessions: (project as any).activeSessions.map((s: any) => ({
            ...s,
            lastSeenAt: s.lastSeenAt.toISOString(),
          })),
        };
    /* eslint-enable @typescript-eslint/no-explicit-any */

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

    // Check write access (owner or EDITOR/OWNER collaborator)
    const hasWriteAccess = await checkProjectWriteAccess(projectId, session.user.id);
    if (!hasWriteAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions. EDITOR or OWNER role required." },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      if (isDev) console.error("[API] Failed to parse JSON:", jsonError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Validate request body with proper Zod error handling
    let validatedData;
    try {
      validatedData = UpdateProjectSchema.parse(body);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        const issues = zodError.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        if (isDev) {
          console.error("[API] Validation failed for project update:", {
            projectId,
            issues,
            zodError,
          });
        }

        return NextResponse.json(
          {
            error: "Request validation failed",
            code: "VALIDATION_ERROR",
            details: issues,
            validationDetails: issues, // For backward compatibility
          },
          { status: 400 }
        );
      }
      // Re-throw non-Zod errors
      throw zodError;
    }

    // NEW: Validate resources if included in update
    if (validatedData.resources && Array.isArray(validatedData.resources)) {
      const resourceValidation = validateResourceBatch(
        validatedData.resources,
        `projects-patch-endpoint-${projectId}`
      );

      // Check for validation errors
      if (resourceValidation.invalid.length > 0) {
        return NextResponse.json(
          {
            error: "Resource validation failed",
            code: "RESOURCE_VALIDATION_ERROR",
            details: resourceValidation.invalid.map(err => ({
              row: err.rowOrIndex,
              field: err.field,
              code: err.code,
              message: err.message,
            })),
            summary: `${resourceValidation.invalid.length} resource(s) failed validation`,
          },
          { status: 400 }
        );
      }

      // Log warnings if any (circular references, incomplete resources)
      if (resourceValidation.warnings.length > 0) {
        if (isDev) {
          console.warn(
            `[API] Resource validation warnings for project ${projectId}:`,
            resourceValidation.warnings
          );
        }
      }

      // Replace the resources array with validated resources
      validatedData.resources = resourceValidation.valid;
    }

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

    // OPTIMISTIC LOCKING: Check version before update
    if (validatedData.expectedVersion !== undefined) {
      const currentProject = await prisma.ganttProject.findUnique({
        where: { id: projectId },
        select: {
          version: true,
          lastModifiedBy: true,
          lastModifiedAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          lastModifier: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!currentProject) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      if (currentProject.version !== validatedData.expectedVersion) {
        // Version conflict detected
        return NextResponse.json(
          {
            error: "CONFLICT",
            code: "VERSION_CONFLICT",
            message: "This project was modified by another user. Please refresh and try again.",
            details: {
              expectedVersion: validatedData.expectedVersion,
              currentVersion: currentProject.version,
              lastModifiedBy: currentProject.lastModifier || currentProject.user,
              lastModifiedAt: currentProject.lastModifiedAt?.toISOString() || currentProject.version,
            },
          },
          { status: 409 }
        );
      }
    }

    // Update project in transaction
    const txStartTime = Date.now();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const updatedProject: { id: string; updatedAt: Date; version: number } = await (prisma.$transaction as any)(async (tx: any) => {
      // Update main project fields with version increment (Unified Model - Phase 3)
      const updateData: any = {
        // Timeline fields
        name: validatedData.name,
        description: validatedData.description,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        viewSettings: validatedData.viewSettings,
        budget: validatedData.budget,
        orgChart: validatedData.orgChart, // Organization chart structure

        // Architecture fields (Unified Project Model)
        businessContext: validatedData.businessContext,
        currentLandscape: validatedData.currentLandscape,
        proposedSolution: validatedData.proposedSolution,
        diagramSettings: validatedData.diagramSettings,
        architectureVersion: validatedData.architectureVersion,

        // Increment version and track last modifier
        version: { increment: 1 },
        lastModifiedBy: session.user.id,
        lastModifiedAt: new Date(),
      };

      // Track lastArchitectureEdit when any architecture field is updated
      if (
        validatedData.businessContext !== undefined ||
        validatedData.currentLandscape !== undefined ||
        validatedData.proposedSolution !== undefined ||
        validatedData.diagramSettings !== undefined
      ) {
        updateData.lastArchitectureEdit = new Date();
      }

      const project = await tx.ganttProject.update({
        where: { id: projectId },
        data: updateData,
        select: { id: true, updatedAt: true, version: true },
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
    }) as { id: string; updatedAt: Date; version: number };
    /* eslint-enable @typescript-eslint/no-explicit-any */

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
          version: updatedProject.version, // Return new version for next save
        },
        meta: {
          txDuration,
          totalDuration: duration,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const _duration = Date.now() - startTime;

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
      const prismaError = error as { code: string; meta?: Record<string, unknown> };
      if (isDev) {
        console.error("Prisma error code:", prismaError.code);
        console.error("Prisma error meta:", prismaError.meta);
      }

      // Provide more user-friendly error messages for common Prisma errors
      const prismaCode = prismaError.code;
      if (prismaCode === "P2002") {
        const meta = prismaError.meta as Record<string, unknown> | undefined;
        const target = (meta?.target as string[]) || [];
        let detailedMessage = "A record with this data already exists.";

        // Provide specific guidance based on constraint
        if (target.includes("taskId") && target.includes("resourceId")) {
          detailedMessage =
            "Duplicate resource assignment detected: The same resource is already assigned to this task.";
        } else if (target.includes("phaseId") && target.includes("resourceId")) {
          detailedMessage =
            "Duplicate PM resource assignment detected: The same PM resource is already assigned to this phase.";
        } else if (target.includes("name")) {
          detailedMessage = "A project with this name already exists. Please use a different name.";
        }

        return NextResponse.json(
          {
            error: "Unique constraint violation",
            code: "DUPLICATE_RECORD",
            message: detailedMessage,
            conflictField: target,
            details: meta,
          },
          { status: 409 }
        );
      } else if (prismaCode === "P2003") {
        const meta = prismaError.meta as Record<string, unknown> | undefined;
        const fieldName = (meta?.field_name as string) || "unknown";

        return NextResponse.json(
          {
            error: "Foreign key constraint violation",
            code: "FOREIGN_KEY_VIOLATION",
            message: `Referenced record does not exist (field: ${fieldName}). The data you're trying to save references a resource, phase, or task that was deleted. Please refresh the page to sync with the latest state.`,
            details: meta,
          },
          { status: 400 }
        );
      } else if (prismaCode === "P2025") {
        return NextResponse.json(
          {
            error: "Record not found",
            code: "RECORD_NOT_FOUND",
            message: "The requested record was not found",
            details: prismaError.meta,
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to update project",
        code: "INTERNAL_ERROR",
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

    // Check if user is ADMIN (can delete any project)
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isAdmin = user?.role === "ADMIN";

    // Check ownership - only owner or ADMIN can delete
    const hasOwnership = await checkProjectOwnership(projectId, session.user.id);
    if (!isAdmin && !hasOwnership) {
      return NextResponse.json(
        { error: "Only the project owner or admin can delete the project" },
        { status: 403 }
      );
    }

    // Verify project exists for ADMIN delete
    if (isAdmin && !hasOwnership) {
      const projectExists = await prisma.ganttProject.findFirst({
        where: { id: projectId, deletedAt: null },
      });
      if (!projectExists) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
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
