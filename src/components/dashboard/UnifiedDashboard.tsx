/**
 * Unified Dashboard Component
 * Role-aware dashboard that replaces both /dashboard and /admin
 */

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { Session } from 'next-auth';
import {
  FileText,
  Users,
  Shield,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';
import { AppShell, PageHeader, Card } from '@/components/ds/AppShell';
import { UserMenu } from '@/components/navigation/UserMenu';
import { globalNav } from '@/components/navigation/global-nav';
import styles from './dashboard.module.css';

interface UnifiedDashboardProps {
  session: Session;
}

interface DashboardStats {
  timelineProjects: number;
  architectureDiagrams: number;
  totalResources: number;
}

interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  proposals: number;
}

interface StatTile {
  label: string;
  value: number;
  description: string;
}

interface ActionLink {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Label + big tabular-nums value + one-line description. A zero renders
 *  quietly rather than being swapped for an invented placeholder. */
function StatCard({ label, value, description }: StatTile) {
  return (
    <Card>
      <p className={styles.statLabel}>{label}</p>
      <p
        className={
          value === 0 ? `${styles.statValue} ${styles.statValueQuiet}` : styles.statValue
        }
      >
        {value.toLocaleString()}
      </p>
      <p className={styles.statDescription}>{description}</p>
    </Card>
  );
}

function ActionCard({ href, title, description, icon: Icon }: ActionLink) {
  return (
    <Link href={href} className={styles.linkCard}>
      <span className={styles.linkIcon}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className={styles.linkTitle}>{title}</span>
      <span className={styles.linkBody}>{description}</span>
    </Link>
  );
}

const QUICK_ACTIONS: ActionLink[] = [
  {
    href: '/gantt-tool',
    title: 'Timeline',
    description: 'Create and manage project timelines with interactive Gantt charts',
    icon: GitBranch,
  },
  {
    href: '/architecture/v3',
    title: 'Architecture',
    description: 'Design and visualize system architecture diagrams',
    icon: FileText,
  },
];

const ADMIN_ACTIONS: ActionLink[] = [
  {
    href: '/admin/users',
    title: 'User management',
    description: 'Add, edit, or remove users and manage permissions',
    icon: Users,
  },
  {
    href: '/admin/security',
    title: 'Security monitoring',
    description: 'View authentication metrics and threat detection',
    icon: Shield,
  },
];

export function UnifiedDashboard({ session }: UnifiedDashboardProps) {
  const isAdmin = session.user.role === 'ADMIN';
  const userName = session.user.email?.split('@')[0] || session.user.name || 'User';

  const [stats, setStats] = useState<DashboardStats>({
    timelineProjects: 0,
    architectureDiagrams: 0,
    totalResources: 0,
  });

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const userStatsResponse = await fetch('/api/dashboard/stats');
        if (userStatsResponse.ok) {
          const data = await userStatsResponse.json();
          setStats({
            timelineProjects: data.timelineProjects || 0,
            architectureDiagrams: data.architectureDiagrams || 0,
            totalResources: data.totalResources || 0,
          });
        }

        if (isAdmin) {
          const adminStatsResponse = await fetch('/api/admin/stats');
          if (adminStatsResponse.ok) {
            const data = await adminStatsResponse.json();
            setAdminStats({
              totalUsers: data.totalUsers || 0,
              activeProjects: data.activeProjects || 0,
              proposals: data.proposals || 0,
            });
          }
        }
      } catch (error) {
        logger.error('[Dashboard] Failed to fetch stats', { error });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  const statTiles: StatTile[] = [
    {
      label: 'Timeline projects',
      value: stats.timelineProjects,
      description: 'Total timeline projects created',
    },
    {
      label: 'Architecture diagrams',
      value: stats.architectureDiagrams,
      description: 'Architecture diagrams designed',
    },
    {
      label: 'Total resources',
      value: stats.totalResources,
      description: 'Team members across all projects',
    },
  ];

  const adminTiles: StatTile[] = adminStats
    ? [
        {
          label: 'Total users',
          value: adminStats.totalUsers,
          description: 'Registered users in the system',
        },
        {
          label: 'Active projects',
          value: adminStats.activeProjects,
          description: 'Approved and in-progress projects',
        },
        {
          label: 'Proposals',
          value: adminStats.proposals,
          description: 'Draft and in-review projects',
        },
      ]
    : [];

  return (
    <AppShell primaryNav={globalNav("/dashboard")} topBarEnd={<UserMenu session={session} />}>
      {/* No sync chip here: the dashboard reads aggregate stats, not a
        * project document — a chip with nothing to sync would be a lie. */}
      <PageHeader
        title={`Welcome back, ${userName}`}
        description={
          isAdmin
            ? 'Manage your projects and oversee system administration.'
            : "Here's what's happening with your projects today."
        }
      />

      <div className={styles.statGrid} aria-busy={isLoading}>
        {statTiles.map((tile) => (
          <StatCard key={tile.label} {...tile} />
        ))}
      </div>

      <section aria-labelledby="quick-actions" className={styles.section}>
        <h2 id="quick-actions" className={styles.sectionHeading}>
          Quick actions
        </h2>
        <div className={styles.linkGrid}>
          {QUICK_ACTIONS.map((action) => (
            <ActionCard key={action.href} {...action} />
          ))}
        </div>
      </section>

      {/* Admin section (only visible to admins) */}
      {isAdmin && adminStats && (
        <section aria-labelledby="administration" className={styles.adminSection}>
          <h2 id="administration" className={styles.sectionHeading}>
            <Shield size={18} aria-hidden="true" className={styles.sectionHeadingIcon} />
            Administration
          </h2>

          <div className={styles.statGrid}>
            {adminTiles.map((tile) => (
              <StatCard key={tile.label} {...tile} />
            ))}
          </div>

          <div className={styles.linkGrid}>
            {ADMIN_ACTIONS.map((action) => (
              <ActionCard key={action.href} {...action} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
