'use client';

import { Card, Row, Col, Button, Statistic } from 'antd';
import {
  FileTextOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { AppShell } from '@/ui/layout/AppShell';
import { PageHeader } from '@/ui/layout/PageHeader';
import { getMenuItems, getBreadcrumbItems } from '@/config/menu';

export default function DashboardPage() {
  const router = useRouter();
  const { session } = useSessionGuard(); // SECURITY: Validates session on page visibility
  const [stats, setStats] = useState({
    projects: 0,
    estimates: 0,
    accuracy: 0,
    timeSaved: 0,
  });

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const userRole = session?.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const menuItems = getMenuItems(userRole);
  const breadcrumbItems = getBreadcrumbItems('/dashboard');

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
      <PageHeader
        title={`Welcome back, ${user?.name || 'User'}`}
        description="Here's what's happening with your projects today."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Projects"
              value={stats.projects}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Estimates"
              value={stats.estimates}
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg. Accuracy"
              value={stats.accuracy}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Time Saved"
              value={stats.timeSaved}
              suffix="h"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <PageHeader title="Quick Actions" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => router.push('/estimator')}>
            <div style={{ textAlign: 'center' }}>
              <CalculatorOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
              <h3 style={{ fontWeight: 'bold', marginTop: 8 }}>Quick Estimate</h3>
              <p style={{ fontSize: 14, color: '#666', margin: '8px 0' }}>
                Start a new SAP implementation estimate
              </p>
              <Button type="link">
                Start now <RightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => router.push('/gantt-tool')}>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 32, color: '#8b5cf6' }} />
              <h3 style={{ fontWeight: 'bold', marginTop: 8 }}>Gantt Tool</h3>
              <p style={{ fontSize: 14, color: '#666', margin: '8px 0' }}>
                Create and manage project timelines
              </p>
              <Button type="link">
                Start now <RightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </AppShell>
  );
}
