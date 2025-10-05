import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
      },
      include: {
        authenticators: true,
        _count: {
          select: {
            auditEvents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usersWithStatus = users.map((user) => {
      const now = new Date();
      const hasPasskey = user.authenticators.length > 0;
      const expired = !user.exception && user.accessExpiresAt <= now;

      let status: 'active' | 'pending' | 'expired';
      if (expired) {
        status = 'expired';
      } else if (!hasPasskey || !user.firstLoginAt) {
        status = 'pending';
      } else {
        status = 'active';
      }

      return {
        id: user.id,
        email: user.email,
        status,
        exception: user.exception,
        accessExpiresAt: user.accessExpiresAt,
        firstLoginAt: user.firstLoginAt,
        lastLoginAt: user.lastLoginAt,
        timelinesGenerated: user.timelinesGenerated,
        lastTimelineAt: user.lastTimelineAt,
        createdAt: user.createdAt,
        hasPasskey,
      };
    });

    return NextResponse.json(
      { users: usersWithStatus },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    if (e.message === 'forbidden') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('users error', e);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
