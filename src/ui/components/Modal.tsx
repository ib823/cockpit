/**
 * Modal - Apple HIG Compliant Modal Component
 * 
 * Canonical modal foundation following Task C-02.
 * Strictly uses apple-design-system.css tokens.
 */

"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FocusTrap from "focus-trap-react";
import clsx from "clsx";
import { Button } from "./Button";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

export interface ModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: React.ReactNode;
  /** Optional subtitle */
  subtitle?: React.ReactNode;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Modal size */
  size?: ModalSize;
  /** Custom footer */
  footer?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Custom z-index */
  zIndex?: number;
  /** Additional className */
  className?: string;
  /** Prevent close on backdrop click */
  preventClose?: boolean;
}

const sizes: Record<ModalSize, string> = {
  sm: "w-[400px]",
  md: "w-[600px]",
  lg: "w-[800px]",
  xl: "w-[1000px]",
  fullscreen: "w-screen h-screen rounded-none",
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  footer,
  children,
  zIndex = 1050,
  className,
  preventClose = false,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            allowOutsideClick: true,
          }}
        >
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 md:p-8" 
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"
              onClick={() => !preventClose && onClose()}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={clsx(
                "relative flex flex-col bg-primary border border-subtle shadow-xl overflow-hidden",
                size !== "fullscreen" && "rounded-xl max-h-[90vh] max-w-full",
                sizes[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-4 p-6 border-b border-subtle shrink-0">
                {icon && (
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[var(--color-blue-light)] text-blue shrink-0">
                    {icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {title && <h2 className="display-small truncate">{title}</h2>}
                  {subtitle && <p className="detail text-secondary mt-1">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-secondary text-secondary transition-default shrink-0"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 body">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 p-6 border-t border-subtle shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};

/**
 * ModalButton - Consistent button for modal footers
 */
export const ModalButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}> = ({ children, onClick, variant = "secondary", disabled, loading, type = "button" }) => (
  <Button
    type={type}
    variant={variant === "danger" ? "danger" : variant}
    onClick={onClick}
    disabled={disabled}
    loading={loading}
    size="sm"
    className="min-w-[88px]"
  >
    {children}
  </Button>
);
