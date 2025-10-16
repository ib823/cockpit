/**
 * NextAuth Session Helpers
 * Replacement for the old jose-based session.ts
 * Provides type-safe session access for API routes
 */

import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authConfig } from './auth';
import { env } from './env';

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
};

export type AuthSession = {
  user: SessionUser;
  expires: string;
};

/**
 * Get the current authenticated user session
 * @returns Session object or null if not authenticated
 */
export async function getSession(): Promise<AuthSession | null> {
  const session = await getServerSession(authConfig);
  return session as AuthSession | null;
}

/**
 * Require an authenticated user or throw 401
 * Use this in protected API routes
 */
export async function requireUser(): Promise<AuthSession> {
  const session = await getSession();
  
  if (!session?.user) {
    throw new Error('Unauthorized: Authentication required');
  }
  
  return session;
}

/**
 * Require an admin user or throw 403
 * Use this in admin API routes
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireUser();
  
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return session;
}

/**
 * Check if the current user is an admin
 * Non-throwing version for conditional logic
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === 'ADMIN';
}

/**
 * Check if the current user is authenticated
 * Non-throwing version for conditional logic
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Manually create a NextAuth session (for custom auth flows)
 * Uses jose directly for JWT signing (bypasses NextAuth's encode to avoid JWE issues)
 */
/**
 * Manually create a NextAuth session (for custom auth flows)
 * Creates JWT manually using Node crypto to avoid jose version conflicts
 */
/**
 * Create JWT token for session (caller must set cookie)
 */
export async function createSessionToken(
  userId: string, 
  email: string, 
  role: 'USER' | 'MANAGER' | 'ADMIN'
): Promise<string> {
  const crypto = await import('crypto');
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId,
    email,
    role,
    sub: userId,
    name: email.split('@')[0],
    iat: now,
    exp: now + (24 * 60 * 60)
  };
  
  const base64UrlEncode = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  
  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  
  const signature = crypto.createHmac('sha256', env.NEXTAUTH_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`;

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.delete('next-auth.session-token');
}
export async function createAuthSession(userId: string, email: string, role: string) {
  const token = await createSessionToken(userId, email, role as "USER" | "MANAGER" | "ADMIN");
  const cookieStore = await cookies();
  cookieStore.set('next-auth.session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
}

/**
 * Destroy the current NextAuth session
 */
export async function destroyAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
}
