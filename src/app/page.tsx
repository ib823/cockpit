import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Fallback-safe: if getServerSession not configured, just redirect to /login
  try {
    const { authConfig } = await import('@/lib/auth');
    const session = await getServerSession(authConfig);
    if (session?.user?.role === 'ADMIN') redirect('/admin');
    if (session?.user) redirect('/dashboard');
  } catch {}
  redirect('/login');
}
