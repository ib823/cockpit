import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Fallback-safe: if getServerSession not configured, just redirect to /login
  try {
    // @ts-expect-error - allow dynamic import pattern
    const { authConfig } = await import('@/lib/auth');
    // @ts-expect-error - authConfig type compatibility
    const session = await getServerSession(authConfig);
    if (session?.user?.role === 'ADMIN') redirect('/admin');
    if (session?.user) redirect('/dashboard');
  } catch {}
  redirect('/login');
}
