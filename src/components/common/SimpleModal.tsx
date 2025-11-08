'use client';

import { ReactNode } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface SimpleModalProps {
  open: boolean;
  onCancel: () => void;
  onOk?: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode | null;
  width?: number | string;
  okText?: string;
  cancelText?: string;
  okButtonProps?: any;
  cancelButtonProps?: any;
  closable?: boolean;
  maskClosable?: boolean;
  centered?: boolean;
}

/**
 * SimpleModal - Lightweight modal replacement for Ant Design Modal
 *
 * This component fixes the permanent hang issue caused by Ant Design Modal's
 * complex focus trap and lifecycle management. It provides the same API but
 * with simple state-driven rendering and no async cleanup.
 *
 * Key differences from Ant Design Modal:
 * - No focus trap that can block main thread
 * - No complex animations or transitions
 * - Synchronous state updates
 * - Simple overlay with backdrop click to close
 */
export function SimpleModal({
  open,
  onCancel,
  onOk,
  title,
  children,
  footer,
  width = 520,
  okText = 'OK',
  cancelText = 'Cancel',
  okButtonProps,
  cancelButtonProps,
  closable = true,
  maskClosable = true,
  centered = true,
}: SimpleModalProps) {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (maskClosable) {
      onCancel();
    }
  };

  const defaultFooter = footer === null ? null : footer || (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
      <Button onClick={onCancel} {...cancelButtonProps}>
        {cancelText}
      </Button>
      {onOk && (
        <Button type="primary" onClick={onOk} {...okButtonProps}>
          {okText}
        </Button>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: centered ? 'center' : 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        padding: centered ? '0' : '100px 0',
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0',
          width: typeof width === 'number' ? `${width}px` : width,
          maxWidth: '90vw',
          maxHeight: '90vh',
          boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || closable) && (
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {title && (
              <div className="text-base" style={{ fontWeight: '600', color: '#1f2937', flex: 1 }}>
                {title}
              </div>
            )}
            {closable && (
              <button
                onClick={onCancel}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00000073',
                  className="text-base",
                }}
              >
                <CloseOutlined />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          style={{
            padding: '24px',
            flex: 1,
            overflow: 'auto',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {defaultFooter && (
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            {defaultFooter}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SimpleModal.confirm - Replacement for Modal.confirm
 */
SimpleModal.confirm = function confirm({
  title,
  content,
  onOk,
  onCancel,
  okText = 'OK',
  cancelText = 'Cancel',
  icon,
}: {
  title?: ReactNode;
  content?: ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  icon?: ReactNode;
}) {
  // For confirm modals, you need to manage state in the parent component
  // This is a placeholder that throws an error to guide developers
  console.error(
    'SimpleModal.confirm requires state management in the parent component. ' +
    'Please use a state variable and SimpleModal component instead. Example:\n\n' +
    'const [showConfirm, setShowConfirm] = useState(false);\n' +
    '<SimpleModal\n' +
    '  open={showConfirm}\n' +
    '  title="Confirm Action"\n' +
    '  onOk={handleConfirm}\n' +
    '  onCancel={() => setShowConfirm(false)}\n' +
    '>\n' +
    '  Are you sure?\n' +
    '</SimpleModal>'
  );
};

export default SimpleModal;
