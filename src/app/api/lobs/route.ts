/**
 * SAP Cockpit - LOBs API
 *
 * GET /api/lobs - Fetch all Lines of Business
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET handler for LOBs
 */
export async function GET() {
  try {
    const lobs = await prisma.lob.findMany({
      orderBy: { lobName: 'asc' },
      include: {
        _count: {
          select: { l3ScopeItems: true },
        },
      },
    });

    console.log(`[LOBs API] ✅ Found ${lobs.length} LOBs`);

    return NextResponse.json({
      success: true,
      count: lobs.length,
      lobs: lobs.map((lob) => ({
        id: lob.id,
        lobName: lob.lobName,
        l3Count: lob._count.l3ScopeItems,
        releaseTag: lob.releaseTag,
        navigatorSectionUrl: lob.navigatorSectionUrl,
      })),
    });
  } catch (error) {
    console.error('[LOBs API] ❌ Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lobs: [],
      },
      { status: 500 }
    );
  }
}
