/**
 * Authentication Metrics Tracking
 *
 * Tracks authentication success rates, failed attempts, and security events.
 * Integrates with PostHog for real-time analytics and alerting.
 */

import { prisma } from '@/lib/db';
import posthog from './posthog';

export type AuthEventType =
  | 'login_success'
  | 'login_failure'
  | 'otp_success'
  | 'otp_failure'
  | 'magic_link_success'
  | 'magic_link_failure'
  | 'admin_login_success'
  | 'admin_login_failure'
  | 'webauthn_success'
  | 'webauthn_failure'
  | 'session_expired'
  | 'account_locked'
  | 'rate_limit_exceeded';

export type AuthMethod = 'passkey' | 'otp' | 'magic-link' | 'admin';

export interface AuthEventMetadata {
  ipAddress?: string;
  userAgent?: string;
  email?: string;
  failureReason?: string;
  method?: AuthMethod;
  deviceType?: string;
  location?: string;
}

/**
 * Log an authentication event to both database and analytics
 */
export async function logAuthEvent(
  type: AuthEventType,
  metadata: AuthEventMetadata,
  userId?: string
): Promise<void> {
  try {
    // Determine if this is a success or failure
    const isSuccess = type.includes('_success');
    const isFailure = type.includes('_failure');

    // Log to database audit events if user is identified
    if (userId) {
      await prisma.auditEvent.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type,
          meta: {
            ...metadata,
            success: isSuccess,
            failure: isFailure,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    // Log to PostHog for analytics
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('auth_event', {
        event_type: type,
        success: isSuccess,
        failure: isFailure,
        method: metadata.method,
        failure_reason: metadata.failureReason,
        ip_address: metadata.ipAddress,
        device_type: metadata.deviceType,
        user_id: userId,
        email: metadata.email,
      });
    }

    // Log critical failures to console for alerting
    if (isFailure || type === 'rate_limit_exceeded' || type === 'account_locked') {
      console.warn('[AUTH METRICS]', {
        type,
        email: metadata.email,
        ipAddress: metadata.ipAddress,
        reason: metadata.failureReason,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[AUTH METRICS] Failed to log auth event:', error);
    // Don't throw - logging should not break auth flow
  }
}

/**
 * Get authentication success rate for a time period
 */
export async function getAuthSuccessRate(
  startDate: Date,
  endDate: Date,
  method?: AuthMethod
): Promise<{
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  byMethod: Record<AuthMethod, { total: number; successful: number; failed: number; rate: number }>;
}> {
  const events = await prisma.auditEvent.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      type: {
        in: [
          'login_success',
          'login_failure',
          'otp_success',
          'otp_failure',
          'magic_link_success',
          'magic_link_failure',
          'admin_login_success',
          'admin_login_failure',
          'webauthn_success',
          'webauthn_failure',
        ],
      },
    },
    select: {
      type: true,
      meta: true,
    },
  });

  const stats = {
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
    byMethod: {
      passkey: { total: 0, successful: 0, failed: 0, rate: 0 },
      otp: { total: 0, successful: 0, failed: 0, rate: 0 },
      'magic-link': { total: 0, successful: 0, failed: 0, rate: 0 },
      admin: { total: 0, successful: 0, failed: 0, rate: 0 },
    } as Record<AuthMethod, { total: number; successful: number; failed: number; rate: number }>,
  };

  events.forEach((event) => {
    const isSuccess = event.type.includes('_success');
    const isFailure = event.type.includes('_failure');
    const eventMethod = (event.meta as any)?.method as AuthMethod | undefined;

    if (method && eventMethod !== method) {
      return; // Skip if filtering by method
    }

    stats.total++;
    if (isSuccess) stats.successful++;
    if (isFailure) stats.failed++;

    // Track by method
    if (eventMethod && stats.byMethod[eventMethod]) {
      stats.byMethod[eventMethod].total++;
      if (isSuccess) stats.byMethod[eventMethod].successful++;
      if (isFailure) stats.byMethod[eventMethod].failed++;
    }
  });

  // Calculate rates
  stats.successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;

  Object.keys(stats.byMethod).forEach((method) => {
    const methodStats = stats.byMethod[method as AuthMethod];
    methodStats.rate =
      methodStats.total > 0 ? (methodStats.successful / methodStats.total) * 100 : 0;
  });

  return stats;
}

/**
 * Get recent failed login attempts for security monitoring
 */
export async function getRecentFailedAttempts(
  minutes: number = 15,
  limit: number = 100
): Promise<
  Array<{
    email: string | null;
    ipAddress: string | null;
    failureReason: string | null;
    timestamp: Date;
    method: AuthMethod | null;
  }>
> {
  const startDate = new Date(Date.now() - minutes * 60 * 1000);

  const events = await prisma.auditEvent.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      type: {
        in: [
          'login_failure',
          'otp_failure',
          'magic_link_failure',
          'admin_login_failure',
          'webauthn_failure',
          'rate_limit_exceeded',
        ],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    select: {
      createdAt: true,
      type: true,
      meta: true,
    },
  });

  return events.map((event) => {
    const meta = event.meta as any;
    return {
      email: meta?.email || null,
      ipAddress: meta?.ipAddress || null,
      failureReason: meta?.failureReason || event.type,
      timestamp: event.createdAt,
      method: meta?.method || null,
    };
  });
}

