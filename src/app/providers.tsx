"use client";
import { App } from "antd";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AntDThemeBridge } from "@/ui/compat/AntDThemeBridge";
import { ToastProvider } from "@/ui/toast/ToastProvider";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes cache time
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              const err = error as { status?: number };
              if (err?.status && err.status >= 400 && err.status < 500) return false;
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("antd: compatible") ||
          args[0].includes("[next-auth][error][CLIENT_FETCH_ERROR]") ||
          // Suppress AntD hydration warnings - expected with dynamic theming
          (args[0].includes("Hydration") && args[0].includes("css-dev-only-do-not-override")) ||
          // Suppress IndexedDB transaction errors (fixed in code, but may persist in old sessions)
          (args[0].includes("[BackgroundSync]") && args[0].includes("transaction has finished")) ||
          // Suppress ALL background sync errors - handled gracefully by toast + modal UI
          (args[0].includes("[BackgroundSync]") && args[0].includes("Sync")) ||
          // Suppress specific sync error patterns
          (args[0].includes("[BackgroundSync]") && (args[0].includes("error") || args[0].includes("failed") || args[0].includes("Error"))) ||
          // Suppress validation and permanent error messages - shown in UI
          (args[0].includes("[BackgroundSync]") && args[0].includes("Permanent error")) ||
          // Suppress initial loader hydration warnings - loader is created client-side only
          (args[0].includes("Hydration") && args[0].includes("initial-loader")) ||
          // Suppress static message API warnings - we use standalone API for better performance
          (args[0].includes("[antd: message]") && args[0].includes("Static function")))
      ) {
        return;
      }
      if (typeof originalError === "function") {
        originalError.apply(console, args);
      }
    };
  }, []);

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AntDThemeBridge>
            <ToastProvider>
              <App>
                {children}
              </App>
            </ToastProvider>
          </AntDThemeBridge>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
