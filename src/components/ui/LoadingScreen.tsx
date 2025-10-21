/**
 * LoadingScreen - Ant Design Spin wrapper
 * Full-screen loading state
 */

'use client';

import { Spin } from 'antd';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f7f8fa 0%, #e6f0ff 50%, #f3e8ff 100%)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16, color: '#666', fontSize: 18 }}>{message}</p>
      </div>
    </div>
  );
}
