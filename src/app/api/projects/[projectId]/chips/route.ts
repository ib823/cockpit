import { NextResponse } from 'next/server';
import { dal } from '@/data/prisma-adapter';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const chips = await dal.listChips(projectId);
    return NextResponse.json(chips);
  } catch (error) {
    console.error('Failed to fetch chips:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
