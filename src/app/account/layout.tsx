import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // CRITICAL: Server-side authentication check
  const session = await getServerSession(authConfig);

  if (!session) {
    // Redirect to login if no session
    redirect('/login?callbackUrl=/account');
  }

  return children;
}
