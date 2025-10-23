/**
 * Offline Page
 * Shown when user is offline and requests a non-cached page
 */

'use client';

import { Result, Button, Space, Typography, Card } from 'antd';
import { DisconnectOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useOnlineStatus } from '@/lib/offline/use-offline';

const { Title, Paragraph, Text } = Typography;

export default function OfflinePage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const handleRetry = () => {
    if (isOnline) {
      router.back();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 600,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <Result
          icon={<DisconnectOutlined style={{ color: isOnline ? '#faad14' : '#ff4d4f' }} />}
          title={
            <Title level={2} style={{ marginBottom: 0 }}>
              {isOnline ? 'Page Not Available Offline' : "You're Offline"}
            </Title>
          }
          subTitle={
            <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
              <Paragraph style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.65)' }}>
                {isOnline
                  ? 'This page has not been cached for offline use yet. Please connect to the internet to access it.'
                  : "It looks like you've lost your internet connection. Don't worry, your work is safe!"}
              </Paragraph>

              {!isOnline && (
                <Card style={{ background: '#f6f8fa', border: '1px solid #e1e4e8' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>What you can do while offline:</Text>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>
                        <Text>Continue working on the estimator</Text>
                      </li>
                      <li>
                        <Text>View your recent projects</Text>
                      </li>
                      <li>
                        <Text>Access your saved data</Text>
                      </li>
                      <li>
                        <Text>All changes will sync when you reconnect</Text>
                      </li>
                    </ul>
                  </Space>
                </Card>
              )}
            </Space>
          }
          extra={
            <Space size="middle" style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleRetry}
              >
                {isOnline ? 'Try Again' : 'Retry'}
              </Button>
              <Button size="large" icon={<HomeOutlined />} onClick={handleGoHome}>
                Go to Dashboard
              </Button>
            </Space>
          }
        />

        {!isOnline && (
          <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Your connection will be restored automatically when internet is available
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
}
