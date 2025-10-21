/**
 * Badge Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Badge as AntBadge, Tag } from 'antd';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantColorMap = {
  default: 'default',
  info: 'blue',
  success: 'green',
  warning: 'gold',
  error: 'red',
} as const;

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  // Use Ant Design Tag for badge-like display
  return (
    <Tag
      color={variantColorMap[variant]}
      className={className}
      style={{
        fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
        padding: size === 'sm' ? '0 8px' : size === 'lg' ? '4px 12px' : '2px 10px',
      }}
    >
      {children}
    </Tag>
  );
}
