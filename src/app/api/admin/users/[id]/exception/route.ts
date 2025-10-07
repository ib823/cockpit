import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { exception } = await req.json().catch(() => ({ exception: false }));

    await prisma.user.update({
      where: { id },
      data: {
        exception,
        // If setting exception, extend expiry far into future
        ...(exception && {
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }),
      },
    });

    return NextResponse.json(
      { ok: true },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    if (e.message === 'forbidden') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('toggle exception error', e);
    return NextResponse.json(
      { error: 'Failed to update exception' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
