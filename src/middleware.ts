// src/middleware.ts
// SECURITY: Server-side middleware for rate limiting and security headers
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Server-side rate limiter using Map (in-memory)
// For production, consider using Redis or similar distributed cache
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per IP

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier (IP address)
 */
function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupRateLimitMap();
  }

  if (!record || now > record.resetTime) {
    // First request or window expired
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  // Check if limit exceeded
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment counter
  record.count++;
  rateLimitMap.set(identifier, record);
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client identifier (IP address)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from common proxy headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier
  return "unknown";
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  // SECURITY: Block requests with internal Next.js headers (CVE-2025-29927)
  const subrequestHeader = request.headers.get("x-middleware-subrequest");
  if (subrequestHeader) {
    console.warn("Blocked request with x-middleware-subrequest header", {
      url: request.url,
      ip: getClientIdentifier(request),
      timestamp: new Date().toISOString(),
    });

    return new NextResponse("Forbidden", { status: 403 });
  }

  // Get client identifier
  const clientId = getClientIdentifier(request);

  // Check rate limit
  const { allowed, remaining, resetTime } = checkRateLimit(clientId);

  // Create response
  let response: NextResponse;

  if (!allowed) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    response = new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Content-Type": "text/plain",
        "Retry-After": retryAfter.toString(),
      },
    });
  } else {
    // Allow request to proceed
    response = NextResponse.next();
  }

  // Add rate limit headers to all responses
  response.headers.set("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());

  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
