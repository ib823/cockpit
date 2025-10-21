'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Statistic, Button, Spin } from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  IssuesCloseOutlined,
} from '@ant-design/icons';
import { signOut } from 'next-auth/react';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { AppShell } from '@/ui/layout/AppShell';
import { PageHeader } from '@/ui/layout/PageHeader';
import { getMenuItems, getBreadcrumbItems } from '@/config/menu';

interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  proposals: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { session } = useSessionGuard();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeProjects: 0,
    proposals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch admin statistics
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 403) {
          router.push('/dashboard');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch admin stats:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // Redirect non-admins
  if (session?.user?.role !== 'ADMIN') {
    router.push('/dashboard');
    return null;
  }

  const menuItems = getMenuItems('ADMIN');
  const breadcrumbItems = getBreadcrumbItems('/admin');

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
        title="Welcome, Admin"
        description="Manage users, projects, and system settings"
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total Users"
                  value={stats.totalUsers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3b82f6' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Active Projects"
                  value={stats.activeProjects}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: '#10b981' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Proposals"
                  value={stats.proposals}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#8b5cf6' }}
                />
              </Card>
            </Col>
          </Row>

          <PageHeader title="Quick Actions" />

          {/* Quick Actions */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => router.push('/admin/users')}>
                <div style={{ textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
                  <h3 style={{ fontWeight: 'bold', marginTop: 8 }}>Manage Users</h3>
                  <p style={{ fontSize: 14, color: '#666', margin: '8px 0' }}>
                    Add, edit, or remove users
                  </p>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => router.push('/gantt-tool')}>
                <div style={{ textAlign: 'center' }}>
                  <BarChartOutlined style={{ fontSize: 32, color: '#10b981' }} />
                  <h3 style={{ fontWeight: 'bold', marginTop: 8 }}>Gantt Tool</h3>
                  <p style={{ fontSize: 14, color: '#666', margin: '8px 0' }}>
                    Manage project timelines
                  </p>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => router.push('/estimator')}>
                <div style={{ textAlign: 'center' }}>
                  <CalculatorOutlined style={{ fontSize: 32, color: '#8b5cf6' }} />
                  <h3 style={{ fontWeight: 'bold', marginTop: 8 }}>Estimator</h3>
                  <p style={{ fontSize: 14, color: '#666', margin: '8px 0' }}>
                    Project cost estimation
                  </p>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                onClick={() =>
                  window.open('https://github.com/anthropics/claude-code/issues', '_blank')
                }
              >
                <div style={{ textAlign: 'center' }}>
                  <IssuesCloseOutlined style={{ fontSize: 32, color: '#f59e0b' }} />
                  <h3 style={{ fontWeight: 'bold', marginTop: 8 }}>Report Issue</h3>
                  <p style={{ fontSize: 14, color: '#666', margin: '8px 0' }}>
                    GitHub issues
                  </p>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AppShell>
  );
}
