/**
 * Keystone - Code Splitting Utilities
 *
 * Lazy load large components and reduce initial bundle size
 * Target: < 200KB initial bundle
 *
 * Features:
 * - Dynamic imports with loading states
 * - Route-based code splitting
 * - Component-level code splitting
 * - Preloading strategies
 */

"use client";

import dynamic from "next/dynamic";
import { ComponentType, lazy, Suspense, ReactNode } from "react";

/**
 * Loading component
 */
export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "200px" }}>
      <div
        className="animate-spin rounded-full border-b-2 border-blue-600"
        style={{ height: "48px", width: "48px" }}
      />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

/**
 * Error boundary fallback
 */
export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center p-6" style={{ minHeight: "200px" }}>
      <div className="text-red-600 text-4xl">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900">Failed to load component</h3>
      <p className="text-sm text-gray-600">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Reload page
      </button>
    </div>
  );
}

/**
 * Dynamic import with loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: ReactNode;
    fallback?: ComponentType<{ error: Error }>;
  }
): T {
  return dynamic(importFn, {
    loading: () => (options?.loading || <LoadingSpinner />) as JSX.Element,
    ssr: false, // Disable SSR for code-split components
  }) as T;
}

/**
 * Lazy load with retry logic
 */
export function lazyLoadWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    maxRetries?: number;
    delay?: number;
  }
): T {
  const { maxRetries = 3, delay = 1000 } = options || {};

  const retryImport = async (retriesLeft: number): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (retriesLeft === 0) {
        throw error;
      }

      console.warn(`[Code Splitting] Import failed, retrying... (${retriesLeft} attempts left)`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      return retryImport(retriesLeft - 1);
    }
  };

  return dynamic(() => retryImport(maxRetries), {
    loading: () => <LoadingSpinner message="Loading component..." />,
    ssr: false,
  }) as T;
}

/**
 * Preload a dynamic component
 */
export async function preloadComponent(importFn: () => Promise<any>): Promise<void> {
  try {
    await importFn();
    console.log("[Code Splitting] ✅ Component preloaded");
  } catch (error) {
    console.error("[Code Splitting] ❌ Failed to preload component:", error);
  }
}

/**
 * Code-split large components
 * These are lazy-loaded on demand
 */

// Gantt Chart (1,453 lines)
export const GanttCanvas = lazyLoadWithRetry<any>(() =>
  import("@/components/gantt-tool/GanttCanvas").then((m) => ({ default: m.GanttCanvas }))
);

// Gantt Side Panel (1,193 lines)
export const GanttSidePanel = lazyLoadWithRetry<any>(() =>
  import("@/components/gantt-tool/GanttSidePanel").then((m) => ({ default: m.GanttSidePanel }))
);

// Import Modal (347 lines - showcase compliant)
export const ImportModal = lazyLoadWithRetry<any>(() =>
  import("@/components/gantt-tool/ImportModal").then((m) => ({ default: m.ImportModal }))
);

// Plan Mode (1,137 lines) - DISABLED: Module removed
// export const PlanMode = lazyLoadWithRetry<any>(() =>
//   import("@/components/project-v2/modes/PlanMode").then((m) => ({ default: m.PlanMode }))
// );

// Organization Chart (1,553 lines) - DISABLED: Module removed
// export const OrganizationChart = lazyLoad<any>(
//   () => import("@/app/organization-chart/page").then((m) => ({ default: m.default || m })) as any
// );

// Dashboard Content
export const DashboardContent = lazyLoad<any>(() =>
  import("@/components/dashboard/DashboardContent").then((m) => ({ default: m.DashboardContent }))
);

// Export components - DISABLED: Module removed
// export const ExportButton = lazyLoad<any>(() =>
//   import("@/components/export/ExportButton").then((m) => ({ default: m.ExportButton }))
// );

/**
 * Route-based preloading
 * Preload components when user hovers over navigation links
 */
export const PRELOAD_MAP: Record<string, () => void> = {
  "/dashboard": () => {
    preloadComponent(() => import("@/components/dashboard/DashboardContent"));
  },
  "/gantt-tool": () => {
    // Preload multiple components for gantt tool
    Promise.all([
      preloadComponent(() => import("@/components/gantt-tool/GanttCanvas")),
      preloadComponent(() => import("@/components/gantt-tool/GanttSidePanel")),
      preloadComponent(() => import("@/components/gantt-tool/GanttToolbar")),
    ]);
  },
  // "/project": () => {
  //   Promise.all([
  //     preloadComponent(() => import("@/components/project-v2/modes/PlanMode")),
  //     preloadComponent(() => import("@/components/project-v2/ProjectLayout")),
  //   ]);
  // },
};

/**
 * Preload route components on hover
 */
export function usePreloadRoute(route: string) {
  return {
    onMouseEnter: () => {
      PRELOAD_MAP[route]?.();
    },
  };
}

/**
 * Intersection Observer for lazy loading
 */
export function useLazyLoadOnScroll(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  options?: IntersectionObserverInit
) {
  if (typeof window === "undefined") return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, options);

  if (ref.current) {
    observer.observe(ref.current);
  }

  return () => observer.disconnect();
}

/**
 * Bundle size analysis
 */
export interface BundleStats {
  component: string;
  size: number;
  loaded: boolean;
  loadTime?: number;
}

const bundleStats: Map<string, BundleStats> = new Map();

export function trackBundleLoad(component: string, size: number, loadTime: number) {
  bundleStats.set(component, {
    component,
    size,
    loaded: true,
    loadTime,
  });

  console.log(
    `[Bundle] Loaded ${component}: ${(size / 1024).toFixed(2)}KB in ${loadTime.toFixed(2)}ms`
  );
}

export function getBundleStats(): BundleStats[] {
  return Array.from(bundleStats.values());
}

export function getTotalBundleSize(): number {
  return Array.from(bundleStats.values()).reduce((sum, stat) => sum + stat.size, 0);
}
