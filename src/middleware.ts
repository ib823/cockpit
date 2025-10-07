// src/middleware.ts
// SECURITY: Server-side middleware for rate limiting and security headers
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/session";

// Server-side rate limiter using Redis (distributed) or Map fallback
let rateLimitStore: any = null;

// Configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per IP

// Login endpoint rate limiting (stricter)
const LOGIN_RATE_LIMIT = {
  window: 300000, // 5 minutes
  maxAttempts: 5, // 5 attempts per 5 minutes
};

// Initialize rate limit store
async function getRateLimitStore() {
  if (rateLimitStore) return rateLimitStore;

  // Try Upstash Redis for production
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      rateLimitStore = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('[RateLimit] Using Upstash Redis');
      return rateLimitStore;
    } catch (error) {
      console.error('[RateLimit] Redis not available, using in-memory fallback');
    }
  }

  // Fallback to in-memory (DEV ONLY)
  rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  console.warn('[RateLimit] Using in-memory rate limiting - NOT SAFE FOR PRODUCTION');
  return rateLimitStore;
}

/**
 * Clean up expired rate limit entries (in-memory only)
 */
function cleanupRateLimitMap(store: Map<string, any>) {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier (IP address)
 */
async function checkRateLimit(identifier: string, path: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const store = await getRateLimitStore();
  const now = Date.now();

  // Stricter limits for login endpoints
  const isLoginEndpoint = path.includes('/api/auth/') || path.includes('/login');
  const windowMs = isLoginEndpoint ? LOGIN_RATE_LIMIT.window : RATE_LIMIT_WINDOW_MS;
  const maxRequests = isLoginEndpoint ? LOGIN_RATE_LIMIT.maxAttempts : MAX_REQUESTS_PER_WINDOW;

  // Redis implementation
  if (store instanceof Map === false) {
    try {
      const key = `ratelimit:${identifier}:${isLoginEndpoint ? 'login' : 'api'}`;
      const ttlSeconds = Math.ceil(windowMs / 1000);

      const current = await store.incr(key);
      if (current === 1) {
        await store.expire(key, ttlSeconds);
      }

      const resetTime = now + windowMs;
      const remaining = Math.max(0, maxRequests - current);

      return {
        allowed: current <= maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('[RateLimit] Redis error:', error);
      // Allow on error (fail open for availability)
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }
  }

  // In-memory fallback
  const record = store.get(identifier);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitMap(store);
  }

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  store.set(identifier, record);
  return {
    allowed: true,
    remaining: maxRequests - record.count,
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
export async function middleware(request: NextRequest) {
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

  // Check authentication for protected routes
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth', '/banner-demo'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Static assets and Next.js internal paths
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/sw.js' || // Service Worker
    /\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|otf)$/.test(pathname);

  if (!isPublicPath && !isStaticAsset) {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // SECURITY: Admin-only routes with enhanced logging
    if (pathname.startsWith('/admin')) {
      if (session.role !== 'ADMIN') {
        // Non-admin trying to access admin routes - redirect to home
        console.warn('[SECURITY] Unauthorized admin access attempt', {
          userId: session.sub,
          role: session.role,
          path: pathname,
          ip: getClientIdentifier(request),
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        });

        // Log to database for audit trail
        try {
          const { prisma } = await import('./lib/db');
          await prisma.auditEvent.create({
            data: {
              userId: session.sub,
              type: 'unauthorized_admin_access',
              meta: {
                path: pathname,
                ip: getClientIdentifier(request),
                userAgent: request.headers.get('user-agent'),
              },
            },
          });
        } catch (error) {
          console.error('Failed to log unauthorized access:', error);
        }

        return NextResponse.redirect(new URL('/', request.url));
      }

      // SECURITY: Log all admin access for audit
      console.log('[AUDIT] Admin access', {
        userId: session.sub,
        role: session.role,
        path: pathname,
        ip: getClientIdentifier(request),
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Validate role hasn't changed (defense in depth)
    if (session.role !== 'USER' && session.role !== 'ADMIN') {
      console.error('[SECURITY] Invalid role in session', {
        userId: session.sub,
        role: session.role,
      });
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // DEVELOPMENT: Rate limiting disabled for now
  // TODO: Re-enable before production deployment
  /*
  const clientId = getClientIdentifier(request);
  const { allowed, remaining, resetTime } = await checkRateLimit(clientId, pathname);

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    const isApiRoute = pathname.startsWith('/api/');

    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ ok: false, message: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    } else {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'rate_limit');
      loginUrl.searchParams.set('retry_after', retryAfter.toString());
      return NextResponse.redirect(loginUrl);
    }
  }
  */

  // Allow request to proceed
  return NextResponse.next();
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
