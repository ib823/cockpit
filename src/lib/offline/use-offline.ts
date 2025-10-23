/**
 * React Hooks for Offline Support
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncService } from './sync-service';
import { offlineStorage } from './offline-storage';

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to track sync status
 */
export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncService.addListener((syncing) => {
      setIsSyncing(syncing);
    });

    // Update pending count
    const updatePendingCount = async () => {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const triggerSync = useCallback(async () => {
    await syncService.sync();
  }, []);

  return {
    isSyncing,
    pendingCount,
    triggerSync,
  };
}

/**
 * Hook to manage offline data storage
 */
export function useOfflineStorage() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    offlineStorage.init().then(() => {
      setInitialized(true);
    });
  }, []);

  return {
    initialized,
    storage: offlineStorage,
  };
}

/**
 * Hook to automatically save data offline
 */
export function useAutoSaveOffline<T>(
  key: string,
  data: T,
  enabled = true,
  debounceMs = 1000
) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled || !data) return;

    const timer = setTimeout(async () => {
      try {
        setSaving(true);
        await offlineStorage.setCache(key, data, 60 * 24); // 24 hour TTL
        setLastSaved(new Date());
      } catch (error) {
        console.error('[useAutoSaveOffline] Failed to save:', error);
      } finally {
        setSaving(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [key, data, enabled, debounceMs]);

  return {
    lastSaved,
    saving,
  };
}

/**
 * Hook to load cached data
 */
export function useCachedData<T>(key: string, defaultValue: T | null = null) {
  const [data, setData] = useState<T | null>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    offlineStorage
      .init()
      .then(() => offlineStorage.getCache(key))
      .then((cached) => {
        if (cached) {
          setData(cached);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('[useCachedData] Failed to load:', error);
        setLoading(false);
      });
  }, [key]);

  return {
    data,
    loading,
  };
}

/**
 * Hook to manage service worker registration
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('[ServiceWorker] Registered:', reg.scope);
        setRegistration(reg);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[ServiceWorker] Registration failed:', error);
      });
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return {
    registration,
    updateAvailable,
    updateServiceWorker,
  };
}
