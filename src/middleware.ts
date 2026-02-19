import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ServerRateLimiter } from "./lib/server-rate-limiter";

// Redis-based rate limiting with in-memory fallback
// Login endpoints: 20 requests per 5 minutes per user-agent
const loginRateLimiter = new ServerRateLimiter("login-endpoint", 20, 5 * 60 * 1000);
// General API: 60 requests per minute per user-agent
const apiRateLimiter = new ServerRateLimiter("api", 60, 60 * 1000);

async function checkRateLimit(
  identifier: string,
  limiter: ServerRateLimiter
): Promise<{
  allowed: boolean;
  retryAfter?: number;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const result = await limiter.check(identifier);
  return {
    allowed: result.success,
    retryAfter: result.retryAfter,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// Get identifier from request - prefer user-agent for better test isolation in dev
// In production with VERCEL=1, this will use IP from x-forwarded-for header
function getIdentifier(request: NextRequest): string {
  // In development, use user-agent for rate limiting (better for testing)
  // SECURITY: In production (Vercel), x-forwarded-for is trusted and takes precedence
  const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (isProduction) {
    // Production: Use IP from trusted proxy headers
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";
    return ip;
  }

  // Development: Use user-agent (allows test isolation)
  // SECURITY: x-forwarded-for headers are IGNORED in development to prevent IP spoofing
  const userAgent = request.headers.get("user-agent") || "unknown";
  // Base64 encode and truncate to keep key size reasonable
  return Buffer.from(userAgent).toString("base64").substring(0, 16);
}

// PUBLIC_PATHS: Exact matches or specific allowed prefixes
const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/register-secure", "/api/favicon", "/api/health"]);
const PUBLIC_PREFIXES = ["/api/auth/"]; // NextAuth and login endpoints
// SENSITIVE_PATHS: Require strict rate limiting
const SENSITIVE_PATHS = ["/api/auth/begin-login", "/api/auth/magic-login", "/api/auth/verify-otp", "/api/auth/check-admin"];

const adminPaths = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files - no rate limiting needed
  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/sw.js" || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Helper to check if path is public
  const isPublic = PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // Stricter root redirect at edge
  if (pathname === "/") {
    const token = await getToken({ req: request });
    const url = new URL(
      token ? "/dashboard" : "/login",
      request.url
    );
    return NextResponse.redirect(url);
  }

  // Redirect /admin to /dashboard (deprecated route - dashboard shows admin section for admins)
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Granular rate limiting based on endpoint type
  const identifier = getIdentifier(request);
  const isSensitive = SENSITIVE_PATHS.some(p => pathname.startsWith(p)) || (pathname.startsWith("/api/auth/begin-login") && request.method === "POST");

  // Choose appropriate rate limiter
  const limiter = isSensitive ? loginRateLimiter : apiRateLimiter;
  const rateLimitResult = await checkRateLimit(identifier, limiter);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfter || 60),
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.reset),
        },
      }
    );
  }

  // CSRF protection for state-changing methods
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method) &&
    !pathname.startsWith("/api/auth/")
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new Response("Invalid origin", { status: 403 });
        }
      } catch {
        return new Response("Invalid origin", { status: 403 });
      }
    }
  }

  // Authentication check
  if (!isPublic) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin authorization (Both UI and API)
    if (adminPaths.some((p) => pathname.startsWith(p))) {
      if (token.role !== "ADMIN") {
        return new Response("Forbidden", { status: 403 });
      }
    }
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Rate limit headers (informational for debugging/monitoring)
  response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
  response.headers.set("X-RateLimit-Reset", String(rateLimitResult.reset));

  // CRITICAL: Prevent browser caching of authenticated pages
  if (!isPublic) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
