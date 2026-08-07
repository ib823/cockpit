/**
 * Gantt Tool API - Delta Save Endpoint
 *
 * PATCH /api/gantt-tool/projects/[projectId]/delta - Update project incrementally
 *
 * Phase 2 Optimization: Only updates entities that changed (created/updated/deleted)
 * This is 10-100x faster than full state replacement for typical edits.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
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
import { logger } from "@/lib/logger";
import { checkProjectAccess } from "@/lib/gantt-tool/access-control";

// Increase function timeout for save operations (max 10s on Hobby, 60s on Pro)
export const maxDuration = 30; // seconds - increased for large projects with many resource assignments

/**
 * Raised when a delta references an entity that does not belong to the target
 * project. Surfaced to the caller as 403 rather than 404 so that the endpoint
 * does not confirm whether the foreign id exists.
 */
class DeltaOwnershipError extends Error {
  constructor(entity: string) {
    super(`Delta references ${entity} outside the target project`);
    this.name = "DeltaOwnershipError";
  }
}

/**
 * Verifies every client-supplied entity id in the delta actually belongs to
 * `projectId` before any write runs.
 *
 * Write access is checked against the project, but the per-entity ids arrive
 * from the client. Without this guard a caller with write access to their own
 * project can name another project's phase/resource/milestone/holiday id and
 * have the update — or the phase task re-sync — applied there.
 *
 * Fails closed: a single foreign id aborts the whole transaction.
 */
