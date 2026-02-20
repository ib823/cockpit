/**
 * Unified Dashboard Component
 * Role-aware dashboard that replaces both /dashboard and /admin
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

  const [stats, setStats] = useState<DashboardStats>({
    timelineProjects: 0,
    architectureDiagrams: 0,
    totalResources: 0,
  });

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [_isLoading, setIsLoading] = useState(true);

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
        console.error('[Dashboard] Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  return (
    <>
      <GlobalNav session={session} />

      <div className="min-h-screen bg-secondary">
        <main id="main-content" className="max-w-[1400px] mx-auto px-6 py-10 md:px-10 md:py-16">
          {/* Welcome Section */}
          <div className="mb-12 animate-slide-up">
            <h1 className="display-large mb-2 text-primary">
              Welcome back, {userName}
            </h1>
            <p className="body-large text-secondary">
              {isAdmin
                ? 'Manage your projects and oversee system administration.'
                : "Here's what's happening with your projects today."}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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
          <section className="mb-16">
            <h2 className="display-small mb-6 text-primary">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <section className="pt-12 border-t border-subtle animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <Shield className="w-6 h-6 text-blue" />
                <h2 className="display-small text-primary">Administration</h2>
              </div>

              {/* Admin Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
