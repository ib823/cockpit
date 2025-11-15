/**
 * Gantt Tool Resource Validation API
 *
 * GET    /api/gantt-tool/resources/validate?projectId=xxx - Get validation report
 *
 * Returns detailed report on:
 * - Valid resources
 * - Orphaned resources (broken manager links)
 * - Circular references
 * - Missing assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  validateResourceHierarchy,
  getValidationSummary,
} from '@/lib/gantt-tool/resource-validator';

export const maxDuration = 10; // seconds

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

// GET - Get validation report
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

    // Get all resources
    const resources = await prisma.ganttResource.findMany({
      where: { projectId },
    });

    // Validate hierarchy
    const validationReport = validateResourceHierarchy(resources);

    // Additional stats
    const stats = {
      total: resources.length,
      active: resources.filter(r => r.isActive).length,
      archived: resources.filter(r => !r.isActive).length,
      rootLevel: resources.filter(r => !r.managerResourceId).length,
      inHierarchy: resources.filter(r => r.managerResourceId).length,
    };

    // Count by category
    const byCategory: Record<string, number> = {};
    resources.forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });

    // Check for unassigned resources
    const unassignedResources = await Promise.all(
      validationReport.valid.map(async (resource) => {
        const taskAssignments =
          await prisma.ganttTaskResourceAssignment.count({
            where: { resourceId: resource.id },
          });

        const phaseAssignments =
          await prisma.ganttPhaseResourceAssignment.count({
            where: { resourceId: resource.id },
          });

        return {
          resourceId: resource.id,
          name: resource.name,
          assigned: taskAssignments + phaseAssignments > 0,
          taskCount: taskAssignments,
          phaseCount: phaseAssignments,
        };
      })
    );

    const unassignedCount = unassignedResources.filter(
      r => !r.assigned
    ).length;

    return NextResponse.json({
      success: true,
      summary: getValidationSummary(validationReport),
      stats: {
        ...stats,
        unassigned: unassignedCount,
      },
      byCategory,
      report: {
        valid: validationReport.valid.map(r => ({
          id: r.id,
          name: r.name,
          designation: r.designation,
          category: r.category,
          managerResourceId: r.managerResourceId,
        })),
        orphaned: validationReport.orphaned.map(r => ({
          id: r.id,
          name: r.name,
          managerResourceId: r.managerResourceId,
          issue: 'Broken manager link - manager does not exist',
        })),
        circular: validationReport.circular.map(r => ({
          id: r.id,
          name: r.name,
          managerResourceId: r.managerResourceId,
          issue: 'Part of circular hierarchy',
        })),
        unassigned: unassignedResources.filter(r => !r.assigned),
      },
      recommendations: getRecommendations(validationReport, unassignedCount),
    });

  } catch (error) {
    console.error('GET /api/gantt-tool/resources/validate failed:', error);
    return NextResponse.json(
      { error: 'Failed to validate resources' },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on validation report
 */
function getRecommendations(
  report: ReturnType<typeof validateResourceHierarchy>,
  unassignedCount: number
): string[] {
  const recommendations: string[] = [];

  if (report.orphaned.length > 0) {
    recommendations.push(
      `⚠️  ${report.orphaned.length} orphaned resource(s) detected. These have broken manager links. Consider deleting or reassigning them.`
    );
  }

  if (report.circular.length > 0) {
    recommendations.push(
      `🔄 ${report.circular.length} resource(s) in circular hierarchy. Break the cycle by removing manager links.`
    );
  }

  if (unassignedCount > 0) {
    recommendations.push(
      `💡 ${unassignedCount} resource(s) are not assigned to any tasks/phases. Consider assigning them or removing if not needed.`
    );
  }

  if (report.orphaned.length === 0 && report.circular.length === 0) {
    recommendations.push('✅ Resource hierarchy is valid and consistent.');
  }

  return recommendations;
}
