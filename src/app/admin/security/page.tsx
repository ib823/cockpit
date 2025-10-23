import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from '@/components/common/LogoutButton';
import { SecurityDashboardClient } from '@/components/admin/SecurityDashboardClient';
import {
  getAuthMetricsSummary,
  getRecentFailedAttempts,
  checkForSuspiciousActivity,
} from '@/lib/monitoring/auth-metrics';
import { getBlockedIPs } from '@/lib/security/ip-blocker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SecurityDashboard() {
  const session = await getServerSession(authConfig);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch initial data server-side
  const [metrics, recentFailures, suspiciousActivity, blockedIPs] = await Promise.all([
    getAuthMetricsSummary(),
    getRecentFailedAttempts(60, 100),
    checkForSuspiciousActivity(),
    getBlockedIPs(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                Admin Dashboard
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/admin/users"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Users
                </Link>
                <Link
                  href="/admin/security"
                  className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600"
                >
                  Security
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Monitoring</h2>
          <p className="text-gray-600">Real-time authentication metrics and threat detection</p>
        </div>

        {/* Client-side interactive dashboard */}
        <SecurityDashboardClient
          initialMetrics={metrics}
          initialFailures={recentFailures}
          initialAlerts={suspiciousActivity}
          initialBlockedIPs={blockedIPs}
        />
      </div>
    </div>
  );
}
