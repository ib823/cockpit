"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/ui/toast/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
    // Suppresses known-benign third-party console noise only.
    //
    // This filter previously also swallowed every `[BackgroundSync]` error —
    // the save path's own failure reporting. Sync errors are surfaced in the UI
    // as a toast, but that gives no stack, no payload and no way to diagnose a
    // save that is silently not persisting, which is the highest-consequence
    // failure this app has. Those clauses are gone; anything matched here must
    // be noise the app cannot act on.
    const originalError = console.error;
    const SUPPRESSED = [
      // Expected while the session endpoint is unreachable; surfaced in the UI
      (msg: string) => msg.includes("[next-auth][error][CLIENT_FETCH_ERROR]"),
    ];

    console.error = (...args) => {
      if (typeof args[0] === "string" && SUPPRESSED.some((matches) => matches(args[0]))) {
        return;
      }
      if (typeof originalError === "function") {
        originalError.apply(console, args);
      }
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            {/*
              Catches render errors in the client tree. `error.tsx` only
              covers errors thrown during a route render; a throw inside an
              already-mounted client component (the Gantt canvas, a modal)
              unmounts the whole tree to a blank page without this.
            */}
            <ErrorBoundary>{children}</ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
