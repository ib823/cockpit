/**
 * Pagination Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Pagination as AntPagination } from 'antd';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  size?: 'sm' | 'md';
  compact?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'small' as const,
  md: 'default' as const,
};

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageCount,
  onPageChange,
  size = 'md',
  compact = false,
  className,
}) => {
  return (
    <AntPagination
      current={page}
      total={pageCount}
      pageSize={1}
      onChange={onPageChange}
      size={sizeMap[size]}
      simple={compact}
      showLessItems={compact}
      className={className}
      showSizeChanger={false}
    />
  );
};
