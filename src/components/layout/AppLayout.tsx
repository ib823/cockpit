'use client';
import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd';
import { 
  CalculatorOutlined, 
  ProjectOutlined, 
  UserOutlined,
  LogoutOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LogoutButton } from '@/components/common/LogoutButton';

const { Header, Content } = Layout;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const currentPath = pathname?.split('/')[1] || 'estimator';

  const menuItems = [
    {
      key: 'estimator',
      icon: <CalculatorOutlined />,
      label: 'Quick Estimate',
      onClick: () => router.push('/estimator'),
    },
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
    <Layout className="min-h-screen">
      <Header className="bg-white border-b flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
            <span className="text-lg font-semibold">SAP Cockpit</span>
          </div>
          
          <Menu
            mode="horizontal"
            selectedKeys={[currentPath]}
            items={menuItems}
            className="border-0 flex-1"
          />
        </div>

        <Space size="middle">
          {session?.user && (
            <>
              <span className="text-sm text-gray-600">{session.user.email}</span>
              <LogoutButton variant="button" theme="light" />
            </>
          )}
        </Space>
      </Header>

      <Content className="bg-gray-50">
        {children}
      </Content>
    </Layout>
  );
}
