import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/nextauth-helpers';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.users.findMany({
      where: {
        role: { not: 'ADMIN' },
      },
      include: {
        Authenticator: true,
        _count: {
          select: {
            AuditEvent: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usersWithStatus = users.map((user) => {
      const now = new Date();
      const hasPasskey = user.Authenticator.length > 0;
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
        name: user.name,
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

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { email, name, role, accessExpiresAt, exception } = body;

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (role && !['USER', 'MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be USER, MANAGER, or ADMIN' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate random ID
    const id = randomBytes(16).toString('hex');

    // Calculate access expiration (default 90 days from now)
    const expiresAt = accessExpiresAt
      ? new Date(accessExpiresAt)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Create user
    const user = await prisma.users.create({
      data: {
        id,
        email,
        name: name || null,
        role: role || 'USER',
        accessExpiresAt: expiresAt,
        exception: exception || false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { user },
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    if (e.message === 'forbidden') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('create user error', e);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
