/**
 * BaseModal - Unified Modal Component
 *
 * Apple HIG-compliant modal foundation for consistent UX across the app
 *
 * Design Philosophy (Steve Jobs/Jony Ive):
 * - Deep simplicity: One modal pattern for all use cases
 * - Pixel-perfect: 8pt grid alignment throughout
 * - God is in details: Smooth animations, perfect typography
 * - Focus & empathy: Keyboard navigation, accessibility built-in
 *
 * Features:
 * - Framer Motion animations (Apple spring physics)
 * - Focus trap (keyboard accessibility)
 * - Escape key to close
 * - Click overlay to close (optional)
 * - Responsive sizes (small/medium/large/xlarge/fullscreen)
 * - Consistent typography and spacing
 * - Support for icons, subtitles, custom footers
 *
 * @version 1.0.0
 */

"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FocusTrap from "focus-trap-react";
import { VARIANTS, SPRING, DURATION, EASING } from "@/lib/design-system/animations";

// ============================================================================
// TYPES
// ============================================================================

export type ModalSize = "small" | "medium" | "large" | "xlarge" | "fullscreen";

export interface BaseModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Modal title (required) */
  title: string;

  /** Optional subtitle for context */
  subtitle?: string | React.ReactNode;

  /** Optional icon (Lucide icon component) */
  icon?: React.ReactNode;

  /** Modal size */
  size?: ModalSize;

  /** Modal content */
  children: React.ReactNode;

  /** Optional custom footer (defaults to close button) */
  footer?: React.ReactNode;

  /** Optional footer actions (alternative to custom footer) */
  footerActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: string;
    icon?: React.ComponentType<any>;
  }>;

  /** Prevent closing on overlay click */
  preventClose?: boolean;

  /** Prevent closing on escape key */
  preventEscapeClose?: boolean;

  /** z-index for stacking modals */
  zIndex?: number;

  /** Custom className for modal content */
  className?: string;
}

// ============================================================================
// SIZE CONFIGURATIONS (8pt Grid)
// ============================================================================

const MODAL_SIZES: Record<ModalSize, { width: string | number; height: string | number }> = {
  small: { width: 480, height: "auto" },    // 60 × 8pt
  medium: { width: 640, height: "auto" },   // 80 × 8pt (default)
  large: { width: 880, height: "auto" },    // 110 × 8pt
  xlarge: { width: 1120, height: "auto" },  // 140 × 8pt
  fullscreen: { width: "100vw", height: "100vh" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = "medium",
  children,
  footer,
  preventClose = false,
  preventEscapeClose = false,
  zIndex = 9999,
  className,
}: BaseModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || preventEscapeClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, preventEscapeClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (preventClose) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalSize = MODAL_SIZES[size];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            allowOutsideClick: true,
            escapeDeactivates: !preventEscapeClose,
          }}
        >
          <div>
            {/* Overlay */}
            <motion.div
              variants={VARIANTS.overlay}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={handleOverlayClick}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)", // Apple HIG overlay
                zIndex,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: size === "fullscreen" ? 0 : "32px", // 4×8pt
              }}
            >
              {/* Modal Content */}
              <motion.div
                ref={modalContentRef}
                variants={VARIANTS.modal}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: modalSize.width,
                  height: modalSize.height,
                  maxWidth: size === "fullscreen" ? "none" : "90vw",
                  maxHeight: size === "fullscreen" ? "none" : "90vh",
                  backgroundColor: "#FFFFFF",
                  borderRadius: size === "fullscreen" ? 0 : "12px", // Apple HIG radius
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)", // Subtle depth
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
                className={className}
              >
                {/* Header (72px / 9×8pt) */}
                <div
                  style={{
                    padding: "24px 32px", // 3×8pt horizontal, 4×8pt vertical
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                    backgroundColor: "#FFFFFF",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px", // 2×8pt
                  }}
                >
                  {/* Icon (optional) */}
                  {icon && (
                    <div
                      style={{
                        width: "40px", // 5×8pt
                        height: "40px", // 5×8pt
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0, 122, 255, 0.1)",
                        borderRadius: "8px", // 1×8pt
                        color: "#007AFF",
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "20px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                        lineHeight: 1.4,
                        marginBottom: subtitle ? "4px" : 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </h2>
                    {subtitle && (
                      <p
                        style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                          fontWeight: 400,
                          color: "#86868B",
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    style={{
                      width: "32px", // 4×8pt
                      height: "32px", // 4×8pt
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#86868B",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F5F5F7";
                      e.currentTarget.style.color = "#1D1D1F";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#86868B";
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body (auto height) */}
                <div
                  style={{
                    flex: 1,
                    padding: "32px", // 4×8pt on all sides
                    overflow: "auto",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {children}
                </div>

                {/* Footer (80px / 10×8pt) */}
                {footer && (
                  <div
                    style={{
                      padding: "24px 32px", // 3×8pt horizontal, 4×8pt vertical
                      borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                      backgroundColor: "#FAFAFA",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "12px", // 1.5×8pt
                    }}
                  >
                    {footer}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// BUTTON COMPONENTS (For consistent footers)
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ModalButton({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  type = "button",
}: ButtonProps) {
  const getStyles = () => {
    const base = {
      padding: "10px 20px", // ~1.25×8pt vertical, 2.5×8pt horizontal
      fontFamily: "var(--font-text)",
      fontSize: "14px",
      fontWeight: 600,
      borderRadius: "8px", // 1×8pt
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s ease",
    };

    switch (variant) {
      case "primary":
        return {
          ...base,
          backgroundColor: disabled ? "#86868B" : "#007AFF",
          color: "#FFFFFF",
        };
      case "destructive":
        return {
          ...base,
          backgroundColor: disabled ? "#86868B" : "#FF3B30",
          color: "#FFFFFF",
        };
      case "secondary":
      default:
        return {
          ...base,
          backgroundColor: "transparent",
          color: "#007AFF",
          border: "1px solid #D1D1D6",
        };
    }
  };

  const styles = getStyles();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={styles}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.backgroundColor = "#0051D5";
        } else if (variant === "destructive") {
          e.currentTarget.style.backgroundColor = "#D70015";
        } else {
          e.currentTarget.style.backgroundColor = "#F5F5F7";
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.backgroundColor = "#007AFF";
        } else if (variant === "destructive") {
          e.currentTarget.style.backgroundColor = "#FF3B30";
        } else {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BaseModal;
