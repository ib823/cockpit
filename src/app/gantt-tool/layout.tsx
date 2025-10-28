import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function GanttToolLayout({ children }: { children: React.ReactNode }) {
  // CRITICAL: Server-side authentication check
  const session = await getServerSession(authConfig);

  if (!session) {
    // Redirect to login if no session
    redirect('/login?callbackUrl=/gantt-tool');
  }

  return children;
}
