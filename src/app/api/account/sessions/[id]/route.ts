import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getToken } from 'next-auth/jwt';

// DELETE /api/account/sessions/:id - Revoke a session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get current session token
    const token = await getToken({ req });
    const currentSessionToken = token?.sessionToken as string | undefined;

    // Find the session to revoke
    const sessionToRevoke = await prisma.sessions.findUnique({
      where: { id },
    });

    if (!sessionToRevoke) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify the session belongs to the user
    if (sessionToRevoke.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prevent revoking current session
    if (sessionToRevoke.sessionToken === currentSessionToken) {
      return NextResponse.json(
        { error: 'Cannot revoke current session. Please logout instead.' },
        { status: 400 }
      );
    }

    // Delete the session
    await prisma.sessions.delete({
      where: { id },
    });

    // Audit log the revocation
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        action: 'DELETE',
        entity: 'SESSION',
        entityId: id,
        changes: {
          revokedSession: {
            id: sessionToRevoke.id,
            ipAddress: sessionToRevoke.ipAddress,
          },
        },
        ipAddress: ip,
        userAgent: userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session revoke error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
