/**
 * Unified Dashboard Page
 * Role-aware dashboard - replaces both /dashboard and /admin
 * Apple HIG compliant - consistent with Gantt V3 and Architecture V3
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/auth';
import { UnifiedDashboard } from '@/components/dashboard/UnifiedDashboard';
import '@/styles/apple-design-system.css';

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect('/login');
  }

  return <UnifiedDashboard session={session} />;
}
