/**
 * Alert Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Alert as AntAlert } from 'antd';
import type { AlertProps as AntAlertProps } from 'antd';

type Variant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: Variant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, onClose }) => {
  return (
    <AntAlert
      type={variant}
      message={title}
      description={children}
      closable={!!onClose}
      onClose={onClose}
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};
