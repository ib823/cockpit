/**
 * Tabs Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Tabs as AntTabs } from 'antd';
import type { TabsProps as AntTabsProps } from 'antd';

type TabItem = { value: string; label: React.ReactNode; disabled?: boolean; content?: React.ReactNode };

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'underline' | 'pill' | 'contained';
  className?: string;
}

const sizeMap = {
  sm: 'small' as const,
  md: 'middle' as const,
  lg: 'large' as const,
};

const variantMap = {
  underline: 'line' as const,
  pill: 'card' as const,
  contained: 'card' as const,
};

export const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  size = 'md',
  variant = 'underline',
  className,
}) => {
  const antItems = items.map((item) => ({
    key: item.value,
    label: item.label,
    children: item.content,
    disabled: item.disabled,
  }));

  return (
    <AntTabs
      items={antItems}
      activeKey={value}
      defaultActiveKey={defaultValue}
      onChange={onChange}
      size={sizeMap[size]}
      type={variantMap[variant]}
      className={className}
    />
  );
};
