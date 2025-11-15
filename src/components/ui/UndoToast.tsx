/**
 * UndoToast - Apple HIG-compliant undo notification
 *
 * Appears at bottom center for 5 seconds after destructive actions
 * Allows user to undo deletion with visual countdown
 *
 * Design Philosophy:
 * - Forgiveness: Give users a chance to undo mistakes
 * - Clarity: Show exactly what was deleted and time remaining
 * - Feedback: Clear visual countdown and button states
 * - Consistency: Matches Apple's iOS undo pattern
 *
 * @version 1.0.0
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { Undo2, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING, EASING } from "@/lib/design-system/animations";

// ============================================================================
// TYPES
// ============================================================================

export interface UndoToastProps {
  /** Whether the toast is visible */
  isOpen: boolean;

  /** Message describing what was deleted */
  message: string;

  /** Callback when undo is clicked */
  onUndo: () => void;

  /** Callback when toast closes (after timeout or manual close) */
  onClose: () => void;

  /** Duration in milliseconds before auto-close (default: 5000) */
  duration?: number;

  /** Variant style */
  variant?: "default" | "warning" | "destructive";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UndoToast({
  isOpen,
  message,
  onUndo,
  onClose,
  duration = 5000,
  variant = "default",
}: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isUndoing, setIsUndoing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when toast opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(duration);
      setIsUndoing(false);

      // Start countdown
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        if (remaining === 0) {
          handleAutoClose();
        }
      }, 50); // Update every 50ms for smooth animation

      // Auto-close after duration
      timerRef.current = setTimeout(() => {
        handleAutoClose();
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isOpen, duration]);

  const handleAutoClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    onClose();
  };

  const handleUndo = () => {
    setIsUndoing(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    // Brief delay to show checkmark animation
    setTimeout(() => {
      onUndo();
      onClose();
    }, 300);
  };

  const handleManualClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    onClose();
  };

  const progress = (timeLeft / duration) * 100;
  const seconds = Math.ceil(timeLeft / 1000);

  // Variant configurations
  const variantConfig = {
    default: {
      bg: "#1D1D1F",
      progressColor: "#007AFF",
      iconColor: "#007AFF",
    },
    warning: {
      bg: "#FF9500",
      progressColor: "#FFD60A",
      iconColor: "#FFFFFF",
    },
    destructive: {
      bg: "#FF3B30",
      progressColor: "#FFCC00",
      iconColor: "#FFFFFF",
    },
  };

  const config = variantConfig[variant];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={SPRING.snappy}
          style={{
            position: "fixed",
            bottom: "32px", // 4×8pt
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "16px", // 2×8pt
            padding: "16px 24px", // 2×8pt, 3×8pt
            backgroundColor: config.bg,
            borderRadius: "16px", // 2×8pt
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(10px)",
            minWidth: "400px",
            maxWidth: "600px",
          }}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {/* Icon */}
          <div
            style={{
              width: "40px", // 5×8pt
              height: "40px", // 5×8pt
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderRadius: "12px", // 1.5×8pt
              flexShrink: 0,
            }}
          >
            {isUndoing ? (
              <CheckCircle2
                className="w-6 h-6"
                style={{
                  color: "#34C759",
                  animation: "scaleIn 0.3s ease-out",
                }}
              />
            ) : (
              <Undo2
                className="w-5 h-5"
                style={{ color: config.iconColor }}
              />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#FFFFFF",
                lineHeight: 1.4,
                marginBottom: "4px",
              }}
            >
              {isUndoing ? "Undoing..." : message}
            </p>
            {!isUndoing && (
              <p
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "rgba(255, 255, 255, 0.7)",
                  lineHeight: 1.3,
                }}
              >
                {seconds} second{seconds !== 1 ? "s" : ""} to undo
              </p>
            )}
          </div>

          {/* Undo Button */}
          {!isUndoing && (
            <button
              onClick={handleUndo}
              style={{
                padding: "10px 20px", // 1.25×8pt, 2.5×8pt
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 700,
                color: config.iconColor,
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                border: "none",
                borderRadius: "10px", // 1.25×8pt
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.35)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              aria-label="Undo deletion"
            >
              Undo
            </button>
          )}

          {/* Close Button */}
          {!isUndoing && (
            <button
              onClick={handleManualClose}
              style={{
                width: "32px", // 4×8pt
                height: "32px", // 4×8pt
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                border: "none",
                borderRadius: "8px", // 1×8pt
                cursor: "pointer",
                color: "rgba(255, 255, 255, 0.7)",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
              }}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Progress Bar */}
          {!isUndoing && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "3px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "0 0 16px 16px",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                style={{
                  height: "100%",
                  backgroundColor: config.progressColor,
                  transition: "width 50ms linear",
                }}
              />
            </div>
          )}

          {/* Success checkmark animation */}
          <style jsx>{`
            @keyframes scaleIn {
              0% {
                transform: scale(0.5);
                opacity: 0;
              }
              50% {
                transform: scale(1.2);
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default UndoToast;
