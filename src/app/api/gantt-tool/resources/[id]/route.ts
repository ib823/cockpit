/**
 * Gantt Tool Resource API - Single Resource Operations
 *
 * GET    /api/gantt-tool/resources/[id]  - Get single resource
 * PATCH  /api/gantt-tool/resources/[id]  - Update resource
 * DELETE /api/gantt-tool/resources/[id]  - Delete resource (soft delete)
 *
 * Standards:
 * - All operations require authentication
 * - All operations validate user ownership of project
 * - Updates are validated (FK constraints, hierarchy integrity)
 * - Deletion checks for assignments and direct reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import {
  validateResourceData,
  canSetManager,
  canDeleteResource,
} from '@/lib/gantt-tool/resource-validator';

export const maxDuration = 10; // seconds

// Validation schema for updating resource
const UpdateResourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.enum([
    'leadership',
    'pm',
    'functional',
    'technical',
    'change',
    'qa',
    'basis',
    'security',
    'other',
  ]).optional(),
  description: z.string().max(1000).optional(),
  designation: z.enum([
    'principal',
    'director',
    'senior_manager',
    'manager',
    'senior_consultant',
    'consultant',
    'analyst',
    'subcontractor',
  ]).optional(),
  managerResourceId: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  projectRole: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  assignmentLevel: z.enum(['phase', 'task', 'both']).optional(),
  isBillable: z.boolean().optional(),
  chargeRatePerHour: z.number().positive().nullable().optional(),
  currency: z.string().nullable().optional(),
  utilizationTarget: z.number().min(0).max(100).nullable().optional(),
});

type UpdateResourceRequest = z.infer<typeof UpdateResourceSchema>;

// Helper: Get resource with ownership check
async function getResourceWithOwnershipCheck(
  resourceId: string,
  userId: string
) {
  const resource = await prisma.ganttResource.findFirst({
    where: {
      id: resourceId,
      project: {
        userId,
        deletedAt: null,
      },
    },
  });
  return resource;
}

// GET - Get single resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resource = await getResourceWithOwnershipCheck(id, session.user.id);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resource,
    });

  } catch (error) {
    console.error(`GET /api/gantt-tool/resources/[id] failed:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// PATCH - Update resource
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get existing resource with ownership check
    const existingResource = await getResourceWithOwnershipCheck(
      id,
      session.user.id
    );

    if (!existingResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parseResult = UpdateResourceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

    // If manager is being updated, validate the change
    if ('managerResourceId' in updates) {
      const allProjectResources = await prisma.ganttResource.findMany({
        where: { projectId: existingResource.projectId },
      });

      const managerCheckResult = canSetManager(
        id,
        updates.managerResourceId || null,
        allProjectResources
      );

      if (!managerCheckResult.valid) {
        return NextResponse.json(
          {
            error: 'Cannot update manager relationship',
            details: managerCheckResult.errors.map(e => ({
              code: e.code,
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
    }

    // Validate other resource data
    const allProjectResources = await prisma.ganttResource.findMany({
      where: { projectId: existingResource.projectId },
    });

    const validationResult = validateResourceData(
      { ...existingResource, ...updates },
      allProjectResources,
      false // isNew = false (update operation)
    );

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors.map(e => ({
            code: e.code,
            message: e.message,
            field: e.field,
          })),
        },
        { status: 400 }
      );
    }

    // Update resource
    const updated = await prisma.ganttResource.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Resource updated successfully`,
    });

  } catch (error) {
    console.error(`PATCH /api/gantt-tool/resources/[id] failed:`, error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resource = await getResourceWithOwnershipCheck(id, session.user.id);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Check if resource can be deleted
    const allProjectResources = await prisma.ganttResource.findMany({
      where: { projectId: resource.projectId },
    });

    // Check for assignments
    const assignmentCount = await prisma.ganttTaskResourceAssignment.count({
      where: { resourceId: id },
    });

    const phaseAssignmentCount = await prisma.ganttPhaseResourceAssignment.count({
      where: { resourceId: id },
    });

    const hasAssignments = assignmentCount > 0 || phaseAssignmentCount > 0;

    const deleteCheckResult = canDeleteResource(
      id,
      allProjectResources,
      hasAssignments
    );

    if (!deleteCheckResult.valid) {
      return NextResponse.json(
        {
          error: 'Cannot delete resource',
          details: deleteCheckResult.errors.map(e => ({
            code: e.code,
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Soft delete
    const deleted = await prisma.ganttResource.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: deleted,
      message: `Resource deleted successfully`,
    });

  } catch (error) {
    console.error(`DELETE /api/gantt-tool/resources/[id] failed:`, error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
