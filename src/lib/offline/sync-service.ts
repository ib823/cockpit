/**
 * Sync Service
 * Handles synchronization of offline data when connection is restored
 */

"use client";

import { offlineStorage, PendingSyncItem } from "./offline-storage";

class SyncService {
  private syncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(syncing: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      // Listen for online/offline events
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());

      // Start periodic sync check
      this.startSyncInterval();
    }
  }

  /**
   * Handle online event
   */
  private handleOnline() {
    console.log("[SyncService] Connection restored");
    this.sync();
  }

  /**
   * Handle offline event
   */
  private handleOffline() {
    console.log("[SyncService] Connection lost");
  }

  /**
   * Start periodic sync check
   */
  private startSyncInterval() {
    // Check every 30 seconds if online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.sync();
      }
    }, 30000);
  }

  /**
   * Stop periodic sync check
   */
  private stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add sync listener
   */
  addListener(listener: (syncing: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.syncing));
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.syncing;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return typeof navigator !== "undefined" && navigator.onLine;
  }

  /**
   * Sync offline data
   */
  async sync(): Promise<void> {
    if (this.syncing) {
      console.log("[SyncService] Sync already in progress");
      return;
    }

    if (!this.isOnline()) {
      console.log("[SyncService] Cannot sync while offline");
      return;
    }

    try {
      this.syncing = true;
      this.notifyListeners();

      console.log("[SyncService] Starting sync...");

      // Get pending sync items
      const pendingItems = await offlineStorage.getPendingSync();

      if (pendingItems.length === 0) {
        console.log("[SyncService] No items to sync");
        return;
      }

      console.log(`[SyncService] Syncing ${pendingItems.length} items`);

      // Sync each item
      let successCount = 0;
      let failureCount = 0;

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await offlineStorage.removeFromPendingSync(item.id!);
          successCount++;
        } catch (error) {
          console.error("[SyncService] Failed to sync item:", error);
          failureCount++;
        }
      }

      console.log(`[SyncService] Sync complete: ${successCount} succeeded, ${failureCount} failed`);

      // Trigger service worker sync if available
      if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        // Use type assertion for Background Sync API
        await (registration as any).sync.register("sync-offline-data");
      }
    } catch (error) {
      console.error("[SyncService] Sync error:", error);
    } finally {
      this.syncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: PendingSyncItem): Promise<void> {
    const response = await fetch(item.url, {
      method: item.method,
      headers: item.headers,
      body: item.body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Queue request for later sync
   */
  async queueRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string
  ): Promise<void> {
    const item: PendingSyncItem = {
      url,
      method,
      headers,
      body,
      timestamp: new Date().toISOString(),
    };

    await offlineStorage.addToPendingSync(item);
    console.log("[SyncService] Request queued for sync:", url);

    // Try to sync immediately if online
    if (this.isOnline()) {
      this.sync();
    }
  }

  /**
   * Get pending sync count
   */
  async getPendingCount(): Promise<number> {
    const items = await offlineStorage.getPendingSync();
    return items.length;
  }

  /**
   * Clear all pending sync items
   */
  async clearPending(): Promise<void> {
    // This would require adding a clearPendingSync method to offlineStorage
    // For now, we'll manually delete all items
    const items = await offlineStorage.getPendingSync();
    for (const item of items) {
      await offlineStorage.removeFromPendingSync(item.id!);
    }
    console.log("[SyncService] Cleared all pending sync items");
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopSyncInterval();
    this.listeners.clear();
  }
}

// Export singleton instance
export const syncService = new SyncService();
