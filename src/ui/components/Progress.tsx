/**
 * Progress Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Progress as AntProgress } from 'antd';

export interface ProgressProps {
  value?: number;
  label?: string;
  indeterminate?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  label,
  indeterminate,
  className
}) => {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {label && (
        <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
          {label}
        </div>
      )}
      <AntProgress
        percent={indeterminate ? undefined : pct}
        status={indeterminate ? 'active' : undefined}
        showInfo={false}
        strokeWidth={8}
      />
    </div>
  );
};
