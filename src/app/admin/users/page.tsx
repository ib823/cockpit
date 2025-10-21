'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Spin, Alert } from 'antd';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { AppShell } from '@/ui/layout/AppShell';
import { PageHeader } from '@/ui/layout/PageHeader';
import { getMenuItems, getBreadcrumbItems } from '@/config/menu';
import UserManagementClient from '@/components/admin/UserManagementClient';

export default function UsersPage() {
  const router = useRouter();
  const { session } = useSessionGuard();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session, router]);

  const userRole = session?.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const menuItems = getMenuItems(userRole);
  const breadcrumbItems = getBreadcrumbItems('/admin/users');

  const user = session?.user
    ? {
        name: session.user.name || session.user.email || 'Admin',
        email: session.user.email || '',
        role: 'ADMIN' as const,
      }
    : undefined;

  return (
    <AppShell
      user={user}
      menuItems={menuItems}
      breadcrumbItems={breadcrumbItems}
      onLogout={() => signOut({ callbackUrl: '/login' })}
    >
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and access permissions"
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : (
        <>
          <UserManagementClient initialUsers={users} />

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">User Management Info</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Create new users with email, name, role, and access settings. Users with "Permanent Access" never expire.
                    Use the Edit button to modify user details, or Delete to remove users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
