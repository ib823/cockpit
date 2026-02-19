/**
 * TOAST NOTIFICATIONS
 *
 * Centralized toast system with design system integration
 * Enhanced with professional colors, shadows, and micro-interactions
 *
 * Per spec: Roadmap_and_DoD.md P0-3
 */

import toast from "react-hot-toast";
import { colorValues, getColoredShadow } from "./design-system";

/**
 * Success toast - green with checkmark icon
 */
export function showSuccess(message: string, duration = 3000) {
  return toast.success(message, {
    duration,
    position: "top-right",
    style: {
      background: colorValues.success[600],
      color: "#fff",
      fontWeight: 600,
      boxShadow: getColoredShadow(colorValues.success[600], "lg"),
      borderRadius: "12px",
      padding: "12px 16px",
    },
    iconTheme: {
      primary: "#fff",
      secondary: colorValues.success[600],
    },
  });
}

/**
 * Error toast - red with error icon
 */
export function showError(message: string, duration = 4000) {
  return toast.error(message, {
    duration,
    position: "top-right",
    style: {
      background: colorValues.error[600],
      color: "#fff",
      fontWeight: 600,
      boxShadow: getColoredShadow(colorValues.error[600], "lg"),
      borderRadius: "12px",
      padding: "12px 16px",
    },
    iconTheme: {
      primary: "#fff",
      secondary: colorValues.error[600],
    },
  });
}

/**
 * Loading toast - spinner with auto-dismiss
 */
export function showLoading(message: string) {
  return toast.loading(message, {
    position: "top-right",
    style: {
      background: colorValues.primary[600],
      color: "#fff",
      fontWeight: 600,
      boxShadow: getColoredShadow(colorValues.primary[600], "md"),
      borderRadius: "12px",
      padding: "12px 16px",
    },
  });
}

/**
 * Info toast - neutral with info styling
 */
export function showInfo(message: string, duration = 3000) {
  return toast(message, {
    duration,
    position: "top-right",
    icon: "ℹ️",
    style: {
      background: colorValues.info[600],
      color: "#fff",
      fontWeight: 600,
      boxShadow: getColoredShadow(colorValues.info[600], "md"),
      borderRadius: "12px",
      padding: "12px 16px",
    },
  });
}

/**
 * Warning toast - orange/yellow styling
 */
export function showWarning(message: string, duration = 4000) {
  return toast(message, {
    duration,
    position: "top-right",
    icon: "⚠️",
    style: {
      background: colorValues.warning[600],
      color: "#fff",
      fontWeight: 600,
      boxShadow: getColoredShadow(colorValues.warning[600], "md"),
      borderRadius: "12px",
      padding: "12px 16px",
    },
  });
}

/**
 * Promise toast - handles async operations
 * Shows loading → success/error automatically
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) {
  return toast.promise(promise, messages, {
    position: "top-right",
    success: {
      style: {
        background: colorValues.success[600],
        color: "#fff",
        fontWeight: 600,
        boxShadow: getColoredShadow(colorValues.success[600], "lg"),
        borderRadius: "12px",
        padding: "12px 16px",
      },
    },
    error: {
      style: {
        background: colorValues.error[600],
        color: "#fff",
        fontWeight: 600,
        boxShadow: getColoredShadow(colorValues.error[600], "lg"),
        borderRadius: "12px",
        padding: "12px 16px",
      },
    },
    loading: {
      style: {
        background: colorValues.primary[600],
        color: "#fff",
        fontWeight: 600,
        boxShadow: getColoredShadow(colorValues.primary[600], "md"),
        borderRadius: "12px",
        padding: "12px 16px",
      },
    },
  });
}

/**
 * Dismiss a specific toast or all toasts
 */
export function dismissToast(toastId?: string) {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
}

/**
 * Custom toast with full control
 */
export { toast as customToast };
