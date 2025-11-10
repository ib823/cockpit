// Cross-tab synchronization hook for localStorage changes
"use client";

import { useEffect } from "react";
import { useTimelineStore } from "@/stores/timeline-store";

/**
 * Synchronize Zustand store across browser tabs
 *
 * When one tab updates localStorage, other tabs receive the 'storage' event
 * and reload their state. This prevents state conflicts when users have
 * multiple tabs open.
 *
 * Limitation: This uses a simple "last write wins" strategy with full reload.
 * For production apps with heavy concurrent usage, consider:
 * - Operational Transformation (OT)
 * - Conflict-free Replicated Data Types (CRDTs)
 * - Server-side state with WebSockets
 */
export function useStorageSync() {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to changes to our timeline store
      if (e.key === "timeline-store" && e.newValue !== null) {
        console.log("[StorageSync] Detected change in another tab, reloading state...");

        try {
          // Parse the new state
          const newState = JSON.parse(e.newValue);

          // Get current store state
          const currentStore = useTimelineStore.getState();

          // Check if there's actually a difference to avoid unnecessary updates
          const currentState = JSON.stringify({
            phases: currentStore.phases,
            selectedPackages: currentStore.selectedPackages,
            profile: currentStore.profile,
          });

          const incomingState = JSON.stringify({
            phases: newState.state?.phases || [],
            selectedPackages: newState.state?.selectedPackages || [],
            profile: newState.state?.profile || {},
          });

          if (currentState !== incomingState) {
            // Ask user before reloading to prevent data loss
            console.log("[StorageSync] State changed, prompting user...");
            const userConfirmed = window.confirm(
              "Timeline was updated in another tab. Reload to see changes?\n\n" +
                "(Any unsaved work in this tab will be lost)"
            );

            if (userConfirmed) {
              console.log("[StorageSync] User confirmed, reloading page...");
              window.location.reload();
            } else {
              console.log("[StorageSync] User cancelled reload, keeping current state");
            }
          }
        } catch (error) {
          console.error("[StorageSync] Failed to sync state:", error);
          // On error, do nothing to avoid breaking the current tab
        }
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener("storage", handleStorageChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
}
