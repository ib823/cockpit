/**
 * Authentication Test Helpers
 * Utility functions for testing auth endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Create mock Next.js request
 */
export function createMockRequest(options: {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}): Request {
  const headers = new Headers(options.headers || {});
  headers.set('content-type', 'application/json');

  const request = new Request(options.url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return request;
}

/**
 * Parse JSON response
 */
export async function parseJsonResponse(response: Response | NextResponse) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Mock passkey response (simplified for testing)
 */
export function createMockPasskeyResponse(authenticatorId: string) {
  return {
    id: authenticatorId,
    rawId: authenticatorId,
    response: {
      clientDataJSON: Buffer.from(JSON.stringify({
        type: 'webauthn.get',
        challenge: 'mock-challenge',
        origin: 'http://localhost:3000',
      })).toString('base64'),
      authenticatorData: Buffer.from('mock-auth-data').toString('base64'),
      signature: Buffer.from('mock-signature').toString('base64'),
      userHandle: Buffer.from('mock-user-handle').toString('base64'),
    },
    type: 'public-key',
  };
}

/**
 * Wait for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random test email
 */
export function randomTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Extract session cookie from response
 */
export function extractSessionCookie(response: Response | NextResponse): string | null {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;

  const match = setCookie.match(/next-auth\.session-token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Check if response has rate limit headers
 */
export function getRateLimitHeaders(response: Response | NextResponse) {
  return {
    limit: response.headers.get('X-RateLimit-Limit'),
    remaining: response.headers.get('X-RateLimit-Remaining'),
    reset: response.headers.get('X-RateLimit-Reset'),
    retryAfter: response.headers.get('Retry-After'),
  };
}

/**
 * Assert response status
 */
export function assertStatus(response: Response | NextResponse, expected: number) {
  if (response.status !== expected) {
    throw new Error(`Expected status ${expected}, got ${response.status}`);
  }
}

/**
 * Assert response JSON matches
 */
export async function assertJsonMatch(
  response: Response | NextResponse,
  expected: Partial<any>
) {
  const json = await parseJsonResponse(response);

  for (const [key, value] of Object.entries(expected)) {
    if (json[key] !== value) {
      throw new Error(
        `Expected ${key} to be ${value}, got ${json[key]}\nFull response: ${JSON.stringify(json, null, 2)}`
      );
    }
  }
}
