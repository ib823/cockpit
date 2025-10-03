// src/lib/logger.ts (already exists, enhance it)

export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error || '');
    
    // In production, send to error tracking (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error);
    }
  },
  
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};