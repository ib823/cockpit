import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json(
        { isAdmin: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const isAdmin = !!user && user.role === 'ADMIN';

    return NextResponse.json(
      { isAdmin },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('check-admin error', e);
    return NextResponse.json(
      { isAdmin: false },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
