/**
 * IP Blocker - Automated IP blocking for repeat offenders
 *
 * Tracks failed authentication attempts and automatically blocks IPs
 * that exceed thresholds. Supports temporary and permanent blocks.
 */

import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";

// Redis connection (with fallback)
let redis: Redis | null = null;
try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && /^https:\/\//i.test(url)) {
    redis = new Redis({ url, token });
  }
} catch (error) {
  console.warn("[ip-blocker] Redis initialization failed, using in-memory fallback:", error);
}

// In-memory fallback for development
const memoryBlockedIPs = new Map<
  string,
  { reason: string; blockedAt: Date; expiresAt: Date | null; permanent: boolean }
>();

export interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date | null;
  permanent: boolean;
  failureCount?: number;
}

export interface BlockConfig {
  maxFailures: number;
  windowMinutes: number;
  blockDurationMinutes: number;
  permanentBlockThreshold?: number; // After this many blocks, make it permanent
}

// Default configuration
const DEFAULT_CONFIG: BlockConfig = {
  maxFailures: 5,
  windowMinutes: 15,
  blockDurationMinutes: 60,
  permanentBlockThreshold: 3,
};

/**
 * Check if an IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  // Check Redis first
  if (redis) {
    try {
      const blockData = await redis.get<BlockedIP>(`ipblock:${ip}`);
      if (blockData) {
        // Check if block has expired
        if (blockData.expiresAt && new Date(blockData.expiresAt) < new Date()) {
          await redis.del(`ipblock:${ip}`);
          return { blocked: false };
        }
        return { blocked: true, reason: blockData.reason };
      }
    } catch (error) {
      console.error("[ip-blocker] Redis check error:", error);
    }
  }

  // Check in-memory fallback
  const blockData = memoryBlockedIPs.get(ip);
  if (blockData) {
    // Check if block has expired
    if (blockData.expiresAt && blockData.expiresAt < new Date()) {
      memoryBlockedIPs.delete(ip);
      return { blocked: false };
    }
    return { blocked: true, reason: blockData.reason };
  }

  return { blocked: false };
}

/**
 * Block an IP address
 */
export async function blockIP(
  ip: string,
  reason: string,
  durationMinutes?: number,
  permanent: boolean = false
): Promise<void> {
  const blockedAt = new Date();
  const expiresAt =
    permanent || !durationMinutes ? null : new Date(Date.now() + durationMinutes * 60 * 1000);

  const blockData: BlockedIP = {
    ip,
    reason,
    blockedAt,
    expiresAt,
    permanent,
  };

  // Store in Redis
  if (redis) {
    try {
      if (permanent) {
        await redis.set(`ipblock:${ip}`, blockData);
      } else {
        await redis.setex(`ipblock:${ip}`, durationMinutes! * 60, blockData);
      }
    } catch (error) {
      console.error("[ip-blocker] Redis set error:", error);
    }
  }

  // Store in memory
  memoryBlockedIPs.set(ip, blockData);

  // Log to audit trail
  try {
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        type: "ip_blocked",
        ipAddress: ip,
        meta: {
          reason,
          blockedAt: blockedAt.toISOString(),
          expiresAt: expiresAt?.toISOString() || null,
          permanent,
          autoBlocked: true,
        },
      },
    });
  } catch (error) {
    console.error("[ip-blocker] Failed to log block event:", error);
  }

  console.warn(`[IP BLOCKER] Blocked IP ${ip}: ${reason}`, {
    expiresAt: expiresAt?.toISOString() || "permanent",
  });
}

/**
 * Unblock an IP address
 */
export async function unblockIP(ip: string): Promise<void> {
  // Remove from Redis
  if (redis) {
    try {
      await redis.del(`ipblock:${ip}`);
    } catch (error) {
      console.error("[ip-blocker] Redis delete error:", error);
    }
  }

  // Remove from memory
  memoryBlockedIPs.delete(ip);

  // Log to audit trail
  try {
    await prisma.securityEvent.create({
      data: {
        id: crypto.randomUUID(),
        type: "ip_unblocked",
        ipAddress: ip,
        meta: {
          unblockedAt: new Date().toISOString(),
          manualUnblock: true,
        },
      },
    });
  } catch (error) {
    console.error("[ip-blocker] Failed to log unblock event:", error);
  }

  console.log(`[IP BLOCKER] Unblocked IP ${ip}`);
}

/**
 * Check and potentially auto-block an IP based on failure count
 */
