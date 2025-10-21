import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/nextauth-helpers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/admin/stats
 * Returns admin dashboard statistics
 */
export async function GET() {
  try {
    await requireAdmin();

    // Count total users (excluding admins)
    const totalUsers = await prisma.users.count({
      where: {
        role: { not: 'ADMIN' },
      },
    });

    // Count active projects (non-archived)
    const activeProjects = await prisma.projects.count({
      where: {
        status: { not: 'ARCHIVED' },
      },
    });

    // Count proposals (projects in review)
    const proposals = await prisma.projects.count({
      where: {
        status: 'IN_REVIEW',
      },
    });

    return NextResponse.json(
      {
        totalUsers,
        activeProjects,
        proposals,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    if (e.message === 'forbidden') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('admin stats error', e);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
