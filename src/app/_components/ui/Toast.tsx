/**
 * Toast Component - Ant Design wrapper
 * No provider needed - Ant Design handles this internally via App component
 */

'use client';

import React from 'react';
import { message } from 'antd';

/**
 * ToastProvider - No-op component for backwards compatibility
 * Ant Design's message/notification don't need a provider
 */
export const ToastProvider: React.FC = () => {
  return null;
};

/**
 * Toast helpers using Ant Design message API
 */
export const toast = {
  success: (msg: string, duration = 3) => message.success(msg, duration),
  error: (msg: string, duration = 4) => message.error(msg, duration),
  loading: (msg: string) => message.loading(msg, 0),
  info: (msg: string, duration = 3) => message.info(msg, duration),
  warning: (msg: string, duration = 4) => message.warning(msg, duration),

  /**
   * Promise helper
   */
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ): Promise<T> => {
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
  },

  dismiss: (key?: string) => {
    if (key) {
      message.destroy(key);
    } else {
      message.destroy();
    }
  },
};
