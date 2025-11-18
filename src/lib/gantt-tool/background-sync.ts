/**
 * Background Sync Manager
 *
 * Syncs local IndexedDB changes to the server in the background.
 * Features:
 * - Automatic retry with exponential backoff
 * - Offline detection
 * - Conflict resolution
 * - Progress tracking
 */

import {
  getProjectLocal,
  getPendingSyncItems,
  removeFromSyncQueue,
  updateSyncQueueItem,
  markProjectSynced,
  addToSyncQueue,
} from "./local-storage";
import { calculateProjectDelta, isDeltaEmpty, sanitizeDelta } from "./delta-calculator";
import { shouldBatchDelta, batchDelta } from "./delta-batcher";
import type { GanttProject, ProjectDelta } from "@/types/gantt-tool";

const MAX_RETRY_COUNT = 10; // Increased from 5 to give more chances
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000, 60000]; // Exponential backoff up to 1 minute
const SYNC_INTERVAL = 5000; // Check every 5 seconds
const RETRY_RESET_TIME = 5 * 60 * 1000; // Reset retry count for items older than 5 minutes

let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;
let syncCallbacks: {
  onSyncStart?: (projectId: string) => void;
  onSyncProgress?: (projectId: string, progress: { current: number; total: number }) => void;
  onSyncSuccess?: (projectId: string) => void;
  onSyncError?: (projectId: string, error: string) => void;
} = {};

/**
 * Format date fields for API
 */
function formatDateField(date: string | Date): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Serialize delta for API
 */
function serializeDelta(delta: ProjectDelta): ProjectDelta {
  const serialized: ProjectDelta = {};

  if (delta.projectUpdates) {
    serialized.projectUpdates = {};
    Object.keys(delta.projectUpdates).forEach((key) => {
      const value = (delta.projectUpdates as any)[key];
      if (key === "startDate" && value) {
        (serialized.projectUpdates as any)[key] = formatDateField(value);
      } else {
        (serialized.projectUpdates as any)[key] = value;
      }
    });
  }

  if (delta.phases) {
    serialized.phases = {};
    if (delta.phases.created) {
      serialized.phases.created = delta.phases.created.map((phase) => ({
        ...phase,
        startDate: formatDateField(phase.startDate),
        endDate: formatDateField(phase.endDate),
        tasks: phase.tasks.map((task: any) => ({
          ...task,
          startDate: formatDateField(task.startDate),
          endDate: formatDateField(task.endDate),
        })),
      }));
    }
    if (delta.phases.updated) {
      serialized.phases.updated = delta.phases.updated.map((phase) => ({
        ...phase,
        startDate: formatDateField(phase.startDate),
        endDate: formatDateField(phase.endDate),
        tasks: phase.tasks.map((task: any) => ({
          ...task,
          startDate: formatDateField(task.startDate),
          endDate: formatDateField(task.endDate),
        })),
      }));
    }
    if (delta.phases.deleted) {
      serialized.phases.deleted = delta.phases.deleted;
    }
  }

  if (delta.resources) {
    serialized.resources = delta.resources;
  }

  if (delta.milestones) {
    serialized.milestones = {};
    if (delta.milestones.created) {
      serialized.milestones.created = delta.milestones.created.map((m) => ({
        ...m,
        date: formatDateField(m.date),
      }));
    }
    if (delta.milestones.updated) {
      serialized.milestones.updated = delta.milestones.updated.map((m) => ({
        ...m,
        date: formatDateField(m.date),
      }));
    }
    if (delta.milestones.deleted) {
      serialized.milestones.deleted = delta.milestones.deleted;
    }
  }

  if (delta.holidays) {
    serialized.holidays = {};
    if (delta.holidays.created) {
      serialized.holidays.created = delta.holidays.created.map((h) => ({
        ...h,
        date: formatDateField(h.date),
      }));
    }
    if (delta.holidays.updated) {
      serialized.holidays.updated = delta.holidays.updated.map((h) => ({
        ...h,
        date: formatDateField(h.date),
      }));
    }
    if (delta.holidays.deleted) {
      serialized.holidays.deleted = delta.holidays.deleted;
    }
  }

  return serialized;
}

/**
 * Sync a single project to the server
 */
async function syncProjectToServer(
  projectId: string,
  lastServerState: GanttProject | null
): Promise<void> {
  const localProject = await getProjectLocal(projectId);
  if (!localProject) {
    throw new Error("Project not found in local storage");
  }

  // Calculate delta
  let delta = calculateProjectDelta(localProject, lastServerState);
  delta = sanitizeDelta(delta);

  // Skip if nothing changed
  if (isDeltaEmpty(delta)) {
    console.log("[BackgroundSync] No changes to sync for", projectId);
    await markProjectSynced(projectId);
    return;
  }

  console.log("[BackgroundSync] Syncing project", projectId);

  // Check if we need to batch
  if (shouldBatchDelta(delta)) {
    const batches = batchDelta(delta);
    console.log(`[BackgroundSync] Batching into ${batches.length} requests`);

    for (let i = 0; i < batches.length; i++) {
      const batchInfo = batches[i];

      syncCallbacks.onSyncProgress?.(projectId, {
        current: i + 1,
        total: batches.length,
      });

      const serializedBatch = serializeDelta(batchInfo.batch);
      await sendDeltaToServer(projectId, serializedBatch);
    }
  } else {
    // Single request
    const serializedDelta = serializeDelta(delta);
    await sendDeltaToServer(projectId, serializedDelta);
  }

  // Mark as synced
  await markProjectSynced(projectId);
  console.log("[BackgroundSync] Successfully synced", projectId);
}

