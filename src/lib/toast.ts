/**
 * TOAST NOTIFICATIONS
 *
 * Centralized toast system replacing console.log and alert().
 *
 * Per spec: Roadmap_and_DoD.md P0-3
 */

import toast from 'react-hot-toast';

/**
 * Success toast - green with checkmark icon
 */
export function showSuccess(message: string, duration = 3000) {
  return toast.success(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: 500,
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
}

/**
 * Error toast - red with error icon
 */
export function showError(message: string, duration = 4000) {
  return toast.error(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: 500,
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
}

/**
 * Loading toast - spinner with auto-dismiss
 */
export function showLoading(message: string) {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontWeight: 500,
    },
  });
}

/**
 * Info toast - neutral with info styling
 */
export function showInfo(message: string, duration = 3000) {
  return toast(message, {
    duration,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#6366f1',
      color: '#fff',
      fontWeight: 500,
    },
  });
}

/**
 * Warning toast - orange/yellow styling
 */
export function showWarning(message: string, duration = 4000) {
  return toast(message, {
    duration,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      fontWeight: 500,
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
    error: string | ((error: any) => string);
  }
) {
  return toast.promise(
    promise,
    messages,
    {
      position: 'top-right',
      success: {
        style: {
          background: '#10b981',
          color: '#fff',
        },
      },
      error: {
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      },
      loading: {
        style: {
          background: '#3b82f6',
          color: '#fff',
        },
      },
    }
  );
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
