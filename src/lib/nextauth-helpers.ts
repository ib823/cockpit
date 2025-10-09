/**
 * NextAuth Session Helpers
 * Replacement for the old jose-based session.ts
 * Provides type-safe session access for API routes
 */

import { getServerSession } from 'next-auth';
import { encode } from 'next-auth/jwt';
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
 * Use this in custom WebAuthn/magic link routes after successful authentication
 * This creates a proper NextAuth JWT session without using the standard flow
 */
export async function createAuthSession(userId: string, email: string, role: 'USER' | 'MANAGER' | 'ADMIN'): Promise<void> {
  const token = await encode({
    token: {
      userId,
      email,
      role,
      sub: userId,
    },
    secret: env.NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60, // 24 hours
  });

  const cookieStore = await cookies();
  cookieStore.set('next-auth.session-token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
}

/**
 * Destroy the current NextAuth session
 * Use this in logout routes
 */
export async function destroyAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('next-auth.session-token');
}
