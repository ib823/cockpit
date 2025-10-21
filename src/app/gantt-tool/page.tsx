/**
 * Gantt Tool - Main Page
 *
 * Standalone route for creating professional timeline visualizations.
 * Authentication optional - accessible to all users.
 */

'use client';

import { signOut, useSession } from 'next-auth/react';
import { GanttToolShell } from '@/components/gantt-tool/GanttToolShell';
import { AppShell } from '@/ui/layout/AppShell';
import { PageHeader } from '@/ui/layout/PageHeader';
import { getMenuItems, getBreadcrumbItems } from '@/config/menu';

export default function GanttToolPage() {
  const { data: session } = useSession();

  const userRole = session?.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const menuItems = getMenuItems(userRole);
  const breadcrumbItems = getBreadcrumbItems('/gantt-tool');

  const user = session?.user
    ? {
        name: session.user.name || session.user.email || 'User',
        email: session.user.email || '',
        role: session.user.role || 'USER',
      }
    : undefined;

  return (
    <AppShell
      user={user}
      menuItems={menuItems}
      breadcrumbItems={breadcrumbItems}
      onLogout={() => signOut({ callbackUrl: '/login' })}
    >
      <GanttToolShell />
    </AppShell>
  );
}
