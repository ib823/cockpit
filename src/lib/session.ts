import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-min-32-chars-long-for-hs256';
const secret = new TextEncoder().encode(SESSION_SECRET);
const COOKIE = 'sb';

export async function setSession(payload: { sub: string; role: 'USER' | 'ADMIN' }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') {
    throw new Error('forbidden');
  }
  return s;
}

export async function requireUser() {
  const s = await getSession();
  if (!s) {
    throw new Error('unauthorized');
  }
  return s;
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE);
}
