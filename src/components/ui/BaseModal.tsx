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
 * @version 2.0.0 - Jobs/Ive Discipline
 */

"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FocusTrap from "focus-trap-react";
import { VARIANTS, SPRING, DURATION, EASING } from "@/lib/design-system/animations";
import { COLORS, SPACING, RADIUS, SHADOWS, MODAL, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

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
    icon?: React.ComponentType<unknown>;
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

  const modalSize = MODAL.sizes[size];

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
                backgroundColor: COLORS.overlay.light, // Lighter overlay (0.35 vs 0.5)
                zIndex,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: size === "fullscreen" ? 0 : SPACING[6], // 32px
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
                  backgroundColor: COLORS.bg.primary, // Pure white
                  borderRadius: size === "fullscreen" ? 0 : RADIUS.default, // 8px everywhere
                  boxShadow: SHADOWS.medium, // Consistent shadow
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
                className={className}
              >
                {/* Header */}
                <div
                  style={{
                    padding: `${SPACING[5]} ${SPACING[6]}`, // 24px vertical, 32px horizontal
                    borderBottom: `1px solid ${COLORS.border.default}`, // Consistent border
                    backgroundColor: COLORS.bg.primary, // Same as body - seamless
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: SPACING[4], // 16px
                  }}
                >
                  {/* Icon (optional) */}
                  {icon && (
                    <div
                      style={{
                        width: '40px', // 5×8pt
                        height: '40px', // 5×8pt
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: COLORS.blueLight, // Subtle blue
                        borderRadius: RADIUS.default, // 8px
                        color: COLORS.blue,
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
                        fontFamily: TYPOGRAPHY.fontFamily.display,
                        fontSize: TYPOGRAPHY.fontSize.title, // 20px
                        fontWeight: TYPOGRAPHY.fontWeight.semibold, // 600
                        color: COLORS.text.primary, // Black 100%
                        lineHeight: TYPOGRAPHY.lineHeight.compact, // 1.3
                        letterSpacing: TYPOGRAPHY.letterSpacing.slightTight, // -0.01em
                        marginBottom: subtitle ? SPACING[1] : 0, // 4px if subtitle
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
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                          fontSize: TYPOGRAPHY.fontSize.caption, // 13px
                          fontWeight: TYPOGRAPHY.fontWeight.regular, // 400
                          color: COLORS.text.secondary, // Black 60%
                          lineHeight: TYPOGRAPHY.lineHeight.normal, // 1.4
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
                      width: '44px', // Apple HIG minimum touch target
                      height: '44px', // Apple HIG minimum touch target
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: RADIUS.default, // 8px
                      cursor: "pointer",
                      color: COLORS.text.secondary, // Black 60%
                      transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.interactive.hover; // Black 4%
                      e.currentTarget.style.color = COLORS.text.primary; // Black 100%
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.text.secondary; // Black 60%
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div
                  style={{
                    flex: 1,
                    padding: SPACING[6], // 32px on all sides
                    overflow: "auto",
                    backgroundColor: COLORS.bg.primary, // Pure white
                  }}
                >
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div
                    style={{
                      padding: `${SPACING[5]} ${SPACING[6]}`, // 24px vertical, 32px horizontal
                      borderTop: `1px solid ${COLORS.border.default}`, // Black 8%
                      backgroundColor: COLORS.bg.primary, // Same as body - seamless
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: SPACING[3], // 12px
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
      padding: `${SPACING[2]} ${SPACING[5]}`, // 8px 24px (proper button padding)
      fontFamily: TYPOGRAPHY.fontFamily.text,
      fontSize: TYPOGRAPHY.fontSize.body, // 15px
      fontWeight: TYPOGRAPHY.fontWeight.semibold, // 600
      borderRadius: RADIUS.default, // 8px
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1, // Simpler opacity
      transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
      minWidth: '88px', // Minimum width for buttons
    };

    switch (variant) {
      case "primary":
        return {
          ...base,
          backgroundColor: disabled ? COLORS.text.disabled : COLORS.blue,
          color: COLORS.bg.primary, // White text
        };
      case "destructive":
        return {
          ...base,
          backgroundColor: disabled ? COLORS.text.disabled : COLORS.red,
          color: COLORS.bg.primary, // White text
        };
      case "secondary":
      default:
        return {
          ...base,
          backgroundColor: "transparent",
          color: COLORS.text.primary, // Black text
          border: `1px solid ${COLORS.border.strong}`, // Black 12%
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
          e.currentTarget.style.backgroundColor = COLORS.blueHover;
        } else if (variant === "destructive") {
          e.currentTarget.style.backgroundColor = COLORS.redHover;
        } else {
          e.currentTarget.style.backgroundColor = COLORS.interactive.hover; // Black 4%
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.backgroundColor = COLORS.blue;
        } else if (variant === "destructive") {
          e.currentTarget.style.backgroundColor = COLORS.red;
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
