/**
 * Dynamic Favicon Hook
 *
 * Updates the browser favicon based on authentication and network status:
 * - Dark (default): Not logged in / unauthenticated
 * - Blue: Logged in / authenticated
 * - Amber: Network error / API unreachable
 *
 * Uses the dynamic favicon API endpoint with status parameter.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

type FaviconStatus = "none" | "connected" | "disconnected";

interface UseDynamicFaviconOptions {
  /** Health check endpoint to ping for network status */
  healthCheckUrl?: string;
  /** Interval in ms between health checks (default: 30000) */
  healthCheckInterval?: number;
  /** Timeout in ms for health check requests (default: 5000) */
  healthCheckTimeout?: number;
}

/**
 * Hook to manage dynamic favicon based on auth and network status
 */
export function useDynamicFavicon(options: UseDynamicFaviconOptions = {}) {
  const {
    healthCheckUrl = "/api/health",
    healthCheckInterval = 60000,
  } = options;

  const { status: sessionStatus } = useSession();
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online");
  const [faviconStatus, setFaviconStatus] = useState<FaviconStatus>("none");
  const abortControllerRef = useRef<AbortController | null>(null);
  const initializedRef = useRef(false);

  // Health check to detect API unreachability
  const checkHealth = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(healthCheckUrl, {
        method: "HEAD",
        cache: "no-store",
        signal: abortControllerRef.current.signal,
      });

      // Consider any response (even 4xx/5xx) as "network is reachable"
      setNetworkStatus("online");
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      // Network error - API unreachable
      setNetworkStatus("offline");
    }
  }, [healthCheckUrl]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online");
      checkHealth();
    };

    const handleOffline = () => {
      setNetworkStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setNetworkStatus("offline");
    } else {
      checkHealth();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkHealth]);

  // Periodic health check when online and tab is visible
  useEffect(() => {
    if (networkStatus === "offline") return;

    const tick = () => {
      if (document.visibilityState === "visible") checkHealth();
    };
    const intervalId = setInterval(tick, healthCheckInterval);
    return () => clearInterval(intervalId);
  }, [networkStatus, healthCheckInterval, checkHealth]);

  // Determine favicon status based on auth and network
  useEffect(() => {
    let newStatus: FaviconStatus;

    // Network error takes priority
    if (networkStatus === "offline") {
      newStatus = "disconnected";
    } else if (sessionStatus === "authenticated") {
      newStatus = "connected";
    } else {
      newStatus = "none";
    }

    setFaviconStatus(newStatus);
  }, [sessionStatus, networkStatus]);

  // Update the actual favicon link element
  useEffect(() => {
    // Always update favicon when status changes
    updateFaviconLink(faviconStatus);

    // Mark as initialized after first update
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, [faviconStatus]);

  // Also set favicon on mount to ensure it's set immediately
  useEffect(() => {
    // Set initial favicon based on current state
    const initialStatus: FaviconStatus =
      networkStatus === "offline" ? "disconnected" :
      sessionStatus === "authenticated" ? "connected" : "none";

    updateFaviconLink(initialStatus);
  }, []);

  return {
    faviconStatus,
    networkStatus,
    isAuthenticated: sessionStatus === "authenticated",
    checkHealth,
  };
}

/**
 * Update the favicon link element in the document head
 */
function updateFaviconLink(status: FaviconStatus) {
  if (typeof document === "undefined") return;

  // Use timestamp to bypass browser cache
  const faviconUrl = `/api/favicon?status=${status}&t=${Date.now()}`;

  // Remove ALL existing favicon links first to prevent conflicts
  const existingLinks = document.querySelectorAll<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  existingLinks.forEach((link) => {
    // Only remove if it's not our dynamic favicon
    if (!link.href.includes("/api/favicon")) {
      link.remove();
    }
  });

  // Find or create the main favicon link
  let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/png"]');

  if (!iconLink) {
    iconLink = document.createElement("link");
    iconLink.rel = "icon";
    iconLink.type = "image/png";
    iconLink.sizes = "32x32";
    document.head.appendChild(iconLink);
  }

  iconLink.href = faviconUrl;

  // Also update/create shortcut icon for broader browser support
  let shortcutLink = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');

  if (!shortcutLink) {
    shortcutLink = document.createElement("link");
    shortcutLink.rel = "shortcut icon";
    shortcutLink.type = "image/png";
    document.head.appendChild(shortcutLink);
  }

  shortcutLink.href = faviconUrl;
}

export default useDynamicFavicon;
