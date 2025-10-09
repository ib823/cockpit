import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/nextauth-helpers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.users.delete({
      where: { id },
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
    console.error('delete user error', e);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
