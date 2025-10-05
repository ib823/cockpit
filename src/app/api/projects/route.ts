import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    include: { chips: true, phases: true },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const data = await req.json();
  
  const project = await prisma.project.create({
    data: {
      name: data.name || 'Untitled Project',
      ownerId: user.id,
      status: 'DRAFT',
    },
  });

  return NextResponse.json(project);
}