"use client";
import { logger } from "@/lib/logger";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * SECURITY: Client-side session guard
 * Validates session when page becomes visible (e.g., via back button)
 * Prevents accessing protected pages after logout
 */
export function useSessionGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check session immediately
    const checkSession = () => {
      // Only redirect if status is 'unauthenticated' and not 'loading'
      // This prevents redirect during initial session load
      if (status === "unauthenticated") {
        logger.warn("[SessionGuard] No valid session detected, redirecting to login");
        router.replace("/login");
      }
    };

    // Only check if not loading to prevent premature redirects
    if (status !== "loading") {
      checkSession();
    }

    // CRITICAL: Re-check when page becomes visible (handles back button)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status !== "loading") {
        logger.info("[SessionGuard] Page became visible, validating session");
        checkSession();
      }
    };

    // CRITICAL: Re-check when window gets focus (handles back button)
    const handleFocus = () => {
      if (status !== "loading") {
        logger.info("[SessionGuard] Window focused, validating session");
        checkSession();
      }
    };

    // CRITICAL: Prevent bfcache (Back-Forward Cache) from serving stale pages
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && status !== "loading") {
        logger.warn("[SessionGuard] Page restored from bfcache, validating session");
        checkSession();
      }
    };

    // CRITICAL: Disable bfcache by adding beforeunload listener
    // This forces browser to not cache the page in bfcache
    const handleBeforeUnload = () => {
      // Empty handler is enough to disable bfcache
    };

    // CRITICAL: On unload, ensure the page is never cached
    const handleUnload = () => {
      // Mark page as stale
      if (typeof window !== "undefined" && window.performance) {
        performance.mark("session-guard-unload");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [status, router]);

  return { session, status };
}
