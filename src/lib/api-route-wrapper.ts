// src/lib/api-route-wrapper.ts
// API Route Security Wrapper
// Fixed: V-009 - Enforces CSRF protection on all state-changing endpoints

import { NextResponse } from "next/server";
import { csrfMiddleware } from "./csrf";

/**
 * Wrapper for API route handlers that enforces CSRF protection
 * Usage: export const POST = withCsrfProtection(async (req) => { ... });
 */
export function withCsrfProtection(
  handler: (req: Request) => Promise<Response | NextResponse>
): (req: Request) => Promise<Response | NextResponse> {
  return async (req: Request) => {
    // Check CSRF protection for state-changing methods
    const csrfError = await csrfMiddleware(req);
    if (csrfError) {
      return csrfError;
    }

    // Call the actual handler
    return handler(req);
  };
}

/**
 * Higher-order function for route handlers with optional CSRF bypass
 * Use this for routes that need conditional CSRF protection
 */
export function withOptionalCsrf(
  handler: (req: Request) => Promise<Response | NextResponse>,
  options: { skipCsrf?: boolean } = {}
): (req: Request) => Promise<Response | NextResponse> {
  if (options.skipCsrf) {
    return handler;
  }
  return withCsrfProtection(handler);
}
