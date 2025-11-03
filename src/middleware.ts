import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ServerRateLimiter } from './lib/server-rate-limiter';

// Redis-based rate limiting with in-memory fallback
// Global rate limiter: 100 requests per minute per IP
const globalRateLimiter = new ServerRateLimiter('global', 100, 60 * 1000);

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result = await globalRateLimiter.check(ip);
  return {
    allowed: result.success,
    retryAfter: result.retryAfter,
  };
}

const publicPaths = ['/', '/login', '/api/auth'];
const adminPaths = ['/admin'];
const protectedPaths = ['/gantt-tool', '/project', '/estimator', '/dashboard', '/account']; // Require authentication

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname === '/sw.js') {
    return NextResponse.next();
  }

  // Stricter root redirect at edge
  if (pathname === '/') {
    const token = await getToken({ req: request });
    const url = new URL(token ? (token.role === 'ADMIN' ? '/admin' : '/dashboard') : '/login', request.url);
    return NextResponse.redirect(url);
  }
  
  // Rate limiting (100 req/min per IP) - Redis-backed with in-memory fallback
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ??
             request.headers.get('x-real-ip') ??
             '127.0.0.1';

  const rateLimitResult = await checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': String(rateLimitResult.retryAfter || 60),
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
      },
    });
  }
  
  // CSRF protection for state-changing methods
  // Skip NextAuth endpoints as they have their own CSRF protection
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
      !pathname.startsWith('/api/auth')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // More robust origin check: compare hostnames, not just string inclusion
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new Response('Invalid origin', { status: 403 });
        }
      } catch {
        // Invalid origin URL
        return new Response('Invalid origin', { status: 403 });
      }
    }
  }
  
  // Authentication check
  if (!publicPaths.some(p => pathname.startsWith(p))) {
    const token = await getToken({ req: request });
    
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Admin authorization
    if (adminPaths.some(p => pathname.startsWith(p))) {
      if (token.role !== 'ADMIN') {
        return new Response('Forbidden', { status: 403 });
      }
    }
  }
  
  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CRITICAL: Prevent browser caching of authenticated pages
  // This stops the back button from showing cached content after logout
  if (!publicPaths.some(p => pathname.startsWith(p))) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
