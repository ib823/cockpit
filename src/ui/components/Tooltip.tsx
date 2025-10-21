/**
 * Tooltip Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Tooltip as AntTooltip } from 'antd';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <AntTooltip title={content} placement="top">
      {children}
    </AntTooltip>
  );
};
