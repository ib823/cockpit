/**
 * Cockpit - LOBs API
 *
 * GET /api/lobs - Fetch all Lines of Business
 *
 * Performance optimizations:
 *   - Redis caching (24hr TTL)
 *   - Stale-while-revalidate
 */

import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withCache, CACHE_CONFIG, CacheKeys } from "@/lib/cache/redis-cache";

const prisma = new PrismaClient();

/**
 * GET handler for LOBs (with Redis caching)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    const result = await withCache(
      CacheKeys.lobsAll(),
      async () => {
        console.warn("[LOBs API] 🔄 Cache MISS - fetching from database");

        const lobs = await prisma.lob.findMany({
          orderBy: { lobName: "asc" },
          include: {
            _count: {
              select: { l3ScopeItems: true },
            },
          },
        });

        return {
          success: true,
          count: lobs.length,
          lobs: lobs.map((lob) => ({
            id: lob.id,
            lobName: lob.lobName,
            l3Count: lob._count.l3ScopeItems,
            releaseTag: lob.releaseTag,
            navigatorSectionUrl: lob.navigatorSectionUrl,
          })),
          cached: false,
          fetchedAt: new Date().toISOString(),
        };
      },
      CACHE_CONFIG.LOBS_TTL,
      {
        forceRefresh,
        staleWhileRevalidate: true,
      }
    );

    const duration = performance.now() - startTime;

    console.warn(`[LOBs API] ✅ Returned ${result.count} LOBs in ${duration.toFixed(2)}ms`);

    return NextResponse.json({
      ...result,
      cached: true,
      responseTime: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[LOBs API] ❌ Error after ${duration.toFixed(2)}ms:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lobs: [],
        cached: false,
      },
      { status: 500 }
    );
  }
}
