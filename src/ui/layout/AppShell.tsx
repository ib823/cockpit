/**
 * AppShell - Unified application layout
 * Professional, responsive, token-driven
 * No decorative icons unless they add meaning
 */

'use client';

import { Layout, Menu, Breadcrumb, Dropdown, Button, Drawer, Space, Typography, theme as antTheme } from 'antd';
import type { MenuProps } from 'antd';
import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useScreen } from '@/config/responsive';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;
const { useToken } = antTheme;

interface AppShellProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  menuItems: MenuProps['items'];
  breadcrumbItems?: { title: string; href?: string }[];
  onLogout?: () => void;
}

export function AppShell({
  children,
  user,
  menuItems,
  breadcrumbItems,
  onLogout
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { token } = useToken();
  const { screens, widthKey, containerMaxWidth } = useScreen();

  const isMobile = widthKey === 'xs' || widthKey === 'sm' || widthKey === 'md';
  const headerHeight = isMobile ? 56 : 64;
  const contentPadding = widthKey === 'xs' || widthKey === 'sm'
    ? token.padding
    : widthKey === 'md'
    ? token.paddingLG
    : token.paddingXL;

  const userMenuItems: MenuProps['items'] = user ? [
    { key: 'account', label: 'Account Settings' },
    { type: 'divider' },
    { key: 'logout', label: 'Sign Out', onClick: onLogout, danger: true },
  ] : [];

  const MenuComponent = (
    <Menu
      mode="inline"
      selectedKeys={[pathname]}
      items={menuItems}
      style={{ borderRight: 0, height: '100%' }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: headerHeight,
          padding: `0 ${contentPadding}px`,
          background: token.colorBgContainer,
          borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Space size={token.marginLG}>
          {isMobile && (
            <Button type="text" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu">
              Menu
            </Button>
          )}
          <Text
            strong
            style={{ fontSize: token.fontSizeLG, color: token.colorText, cursor: 'pointer' }}
            onClick={() => window.location.href = '/'}
          >
            SAP Cockpit
          </Text>
        </Space>
        {!isMobile && breadcrumbItems && breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} />
        )}
        {user && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text"><Text>{user.name}</Text></Button>
          </Dropdown>
        )}
      </Header>
      <Layout>
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            breakpoint="lg"
            width={272}
            collapsedWidth={80}
            style={{
              overflow: 'auto',
              height: `calc(100vh - ${headerHeight}px)`,
              position: 'sticky',
              top: headerHeight,
              left: 0,
              background: token.colorBgContainer,
              borderRight: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
            }}
          >
            {MenuComponent}
          </Sider>
        )}
        {isMobile && (
          <Drawer
            title="Navigation"
            placement="left"
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            width={272}
            styles={{ body: { padding: 0 } }}
          >
            {MenuComponent}
          </Drawer>
        )}
        <Layout style={{ background: token.colorBgLayout }}>
          <Content
            style={{
              margin: 0,
              padding: contentPadding,
              minHeight: `calc(100vh - ${headerHeight}px - 64px)`,
            }}
          >
            <div style={{ maxWidth: containerMaxWidth, margin: '0 auto', width: '100%' }}>
              {children}
            </div>
          </Content>
          <Footer
            style={{
              textAlign: 'center',
              background: token.colorBgContainer,
              borderTop: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
              padding: `${token.paddingLG}px ${contentPadding}px`,
            }}
          >
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              © {new Date().getFullYear()} SAP Cockpit · v1.0.0
            </Text>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}
