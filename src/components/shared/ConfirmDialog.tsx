/**
 * ConfirmDialog Component
 * Confirmation dialogs for destructive actions with clear visual hierarchy
 *
 * Usage:
 * const [showConfirm, confirmDialog] = useConfirmDialog();
 *
 * await showConfirm({
 *   title: "Delete Project?",
 *   description: "This will permanently delete all project data.",
 *   confirmText: "Delete",
 *   danger: true
 * });
 */

'use client';

import { Modal } from 'antd';
import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  icon,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const defaultIcon = danger ? (
    <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
  ) : (
    <QuestionCircleOutlined style={{ color: '#2563eb' }} />
  );

  Modal.confirm({
    title,
    content: description,
    icon: icon || defaultIcon,
    okText: confirmText,
    cancelText,
    okButtonProps: {
      danger,
      style: {
        height: '40px',
        fontWeight: 500,
        minWidth: '80px'
      }
    },
    cancelButtonProps: {
      style: {
        height: '40px',
        fontWeight: 500,
        minWidth: '80px'
      }
    },
    centered: true,
    maskClosable: false,
    keyboard: true,
    onOk: onConfirm,
    onCancel
  });
}

/**
 * Hook for easier confirm dialog usage
 */
export function useConfirmDialog() {
  const showConfirm = (options: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'>) => {
    return new Promise<boolean>((resolve) => {
      ConfirmDialog({
        ...options,
        onConfirm: async () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        }
      });
    });
  };

  return showConfirm;
}

/**
 * Pre-configured destructive action confirm
 */
export function confirmDelete(
  itemName: string,
  additionalInfo?: string
): Promise<boolean> {
  const confirm = useConfirmDialog();
  return confirm({
    title: `Delete ${itemName}?`,
    description: (
      <div style={{ marginTop: '8px'>
        <p style={{ marginBottom: '8px'>
          This action cannot be undone. All data associated with this {itemName.toLowerCase()} will be permanently removed.
        </p>
        {additionalInfo && (
          <p className="text-sm", color: '#64748b', marginBottom: 0>
            {additionalInfo}
          </p>
        )}
      </div>
    ),
    confirmText: 'Delete',
    cancelText: 'Keep it',
    danger: true
  });
}

/**
 * Pre-configured discard changes confirm
 */
export function confirmDiscardChanges(): Promise<boolean> {
  const confirm = useConfirmDialog();
  return confirm({
    title: 'Discard unsaved changes?',
    description: 'You have unsaved changes. If you leave now, your changes will be lost.',
    confirmText: 'Discard',
    cancelText: 'Keep editing',
    danger: true
  });
}

/**
 * Pre-configured navigation confirm (with unsaved changes)
 */
export function confirmNavigation(destination: string): Promise<boolean> {
  const confirm = useConfirmDialog();
  return confirm({
    title: 'Leave without saving?',
    description: (
      <div>
        <p style={{ marginBottom: '8px'>
          You have unsaved changes. Do you want to save before leaving?
        </p>
        <p className="text-sm", color: '#64748b', marginBottom: 0>
          Destination: {destination}
        </p>
      </div>
    ),
    confirmText: 'Leave without saving',
    cancelText: 'Stay and save',
    danger: true
  });
}
