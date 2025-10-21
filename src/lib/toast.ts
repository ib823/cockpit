/**
 * TOAST NOTIFICATIONS - Ant Design wrapper
 *
 * Centralized notification system using Ant Design's message and notification APIs.
 *
 * Per spec: Roadmap_and_DoD.md P0-3
 */

import { message, notification } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';

// Configure default settings
message.config({
  top: 80,
  duration: 3,
  maxCount: 3,
});

notification.config({
  placement: 'topRight',
  duration: 4,
});

/**
 * Success toast - green with checkmark icon
 */
export function showSuccess(msg: string, duration = 3) {
  return message.success(msg, duration);
}

/**
 * Error toast - red with error icon
 */
export function showError(msg: string, duration = 4) {
  return message.error(msg, duration);
}

/**
 * Loading toast - spinner with auto-dismiss
 */
export function showLoading(msg: string) {
  return message.loading(msg, 0); // 0 = infinite duration
}

/**
 * Info toast - neutral with info styling
 */
export function showInfo(msg: string, duration = 3) {
  return message.info(msg, duration);
}

/**
 * Warning toast - orange/yellow styling
 */
export function showWarning(msg: string, duration = 4) {
  return message.warning(msg, duration);
}

/**
 * Promise toast - handles async operations
 * Shows loading → success/error automatically
 */
export async function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
): Promise<T> {
  const hide = message.loading(messages.loading, 0);

  try {
    const data = await promise;
    hide();
    const successMsg =
      typeof messages.success === 'function'
        ? messages.success(data)
        : messages.success;
    message.success(successMsg);
    return data;
  } catch (error) {
    hide();
    const errorMsg =
      typeof messages.error === 'function'
        ? messages.error(error)
        : messages.error;
    message.error(errorMsg);
    throw error;
  }
}

/**
 * Dismiss a specific toast or all toasts
 */
export function dismissToast(key?: string) {
  if (key) {
    message.destroy(key);
  } else {
    message.destroy();
  }
}

/**
 * Show notification (for more complex messages with title, description, actions)
 */
export const showNotification = {
  success: (title: string, description?: string, duration = 4) => {
    notification.success({
      message: title,
      description,
      duration,
    });
  },
  error: (title: string, description?: string, duration = 4) => {
    notification.error({
      message: title,
      description,
      duration,
    });
  },
  info: (title: string, description?: string, duration = 4) => {
    notification.info({
      message: title,
      description,
      duration,
    });
  },
  warning: (title: string, description?: string, duration = 4) => {
    notification.warning({
      message: title,
      description,
      duration,
    });
  },
};

/**
 * Direct access to Ant Design message and notification APIs
 */
export { message, notification };
export const customToast = message;