/**
 * Get authentication metrics summary for dashboard
 */
export async function getAuthMetricsSummary(): Promise<{
  last24Hours: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  last7Days: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  last30Days: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  recentFailures: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
}> {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [stats24h, stats7d, stats30d, recentFailures] = await Promise.all([
    getAuthSuccessRate(last24Hours, now),
    getAuthSuccessRate(last7Days, now),
    getAuthSuccessRate(last30Days, now),
    getRecentFailedAttempts(15, 50),
  ]);

  // Aggregate failure reasons
  const reasonCounts = new Map<string, number>();
  recentFailures.forEach((failure) => {
    const reason = failure.failureReason || 'unknown';
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });

  const topFailureReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    last24Hours: {
      total: stats24h.total,
      successful: stats24h.successful,
      failed: stats24h.failed,
      successRate: stats24h.successRate,
    },
    last7Days: {
      total: stats7d.total,
      successful: stats7d.successful,
      failed: stats7d.failed,
      successRate: stats7d.successRate,
    },
    last30Days: {
      total: stats30d.total,
      successful: stats30d.successful,
      failed: stats30d.failed,
      successRate: stats30d.successRate,
    },
    recentFailures: recentFailures.length,
    topFailureReasons,
  };
}

/**
 * Alert on suspicious authentication patterns
 */
export async function checkForSuspiciousActivity(): Promise<{
  hasAlert: boolean;
  alerts: Array<{
    type: 'high_failure_rate' | 'repeated_failures' | 'distributed_attack';
    severity: 'low' | 'medium' | 'high';
    message: string;
    data: any;
  }>;
}> {
  const alerts: Array<{
    type: 'high_failure_rate' | 'repeated_failures' | 'distributed_attack';
    severity: 'low' | 'medium' | 'high';
    message: string;
    data: any;
  }> = [];

  // Check for high failure rate in last 15 minutes
  const last15Min = new Date(Date.now() - 15 * 60 * 1000);
  const recentStats = await getAuthSuccessRate(last15Min, new Date());

  if (recentStats.total > 10 && recentStats.successRate < 50) {
    alerts.push({
      type: 'high_failure_rate',
      severity: 'high',
      message: `Authentication success rate dropped to ${recentStats.successRate.toFixed(1)}% in the last 15 minutes`,
      data: recentStats,
    });
  }

  // Check for repeated failures from same IP or email
  const recentFailures = await getRecentFailedAttempts(15, 100);
  const ipCounts = new Map<string, number>();
  const emailCounts = new Map<string, number>();

  recentFailures.forEach((failure) => {
    if (failure.ipAddress) {
      ipCounts.set(failure.ipAddress, (ipCounts.get(failure.ipAddress) || 0) + 1);
    }
    if (failure.email) {
      emailCounts.set(failure.email, (emailCounts.get(failure.email) || 0) + 1);
    }
  });

  // Alert on IPs with 5+ failed attempts
  ipCounts.forEach((count, ip) => {
    if (count >= 5) {
      alerts.push({
        type: 'repeated_failures',
        severity: 'medium',
        message: `IP ${ip} has ${count} failed authentication attempts in the last 15 minutes`,
        data: { ip, count },
      });
    }
  });

  // Alert on emails with 3+ failed attempts
  emailCounts.forEach((count, email) => {
    if (count >= 3) {
      alerts.push({
        type: 'repeated_failures',
        severity: 'medium',
        message: `Email ${email} has ${count} failed authentication attempts in the last 15 minutes`,
        data: { email, count },
      });
    }
  });

  // Check for distributed attack (many different IPs)
  if (ipCounts.size > 20 && recentFailures.length > 50) {
    alerts.push({
      type: 'distributed_attack',
      severity: 'high',
      message: `Potential distributed attack detected: ${recentFailures.length} failed attempts from ${ipCounts.size} different IPs`,
      data: { totalFailures: recentFailures.length, uniqueIPs: ipCounts.size },
    });
  }

  return {
    hasAlert: alerts.length > 0,
    alerts,
  };
}
