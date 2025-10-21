/**
 * PageHeader - Page title, description, and actions
 * Responsive typography and spacing
 */

'use client';

import { Space, Typography, theme as antTheme } from 'antd';
import type { ReactNode } from 'react';
import { useScreen } from '@/config/responsive';

const { Title, Paragraph } = Typography;
const { useToken } = antTheme;

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  extra?: ReactNode;
}

export function PageHeader({ title, description, actions, extra }: PageHeaderProps) {
  const { token } = useToken();
  const { widthKey } = useScreen();

  const titleLevel = widthKey === 'xs' || widthKey === 'sm' ? 3 : 2;

  const descriptionStyle = widthKey === 'xs' || widthKey === 'sm'
    ? {
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }
    : {};

  return (
    <div style={{ marginBottom: token.marginLG }}>
      <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: token.margin,
            flexWrap: widthKey === 'xs' ? 'wrap' : 'nowrap',
          }}
        >
          <Title level={titleLevel} style={{ margin: 0, flex: 1, minWidth: 0 }}>
            {title}
          </Title>
          {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
        </div>
        {description && (
          <Paragraph type="secondary" style={{ margin: 0, fontSize: token.fontSize, ...descriptionStyle }}>
            {description}
          </Paragraph>
        )}
        {extra}
      </Space>
    </div>
  );
}
