/**
 * LoadingState Component
 * Standardized loading patterns for consistent UX
 *
 * Usage:
 * - page: Full page loading
 * - inline: Inline content loading
 * - skeleton: Content placeholder
 * - overlay: Overlay loading state
 */

import { Spin, Skeleton, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export type LoadingType = 'page' | 'inline' | 'skeleton' | 'overlay';

interface LoadingStateProps {
  type?: LoadingType;
  message?: string;
  rows?: number; // For skeleton type
  className?: string;
}

export function LoadingState({
  type = 'inline',
  message,
  rows = 3,
  className = ''
}: LoadingStateProps) {
  const loadingIcon = <LoadingOutlined style={{ fontSize: 24, color: '#2563eb' }} spin />;

  if (type === 'skeleton') {
    return (
      <div className={className}>
        <Skeleton active paragraph={{ rows }} />
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px'
        }}
      >
        <Spin indicator={loadingIcon} size="large" />
        {message && (
          <p style={{
            color: '#64748b',
            className="text-sm",
            marginTop: '8px',
            fontWeight: 500
          }}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (type === 'overlay') {
    return (
      <div
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          gap: '16px'
        }}
      >
        <Spin indicator={loadingIcon} size="large" />
        {message && (
          <p style={{
            color: '#64748b',
            className="text-sm",
            fontWeight: 500
          }}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default: inline
  return (
    <Space className={className} size="middle" style={{ display: 'flex', alignItems: 'center' }}>
      <Spin indicator={loadingIcon} />
      {message && (
        <span style={{ color: '#64748b', className="text-sm", fontWeight: 500 }}>
          {message}
        </span>
      )}
    </Space>
  );
}

/**
 * SkeletonCard - Consistent skeleton loading for cards
 */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{
      padding: '24px',
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
}

/**
 * SkeletonTable - Skeleton for table loading
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: '24px' }}>
      <Skeleton active title paragraph={{ rows }} />
    </div>
  );
}
