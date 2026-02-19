/**
 * Cockpit - React Query Configuration
 *
 * Centralized React Query setup with intelligent caching
 * Performance: Automatic request deduplication, background refetching
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// Devtools import - may not be available in all environments
let ReactQueryDevtools: any;
try {
  ReactQueryDevtools = require("@tanstack/react-query-devtools").ReactQueryDevtools;
} catch {
  // Devtools not installed - gracefully degrade
}

/**
 * Default query options
 */
const defaultQueryOptions = {
  queries: {
    // Stale time - data stays fresh for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Cache time - data stays in cache for 30 minutes after becoming stale
    gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)

    // Retry failed requests
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (can be disabled per-query)
    refetchOnWindowFocus: false,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Refetch on mount if data is stale
    refetchOnMount: true,

    // Network mode - online, always, offlineFirst
    networkMode: "online",
  },

  mutations: {
    // Retry mutations once
    retry: 1,

    // Network mode for mutations
    networkMode: "online",
  },
} as const;

/**
 * Create a new QueryClient instance
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

/**
 * Browser-side QueryClient singleton
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * React Query Provider Component
 *
 * Usage:
 * ```tsx
 * import { ReactQueryProvider } from '@/lib/react-query';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ReactQueryProvider>{children}</ReactQueryProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

/**
 * Query keys for type-safe cache management
 */
export const queryKeys = {
  // L3 Catalog
  l3Catalog: {
    all: ["l3-catalog"] as const,
    lists: () => [...queryKeys.l3Catalog.all, "list"] as const,
    list: (filters: Record<string, any>) => [...queryKeys.l3Catalog.lists(), filters] as const,
    details: () => [...queryKeys.l3Catalog.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.l3Catalog.details(), id] as const,
  },

  // LOBs
  lobs: {
    all: ["lobs"] as const,
    lists: () => [...queryKeys.lobs.all, "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.lobs.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.lobs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.lobs.details(), id] as const,
  },

  // Projects
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.projects.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  // User
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
    projects: () => [...queryKeys.user.all, "projects"] as const,
    settings: () => [...queryKeys.user.all, "settings"] as const,
  },

  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
    charts: () => [...queryKeys.dashboard.all, "charts"] as const,
    recent: () => [...queryKeys.dashboard.all, "recent"] as const,
  },

  // Analytics
  analytics: {
    all: ["analytics"] as const,
    overview: () => [...queryKeys.analytics.all, "overview"] as const,
    project: (id: string) => [...queryKeys.analytics.all, "project", id] as const,
    timeRange: (start: string, end: string) =>
      [...queryKeys.analytics.all, "timeRange", start, end] as const,
  },
} as const;

/**
 * Helper to invalidate queries by pattern
 */
export async function invalidateQueries(client: QueryClient, keys: readonly any[]) {
  await client.invalidateQueries({ queryKey: keys });
}

/**
 * Helper to prefetch queries
 */
export async function prefetchQuery<T>(
  client: QueryClient,
  queryKey: readonly any[],
  queryFn: () => Promise<T>,
  options?: { staleTime?: number }
) {
  await client.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
  });
}

/**
 * Cache statistics
 */
export function getQueryCacheStats(client: QueryClient) {
  const cache = client.getQueryCache();
  const queries = cache.getAll();

  return {
    totalQueries: queries.length,
    activeQueries: queries.filter((q) => q.state.fetchStatus === "fetching").length,
    staleQueries: queries.filter((q) => q.isStale()).length,
    cachedQueries: queries.filter((q) => q.state.data !== undefined).length,
  };
}

/**
 * Clear all cache
 */
export function clearAllCache(client: QueryClient) {
  client.clear();
  console.log("[React Query] 🗑️  All cache cleared");
}
