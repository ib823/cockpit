/**
 * SECURITY AUDIT LOGGING
 *
 * Logs all security-sensitive operations for compliance and incident investigation
 * Required for SOC 2, ISO 27001, and other security certifications
 */

import { prisma } from "./db";
import { AuditAction, Prisma } from "@prisma/client";

export { AuditAction };

export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log security-sensitive operation to audit trail
 *
 * IMPORTANT: Do not throw errors from this function - audit logging
 * should never break the user's request
 */
export async function logAuditEvent(
  context: AuditContext,
  action: AuditAction,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: context.userId,
        action,
        entity,
        entityId,
        changes: (changes ?? Prisma.DbNull) as Prisma.InputJsonValue,
        ipAddress: context.ipAddress || undefined,
        userAgent: context.userAgent || undefined,
        createdAt: new Date(),
      },
    });

    console.log("[Audit]", {
      action,
      entity,
      entityId,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // CRITICAL: Log to monitoring but don't fail the request
    console.error("[Audit] Failed to log event:", error);

    // In production, alert monitoring system
    if (process.env.NODE_ENV === "production") {
      // Note: Integrate with Sentry or monitoring service for production alerts
      console.error("[Audit] ALERT: Audit logging failed in production!", {
        action,
        entity,
        entityId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Extract audit context from NextRequest
 * Use this in API route handlers
 */
export function getAuditContext(request: Request, userId: string): AuditContext {
  const headers = request.headers;

  return {
    userId,
    ipAddress: extractIPAddress(headers),
    userAgent: headers.get("user-agent") || undefined,
  };
}

/**
 * Extract real IP address from request headers
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP)
 */
function extractIPAddress(headers: Headers): string | undefined {
  // Trust proxy headers only in production with TRUST_PROXY=true
  const trustProxy = process.env.TRUST_PROXY === "true" && process.env.NODE_ENV === "production";

  if (!trustProxy) {
    return undefined;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Query audit logs for a specific entity
 * Useful for showing audit history in UI
 */
export async function getAuditLog(entity: string, entityId: string, limit: number = 50) {
  return prisma.audit_logs.findMany({
    where: {
      entity,
      entityId,
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Query audit logs for a specific user
 * Useful for admin dashboards and security investigations
 */
export async function getUserAuditLog(userId: string, limit: number = 100) {
  return prisma.audit_logs.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Query recent audit events by action type
 * Useful for security monitoring and anomaly detection
 */
export async function getAuditLogByAction(
  action: AuditAction,
  hours: number = 24,
  limit: number = 100
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return prisma.audit_logs.findMany({
    where: {
      action,
      createdAt: {
        gte: since,
      },
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Audit statistics for security dashboard
 */
export async function getAuditStats(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalEvents, byAction, byUser] = await Promise.all([
    // Total events
    prisma.audit_logs.count({
      where: { createdAt: { gte: since } },
    }),

    // Events by action type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.audit_logs.groupBy as any)({
      by: ["action"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),

    // Most active users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.audit_logs.groupBy as any)({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 10,
    }),
  ]);

  return {
    totalEvents,
    byAction: byAction.map((item: any) => ({
      action: item.action,
      count: item._count?._all || 0,
    })),
    topUsers: byUser.map((item: any) => ({
      userId: item.userId,
      count: item._count?._all || 0,
    })),
  };
}

/**
 * Detect suspicious activity patterns
 * Returns potential security incidents for investigation
 */
export async function detectSuspiciousActivity(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Find users with unusual delete activity
  const suspiciousDeletes = await (prisma.audit_logs.groupBy as any)({
    by: ["userId"],
    where: {
      action: "DELETE",
      createdAt: { gte: since },
    },
    _count: { _all: true },
    having: {
      userId: {
        _count: {
          gt: 10, // More than 10 deletes in time period
        },
      },
    },
  });

  // Find failed access attempts (if logged)
  const failedAccess = await prisma.audit_logs.findMany({
    where: {
      entity: "access_denied",
      createdAt: { gte: since },
    },
    include: {
      users: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });

  return {
    suspiciousDeletes: suspiciousDeletes.map((item: { userId: string; _count: number }) => ({
      userId: item.userId,
      deleteCount: item._count,
    })),
    failedAccessAttempts: failedAccess.length,
    incidents: failedAccess.slice(0, 20), // Latest 20
  };
}
