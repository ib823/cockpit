/**
 * Gantt Tool API - Projects List & Create
 *
 * GET  /api/gantt-tool/projects - List user's projects
 * POST /api/gantt-tool/projects - Create new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a project
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  viewSettings: z.object({
    zoomLevel: z.enum(['day', 'week', 'month', 'quarter', 'half-year', 'year']),
    showWeekends: z.boolean(),
    showHolidays: z.boolean(),
    showMilestones: z.boolean(),
    showTaskDependencies: z.boolean(),
    showCriticalPath: z.boolean(),
    showTitles: z.boolean().optional(),
    barDurationDisplay: z.enum(['wd', 'cd', 'resource', 'dates', 'all', 'clean']).optional(),
  }),
  budget: z.any().optional(), // JSON field
});

// GET - List all projects for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.ganttProject.findMany({
      where: {
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
              orderBy: { order: 'asc' },
            },
            phaseResourceAssignments: true,
          },
          orderBy: { order: 'asc' },
        },
        milestones: {
          orderBy: { date: 'asc' },
        },
        holidays: {
          orderBy: { date: 'asc' },
        },
        resources: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Serialize dates to strings for frontend
    const serializedProjects = projects.map(project => ({
      ...project,
      startDate: project.startDate.toISOString().split('T')[0],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deletedAt: project.deletedAt?.toISOString() || null,
      phases: project.phases.map(phase => ({
        ...phase,
        startDate: phase.startDate.toISOString().split('T')[0],
        endDate: phase.endDate.toISOString().split('T')[0],
        tasks: phase.tasks.map(task => ({
          ...task,
          startDate: task.startDate.toISOString().split('T')[0],
          endDate: task.endDate.toISOString().split('T')[0],
          resourceAssignments: task.resourceAssignments.map(ra => ({
            ...ra,
            assignedAt: ra.assignedAt.toISOString(),
          })),
        })),
        phaseResourceAssignments: phase.phaseResourceAssignments.map(pra => ({
          ...pra,
          assignedAt: pra.assignedAt.toISOString(),
        })),
      })),
      milestones: project.milestones.map(m => ({
        ...m,
        date: m.date.toISOString().split('T')[0],
      })),
      holidays: project.holidays.map(h => ({
        ...h,
        date: h.date.toISOString().split('T')[0],
      })),
      resources: project.resources.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ projects: serializedProjects }, { status: 200 });
  } catch (error) {
    console.error('[API] Failed to fetch gantt projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateProjectSchema.parse(body);

    // Check for duplicate project name (case-insensitive)
    const existingProject = await prisma.ganttProject.findFirst({
      where: {
        userId: session.user.id,
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: `A project named "${validatedData.name}" already exists. Please choose a different name.` },
        { status: 409 }
      );
    }

    const project = await prisma.ganttProject.create({
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

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        action: 'CREATE',
        entity: 'gantt_project',
        entityId: project.id,
        changes: {
          name: validatedData.name,
          startDate: validatedData.startDate,
        },
      },
    });

    // Serialize dates to strings for frontend
    const serializedProject = {
      ...project,
      startDate: project.startDate.toISOString().split('T')[0],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deletedAt: project.deletedAt?.toISOString() || null,
      phases: project.phases.map(phase => ({
        ...phase,
        startDate: phase.startDate.toISOString().split('T')[0],
        endDate: phase.endDate.toISOString().split('T')[0],
      })),
      milestones: project.milestones.map(m => ({
        ...m,
        date: m.date.toISOString().split('T')[0],
      })),
      holidays: project.holidays.map(h => ({
        ...h,
        date: h.date.toISOString().split('T')[0],
      })),
      resources: project.resources.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ project: serializedProject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[API] Failed to create gantt project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
