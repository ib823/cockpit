/**
 * SAP Cockpit - L3 Catalog API
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
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET handler for L3 catalog
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const lobName = searchParams.get('lobName');
    const moduleFilter = searchParams.get('module');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');
    const includeMetrics = searchParams.get('includeMetrics') !== 'false';
    const includeIntegration = searchParams.get('includeIntegration') === 'true';

    console.log('[L3 Catalog API] Query params:', {
      lobName,
      module: moduleFilter,
      tier,
      search,
      includeMetrics,
      includeIntegration,
    });

    // Build where clause
    const where: any = {};

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
        { l3Code: { contains: search, mode: 'insensitive' } },
        { l3Name: { contains: search, mode: 'insensitive' } },
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
      orderBy: [
        { lob: { lobName: 'asc' } },
        { module: 'asc' },
        { l3Code: 'asc' },
      ],
    });

    console.log(`[L3 Catalog API] ✅ Found ${items.length} items`);

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
            integrationPackageAvailable:
              item.integrationDetails.integrationPackageAvailable,
            testScriptExists: item.integrationDetails.testScriptExists,
          },
        }),
    }));

    return NextResponse.json({
      success: true,
      count: transformed.length,
      items: transformed,
    });
  } catch (error) {
    console.error('[L3 Catalog API] ❌ Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        items: [],
      },
      { status: 500 }
    );
  }
}

