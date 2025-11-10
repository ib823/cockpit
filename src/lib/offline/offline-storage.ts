/**
 * Offline Storage Service
 * Uses IndexedDB for storing data when offline
 */

const DB_NAME = "sap-cockpit-offline";
const DB_VERSION = 1;

// Object store names
const STORES = {
  ESTIMATES: "estimates",
  PROJECTS: "projects",
  PENDING_SYNC: "pending-sync",
  CACHE: "cache",
};

export interface StoredEstimate {
  id: string;
  profile: string;
  inputs: any;
  results: any;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface StoredProject {
  id: string;
  name: string;
  data: any;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface PendingSyncItem {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open database"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[OfflineStorage] Database initialized");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.ESTIMATES)) {
          const estimateStore = db.createObjectStore(STORES.ESTIMATES, { keyPath: "id" });
          estimateStore.createIndex("createdAt", "createdAt", { unique: false });
          estimateStore.createIndex("synced", "synced", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: "id" });
          projectStore.createIndex("createdAt", "createdAt", { unique: false });
          projectStore.createIndex("synced", "synced", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          db.createObjectStore(STORES.PENDING_SYNC, { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: "key" });
          cacheStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        console.log("[OfflineStorage] Database schema created");
      };
    });

    return this.initPromise;
  }

  /**
   * Save an estimate
   */
  async saveEstimate(estimate: StoredEstimate): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ESTIMATES], "readwrite");
      const store = transaction.objectStore(STORES.ESTIMATES);
      const request = store.put(estimate);

      request.onsuccess = () => {
        console.log("[OfflineStorage] Estimate saved:", estimate.id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get an estimate by ID
   */
  async getEstimate(id: string): Promise<StoredEstimate | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ESTIMATES], "readonly");
      const store = transaction.objectStore(STORES.ESTIMATES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all estimates
   */
  async getAllEstimates(): Promise<StoredEstimate[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ESTIMATES], "readonly");
      const store = transaction.objectStore(STORES.ESTIMATES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get unsynced estimates
   */
  async getUnsyncedEstimates(): Promise<StoredEstimate[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ESTIMATES], "readonly");
      const store = transaction.objectStore(STORES.ESTIMATES);
      const index = store.index("synced");
      const request = index.getAll(false as any); // IDBKeyRange accepts boolean in some implementations

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an estimate
   */
  async deleteEstimate(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ESTIMATES], "readwrite");
      const store = transaction.objectStore(STORES.ESTIMATES);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log("[OfflineStorage] Estimate deleted:", id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save a project
   */
  async saveProject(project: StoredProject): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PROJECTS], "readwrite");
      const store = transaction.objectStore(STORES.PROJECTS);
      const request = store.put(project);

      request.onsuccess = () => {
        console.log("[OfflineStorage] Project saved:", project.id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<StoredProject | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PROJECTS], "readonly");
      const store = transaction.objectStore(STORES.PROJECTS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<StoredProject[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PROJECTS], "readonly");
      const store = transaction.objectStore(STORES.PROJECTS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add item to pending sync queue
   */
  async addToPendingSync(item: PendingSyncItem): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SYNC], "readwrite");
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.add(item);

      request.onsuccess = () => {
        console.log("[OfflineStorage] Added to pending sync:", item.url);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending sync items
   */
  async getPendingSync(): Promise<PendingSyncItem[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SYNC], "readonly");
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove item from pending sync queue
   */
  async removeFromPendingSync(id: number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SYNC], "readwrite");
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log("[OfflineStorage] Removed from pending sync:", id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set cached data with expiry
   */
  async setCache(key: string, data: any, ttlMinutes = 60): Promise<void> {
    const db = await this.init();
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], "readwrite");
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        expiresAt,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached data
   */
  async getCache(key: string): Promise<any | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], "readonly");
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (result.expiresAt < Date.now()) {
          // Clean up expired cache
          this.deleteCache(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete cached data
   */
  async deleteCache(key: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], "readwrite");
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    const db = await this.init();
    const stores = [STORES.ESTIMATES, STORES.PROJECTS, STORES.PENDING_SYNC, STORES.CACHE];

    return Promise.all(
      stores.map(
        (storeName) =>
          new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
      )
    ).then(() => {
      console.log("[OfflineStorage] All data cleared");
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();
