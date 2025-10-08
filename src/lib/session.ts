/**
 * Session Management
 * SECURITY: JWT-based sessions with validated environment configuration
 * No default secret fallback - fails loudly if SESSION_SECRET not configured
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from './env';

// SECURITY: Use validated environment variable (no default fallback)
const secret = new TextEncoder().encode(env.SESSION_SECRET);
const COOKIE = 'sb';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export interface SessionPayload {
  sub: string; // User ID
  role: 'USER' | 'ADMIN';
  csrfToken?: string; // CSRF token for additional security
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Create a new session with JWT token
 * @param payload User information and role
 */
export async function setSession(payload: { sub: string; role: 'USER' | 'ADMIN'; csrfToken?: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Get current session from cookie
 * @returns Session payload or null if not authenticated
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  
  if (!token) {
    return null;
  }

  try {
  //  const { payload } = await jwtVerify(token, secret);
  //  return payload as SessionPayload;
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
  } catch (error) {
    // Token expired, invalid, or malformed
    console.warn('[Session] JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Require admin role or throw error
 * Use this in admin API routes
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized: Authentication required');
  }
  
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return session;
}

/**
 * Require any authenticated user or throw error
 * Use this in protected API routes
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized: Authentication required');
  }
  
  return session;
}

/**
 * Destroy current session
 * Call this on logout
 */
export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/**
 * Refresh session expiration
 * Call this on user activity to keep session alive
 */
export async function refreshSession(): Promise<void> {
  const session = await getSession();
  
  if (session) {
    // Re-issue token with new expiration
    await setSession({
      sub: session.sub,
      role: session.role,
      csrfToken: session.csrfToken,
    });
  }
}