import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function ProjectRootLayout({ children }: { children: React.ReactNode }) {
  // CRITICAL: Server-side authentication check
  const session = await getServerSession(authConfig);

  if (!session) {
    // Redirect to login if no session
    redirect('/login?callbackUrl=/project');
  }

  // Additional check: ensure user is active
  if (session.user.role !== 'ADMIN' && session.user.role !== 'USER' && session.user.role !== 'MANAGER') {
    redirect('/login');
  }

  return children;
}