/**
 * Send delta to server
 */
async function sendDeltaToServer(projectId: string, delta: ProjectDelta): Promise<void> {
  const response = await fetch(`/api/gantt-tool/projects/${projectId}/delta`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delta),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText || "Unknown Error"}`,
    }));
    const errorMessage =
      errorData.error || errorData.message || `Sync failed with status ${response.status}`;

    // Log sync failure (suppressed in console filter but useful for debugging)
    console.error("[BackgroundSync] Sync failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      projectId,
    });

    throw new Error(errorMessage);
  }
}

/**
 * Process sync queue
 */
async function processSyncQueue(): Promise<void> {
  if (isSyncing) {
    console.log("[BackgroundSync] Already syncing, skipping...");
    return;
  }

  // Check if online
  if (!navigator.onLine) {
    console.log("[BackgroundSync] Offline, skipping sync");
    return;
  }

  isSyncing = true;

  try {
    const pendingItems = await getPendingSyncItems();

    if (pendingItems.length === 0) {
      return;
    }

    console.log(`[BackgroundSync] Processing ${pendingItems.length} pending sync items`);

    for (const item of pendingItems) {
      // Reset retry count for old items (gives them another chance after app reload or long delay)
      const itemAge = Date.now() - item.timestamp;
      if (item.retryCount > 0 && itemAge > RETRY_RESET_TIME) {
        console.log(
          `[BackgroundSync] Resetting retry count for old item (age: ${Math.round(itemAge / 1000)}s)`,
          item.projectId
        );
        item.retryCount = 0;
        item.lastError = undefined;
        await updateSyncQueueItem(item);
      }
      try {
        syncCallbacks.onSyncStart?.(item.projectId);

        // Fetch current server state to calculate proper delta
        let serverState: GanttProject | null = null;
        try {
          const response = await fetch(`/api/gantt-tool/projects/${item.projectId}`);
          if (response.ok) {
            const data = await response.json();
            serverState = data.project;
            console.log("[BackgroundSync] Fetched server state for delta calculation");
          }
        } catch (fetchError) {
          console.warn(
            "[BackgroundSync] Could not fetch server state, syncing full state:",
            fetchError
          );
        }

        await syncProjectToServer(item.projectId, serverState);

        // Remove from queue on success
        await removeFromSyncQueue(item.id);
        syncCallbacks.onSyncSuccess?.(item.projectId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[BackgroundSync] Sync failed for", item.projectId, errorMessage);

        // Update retry count
        item.retryCount++;
        item.lastError = errorMessage;

        if (item.retryCount >= MAX_RETRY_COUNT) {
          // Don't remove from queue - keep it for potential recovery
          console.error("[BackgroundSync] Max retries exceeded for", item.projectId);
          console.error("[BackgroundSync] Error details:", {
            projectId: item.projectId,
            retryCount: item.retryCount,
            lastError: errorMessage,
            timestamp: new Date(item.timestamp).toISOString(),
            itemAge: `${Math.round((Date.now() - item.timestamp) / 1000)}s`,
          });

          await updateSyncQueueItem(item);
          syncCallbacks.onSyncError?.(
            item.projectId,
            `Sync failed after ${MAX_RETRY_COUNT} attempts: ${errorMessage}. Changes are saved locally and will retry automatically.`
          );

          // Skip this item for now but don't remove it - will retry after RETRY_RESET_TIME
          console.log(
            `[BackgroundSync] Will retry again after ${RETRY_RESET_TIME / 1000}s or on app reload`
          );
        } else {
          // Schedule retry
          const delay = RETRY_DELAYS[Math.min(item.retryCount - 1, RETRY_DELAYS.length - 1)];
          console.log(
            `[BackgroundSync] Retrying in ${delay}ms (attempt ${item.retryCount + 1}/${MAX_RETRY_COUNT})`
          );

          await updateSyncQueueItem(item);

          // Wait before next retry
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  } finally {
    isSyncing = false;
  }
}

/**
 * Start background sync
 */
export function startBackgroundSync(callbacks?: typeof syncCallbacks): void {
  console.log("[BackgroundSync] Starting background sync");

  if (callbacks) {
    syncCallbacks = callbacks;
  }

  // Process immediately
  processSyncQueue().catch(console.error);

  // Start interval
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    processSyncQueue().catch(console.error);
  }, SYNC_INTERVAL);

  // Listen for online/offline events
  window.addEventListener("online", () => {
    console.log("[BackgroundSync] Back online, triggering sync");
    processSyncQueue().catch(console.error);
  });
}

/**
 * Stop background sync
 */
export function stopBackgroundSync(): void {
  console.log("[BackgroundSync] Stopping background sync");

  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Manually trigger sync
 */
export async function triggerSync(projectId?: string): Promise<void> {
  if (projectId) {
    // Sync specific project
    await addToSyncQueue(projectId);
  }

  await processSyncQueue();
}

/**
 * Check sync status
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

/**
 * Clear sync queue (for debugging/recovery)
 */
export async function clearSyncQueue(): Promise<void> {
  const { clearAllLocalData } = await import("./local-storage");
  const items = await getPendingSyncItems();

  for (const item of items) {
    await removeFromSyncQueue(item.id);
  }

  console.log(`[BackgroundSync] Cleared ${items.length} items from sync queue`);
}

/**
 * Force immediate sync (for debugging)
 */
export async function forceSyncNow(projectId?: string): Promise<void> {
  console.log("[BackgroundSync] Force sync triggered");

  if (projectId) {
    await addToSyncQueue(projectId);
  }

  isSyncing = false; // Reset flag to allow immediate sync
  await processSyncQueue();
}
