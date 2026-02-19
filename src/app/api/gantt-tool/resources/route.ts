/**
 * Gantt Tool Resource API - Collection Operations
 *
 * GET    /api/gantt-tool/resources?projectId=xxx  - Get all resources for project
 * POST   /api/gantt-tool/resources                 - Create new resource
 *
 * Standards:
 * - All operations require authentication
 * - All operations validate user ownership of project
 * - All resource data is validated before persistence
 * - FK constraints are checked (manager must exist)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validateResourceData } from '@/lib/gantt-tool/resource-validator';

export const maxDuration = 10; // seconds

// Validation schema for creating resource
const CreateResourceSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  name: z.string().min(1).max(255, 'Name too long'),
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
  ]),
  description: z.string().max(1000, 'Description too long'),
  designation: z.enum([
    'principal',
    'director',
    'senior_manager',
    'manager',
    'senior_consultant',
    'consultant',
    'analyst',
    'subcontractor',
  ]),
  managerResourceId: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  projectRole: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  assignmentLevel: z.enum(['phase', 'task', 'both']).optional().default('both'),
  isBillable: z.boolean().optional().default(false),
  chargeRatePerHour: z.number().positive().nullable().optional(),
  currency: z.string().nullable().optional(),
  utilizationTarget: z.number().min(0).max(100).nullable().optional(),
});

type _CreateResourceRequest = z.infer<typeof CreateResourceSchema>;

// Helper: Check project ownership
async function checkProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.ganttProject.findFirst({
    where: {
      id: projectId,
      userId,
      deletedAt: null,
    },
  });
  return project !== null;
}

// GET - Get all resources for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter required' },
        { status: 400 }
      );
    }

    // Check project ownership
    const hasAccess = await checkProjectOwnership(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all resources for project
    const resources = await prisma.ganttResource.findMany({
      where: {
        projectId,
        isActive: true, // Only return active resources by default
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: resources,
      count: resources.length,
    });

  } catch (error) {
    console.error('GET /api/gantt-tool/resources failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST - Create new resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = CreateResourceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: parseResult.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check project ownership
    const hasAccess = await checkProjectOwnership(data.projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all existing resources in project for validation
    const existingResources = await prisma.ganttResource.findMany({
      where: { projectId: data.projectId },
    });

    // Validate resource data (hierarchy, FK constraints, etc.)
    const validationResult = validateResourceData(
      {
        ...data,
        projectId: data.projectId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      existingResources,
      true // isNew
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

    // Create resource in database
    const resource = await prisma.ganttResource.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        category: data.category,
        description: data.description,
        designation: data.designation,
        managerResourceId: data.managerResourceId || null,
        email: data.email || null,
        department: data.department || null,
        location: data.location || null,
        projectRole: data.projectRole || null,
        companyName: data.companyName || null,
        assignmentLevel: data.assignmentLevel,
        isBillable: data.isBillable,
        chargeRatePerHour: data.chargeRatePerHour || null,
        currency: data.currency || null,
        utilizationTarget: data.utilizationTarget || null,
        isActive: true,
        validationStatus: 'valid',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    return NextResponse.json(
      {
        success: true,
        data: resource,
        message: `Resource "${resource.name}" created successfully`,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/gantt-tool/resources failed:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
