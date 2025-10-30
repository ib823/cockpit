import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authConfig } from './auth';
import { NextResponse } from 'next/server';

export async function createSessionToken(
  userId: string,
  email: string,
  role: 'USER' | 'MANAGER' | 'ADMIN',
  name?: string | null
): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is required');

  const token = await encode({
    token: {
      userId,
      email,
      role,
      sub: userId,
      name: name || email.split('@')[0],
    },
    secret,
    maxAge: 30 * 24 * 60 * 60, // 30 days to match NextAuth config
  });

  return token;
}

export async function createAuthSession(
  userId: string,
  email: string,
  role: 'USER' | 'MANAGER' | 'ADMIN' | string,
  name?: string | null
) {
  const token = await createSessionToken(userId, email, role as any, name);
  const cookieStore = await cookies();
  cookieStore.set('next-auth.session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days to match JWT token expiry
  });
}

export async function requireAdmin() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }

  return session;
}

export async function getSession() {
  return await getServerSession(authConfig);
}

export async function destroyAuthSession() {
  const cookieStore = await cookies();

  // Clear NextAuth session cookie
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');

  // Clear CSRF token
  cookieStore.delete('next-auth.csrf-token');
  cookieStore.delete('__Host-next-auth.csrf-token');

  // Clear callback URL
  cookieStore.delete('next-auth.callback-url');
  cookieStore.delete('__Secure-next-auth.callback-url');
}
