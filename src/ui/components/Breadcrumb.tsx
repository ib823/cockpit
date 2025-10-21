/**
 * Breadcrumb Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import type { BreadcrumbProps as AntBreadcrumbProps } from 'antd';

export type Crumb = { label: React.ReactNode; href?: string; onClick?: () => void };

export interface BreadcrumbProps {
  items: Crumb[];
  'aria-label'?: string;
  className?: string;
  collapseAt?: number; // e.g. 5 → collapse middle when ≥ 5 items
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  collapseAt = 5,
  'aria-label': ariaLabel = 'Breadcrumb',
}) => {
  // Auto-collapse logic
  const needsCollapse = items.length >= collapseAt;
  const visible = needsCollapse ? [items[0], { label: '…' }, ...items.slice(-2)] : items;

  // Convert to Ant Design items format
  const antItems = visible.map((crumb) => ({
    title: crumb.label,
    href: crumb.href,
    onClick: crumb.onClick,
  }));

  return (
    <nav aria-label={ariaLabel} className={className}>
      <AntBreadcrumb items={antItems} separator="/" />
    </nav>
  );
};
