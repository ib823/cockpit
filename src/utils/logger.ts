// Simple logger utility
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  switch (level) {
    case 'error':
      console.error(logMessage, data || '');
      break;
    case 'warn':
      console.warn(logMessage, data || '');
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(logMessage, data || '');
      }
      break;
    case 'info':
    default:
      console.log(logMessage, data || '');
  }
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
};