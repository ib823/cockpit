'use client';
import { Card, Row, Col, Button, Statistic, Dropdown } from 'antd';
import {
  FileTextOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useSessionGuard } from '@/hooks/useSessionGuard';

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
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  const isAdmin = session?.user?.role === 'ADMIN';

  const menuItems = [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: 'Account Settings',
      onClick: () => router.push('/account'),
    },
    ...(isAdmin ? [{
      key: 'admin',
      icon: <CrownOutlined />,
      label: 'Admin Dashboard',
      onClick: () => router.push('/admin'),
    }] : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => signOut({ callbackUrl: '/login' }),
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Keystone</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button
                type="default"
                icon={<CrownOutlined />}
                onClick={() => router.push('/admin')}
              >
                Admin Dashboard
              </Button>
            )}
            <Dropdown menu={{ items: menuItems }} placement="bottomRight">
              <Button type="text" className="flex items-center gap-2">
                <UserOutlined />
                <span>{session?.user?.email || session?.user?.name || 'User'}</span>
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {session?.user?.name || session?.user?.email || 'User'}</h1>
        <p className="text-gray-600 mb-6">Here&apos;s what&apos;s happening with your projects today.</p>
      
      <Row gutter={[16, 16]} className="mb-6">
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

      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => router.push('/gantt-tool')}>
            <div className="text-center">
              <FileTextOutlined style={{ fontSize: 32, color: '#8b5cf6' }} />
              <h3 className="font-bold mt-2">Gantt Tool</h3>
              <p className="text-sm text-gray-600">Create and manage project timelines</p>
              <Button type="link">Start now <RightOutlined /></Button>
            </div>
          </Card>
        </Col>
      </Row>
      </div>
    </div>
  );
}
