/**
 * Modal Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Modal as AntModal } from 'antd';
import type { ModalProps as AntModalProps } from 'antd';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  footer,
  width = 560,
  children,
}) => {
  return (
    <AntModal
      open={open}
      onCancel={onClose}
      title={title}
      footer={footer}
      width={width}
      centered
      destroyOnClose
    >
      {children}
    </AntModal>
  );
};
