import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/account/passkeys - List all passkeys
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all passkeys (authenticators) for the user
    const passkeys = await prisma.authenticator.findMany({
      where: { userId: user.id },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        deviceType: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    // Format for response
    const formattedPasskeys = passkeys.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      deviceType: p.deviceType,
      createdAt: p.createdAt.toISOString(),
      lastUsedAt: p.lastUsedAt.toISOString(),
    }));

    return NextResponse.json(formattedPasskeys);
  } catch (error) {
    console.error('Passkeys fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