export async function checkAndBlockIP(
  ip: string,
  config: Partial<BlockConfig> = {}
): Promise<{ blocked: boolean; reason?: string }> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Get recent failures for this IP from audit events
  const windowStart = new Date(Date.now() - fullConfig.windowMinutes * 60 * 1000);

  try {
    const failures = await prisma.auditEvent.findMany({
      where: {
        createdAt: {
          gte: windowStart,
        },
        type: {
          in: [
            "webauthn_failure",
            "otp_failure",
            "magic_link_failure",
            "admin_login_failure",
            "login_failure",
          ],
        },
        meta: {
          path: ["ipAddress"],
          equals: ip,
        },
      },
      select: {
        type: true,
        createdAt: true,
      },
    });

    if (failures.length >= fullConfig.maxFailures) {
      // Check how many times this IP has been blocked before
      const previousBlocks = await prisma.securityEvent.count({
        where: {
          ipAddress: ip,
          type: "ip_blocked",
        },
      });

      const permanent = previousBlocks >= (fullConfig.permanentBlockThreshold || 3);
      const reason = permanent
        ? `Permanent block: ${failures.length} failures in ${fullConfig.windowMinutes} minutes (${previousBlocks} previous blocks)`
        : `Temporary block: ${failures.length} failures in ${fullConfig.windowMinutes} minutes`;

      await blockIP(ip, reason, fullConfig.blockDurationMinutes, permanent);

      return { blocked: true, reason };
    }

    return { blocked: false };
  } catch (error) {
    console.error("[ip-blocker] Error checking failures:", error);
    return { blocked: false };
  }
}

/**
 * Get all currently blocked IPs
 */
export async function getBlockedIPs(): Promise<BlockedIP[]> {
  const blockedIPs: BlockedIP[] = [];

  // Get from Redis (if available)
  if (redis) {
    try {
      const keys = await redis.keys("ipblock:*");
      for (const key of keys) {
        const data = await redis.get<BlockedIP>(key);
        if (data) {
          // Check if expired
          if (!data.expiresAt || new Date(data.expiresAt) > new Date()) {
            blockedIPs.push(data);
          }
        }
      }
    } catch (error) {
      console.error("[ip-blocker] Error fetching blocked IPs from Redis:", error);
    }
  }

  // Get from memory
  memoryBlockedIPs.forEach((blockData, ip) => {
    if (!blockData.expiresAt || blockData.expiresAt > new Date()) {
      // Only add if not already in list from Redis
      if (!blockedIPs.find((b) => b.ip === ip)) {
        blockedIPs.push({ ...blockData, ip });
      }
    }
  });

  // Sort by most recent first
  blockedIPs.sort((a, b) => b.blockedAt.getTime() - a.blockedAt.getTime());

  return blockedIPs;
}

/**
 * Get block history for an IP
 */
export async function getIPBlockHistory(ip: string): Promise<
  Array<{
    type: string;
    createdAt: Date;
    reason?: string;
    permanent?: boolean;
  }>
> {
  try {
    const events = await prisma.securityEvent.findMany({
      where: {
        ipAddress: ip,
        type: {
          in: ["ip_blocked", "ip_unblocked"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return events.map((event) => ({
      type: event.type,
      createdAt: event.createdAt,
      reason: (event.meta as any)?.reason,
      permanent: (event.meta as any)?.permanent,
    }));
  } catch (error) {
    console.error("[ip-blocker] Error fetching block history:", error);
    return [];
  }
}

/**
 * Clean up expired blocks
 */
export async function cleanupExpiredBlocks(): Promise<number> {
  let cleaned = 0;

  // Clean up memory
  const now = new Date();
  memoryBlockedIPs.forEach((blockData, ip) => {
    if (blockData.expiresAt && blockData.expiresAt < now) {
      memoryBlockedIPs.delete(ip);
      cleaned++;
    }
  });

  // Clean up Redis (Redis should handle expiry automatically with SETEX)
  // but we can manually clean up any that slipped through
  if (redis) {
    try {
      const keys = await redis.keys("ipblock:*");
      for (const key of keys) {
        const data = await redis.get<BlockedIP>(key);
        if (data && data.expiresAt && new Date(data.expiresAt) < now) {
          await redis.del(key);
          cleaned++;
        }
      }
    } catch (error) {
      console.error("[ip-blocker] Error cleaning up Redis:", error);
    }
  }

  return cleaned;
}
