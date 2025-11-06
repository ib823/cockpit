/**
 * Client-Side First Storage - IndexedDB wrapper for Gantt projects
 *
 * Architecture:
 * 1. User makes change → Save to IndexedDB immediately (instant, 0ms)
 * 2. Queue sync to server in background (non-blocking)
 * 3. Show "Saved locally" → "Synced to cloud" when done
 *
 * Benefits:
 * - No timeout issues (saves locally first)
 * - Instant feedback to user
 * - Offline support
 * - Automatic conflict resolution
 */

import type { GanttProject } from '@/types/gantt-tool';

const DB_NAME = 'gantt_tool_local_v1';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const SYNC_QUEUE_STORE = 'sync_queue';

interface SyncQueueItem {
  id: string;
  projectId: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create projects store
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('projectId', 'projectId', { unique: false });
      }
    };
  });
}

/**
 * Save project to local IndexedDB (instant)
 */
export async function saveProjectLocal(project: GanttProject): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([PROJECTS_STORE], 'readwrite');
  const store = tx.objectStore(PROJECTS_STORE);

  // Add metadata for tracking
  const projectWithMeta = {
    ...project,
    localUpdatedAt: new Date().toISOString(),
    needsSync: true, // Flag for background sync
  };

  return new Promise((resolve, reject) => {
    const request = store.put(projectWithMeta);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get project from local IndexedDB
 */
export async function getProjectLocal(projectId: string): Promise<GanttProject | null> {
  const db = await openDB();
  const tx = db.transaction([PROJECTS_STORE], 'readonly');
  const store = tx.objectStore(PROJECTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all projects from local IndexedDB
 */
export async function getAllProjectsLocal(): Promise<GanttProject[]> {
  const db = await openDB();
  const tx = db.transaction([PROJECTS_STORE], 'readonly');
  const store = tx.objectStore(PROJECTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete project from local IndexedDB
 */
export async function deleteProjectLocal(projectId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([PROJECTS_STORE], 'readwrite');
  const store = tx.objectStore(PROJECTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(projectId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add project to sync queue
 */
export async function addToSyncQueue(projectId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE_STORE);

  const queueItem: SyncQueueItem = {
    id: `sync_${Date.now()}_${projectId}`,
    projectId,
    timestamp: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(queueItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending sync items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await openDB();
  const tx = db.transaction([SYNC_QUEUE_STORE], 'readonly');
  const store = tx.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(syncId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(syncId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update sync queue item (for retry tracking)
 */
export async function updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark project as synced (clear needsSync flag)
 */
export async function markProjectSynced(projectId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([PROJECTS_STORE], 'readwrite');
  const store = tx.objectStore(PROJECTS_STORE);

  return new Promise((resolve, reject) => {
    // Get project within the same transaction to avoid transaction auto-commit
    const getRequest = store.get(projectId);

    getRequest.onsuccess = () => {
      const project = getRequest.result;
      if (project) {
        const updatedProject = {
          ...project,
          needsSync: false,
          lastSyncedAt: new Date().toISOString(),
        };

        const putRequest = store.put(updatedProject);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(); // Project not found, nothing to update
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Check if project needs sync
 */
export async function projectNeedsSync(projectId: string): Promise<boolean> {
  const project = await getProjectLocal(projectId);
  return !!(project && (project as any).needsSync);
}

/**
 * Clear all local data (for testing/debugging)
 */
export async function clearAllLocalData(): Promise<void> {
  const db = await openDB();

  const tx = db.transaction([PROJECTS_STORE, SYNC_QUEUE_STORE], 'readwrite');
  const projectStore = tx.objectStore(PROJECTS_STORE);
  const syncStore = tx.objectStore(SYNC_QUEUE_STORE);

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const request = projectStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
    new Promise<void>((resolve, reject) => {
      const request = syncStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
  ]);
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usagePercent: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
    };
  }
  return null;
}
