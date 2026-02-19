/**
 * Gantt Tool API - Projects List & Create
 *
 * GET  /api/gantt-tool/projects - List user's projects
 * POST /api/gantt-tool/projects - Create new project
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/db";
import { z } from "zod";
import { getDefaultHolidaysForProject } from "@/lib/gantt-tool/holiday-integration";

// Validation schema for creating a project
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  viewSettings: z.object({
    zoomLevel: z.enum(["day", "week", "month", "quarter", "half-year", "year"]),
    showWeekends: z.boolean(),
    showHolidays: z.boolean(),
    showMilestones: z.boolean(),
    showTaskDependencies: z.boolean(),
    showCriticalPath: z.boolean(),
    showTitles: z.boolean().optional(),
    barDurationDisplay: z.enum(["wd", "cd", "resource", "dates", "all", "clean"]).optional(),
  }),
  budget: z.any().optional(), // JSON field
});

// GET - List all projects for authenticated user (owned + shared)
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use withRetry wrapper for database queries
    // NOTE: This query loads full nested data for offline-first sync architecture
    // Fetch both owned projects and shared projects
    const projects = await withRetry(() =>
      prisma.ganttProject.findMany({
        where: {
          deletedAt: null,
          OR: [
            // Projects owned by the user
            { userId: session.user.id },
            // Projects shared with the user
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
          // Include collaboration info
          collaborators: {
            where: {
              userId: session.user.id,
            },
            select: {
              role: true,
              acceptedAt: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    );

    // Serialize dates to strings for frontend
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const serializedProjects = projects.map((project: any) => {
      const isOwner = project.userId === session.user.id;
      const collaboratorInfo = project.collaborators[0]; // Will have at most 1 entry due to where clause

      return {
        ...project,
        startDate: project.startDate.toISOString().split("T")[0],
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        deletedAt: project.deletedAt?.toISOString() || null,
        // Add ownership and collaboration metadata
        isOwner,
        owner: project.user,
        collaboratorRole: collaboratorInfo?.role || null,
        collaboratorAcceptedAt: collaboratorInfo?.acceptedAt?.toISOString() || null,
        phases: project.phases.map((phase: any) => ({
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
        milestones: project.milestones.map((m: any) => ({
          ...m,
          date: m.date.toISOString().split("T")[0],
        })),
        holidays: project.holidays.map((h: any) => ({
          ...h,
          date: h.date.toISOString().split("T")[0],
        })),
        resources: project.resources.map((r: any) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return NextResponse.json({ projects: serializedProjects }, { status: 200 });
  } catch (error) {
    console.error("[API] Failed to fetch gantt projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateProjectSchema.parse(body);

    // Check for duplicate project name (case-insensitive)
    const existingProject = await withRetry(() =>
      prisma.ganttProject.findFirst({
        where: {
          userId: session.user.id,
          name: {
            equals: validatedData.name,
            mode: "insensitive",
          },
          deletedAt: null,
        },
      })
    );

    if (existingProject) {
      return NextResponse.json(
        {
          error: `A project named "${validatedData.name}" already exists. Please choose a different name.`,
        },
        { status: 409 }
      );
    }

    // CRITICAL FIX: Generate default holidays for the project
    // This ensures working days calculations are accurate from day 1
    const defaultHolidays = getDefaultHolidaysForProject(
      new Date(validatedData.startDate),
      "ABMY" // Default to Malaysia, can be made configurable later
    );

    // Use transaction with retry for create + audit log + holidays
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const project = (await withRetry(() =>
      (prisma.$transaction as any)(async (tx: any) => {
        const newProject = await tx.ganttProject.create({
          data: {
            userId: session.user.id,
            name: validatedData.name,
            description: validatedData.description,
            startDate: new Date(validatedData.startDate),
            viewSettings: validatedData.viewSettings,
            budget: validatedData.budget || null,
          },
          include: {
            phases: true,
            milestones: true,
            holidays: true,
            resources: true,
          },
        });

        // CRITICAL FIX: Create default holidays for the project
        // This fixes the bug where holidays appeared on timeline but didn't affect working days
        if (defaultHolidays.length > 0) {
          await tx.ganttHoliday.createMany({
            data: defaultHolidays.map(h => ({
              id: h.id,
              projectId: newProject.id,
              name: h.name,
              date: new Date(h.date),
              region: h.region,
              type: h.type,
            })),
          });
        }

        // Fetch updated project with holidays
        const projectWithHolidays = await tx.ganttProject.findUnique({
          where: { id: newProject.id },
          include: {
            phases: true,
            milestones: true,
            holidays: true,
            resources: true,
          },
        });

        // Audit log
        await tx.audit_logs.create({
          data: {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: session.user.id,
            action: "CREATE",
            entity: "gantt_project",
            entityId: newProject.id,
            changes: {
              name: validatedData.name,
              startDate: validatedData.startDate,
              holidaysInitialized: defaultHolidays.length,
            },
          },
        });

        return projectWithHolidays;
      })
    )) as any;

    // Serialize dates to strings for frontend
    const serializedProject = {
      ...project,
      startDate: project.startDate.toISOString().split("T")[0],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deletedAt: project.deletedAt?.toISOString() || null,
      phases: project.phases.map((phase: any) => ({
        ...phase,
        startDate: phase.startDate.toISOString().split("T")[0],
        endDate: phase.endDate.toISOString().split("T")[0],
      })),
      milestones: project.milestones.map((m: any) => ({
        ...m,
        date: m.date.toISOString().split("T")[0],
      })),
      holidays: project.holidays.map((h: any) => ({
        ...h,
        date: h.date.toISOString().split("T")[0],
      })),
      resources: project.resources.map((r: any) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return NextResponse.json({ project: serializedProject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[API] Failed to create gantt project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
