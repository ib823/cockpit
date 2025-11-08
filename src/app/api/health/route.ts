/**
 * Health Check Endpoint
 *
 * GET /api/health - Check system health including database connection
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity with detailed health info
    const dbHealth = await checkDatabaseHealth();
    const responseTime = Date.now() - startTime;

    if (!dbHealth.healthy) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'down',
            api: 'up',
          },
          database: {
            latency: dbHealth.latency,
            error: dbHealth.error,
          },
          responseTimeMs: responseTime,
          environment: {
            nodeEnv: process.env.NODE_ENV,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'up',
          api: 'up',
        },
        database: {
          latency: dbHealth.latency,
        },
        responseTimeMs: responseTime,
        environment: {
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    console.error('[Health] Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'error',
          api: 'degraded',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs: responseTime,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
      },
      { status: 500 }
    );
  }
}
