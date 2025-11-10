/**
 * API Route Protection Middleware
 *
 * Comprehensive protection for Next.js API routes
 * Includes: Rate limiting, bot detection, CAPTCHA, abuse prevention
 */

import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getRequestIdentifier,
  detectBot,
  detectAbusePatterns,
} from "./rate-limiter";
import { verifyCaptcha } from "./captcha";
import {
  SECURITY_CONFIG,
  logSecurityEvent,
  SecurityEventType,
  getClientIP,
  isIPAllowed,
} from "./config";

export interface ProtectionOptions {
  // Rate limiting
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };

  // CAPTCHA verification
  requireCaptcha?: boolean;
  captchaAction?: string;

  // Bot detection
  detectBots?: boolean;
  botThreshold?: number; // 0.0 - 1.0

  // Abuse detection
  detectAbuse?: boolean;
  abuseAction?: string;

  // User identification
  userId?: string;

  // Skip protection (for authenticated admin users)
  skipProtection?: boolean;
}

export interface ProtectionResult {
  allowed: boolean;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    retryAfter?: number;
  };
  headers?: Record<string, string>;
}

/**
 * Protect API route with multiple security layers
 */
export async function protectAPIRoute(
  req: Request,
  options: ProtectionOptions = {}
): Promise<ProtectionResult> {
  // Skip if explicitly disabled
  if (options.skipProtection) {
    return { allowed: true };
  }

  const ip = getClientIP(req);
  const identifier = getRequestIdentifier(req, options.userId);
  const headers: Record<string, string> = {};

  // 1. IP Allowlist/Blocklist Check
  if (!isIPAllowed(ip)) {
    logSecurityEvent(SecurityEventType.IP_BLOCKED, {
      identifier,
      ip,
      endpoint: new URL(req.url).pathname,
      reason: "IP in blocklist or not in allowlist",
    });

    return {
      allowed: false,
      error: {
        code: "IP_BLOCKED",
        message: "Access denied from your IP address",
        statusCode: 403,
      },
    };
  }

  // 2. Bot Detection
  if (options.detectBots !== false && SECURITY_CONFIG.botDetection.enabled) {
    const botCheck = detectBot(req);
    const threshold = options.botThreshold || SECURITY_CONFIG.botDetection.threshold;

    if (botCheck.isBot && botCheck.confidence >= threshold) {
      logSecurityEvent(SecurityEventType.BOT_DETECTED, {
        identifier,
        ip,
        userAgent: req.headers.get("user-agent") || "",
        endpoint: new URL(req.url).pathname,
        reason: `Bot confidence: ${(botCheck.confidence * 100).toFixed(1)}%`,
        metadata: { reasons: botCheck.reasons },
      });

      if (SECURITY_CONFIG.botDetection.autoBlock) {
        return {
          allowed: false,
          error: {
            code: "BOT_DETECTED",
            message: "Automated access detected. Please use a standard web browser.",
            statusCode: 403,
          },
        };
      }
    }
  }

  // 3. Rate Limiting
  if (options.rateLimit) {
    const rateCheck = checkRateLimit(identifier, options.rateLimit);

    // Add rate limit headers
    headers["X-RateLimit-Limit"] = String(options.rateLimit.maxRequests);
    headers["X-RateLimit-Remaining"] = String(rateCheck.remaining);
    headers["X-RateLimit-Reset"] = String(Math.floor(rateCheck.resetTime / 1000));

    if (!rateCheck.allowed) {
      if (rateCheck.retryAfter) {
        headers["Retry-After"] = String(rateCheck.retryAfter);
      }

      logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
        identifier,
        ip,
        endpoint: new URL(req.url).pathname,
        reason: `Exceeded ${options.rateLimit.maxRequests} requests per ${options.rateLimit.windowMs}ms`,
      });

      return {
        allowed: false,
        headers,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Please try again in ${rateCheck.retryAfter} seconds.`,
          statusCode: 429,
          retryAfter: rateCheck.retryAfter,
        },
      };
    }
  }

  // 4. Abuse Pattern Detection
  if (options.detectAbuse !== false && SECURITY_CONFIG.abuse.detectPatterns) {
    const abuseCheck = detectAbusePatterns(identifier, options.abuseAction || "request");

    if (abuseCheck.suspicious) {
      logSecurityEvent(SecurityEventType.SUSPICIOUS_PATTERN, {
        identifier,
        ip,
        endpoint: new URL(req.url).pathname,
        reason: abuseCheck.reasons.join(", "),
      });

      // Escalate to CAPTCHA if configured
      if (SECURITY_CONFIG.abuse.escalateToCaptcha && !options.requireCaptcha) {
        return {
          allowed: false,
          error: {
            code: "CAPTCHA_REQUIRED",
            message: "Suspicious activity detected. Please complete CAPTCHA verification.",
            statusCode: 403,
          },
        };
      }

      // Or block temporarily
      if (SECURITY_CONFIG.abuse.tempBlockSuspicious) {
        return {
          allowed: false,
          error: {
            code: "SUSPICIOUS_ACTIVITY",
            message: "Suspicious activity detected. Please try again later.",
            statusCode: 403,
            retryAfter: Math.ceil(SECURITY_CONFIG.abuse.tempBlockDuration / 1000),
          },
        };
      }
    }
  }

  // 5. CAPTCHA Verification
  if (options.requireCaptcha && SECURITY_CONFIG.captcha.enabled) {
    const captchaToken = req.headers.get("x-captcha-token");

    if (!captchaToken) {
      return {
        allowed: false,
        error: {
          code: "CAPTCHA_REQUIRED",
          message: "CAPTCHA verification required",
          statusCode: 403,
        },
      };
    }

    const captchaResult = await verifyCaptcha(
      captchaToken,
      {
        provider: SECURITY_CONFIG.captcha.provider,
        siteKey: SECURITY_CONFIG.captcha.siteKey,
        secretKey: SECURITY_CONFIG.captcha.secretKey,
        scoreThreshold: SECURITY_CONFIG.captcha.scoreThreshold,
      },
      ip
    );

    if (!captchaResult.success) {
      logSecurityEvent(SecurityEventType.CAPTCHA_FAILED, {
        identifier,
        ip,
        endpoint: new URL(req.url).pathname,
        reason: captchaResult.errorCodes?.join(", ") || "Unknown",
      });

      return {
        allowed: false,
        error: {
          code: "CAPTCHA_FAILED",
          message: "CAPTCHA verification failed. Please try again.",
          statusCode: 403,
        },
      };
    }

    // Check score for reCAPTCHA v3
    if (SECURITY_CONFIG.captcha.provider === "recaptcha" && captchaResult.score !== undefined) {
      if (captchaResult.score < SECURITY_CONFIG.captcha.scoreThreshold) {
        logSecurityEvent(SecurityEventType.CAPTCHA_FAILED, {
          identifier,
          ip,
          endpoint: new URL(req.url).pathname,
          reason: `Low score: ${captchaResult.score}`,
          metadata: { score: captchaResult.score },
        });

        return {
          allowed: false,
          error: {
            code: "CAPTCHA_SCORE_TOO_LOW",
            message: "CAPTCHA verification failed. Please try again.",
            statusCode: 403,
          },
        };
      }
    }
  }

  // All checks passed
  return {
    allowed: true,
    headers,
  };
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withAPIProtection(options: ProtectionOptions = {}) {
  return async function protectionMiddleware(req: Request, context?: any) {
    const result = await protectAPIRoute(req, options);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: result.error?.code || "FORBIDDEN",
          message: result.error?.message || "Access denied",
        },
        {
          status: result.error?.statusCode || 403,
          headers: result.headers,
        }
      );
    }

    // Add protection headers to response
    return {
      protectionPassed: true,
      headers: result.headers || {},
    };
  };
}

/**
 * Helper to add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.hcaptcha.com https://www.google.com/recaptcha/ https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://hcaptcha.com https://www.google.com/recaptcha/; frame-src https://hcaptcha.com https://www.google.com/recaptcha/ https://challenges.cloudflare.com;"
  );

  return response;
}
