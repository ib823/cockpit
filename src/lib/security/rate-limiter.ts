/**
 * Rate Limiting and Abuse Prevention
 *
 * Protects API endpoints from abuse, spam, and DDoS attacks
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (
        entry.resetTime < now &&
        (!entry.blocked || (entry.blockUntil && entry.blockUntil < now))
      ) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Project operations
  PROJECT_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 projects per hour per user
  },
  PROJECT_UPDATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 updates per minute (1 per second avg)
  },
  PROJECT_DELETE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 deletions per hour
  },

  // Import operations (more strict)
  EXCEL_IMPORT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 imports per minute
  },

  // Authentication
  LOGIN_ATTEMPT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 failed attempts before lockout
  },
  REGISTER_ATTEMPT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registration attempts per hour
  },

  // API general
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute per user
  },
} as const;

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  identifier: string, // User ID, IP address, or combination
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blocked && entry.blockUntil && entry.blockUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockUntil,
      retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
    };
  }

  // Create new entry or reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    // Block for the remaining window time
    entry.blocked = true;
    entry.blockUntil = entry.resetTime;

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Increment rate limit counter without checking
 * Used for successful operations that should count against limit
 */
export function incrementRateLimit(identifier: string, config: RateLimitConfig): void {
  checkRateLimit(identifier, config);
}

/**
 * Reset rate limit for a specific identifier
 * Useful for clearing after successful CAPTCHA or admin override
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get rate limit info without incrementing
 */
export function getRateLimitInfo(
  identifier: string,
  config: RateLimitConfig
): {
  count: number;
  remaining: number;
  resetTime: number;
  blocked: boolean;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      blocked: false,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
    blocked: entry.blocked,
  };
}

/**
 * Middleware helper for Next.js API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware(req: Request, identifier: string) {
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      const error = new Error("Rate limit exceeded");
      (error as any).statusCode = 429;
      (error as any).retryAfter = result.retryAfter;
      (error as any).resetTime = result.resetTime;
      throw error;
    }

    return {
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  };
}

/**
 * Get identifier from request (IP + User ID)
 */
export function getRequestIdentifier(req: Request, userId?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // Combine IP and user ID for better tracking
  return userId ? `${userId}:${ip}` : `ip:${ip}`;
}

/**
 * Bot detection based on request patterns
 */
export function detectBot(req: Request): {
  isBot: boolean;
  confidence: number; // 0-1
  reasons: string[];
} {
  const reasons: string[] = [];
  let botScore = 0;

  // Check User-Agent
  const userAgent = req.headers.get("user-agent") || "";
  const botUserAgents = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "curl",
    "wget",
    "python",
    "java",
    "Go-http-client",
    "okhttp",
  ];

  if (!userAgent) {
    botScore += 0.5;
    reasons.push("Missing User-Agent");
  } else if (botUserAgents.some((bot) => userAgent.toLowerCase().includes(bot))) {
    botScore += 0.8;
    reasons.push("Bot-like User-Agent");
  }

  // Check for missing common browser headers
  const acceptHeader = req.headers.get("accept");
  if (!acceptHeader || !acceptHeader.includes("text/html")) {
    botScore += 0.3;
    reasons.push("Missing or invalid Accept header");
  }

  const acceptLanguage = req.headers.get("accept-language");
  if (!acceptLanguage) {
    botScore += 0.2;
    reasons.push("Missing Accept-Language header");
  }

  // Check for automation tools
  const referer = req.headers.get("referer") || "";
  if (referer === "") {
    botScore += 0.1;
    reasons.push("Missing Referer (possible direct API access)");
  }

  // Normalize score to 0-1
  const confidence = Math.min(1, botScore);
  const isBot = confidence >= 0.6; // 60% confidence threshold

  return {
    isBot,
    confidence,
    reasons,
  };
}

/**
 * Check if request shows suspicious patterns
 */
export function detectAbusePatterns(
  identifier: string,
  action: string
): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let suspicious = false;

  // Check for rapid repeated actions
  const recentActions = new Map<string, number[]>();
  const actionKey = `${identifier}:${action}`;
  const now = Date.now();
  const history = recentActions.get(actionKey) || [];

  // Add current action
  history.push(now);

  // Keep only last 1 minute of history
  const filtered = history.filter((timestamp) => timestamp > now - 60000);
  recentActions.set(actionKey, filtered);

  // Flag if more than 10 identical actions in 1 minute
  if (filtered.length > 10) {
    suspicious = true;
    reasons.push(`Rapid repeated action: ${filtered.length} times in 1 minute`);
  }

  return {
    suspicious,
    reasons,
  };
}
