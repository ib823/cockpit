/**
 * The three global destinations, shared by every screen that mounts the
 * AppShell top bar. One list, so a renamed or added destination cannot drift
 * between Dashboard, Timeline and Architecture.
 */

import type { NavItem, SyncChipProps } from "@/components/ds/AppShell";

export type GlobalDestination = "/dashboard" | "/gantt-tool" | "/architecture/v3";

export function globalNav(current: GlobalDestination): NavItem[] {
  return [
    { label: "Dashboard", href: "/dashboard", current: current === "/dashboard" },
    { label: "Timeline", href: "/gantt-tool", current: current === "/gantt-tool" },
    {
      label: "Architecture",
      href: "/architecture/v3",
      current: current === "/architecture/v3",
    },
  ];
}

/** The gantt store's sync vocabulary (six states, split by storage tier). */
type StoreSyncStatus =
  | "idle"
  | "saving-local"
  | "saved-local"
  | "syncing-cloud"
  | "synced-cloud"
  | "error";

/**
 * Collapses the store's six states onto the SyncChip's four. The chip's job
 * is "can I close the tab?", so local-vs-cloud tiers both read as "Saving"
 * while in flight and "Synced" at rest; only failure keeps its own face.
 */
export function toSyncChip(status: StoreSyncStatus): SyncChipProps {
  switch (status) {
    case "saving-local":
    case "syncing-cloud":
      return { state: "pending" };
    case "error":
      return { state: "error" };
    default:
      return { state: "synced" };
  }
}
