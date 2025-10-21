/**
 * EmptyState Component - Ant Design wrapper
 */

import React from 'react';
import { Empty, Button, Card } from 'antd';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  children?: React.ReactNode;
}

const variantMap = {
  primary: 'primary' as const,
  secondary: 'default' as const,
  ghost: 'text' as const,
};

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <Card style={{ background: '#fafafa' }}>
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <Empty
          image={
            Icon ? (
              <Icon style={{ width: 64, height: 64, color: '#bbb', margin: '0 auto' }} />
            ) : (
              Empty.PRESENTED_IMAGE_SIMPLE
            )
          }
          description={
            <>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#262626', marginBottom: 8 }}>
                {title}
              </div>
              {description && (
                <div style={{ fontSize: 14, color: '#8c8c8c', maxWidth: 448, margin: '0 auto 24px' }}>
                  {description}
                </div>
              )}
            </>
          }
        >
          {action && (
            <Button type={variantMap[action.variant || 'primary']} size="middle" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {children}
        </Empty>
      </div>
    </Card>
  );
}
