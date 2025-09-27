import { NextRequest } from 'next/server';
import { securityMiddleware } from '@/core/security/middleware';

export function middleware(request: NextRequest) {
  return securityMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
