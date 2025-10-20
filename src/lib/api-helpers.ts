import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from './db';

/**
 * Wrap an API route handler with automatic database retry logic
 *
 * Usage:
 * ```ts
 * export const GET = withDatabaseRetry(async (request) => {
 *   const data = await prisma.user.findMany();
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withDatabaseRetry<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await withRetry(() => handler(...args));
    } catch (error: any) {
      // If we still fail after retries, return a proper error response
      console.error('[API] Database operation failed after retries:', error);

      // Return user-friendly error based on error type
      if (error?.code?.startsWith('P1')) {
        // Connection errors
        return NextResponse.json(
          {
            error: 'Database connection error. Please try again in a moment.',
            code: 'DB_CONNECTION_ERROR',
          },
          { status: 503 } // Service Unavailable
        );
      }

      // Re-throw for proper error handling
      throw error;
    }
  };
}

/**
 * Simple request logger middleware
 */
export function logRequest(request: NextRequest, label: string) {
  const method = request.method;
  const url = request.url;
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${url} - ${label}`);
}
