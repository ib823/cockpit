"use client";

import { ReactNode } from "react";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";

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
  okButtonProps?: Record<string, unknown>;
  cancelButtonProps?: Record<string, unknown>;
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
  okText = "OK",
  cancelText = "Cancel",
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

  const defaultFooter =
    footer === null
      ? null
      : footer || (
          <div className="flex justify-end gap-2 mt-6">
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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      role="dialog"
      className={`fixed inset-0 bg-black/45 flex justify-center z-[1000] ${
        centered ? "items-center" : "items-start pt-[100px]"
      }`}
      onClick={handleBackdropClick}
      onKeyDown={(e) => { if (e.key === 'Escape') handleBackdropClick(); }}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            {title && (
              <div className="text-base font-semibold text-[var(--color-text-primary)] flex-1">
                {title}
              </div>
            )}
            {closable && (
              <button
                onClick={onCancel}
                className="border-none bg-transparent cursor-pointer p-1 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              >
                <CloseOutlined />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 flex-1 overflow-auto">
          {children}
        </div>

        {/* Footer */}
        {defaultFooter && (
          <div className="px-4 py-2.5 border-t border-[var(--color-border-subtle)]">
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
  title: _title,
  content: _content,
  onOk: _onOk,
  onCancel: _onCancel,
  okText: _okText = "OK",
  cancelText: _cancelText = "Cancel",
  icon: _icon,
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
    "SimpleModal.confirm requires state management in the parent component. " +
      "Please use a state variable and SimpleModal component instead. Example:\n\n" +
      "const [showConfirm, setShowConfirm] = useState(false);\n" +
      "<SimpleModal\n" +
      "  open={showConfirm}\n" +
      '  title="Confirm Action"\n' +
      "  onOk={handleConfirm}\n" +
      "  onCancel={() => setShowConfirm(false)}\n" +
      ">\n" +
      "  Are you sure?\n" +
      "</SimpleModal>"
  );
};

export default SimpleModal;
