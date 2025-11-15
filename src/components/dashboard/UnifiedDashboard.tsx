/**
 * Unified Dashboard Component
 * Role-aware dashboard that replaces both /dashboard and /admin
 * Apple HIG compliant design - consistent with Gantt V3 and Architecture V3
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import {
  FileText,
  Users,
  Shield,
  GitBranch,
} from 'lucide-react';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { MetricCard } from './MetricCard';
import { QuickActionCard } from './QuickActionCard';
import styles from './UnifiedDashboard.module.css';

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

export function UnifiedDashboard({ session }: UnifiedDashboardProps) {
  const router = useRouter();
  const isAdmin = session.user.role === 'ADMIN';
  const userName = session.user.email?.split('@')[0] || session.user.name || 'User';

  // Remove the old header - GlobalNav handles this now

  // User stats
  const [stats, setStats] = useState<DashboardStats>({
    timelineProjects: 0,
    architectureDiagrams: 0,
    totalResources: 0,
  });

  // Admin stats
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Fetch user stats
        const userStatsResponse = await fetch('/api/dashboard/stats');
        if (userStatsResponse.ok) {
          const data = await userStatsResponse.json();
          setStats({
            timelineProjects: data.timelineProjects || 0,
            architectureDiagrams: data.architectureDiagrams || 0,
            totalResources: data.totalResources || 0,
          });
        }

        // Fetch admin stats if admin
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
        console.error('[Dashboard] Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  return (
    <>
      {/* Global Navigation - Tier 1 */}
      <GlobalNav session={session} />

      <div className={styles.container}>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Welcome Section */}
        <div className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {userName}
          </h1>
          <p className={styles.welcomeSubtitle}>
            {isAdmin
              ? 'Manage your projects and oversee system administration.'
              : "Here's what's happening with your projects today."}
          </p>
        </div>

        {/* Metrics */}
        <div className={styles.metricsGrid}>
          <MetricCard
            icon={GitBranch}
            iconColor="blue"
            label="Timeline Projects"
            value={stats.timelineProjects}
            description="Total timeline projects created"
            isEmpty={stats.timelineProjects === 0}
          />

          <MetricCard
            icon={FileText}
            iconColor="purple"
            label="Architecture Diagrams"
            value={stats.architectureDiagrams}
            description="Architecture diagrams designed"
            isEmpty={stats.architectureDiagrams === 0}
          />

          <MetricCard
            icon={Users}
            iconColor="green"
            label="Total Resources"
            value={stats.totalResources}
            description="Team members across all projects"
            isEmpty={stats.totalResources === 0}
          />
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <QuickActionCard
              icon={GitBranch}
              iconColor="blue"
              title="Timeline"
              description="Create and manage project timelines with interactive Gantt charts"
              onClick={() => router.push('/gantt-tool')}
            />

            <QuickActionCard
              icon={FileText}
              iconColor="purple"
              title="Architecture"
              description="Design and visualize system architecture diagrams"
              onClick={() => router.push('/architecture/v3')}
            />
          </div>
        </section>

        {/* Admin Section (only visible to admins) */}
        {isAdmin && adminStats && (
          <section className={styles.adminSection}>
            <div className={styles.adminHeader}>
              <Shield className={styles.adminIcon} />
              <h2 className={styles.adminTitle}>Administration</h2>
            </div>

            {/* Admin Metrics */}
            <div className={styles.metricsGrid} style={{ marginBottom: 'var(--space-32)' }}>
              <MetricCard
                icon={Users}
                iconColor="blue"
                label="Total Users"
                value={adminStats.totalUsers}
                description="Registered users in the system"
                isEmpty={adminStats.totalUsers === 0}
              />

              <MetricCard
                icon={FileText}
                iconColor="green"
                label="Active Projects"
                value={adminStats.activeProjects}
                description="Approved and in-progress projects"
                isEmpty={adminStats.activeProjects === 0}
              />

              <MetricCard
                icon={FileText}
                iconColor="orange"
                label="Proposals"
                value={adminStats.proposals}
                description="Draft and in-review projects"
                isEmpty={adminStats.proposals === 0}
              />
            </div>

            {/* Admin Actions */}
            <div className={styles.adminGrid}>
              <QuickActionCard
                icon={Users}
                iconColor="blue"
                title="User Management"
                description="Add, edit, or remove users and manage permissions"
                onClick={() => router.push('/admin/users')}
                variant="admin"
              />

              <QuickActionCard
                icon={Shield}
                iconColor="red"
                title="Security Monitoring"
                description="View authentication metrics and threat detection"
                onClick={() => router.push('/admin/security')}
                variant="admin"
              />
            </div>
          </section>
        )}
      </main>
    </div>
    </>
  );
}
