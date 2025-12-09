/**
 * Dynamic Favicon Component
 *
 * Renders nothing visually but manages the browser favicon based on:
 * - Dark (default): Not logged in / unauthenticated
 * - Blue: Logged in / authenticated
 * - Amber: Network error / API unreachable
 *
 * Place this component once in your app layout or providers.
 */

"use client";

import { useEffect } from "react";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";

interface DynamicFaviconProps {
  /** Health check endpoint URL (default: /api/health) */
  healthCheckUrl?: string;
  /** Health check interval in ms (default: 30000) */
  healthCheckInterval?: number;
}

/**
 * Component that manages dynamic favicon updates.
 * Renders nothing - pure side-effect component.
 */
export function DynamicFavicon({
  healthCheckUrl = "/api/health",
  healthCheckInterval = 30000,
}: DynamicFaviconProps) {
  // Remove any static favicon links on mount before the hook runs
  useEffect(() => {
    // Aggressively remove all existing favicon links to prevent conflicts
    // This runs before the hook sets up the dynamic favicon
    const existingLinks = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"]'
    );
    existingLinks.forEach((link) => {
      // Remove all favicon links - we'll create fresh ones
      link.remove();
    });
  }, []);

  // Hook handles all the favicon logic
  useDynamicFavicon({
    healthCheckUrl,
    healthCheckInterval,
  });

  // Render nothing - this is a side-effect only component
  return null;
}

export default DynamicFavicon;
