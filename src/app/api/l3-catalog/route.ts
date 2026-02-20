/**
 * Cockpit - L3 Catalog API
 *
 * GET /api/l3-catalog - Fetch L3 scope items with filtering
 *
 * Query parameters:
 *   - lobName: Filter by LOB name
 *   - module: Filter by module
 *   - tier: Filter by complexity tier (A, B, C, D)
 *   - search: Search in l3Name and l3Code
 *   - includeMetrics: Include complexity metrics (default: true)
 *   - includeIntegration: Include integration details (default: false)
 *
 * Performance optimizations:
 *   - Redis caching (24hr TTL) - 90%+ query reduction
 *   - Smart cache keys per filter combination
 *   - Stale-while-revalidate for zero downtime
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withCache, CACHE_CONFIG, cache } from "@/lib/cache/redis-cache";
import { requireAdmin } from "@/lib/nextauth-helpers";

const prisma = new PrismaClient();

/**
 * GET handler for L3 catalog (with Redis caching)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const lobName = searchParams.get("lobName");
    const moduleFilter = searchParams.get("module");
    const tier = searchParams.get("tier");
    const search = searchParams.get("search");
    const includeMetrics = searchParams.get("includeMetrics") !== "false";
    const includeIntegration = searchParams.get("includeIntegration") === "true";
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    // Query params logged for debugging (development only)
    if (process.env.NODE_ENV === "development") {
      console.warn("[L3 Catalog API] Query params:", {
        lobName,
        module: moduleFilter,
        tier,
        search,
        includeMetrics,
        includeIntegration,
        forceRefresh,
      });
    }

    // Generate cache key based on query params
    const cacheKeyParts = ["l3", "catalog"];
    if (lobName) cacheKeyParts.push(`lob=${lobName}`);
    if (moduleFilter) cacheKeyParts.push(`module=${moduleFilter}`);
    if (tier) cacheKeyParts.push(`tier=${tier}`);
    if (search) cacheKeyParts.push(`search=${search}`);
    if (includeMetrics) cacheKeyParts.push("metrics");
    if (includeIntegration) cacheKeyParts.push("integration");
    const cacheKey = cacheKeyParts.join(":");

    // Fetch with caching
    const result = await withCache(
      cacheKey,
      async () => {
        console.warn("[L3 Catalog API] 🔄 Cache MISS - fetching from database");

        // Build where clause
        const where: Record<string, unknown> = {};

        if (lobName) {
          where.lob = { lobName };
        }

        if (moduleFilter) {
          where.module = moduleFilter;
        }

        if (tier) {
          where.complexityMetrics = {
            defaultTier: tier,
          };
        }

        if (search) {
          where.OR = [
            { l3Code: { contains: search, mode: "insensitive" } },
            { l3Name: { contains: search, mode: "insensitive" } },
          ];
        }

        // Fetch L3 items with includes
        const items = await prisma.l3ScopeItem.findMany({
          where,
          include: {
            lob: true,
            ...(includeMetrics && {
              complexityMetrics: true,
            }),
            ...(includeIntegration && {
              integrationDetails: true,
            }),
          },
          orderBy: [{ lob: { lobName: "asc" } }, { module: "asc" }, { l3Code: "asc" }],
        });

        // Transform to match frontend types
        const transformed = items.map((item) => ({
          id: item.id,
          l3Code: item.l3Code,
          l3Name: item.l3Name,
          lobName: item.lob.lobName,
          module: item.module,
          processNavigatorUrl: item.processNavigatorUrl,
          releaseTag: item.releaseTag,
          ...(includeMetrics &&
            item.complexityMetrics && {
              complexityMetrics: {
                defaultTier: item.complexityMetrics.defaultTier,
                coefficient: item.complexityMetrics.coefficient,
                tierRationale: item.complexityMetrics.tierRationale,
                crossModuleTouches: item.complexityMetrics.crossModuleTouches,
                localizationFlag: item.complexityMetrics.localizationFlag,
                extensionRisk: item.complexityMetrics.extensionRisk,
              },
            }),
          ...(includeIntegration &&
            item.integrationDetails && {
              integrationDetails: {
                integrationPackageAvailable: item.integrationDetails.integrationPackageAvailable,
                testScriptExists: item.integrationDetails.testScriptExists,
              },
            }),
        }));

        return {
          success: true,
          count: transformed.length,
          items: transformed,
          cached: false,
          fetchedAt: new Date().toISOString(),
        };
      },
      CACHE_CONFIG.L3_CATALOG_TTL,
      {
        forceRefresh,
        staleWhileRevalidate: true, // Return stale data while refreshing
      }
    );

    const duration = performance.now() - startTime;

    console.warn(`[L3 Catalog API] ✅ Returned ${result.count} items in ${duration.toFixed(2)}ms`);

    // Add cache hit indicator
    return NextResponse.json({
      ...result,
      cached: true,
      responseTime: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[L3 Catalog API] ❌ Error after ${duration.toFixed(2)}ms:`, error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch catalog",
        items: [],
        cached: false,
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for cache invalidation (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { action } = await request.json();

    if (action === "invalidate") {
      // Invalidate all L3 catalog cache
      await cache.deletePattern("l3:catalog:*");

      console.warn("[L3 Catalog API] 🗑️  Cache invalidated");

      return NextResponse.json({
        success: true,
        message: "L3 catalog cache invalidated",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "unauthorized") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "forbidden") {
        return NextResponse.json(
          { success: false, error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }

    console.error("[L3 Catalog API] ❌ POST Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update catalog",
      },
      { status: 500 }
    );
  }
}