async function assertDeltaOwnership(
  tx: typeof prisma,
  projectId: string,
  delta: {
    resources?: { updated?: unknown[] };
    phases?: { updated?: unknown[] };
    tasks?: { updated?: unknown[]; deleted?: string[] };
    milestones?: { updated?: unknown[] };
    holidays?: { updated?: unknown[] };
  }
): Promise<void> {
  const ids = (rows: unknown[] | undefined): string[] =>
    (rows ?? []).map((r) => (r as { id?: unknown }).id).filter((id): id is string => typeof id === "string");

  const checks: Array<{ entity: string; ids: string[]; count: (ids: string[]) => Promise<number> }> = [
    {
      entity: "resource",
      ids: ids(delta.resources?.updated),
      count: (list) => tx.ganttResource.count({ where: { id: { in: list }, projectId } }),
    },
    {
      entity: "phase",
      ids: ids(delta.phases?.updated),
      count: (list) => tx.ganttPhase.count({ where: { id: { in: list }, projectId } }),
    },
    {
      // Tasks are owned transitively, through their phase.
      entity: "task",
      ids: [...ids(delta.tasks?.updated), ...(delta.tasks?.deleted ?? [])],
      count: (list) =>
        tx.ganttTask.count({ where: { id: { in: list }, phase: { projectId } } }),
    },
    {
      entity: "milestone",
      ids: ids(delta.milestones?.updated),
      count: (list) => tx.ganttMilestone.count({ where: { id: { in: list }, projectId } }),
    },
    {
      entity: "holiday",
      ids: ids(delta.holidays?.updated),
      count: (list) => tx.ganttHoliday.count({ where: { id: { in: list }, projectId } }),
    },
  ];

  for (const check of checks) {
    const unique = Array.from(new Set(check.ids));
    if (unique.length === 0) continue;
    const owned = await check.count(unique);
    if (owned !== unique.length) {
      throw new DeltaOwnershipError(check.entity);
    }
  }
}

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
      viewSettings: z.record(z.string(), z.unknown()).optional(),
      budget: z.record(z.string(), z.unknown()).optional(),
      orgChart: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  phases: z
    .object({
      created: z.array(z.record(z.string(), z.unknown())).optional(),
      updated: z.array(z.record(z.string(), z.unknown())).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  tasks: z
    .object({
      created: z.array(z.record(z.string(), z.unknown())).optional(),
      updated: z.array(z.record(z.string(), z.unknown())).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  resources: z
    .object({
      created: z.array(z.record(z.string(), z.unknown())).optional(),
      updated: z.array(z.record(z.string(), z.unknown())).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  milestones: z
    .object({
      created: z.array(z.record(z.string(), z.unknown())).optional(),
      updated: z.array(z.record(z.string(), z.unknown())).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
  holidays: z
    .object({
      created: z.array(z.record(z.string(), z.unknown())).optional(),
      updated: z.array(z.record(z.string(), z.unknown())).optional(),
      deleted: z.array(z.string()).optional(),
    })
    .optional(),
});

// PATCH - Update project with delta (incremental changes only)
export const PATCH = withAuth<{ params: Promise<{ projectId: string }> }>(
  async (request, auth, { params }) => {
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV === "development";

  try {
    const { projectId } = await params;

    // Require write access — owner or EDITOR collaborator (VIEWERs are blocked).
    const access = await checkProjectAccess(projectId, auth.userId);
    if (!access.canWrite) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      if (isDev) logger.error("[API Delta] Failed to parse JSON", { error: jsonError });
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const delta = DeltaSaveSchema.parse(body);

    // Check for duplicate project name if name is being updated
    if (delta.projectUpdates?.name) {
      const existingProject = await prisma.ganttProject.findFirst({
        where: {
          userId: auth.userId,
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

    const updatedProject: { id: string; updatedAt: Date } | null = await (prisma.$transaction as unknown as (fn: (tx: typeof prisma) => Promise<{ id: string; updatedAt: Date } | null>) => Promise<{ id: string; updatedAt: Date } | null>)(async (tx) => {
      // 0. Authorize every client-supplied entity id against this project
      // before any write runs. Route-level access only proves the caller may
      // write to `projectId`, not that the ids in the delta live there.
      await assertDeltaOwnership(tx, projectId, delta);

      // 1. Update project-level fields if any changed
      let project: { id: string; updatedAt: Date } | null;
      if (delta.projectUpdates && Object.keys(delta.projectUpdates).length > 0) {
        const updates: Record<string, unknown> = { ...delta.projectUpdates };
        if (updates.startDate) {
          updates.startDate = new Date(updates.startDate as string | number | Date);
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
            data: (delta.resources.created as unknown as Resource[]).map((r) => ({
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
          for (const r of delta.resources.updated as unknown as Resource[]) {
            await tx.ganttResource.updateMany({
              where: { id: r.id, projectId },
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
            data: (delta.phases.created as unknown as GanttPhase[]).map((phase) => ({
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

          // Batch-create all tasks, task assignments, and phase assignments
          // across the newly created phases — one query each instead of
          // per-phase/per-task round-trips inside the transaction.
          const createdPhases = delta.phases.created as unknown as GanttPhase[];

          const newTasks = createdPhases.flatMap((phase) =>
            (phase.tasks ?? []).map((task, index: number) => ({
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
            }))
          );
          if (newTasks.length > 0) {
            await tx.ganttTask.createMany({ data: newTasks, skipDuplicates: true });
          }

          const newTaskAssignments = createdPhases.flatMap((phase) =>
            (phase.tasks ?? []).flatMap((task) =>
              (task.resourceAssignments ?? []).map((ra) => ({
                id: ra.id,
                taskId: task.id,
                resourceId: ra.resourceId,
                assignmentNotes: ra.assignmentNotes || "",
                allocationPercentage: ra.allocationPercentage || 100,
                assignedAt: new Date(ra.assignedAt || Date.now()),
              }))
            )
          );
          if (newTaskAssignments.length > 0) {
            await tx.ganttTaskResourceAssignment.createMany({
              data: newTaskAssignments,
              skipDuplicates: true,
            });
          }

          const newPhaseAssignments = createdPhases.flatMap((phase) =>
            (phase.phaseResourceAssignments ?? []).map((pra) => ({
              id: pra.id,
              phaseId: phase.id,
              resourceId: pra.resourceId,
              assignmentNotes: pra.assignmentNotes,
              allocationPercentage: pra.allocationPercentage,
              assignedAt: new Date(pra.assignedAt || Date.now()),
            }))
          );
          if (newPhaseAssignments.length > 0) {
            await tx.ganttPhaseResourceAssignment.createMany({
              data: newPhaseAssignments,
              skipDuplicates: true,
            });
          }
        }

        // Update phases
        if (delta.phases.updated && delta.phases.updated.length > 0) {
          const updatedPhases = delta.phases.updated as unknown as GanttPhase[];

          // Phase rows carry distinct data, so update them individually.
          for (const phase of updatedPhases) {
            await tx.ganttPhase.updateMany({
              where: { id: phase.id, projectId },
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
          }

          // Re-sync tasks for phases that provided a `tasks` array.
          //
          // This diffs rather than replaces. It used to delete every task in
          // the phase and recreate whatever the payload contained, which meant
          // a payload missing a task silently destroyed it — and destroyed its
          // resource assignments with it via cascade. Nothing on the server
          // guarantees the client sends a complete array, so that invariant was
          // implicit and unguarded. Proven against a real database in
          // tests/integration/delta-task-persistence.int.test.ts.
          const phasesWithTasks = updatedPhases.filter((p) => p.tasks !== undefined);
          if (phasesWithTasks.length > 0) {
            const syncedPhaseIds = phasesWithTasks.map((p) => p.id);

            // Existing rows, scoped through the phase relation so a foreign
            // phase id can never widen the set (see assertDeltaOwnership).
            const existingTasks = await tx.ganttTask.findMany({
              where: { phaseId: { in: syncedPhaseIds }, phase: { projectId } },
              select: { id: true, phaseId: true },
            });
            const existingTaskIds = new Set(existingTasks.map((t) => t.id));

            const payloadTasks = phasesWithTasks.flatMap((phase) =>
              (phase.tasks ?? []).map((task, index: number) => ({
                phase,
                task,
                row: {
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
                },
              }))
            );

            // Deliberately NO delete-by-omission.
            //
            // A phase payload cannot distinguish "the user deleted this task"
            // from "the client did not send it". Treating absence as deletion
            // is what destroyed data here, and a diff alone does not fix that —
            // it only makes the destruction tidier. In a local-first app whose
            // client may hold a partial or stale copy, absence must mean
            // "unchanged".
            //
            // Deletion is therefore explicit only, via `delta.tasks.deleted`,
            // where the client states the intent rather than implying it.

            // Create the genuinely new ones.
            const newTaskRows = payloadTasks
              .filter((t) => !existingTaskIds.has(t.row.id))
              .map((t) => t.row);
            if (newTaskRows.length > 0) {
              await tx.ganttTask.createMany({ data: newTaskRows, skipDuplicates: true });
            }

            // Update the survivors in place, so their identity — and anything
            // referencing it — is preserved.
            for (const { row } of payloadTasks.filter((t) => existingTaskIds.has(t.row.id))) {
              const { id, ...fields } = row;
              await tx.ganttTask.updateMany({
                where: { id, phase: { projectId } },
                data: fields,
              });
            }

            // Resource assignments now need explicit reconciliation. While tasks
            // were delete-and-recreated their assignments were swept away by
            // cascade, so a bare createMany sufficed. Surviving tasks keep their
            // assignments, so an assignment the user removed would otherwise
            // persist forever.
            //
            // Only tasks that actually supplied `resourceAssignments` are
            // touched; `undefined` means "not specified", not "empty".
            const tasksWithAssignments = payloadTasks.filter(
              (t) => t.task.resourceAssignments !== undefined
            );
            if (tasksWithAssignments.length > 0) {
              const assignmentTaskIds = tasksWithAssignments.map((t) => t.row.id);
              const keepAssignmentIds = tasksWithAssignments.flatMap((t) =>
                (t.task.resourceAssignments ?? []).map((ra) => ra.id)
              );

              await tx.ganttTaskResourceAssignment.deleteMany({
                where: {
                  taskId: { in: assignmentTaskIds },
                  ...(keepAssignmentIds.length > 0 ? { id: { notIn: keepAssignmentIds } } : {}),
                  task: { phase: { projectId } },
                },
              });

              const assignmentRows = tasksWithAssignments.flatMap((t) =>
                (t.task.resourceAssignments ?? []).map((ra) => ({
                  id: ra.id,
                  taskId: t.row.id,
                  resourceId: ra.resourceId,
                  assignmentNotes: ra.assignmentNotes || "",
                  allocationPercentage: ra.allocationPercentage || 100,
                  assignedAt: new Date(ra.assignedAt || Date.now()),
                }))
              );
              if (assignmentRows.length > 0) {
                await tx.ganttTaskResourceAssignment.createMany({
                  data: assignmentRows,
                  skipDuplicates: true,
                });
              }
            }
          }

          // Re-sync phase resource assignments for phases that provided them.
          const phasesWithPRA = updatedPhases.filter(
            (p) => p.phaseResourceAssignments !== undefined
          );
          if (phasesWithPRA.length > 0) {
            await tx.ganttPhaseResourceAssignment.deleteMany({
              where: {
                phaseId: { in: phasesWithPRA.map((p) => p.id) },
                phase: { projectId },
              },
            });

            const phaseAssignmentsToCreate = phasesWithPRA.flatMap((phase) =>
              (phase.phaseResourceAssignments ?? []).map((pra) => ({
                id: pra.id,
                phaseId: phase.id,
                resourceId: pra.resourceId,
                assignmentNotes: pra.assignmentNotes,
                allocationPercentage: pra.allocationPercentage,
                assignedAt: new Date(pra.assignedAt || Date.now()),
              }))
            );
            if (phaseAssignmentsToCreate.length > 0) {
              await tx.ganttPhaseResourceAssignment.createMany({
                data: phaseAssignmentsToCreate,
                skipDuplicates: true,
              });
            }
          }
        }
      }

      // 3b. Handle task-level changes.
      //
      // `delta.tasks` was accepted by DeltaSaveSchema and read by nothing, so a
      // task edit could only reach the database through the phase path — which
      // is why a partial phase payload destroyed siblings. Handling tasks
      // directly lets a client change one task without restating its phase.
      if (delta.tasks) {
        if (delta.tasks.deleted && delta.tasks.deleted.length > 0) {
          await tx.ganttTask.deleteMany({
            where: { id: { in: delta.tasks.deleted }, phase: { projectId } },
          });
        }

        if (delta.tasks.created && delta.tasks.created.length > 0) {
          await tx.ganttTask.createMany({
            data: (delta.tasks.created as unknown as (GanttTask & { phaseId: string })[]).map(
              (t, index) => ({
                id: t.id,
                phaseId: t.phaseId,
                name: t.name,
                description: t.description,
                startDate: new Date(t.startDate),
                endDate: new Date(t.endDate),
                progress: t.progress || 0,
                assignee: t.assignee,
                order: t.order !== undefined ? t.order : index,
                dependencies: t.dependencies || [],
              })
            ),
            skipDuplicates: true,
          });
        }

        if (delta.tasks.updated && delta.tasks.updated.length > 0) {
          for (const t of delta.tasks.updated as unknown as GanttTask[]) {
            await tx.ganttTask.updateMany({
              // Scoped through the phase relation, so a foreign task id cannot
              // be written even though the caller owns this project.
              where: { id: t.id, phase: { projectId } },
              data: {
                name: t.name,
                description: t.description,
                startDate: new Date(t.startDate),
                endDate: new Date(t.endDate),
                progress: t.progress || 0,
                assignee: t.assignee,
                ...(t.order !== undefined ? { order: t.order } : {}),
                dependencies: t.dependencies || [],
              },
            });
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
            data: (delta.milestones.created as unknown as GanttMilestone[]).map((m) => ({
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
          for (const m of delta.milestones.updated as unknown as GanttMilestone[]) {
            await tx.ganttMilestone.updateMany({
              where: { id: m.id, projectId },
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
            data: (delta.holidays.created as unknown as GanttHoliday[]).map((h) => ({
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
          for (const h of delta.holidays.updated as unknown as GanttHoliday[]) {
            await tx.ganttHoliday.updateMany({
              where: { id: h.id, projectId },
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
          userId: auth.userId,
          action: "UPDATE",
          entity: "gantt_project",
          entityId: projectId,
          changes: delta,
        },
      });
    } catch (auditError) {
      if (isDev) logger.error("[API Delta] Failed to create audit log", { error: auditError });
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

    if (error instanceof DeltaOwnershipError) {
      logger.warn("[API Delta] Cross-project entity reference rejected", {
        userId: auth.userId,
        projectId: (await params).projectId,
        reason: error.message,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("[API Delta] Zod validation failed", { value: error.issues });
      }
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    // Log detailed error information (only in development)
    if (process.env.NODE_ENV === "development") {
      logger.error("[API Delta] Failed to update project", { error });
    }

    // Handle Prisma-specific errors
    const prismaError = error as { code?: string; meta?: { target?: string[]; field_name?: string } };
    if (prismaError?.code && typeof prismaError.code === 'string') {
      const prismaCode = prismaError.code;
      if (prismaCode === "P2002") {
        const meta = prismaError.meta;
        const target = (meta?.target || []) as string[];
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
          },
          { status: 409 }
        );
      } else if (prismaCode === "P2003") {
        const meta = prismaError.meta;
        const fieldName = meta?.field_name || "unknown";

        return NextResponse.json(
          {
            error: "Foreign key constraint violation",
            code: "FOREIGN_KEY_VIOLATION",
            message: `Referenced record does not exist (field: ${fieldName}). The data you're trying to save references a resource, phase, or task that was deleted. Please refresh the page to sync with the latest state.`,
          },
          { status: 400 }
        );
      } else if (prismaCode === "P2025") {
        return NextResponse.json(
          {
            error: "Record not found",
            code: "RECORD_NOT_FOUND",
            message: "The requested record was not found",
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to update project",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
});
