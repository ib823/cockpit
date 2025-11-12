/**
 * Gantt Tool API - Delta Save Endpoint
 *
 * PATCH /api/gantt-tool/projects/[projectId]/delta - Update project incrementally
 *
 * Phase 2 Optimization: Only updates entities that changed (created/updated/deleted)
 * This is 10-100x faster than full state replacement for typical edits.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type {
  Resource,
  GanttPhase,
  GanttTask,
  TaskResourceAssignment,
  PhaseResourceAssignment,
  GanttMilestone,
  GanttHoliday,
} from "@/types/gantt-tool";

// Increase function timeout for save operations (max 10s on Hobby, 60s on Pro)
export const maxDuration = 30; // seconds - increased for large projects with many resource assignments

// Validation schema for delta updates
const DeltaSaveSchema = z.object({
  projectUpdates: z
    .object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      viewSettings: z.any().optional(),
      budget: z.any().optional(),
      orgChart: z.any().optional(),
    })
    .optional(),
  phases: z
    .object({
      created: z.array(z.any()).optional(),
      updated: z.array(z.any()).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  tasks: z
    .object({
      created: z.array(z.any()).optional(),
      updated: z.array(z.any()).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  resources: z
    .object({
      created: z.array(z.any()).optional(),
      updated: z.array(z.any()).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  milestones: z
    .object({
      created: z.array(z.any()).optional(),
      updated: z.array(z.any()).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  holidays: z
    .object({
      created: z.array(z.any()).optional(),
      updated: z.array(z.any()).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
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

// PATCH - Update project with delta (incremental changes only)
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
      if (isDev) console.error("[API Delta] Failed to parse JSON:", jsonError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const delta = DeltaSaveSchema.parse(body);

    // Check for duplicate project name if name is being updated
    if (delta.projectUpdates?.name) {
      const existingProject = await prisma.ganttProject.findFirst({
        where: {
          userId: session.user.id,
          name: {
            equals: delta.projectUpdates.name,
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
            error: `A project named "${delta.projectUpdates.name}" already exists. Please choose a different name.`,
          },
          { status: 409 }
        );
      }
    }

    // Update project in transaction using delta operations
    const txStartTime = Date.now();

    const updatedProject: { id: string; updatedAt: Date } | null = await (prisma.$transaction as any)(async (tx: any) => {
      // 1. Update project-level fields if any changed
      let project: { id: string; updatedAt: Date } | null;
      if (delta.projectUpdates && Object.keys(delta.projectUpdates).length > 0) {
        const updates: any = { ...delta.projectUpdates };
        if (updates.startDate) {
          updates.startDate = new Date(updates.startDate);
        }
        project = await tx.ganttProject.update({
          where: { id: projectId },
          data: updates,
          select: { id: true, updatedAt: true },
        });
      } else {
        // Just fetch the project if no updates
        project = await tx.ganttProject.findUnique({
          where: { id: projectId },
          select: { id: true, updatedAt: true },
        });
      }

      // 2. Handle resource changes (must be before phases/tasks that reference them)
      if (delta.resources) {
        // Delete resources
        if (delta.resources.deleted && delta.resources.deleted.length > 0) {
          await tx.ganttResource.deleteMany({
            where: {
              id: { in: delta.resources.deleted },
              projectId: projectId,
            },
          });
        }

        // Create resources
        if (delta.resources.created && delta.resources.created.length > 0) {
          await tx.ganttResource.createMany({
            data: delta.resources.created.map((r: Resource) => ({
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

        // Update resources
        if (delta.resources.updated && delta.resources.updated.length > 0) {
          for (const r of delta.resources.updated) {
            await tx.ganttResource.update({
              where: { id: r.id },
              data: {
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
              },
            });
          }
        }
      }

      // 3. Handle phase changes
      if (delta.phases) {
        // Delete phases (cascade will delete tasks)
        if (delta.phases.deleted && delta.phases.deleted.length > 0) {
          await tx.ganttPhase.deleteMany({
            where: {
              id: { in: delta.phases.deleted },
              projectId: projectId,
            },
          });
        }

        // Create phases
        if (delta.phases.created && delta.phases.created.length > 0) {
          await tx.ganttPhase.createMany({
            data: delta.phases.created.map((phase: GanttPhase) => ({
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

          // Create tasks for new phases
          for (const phase of delta.phases.created) {
            if (phase.tasks && phase.tasks.length > 0) {
              await tx.ganttTask.createMany({
                data: phase.tasks.map((task: GanttTask, index: number) => ({
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
                })),
                skipDuplicates: true, // Skip if task already exists
              });

              // Create task resource assignments
              for (const task of phase.tasks) {
                if (task.resourceAssignments && task.resourceAssignments.length > 0) {
                  await tx.ganttTaskResourceAssignment.createMany({
                    data: task.resourceAssignments.map((ra: TaskResourceAssignment) => ({
                      id: ra.id,
                      taskId: task.id,
                      resourceId: ra.resourceId,
                      assignmentNotes: ra.assignmentNotes || '',
                      allocationPercentage: ra.allocationPercentage || 100,
                      assignedAt: new Date(ra.assignedAt || Date.now()),
                    })),
                    skipDuplicates: true, // Skip if assignment already exists
                  });
                }
              }
            }

            // Create phase resource assignments
            if (phase.phaseResourceAssignments && phase.phaseResourceAssignments.length > 0) {
              await tx.ganttPhaseResourceAssignment.createMany({
                data: phase.phaseResourceAssignments.map((pra: PhaseResourceAssignment) => ({
                  id: pra.id,
                  phaseId: phase.id,
                  resourceId: pra.resourceId,
                  assignmentNotes: pra.assignmentNotes,
                  allocationPercentage: pra.allocationPercentage,
                  assignedAt: new Date(pra.assignedAt || Date.now()),
                })),
                skipDuplicates: true, // Skip if assignment already exists
              });
            }
          }
        }

        // Update phases
        if (delta.phases.updated && delta.phases.updated.length > 0) {
          for (const phase of delta.phases.updated) {
            await tx.ganttPhase.update({
              where: { id: phase.id },
              data: {
                name: phase.name,
                description: phase.description,
                color: phase.color,
                startDate: new Date(phase.startDate),
                endDate: new Date(phase.endDate),
                collapsed: phase.collapsed || false,
                order: phase.order || 0,
                dependencies: phase.dependencies || [],
              },
            });

            // For updated phases, we also need to sync tasks
            if (phase.tasks) {
              // Delete existing tasks for this phase
              await tx.ganttTask.deleteMany({
                where: { phaseId: phase.id },
              });

              // Recreate tasks
              if (phase.tasks.length > 0) {
                await tx.ganttTask.createMany({
                  data: phase.tasks.map((task: GanttTask, index: number) => ({
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
                  })),
                  skipDuplicates: true, // Skip if task already exists
                });

                // Recreate task resource assignments
                for (const task of phase.tasks) {
                  if (task.resourceAssignments && task.resourceAssignments.length > 0) {
                    await tx.ganttTaskResourceAssignment.createMany({
                      data: task.resourceAssignments.map((ra: TaskResourceAssignment) => ({
                        id: ra.id,
                        taskId: task.id,
                        resourceId: ra.resourceId,
                        assignmentNotes: ra.assignmentNotes || '',
                        allocationPercentage: ra.allocationPercentage || 100,
                        assignedAt: new Date(ra.assignedAt || Date.now()),
                      })),
                      skipDuplicates: true, // Skip if assignment already exists
                    });
                  }
                }
              }
            }

            // Sync phase resource assignments
            if (phase.phaseResourceAssignments) {
              // Delete existing
              await tx.ganttPhaseResourceAssignment.deleteMany({
                where: { phaseId: phase.id },
              });

              // Recreate
              if (phase.phaseResourceAssignments.length > 0) {
                await tx.ganttPhaseResourceAssignment.createMany({
                  data: phase.phaseResourceAssignments.map((pra: PhaseResourceAssignment) => ({
                    id: pra.id,
                    phaseId: phase.id,
                    resourceId: pra.resourceId,
                    assignmentNotes: pra.assignmentNotes,
                    allocationPercentage: pra.allocationPercentage,
                    assignedAt: new Date(pra.assignedAt || Date.now()),
                  })),
                  skipDuplicates: true, // Skip if assignment already exists
                });
              }
            }
          }
        }
      }

      // 4. Handle milestone changes
      if (delta.milestones) {
        if (delta.milestones.deleted && delta.milestones.deleted.length > 0) {
          await tx.ganttMilestone.deleteMany({
            where: {
              id: { in: delta.milestones.deleted },
              projectId: projectId,
            },
          });
        }

        if (delta.milestones.created && delta.milestones.created.length > 0) {
          await tx.ganttMilestone.createMany({
            data: delta.milestones.created.map((m: GanttMilestone) => ({
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

        if (delta.milestones.updated && delta.milestones.updated.length > 0) {
          for (const m of delta.milestones.updated) {
            await tx.ganttMilestone.update({
              where: { id: m.id },
              data: {
                name: m.name,
                description: m.description,
                date: new Date(m.date),
                icon: m.icon,
                color: m.color,
              },
            });
          }
        }
      }

      // 5. Handle holiday changes
      if (delta.holidays) {
        if (delta.holidays.deleted && delta.holidays.deleted.length > 0) {
          await tx.ganttHoliday.deleteMany({
            where: {
              id: { in: delta.holidays.deleted },
              projectId: projectId,
            },
          });
        }

        if (delta.holidays.created && delta.holidays.created.length > 0) {
          await tx.ganttHoliday.createMany({
            data: delta.holidays.created.map((h: GanttHoliday) => ({
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

        if (delta.holidays.updated && delta.holidays.updated.length > 0) {
          for (const h of delta.holidays.updated) {
            await tx.ganttHoliday.update({
              where: { id: h.id },
              data: {
                name: h.name,
                date: new Date(h.date),
                region: h.region,
                type: h.type,
              },
            });
          }
        }
      }

      return project;
    }) as { id: string; updatedAt: Date } | null;

    const txDuration = Date.now() - txStartTime;
    const duration = Date.now() - startTime;

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found after update" }, { status: 404 });
    }

    // Audit log (non-critical)
    try {
      await prisma.audit_logs.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: "UPDATE",
          entity: "gantt_project",
          entityId: projectId,
          changes: delta,
        },
      });
    } catch (auditError) {
      if (isDev) console.error("[API Delta] Failed to create audit log:", auditError);
    }

    // Return minimal response
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
    const _duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[API Delta] Zod validation failed:", error.issues);
      }
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    // Log detailed error information (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error("[API Delta] Failed to update project:");
      console.error("Error:", error instanceof Error ? error.message : error);
    }

    // Handle Prisma-specific errors
    const prismaError = error as any;
    if (prismaError?.code && typeof prismaError.code === 'string') {
      const prismaCode = prismaError.code;
      if (prismaCode === "P2002") {
        const meta = prismaError.meta;
        const target = (meta?.target || []) as string[];
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
          },
          { status: 409 }
        );
      } else if (prismaCode === "P2003") {
        return NextResponse.json(
          {
            error: "Foreign key constraint violation",
            message: "Referenced record does not exist",
          },
          { status: 400 }
        );
      } else if (prismaCode === "P2025") {
        return NextResponse.json(
          { error: "Record not found", message: "The requested record was not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to update project",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
