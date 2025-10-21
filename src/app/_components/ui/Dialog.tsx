/**
 * Dialog Component - Ant Design Modal wrapper
 * Apple-inspired minimalist design compatibility layer
 */

'use client';

import React from 'react';
import { Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  footer?: React.ReactNode;
}

const sizeMap = {
  sm: 416,
  md: 520,
  lg: 720,
  xl: 1000,
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  footer,
}) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={title}
      footer={footer}
      width={sizeMap[size]}
      centered
      destroyOnClose
      closeIcon={<CloseOutlined />}
      className={className}
    >
      {children}
    </Modal>
  );
};
