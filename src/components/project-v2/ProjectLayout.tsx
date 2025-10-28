'use client';
import { Layout, Tabs, Button, Avatar, Dropdown, Space, Progress } from 'antd';
import { UserOutlined, LogoutOutlined, DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/common/LogoutButton';

const { Header, Content } = Layout;

interface ProjectLayoutProps {
  children: React.ReactNode;
  progress?: number;
  userEmail?: string;
}

export function ProjectLayout({ children, progress = 0, userEmail }: ProjectLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = pathname?.split('/').pop() || 'capture';

  const tabs = [
    { key: 'capture', label: 'Capture', path: '/project/capture' },
    { key: 'decide', label: 'Decide', path: '/project/decide' },
    { key: 'plan', label: 'Plan', path: '/project/plan' },
    { key: 'present', label: 'Present', path: '/project/present' },
  ];

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold m-0">Keystone</h1>
          <Tabs
            activeKey={currentTab}
            items={tabs}
            onChange={(key) => {
              const tab = tabs.find(t => t.key === key);
              if (tab) router.push(tab.path);
            }}
            className="mb-0"
          />
        </div>
        
        <Space size="middle">
          {progress > 0 && (
            <div className="w-32">
              <Progress percent={progress} size="small" />
            </div>
          )}
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button icon={<ShareAltOutlined />}>Share</Button>
          <LogoutButton variant="button" />
        </Space>
      </Header>
      
      <Content className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </Content>
    </Layout>
  );
}
