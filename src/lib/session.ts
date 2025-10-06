import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
const COOKIE = 'sb';

export async function setSession(payload: { sub: string; role: 'USER' | 'ADMIN' }) {
  // Best practice: 15-minute sessions for regular users, 1 hour for admins
  const expiry = payload.role === 'ADMIN' ? '1h' : '15m';

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret);

  const store = await cookies();
  const maxAge = payload.role === 'ADMIN' ? 3600 : 900; // seconds

  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
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
  if (!s || s.role !== 'ADMIN') throw new Error('forbidden');
  return s;
}
