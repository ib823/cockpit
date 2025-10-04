/**
 * Global Data Reset Utility
 * Clears all localStorage data and resets all Zustand stores
 */

import { usePresalesStore } from "@/stores/presales-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { useProjectStore } from "@/stores/project-store";

export function resetAllData() {
  console.log("🗑️ Starting complete data reset...");

  // First, clear ALL localStorage (nuclear option)
  localStorage.clear();
  console.log("✅ localStorage cleared");

  // Then reset all Zustand stores to their initial state
  try {
    usePresalesStore.getState().reset();
    console.log("✅ Presales store reset");
  } catch (e) {
    console.error("Failed to reset presales store:", e);
  }

  try {
    useTimelineStore.getState().reset();
    console.log("✅ Timeline store reset");
  } catch (e) {
    console.error("Failed to reset timeline store:", e);
  }

  try {
    useProjectStore.getState().reset();
    console.log("✅ Project store reset");
  } catch (e) {
    console.error("Failed to reset project store:", e);
  }

  console.log("✅ All data cleared successfully");
}

export function confirmResetAllData(): boolean {
  return window.confirm(
    "⚠️ Clear All Data?\n\n" +
      "This will permanently delete:\n" +
      "• All extracted requirements (chips)\n" +
      "• All decisions made\n" +
      "• All timeline data\n" +
      "• All manual overrides\n\n" +
      "This action cannot be undone.\n\n" +
      "Continue?"
  );
}
