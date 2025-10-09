import { prisma } from '@/lib/db';
import { getSession } from '@/lib/nextauth-helpers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const projects = await prisma.projects.findMany({
    where: { ownerId: user.id },
    include: { chips: true, phases: true },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const data = await req.json();

  const project = await prisma.projects.create({
    data: {
      name: data.name || 'Untitled Project',
      ownerId: user.id,
      status: 'DRAFT',
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(project);
}