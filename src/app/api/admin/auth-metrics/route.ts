import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getAuthMetricsSummary,
  getAuthSuccessRate,
  getRecentFailedAttempts,
  checkForSuspiciousActivity,
} from '@/lib/monitoring/auth-metrics';

export const runtime = 'nodejs';

/**
 * GET /api/admin/auth-metrics
 *
 * Returns authentication metrics and success rates.
 * Requires ADMIN role.
 */
export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        const summary = await getAuthMetricsSummary();
        return NextResponse.json({ ok: true, data: summary });
      }

      case 'rate': {
        const period = searchParams.get('period') || '24h';
        const method = searchParams.get('method') as any;

        let startDate: Date;
        const endDate = new Date();

        switch (period) {
          case '1h':
            startDate = new Date(Date.now() - 60 * 60 * 1000);
            break;
          case '24h':
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }

        const rate = await getAuthSuccessRate(startDate, endDate, method);
        return NextResponse.json({
          ok: true,
          data: {
            period,
            method: method || 'all',
            ...rate,
          },
        });
      }

      case 'failures': {
        const minutes = parseInt(searchParams.get('minutes') || '15', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const failures = await getRecentFailedAttempts(minutes, limit);
        return NextResponse.json({
          ok: true,
          data: {
            minutes,
            count: failures.length,
            failures,
          },
        });
      }

      case 'alerts': {
        const activity = await checkForSuspiciousActivity();
        return NextResponse.json({
          ok: true,
          data: activity,
        });
      }

      default:
        return NextResponse.json(
          { ok: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AUTH METRICS API] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
