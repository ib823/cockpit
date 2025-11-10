/**
 * Sentry Error Monitoring Integration
 *
 * Captures and reports application errors, performance issues,
 * and user feedback for the Keystone application.
 *
 * Note: Actual @sentry/nextjs package installation deferred to avoid
 * complex SDK setup. This provides the structure for when it's installed.
 */

interface SentryConfig {
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Sentry initialization configuration
 *
 * To enable: npm install @sentry/nextjs
 * Then run: npx @sentry/wizard@latest -i nextjs
 */
export const sentryConfig: SentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
};

/**
 * Capture exception manually
 * Placeholder for Sentry.captureException
 */
export function captureException(error: Error, context?: Record<string, any>) {
  console.error("[Sentry Placeholder] Error captured:", error, context);

  // In production with Sentry installed:
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureException(error, { extra: context });
}

/**
 * Capture message manually
 * Placeholder for Sentry.captureMessage
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, any>
) {
  console.log(`[Sentry Placeholder] Message (${level}):`, message, context);

  // In production with Sentry installed:
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureMessage(message, { level, extra: context });
}

/**
 * Set user context for error reports
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  console.log("[Sentry Placeholder] User context set:", user);

  // In production with Sentry installed:
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.setUser(user);
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  console.log("[Sentry Placeholder] User context cleared");

  // In production with Sentry installed:
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  console.log(`[Sentry Placeholder] Breadcrumb [${category}]:`, message, data);

  // In production with Sentry installed:
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}

/**
 * Wrap async function with error boundary
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, { function: fn.name, args });
      throw error;
    }
  }) as T;
}

/**
 * Performance monitoring - start transaction
 */
export function startTransaction(name: string, op: string) {
  console.log(`[Sentry Placeholder] Transaction started: ${name} (${op})`);

  // In production with Sentry installed:
  // import * as Sentry from '@sentry/nextjs';
  // return Sentry.startTransaction({ name, op });

  return {
    finish: () => console.log(`[Sentry Placeholder] Transaction finished: ${name}`),
    setStatus: (status: string) =>
      console.log(`[Sentry Placeholder] Transaction status: ${status}`),
  };
}

/**
 * Installation instructions
 */
export const SENTRY_INSTALL_INSTRUCTIONS = `
To enable Sentry monitoring:

1. Install Sentry SDK:
   npm install @sentry/nextjs

2. Run Sentry wizard:
   npx @sentry/wizard@latest -i nextjs

3. Add DSN to .env:
   NEXT_PUBLIC_SENTRY_DSN=your-dsn-here

4. Restart application
`;

export function logSentryInstructions() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "development") {
    console.log(SENTRY_INSTALL_INSTRUCTIONS);
  }
}
