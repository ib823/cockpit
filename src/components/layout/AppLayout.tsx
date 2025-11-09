'use client';
import { Layout, Menu, Avatar, Dropdown, Space, Badge, Drawer, Button } from 'antd';
import {
  CalculatorOutlined,
  ProjectOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LogoutButton } from '@/components/common/LogoutButton';
import { useState } from 'react';

const { Header, Content } = Layout;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = pathname?.split('/')[1] || 'project';

  const menuItems = [
    {
      key: 'project',
      icon: <ProjectOutlined />,
      label: 'Project Builder',
      onClick: () => router.push('/project/capture'),
    },
  ];

  if (session?.user?.role === 'ADMIN') {
    menuItems.push({
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Admin',
      onClick: () => router.push('/admin'),
    });
  }

  return (
    <Layout className="min-h-screen w-full">
      <Header className="bg-white border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50" style={{ width: '100%' }}>
        <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
            <span className="text-lg font-semibold">Keystone</span>
          </div>

          {/* Desktop Menu - Hidden on mobile */}
          <Menu
            mode="horizontal"
            selectedKeys={[currentPath]}
            items={menuItems}
            className="border-0 flex-1 hidden md:flex"
          />

          {/* Hamburger Button - Visible only on mobile */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden ml-auto"
            size="large"
          />
        </div>

        {/* User Info - Hidden on mobile to save space */}
        <Space size="middle" className="hidden sm:flex">
          {session?.user && (
            <>
              <span className="text-sm text-gray-600 hidden lg:inline">{session.user.email}</span>
              <LogoutButton variant="button" theme="light" />
            </>
          )}
        </Space>
      </Header>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        className="md:hidden"
      >
        <Menu
          mode="vertical"
          selectedKeys={[currentPath]}
          items={menuItems}
          onClick={() => setMobileMenuOpen(false)}
          className="border-0"
        />

        {/* User Info in Mobile Menu */}
        {session?.user && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-4">{session.user.email}</div>
            <LogoutButton variant="button" theme="light" />
          </div>
        )}
      </Drawer>

      <Content className="bg-gray-50" style={{ width: '100%' }}>
        {children}
      </Content>
    </Layout>
  );
}
