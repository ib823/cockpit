/**
 * Gantt Tool API - Single Project Operations
 *
 * GET    /api/gantt-tool/projects/[projectId] - Get project details
 * PATCH  /api/gantt-tool/projects/[projectId] - Update project
 * DELETE /api/gantt-tool/projects/[projectId] - Delete project (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating a project
const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  viewSettings: z.any().optional(), // JSON field
  budget: z.any().optional(), // JSON field
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.ganttProject.findFirst({
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
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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
    };

    return NextResponse.json({ project: serializedProject }, { status: 200 });
  } catch (error) {
    console.error('[API] Failed to fetch gantt project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH - Update project (full state replacement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Check ownership
    const hasAccess = await checkProjectOwnership(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateProjectSchema.parse(body);

    // Check for duplicate project name if name is being updated
    if (validatedData.name) {
      const existingProject = await prisma.ganttProject.findFirst({
        where: {
          userId: session.user.id,
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          deletedAt: null,
          NOT: {
            id: projectId,
          },
        },
      });

      if (existingProject) {
        return NextResponse.json(
          { error: `A project named "${validatedData.name}" already exists. Please choose a different name.` },
          { status: 409 }
        );
      }
    }

    // Update project in transaction
    const updatedProject = await prisma.$transaction(async (tx) => {
      // Update main project fields
      const project = await tx.ganttProject.update({
        where: { id: projectId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
          viewSettings: validatedData.viewSettings,
          budget: validatedData.budget,
        },
      });

      // If phases provided, replace all phases
      if (validatedData.phases) {
        // Delete existing phases (cascade will delete tasks)
        await tx.ganttPhase.deleteMany({
          where: { projectId: projectId },
        });

        // Create new phases with tasks
        for (const phase of validatedData.phases) {
          await tx.ganttPhase.create({
            data: {
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
              tasks: {
                create: (phase.tasks || []).map((task: any, index: number) => ({
                  id: task.id,
                  name: task.name,
                  description: task.description,
                  startDate: new Date(task.startDate),
                  endDate: new Date(task.endDate),
                  progress: task.progress || 0,
                  assignee: task.assignee,
                  order: task.order !== undefined ? task.order : index,
                  dependencies: task.dependencies || [],
                  resourceAssignments: {
                    create: (task.resourceAssignments || []).map((ra: any) => ({
                      id: ra.id,
                      resourceId: ra.resourceId,
                      assignmentNotes: ra.assignmentNotes,
                      allocationPercentage: ra.allocationPercentage,
                      assignedAt: new Date(ra.assignedAt || Date.now()),
                    })),
                  },
                })),
              },
              phaseResourceAssignments: {
                create: (phase.phaseResourceAssignments || []).map((pra: any) => ({
                  id: pra.id,
                  resourceId: pra.resourceId,
                  assignmentNotes: pra.assignmentNotes,
                  allocationPercentage: pra.allocationPercentage,
                  assignedAt: new Date(pra.assignedAt || Date.now()),
                })),
              },
            },
          });
        }
      }

      // If milestones provided, replace all
      if (validatedData.milestones) {
        await tx.ganttMilestone.deleteMany({
          where: { projectId: projectId },
        });

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
        });
      }

      // If holidays provided, replace all
      if (validatedData.holidays) {
        await tx.ganttHoliday.deleteMany({
          where: { projectId: projectId },
        });

        await tx.ganttHoliday.createMany({
          data: validatedData.holidays.map((h: any) => ({
            id: h.id,
            projectId: projectId,
            name: h.name,
            date: new Date(h.date),
            region: h.region,
            type: h.type,
          })),
        });
      }

      // If resources provided, replace all
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
            description: r.description || '',
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
          })),
        });
      }

      return project;
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'gantt_project',
        entityId: projectId,
        changes: validatedData,
      },
    });

    // Fetch updated project with relations for serialization
    const fullProject = await prisma.ganttProject.findFirst({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            tasks: {
              include: { resourceAssignments: true },
              orderBy: { order: 'asc' },
            },
            phaseResourceAssignments: true,
          },
          orderBy: { order: 'asc' },
        },
        milestones: { orderBy: { date: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
        resources: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!fullProject) {
      return NextResponse.json({ error: 'Project not found after update' }, { status: 404 });
    }

    // Serialize dates to strings for frontend
    const serializedProject = {
      ...fullProject,
      startDate: fullProject.startDate.toISOString().split('T')[0],
      createdAt: fullProject.createdAt.toISOString(),
      updatedAt: fullProject.updatedAt.toISOString(),
      deletedAt: fullProject.deletedAt?.toISOString() || null,
      phases: fullProject.phases.map(phase => ({
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
      milestones: fullProject.milestones.map(m => ({
        ...m,
        date: m.date.toISOString().split('T')[0],
      })),
      holidays: fullProject.holidays.map(h => ({
        ...h,
        date: h.date.toISOString().split('T')[0],
      })),
      resources: fullProject.resources.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ project: serializedProject }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[API] Failed to update gantt project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Check ownership
    const hasAccess = await checkProjectOwnership(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
        action: 'DELETE',
        entity: 'gantt_project',
        entityId: projectId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[API] Failed to delete gantt project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
