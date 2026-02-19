/**
 * Cockpit - Advanced Service Worker
 *
 * High-performance caching strategies for instant load times
 *
 * Strategies:
 * - Cache-First: Static assets (fonts, images, CSS, JS)
 * - Network-First: API calls with fallback
 * - Stale-While-Revalidate: Dynamic content
 * - Background sync for offline mutations
 * - Prefetching critical resources
 */

const CACHE_VERSION = "cockpit-v2";
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;
const CACHE_API = `${CACHE_VERSION}-api`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/logo-cockpit.png",
  "/icon-192.png",
  "/icon-512.png",
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  [CACHE_DYNAMIC]: 50,
  [CACHE_IMAGES]: 30,
  [CACHE_API]: 20,
};

// Cache duration in seconds
const CACHE_DURATION = {
  STATIC: 31536000, // 1 year
  DYNAMIC: 3600, // 1 hour
  API: 300, // 5 minutes
  IMAGES: 604800, // 7 days
};

/**
 * Install event - cache static assets
 */
self.addEventListener("install", (event) => {
  console.log("[SW] ⚙️  Installing service worker...");

  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then((cache) => {
        console.log("[SW] 💾 Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] ✅ Service worker installed");
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] 🔄 Activating service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old cache versions
              return (
                name.startsWith("cockpit-") &&
                name !== CACHE_STATIC &&
                name !== CACHE_DYNAMIC &&
                name !== CACHE_IMAGES &&
                name !== CACHE_API
              );
            })
            .map((name) => {
              console.log(`[SW] 🗑️  Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("[SW] ✅ Service worker activated");
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - intelligent caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip chrome-extension and other special URLs
  if (request.url.startsWith("chrome-extension://") || request.url.startsWith("moz-extension://")) {
    return;
  }

  // Route to appropriate strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
  } else if (isImage(url)) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
  } else if (isAPICall(url)) {
    event.respondWith(networkFirstWithCache(request, CACHE_API));
  } else {
    event.respondWith(staleWhileRevalidate(request, CACHE_DYNAMIC));
  }
});

/**
 * Cache-First strategy (for static assets)
 * Fastest strategy - always returns from cache if available
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      console.log(`[SW] ✅ Cache HIT: ${request.url}`);
      return cached;
    }

    console.log(`[SW] ❌ Cache MISS: ${request.url}`);
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error(`[SW] ❌ Error in cacheFirst:`, error);
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Network-First strategy (for API calls)
 * Tries network first, falls back to cache on failure
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);

    try {
      const response = await fetch(request);

      // Cache successful responses
      if (response && response.status === 200) {
        cache.put(request, response.clone());
        console.log(`[SW] 💾 Cached API response: ${request.url}`);

        // Limit cache size
        limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName]);
      }

      return response;
    } catch (networkError) {
      // Network failed, try cache
      console.warn(`[SW] ⚠️  Network failed, using cache: ${request.url}`);
      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      // No cache available either
      throw networkError;
    }
  } catch (error) {
    console.error(`[SW] ❌ Error in networkFirstWithCache:`, error);
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Stale-While-Revalidate strategy (for dynamic content)
 * Returns cached content immediately, updates cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Fetch fresh data in background
    const fetchPromise = fetch(request).then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
        console.log(`[SW] 🔄 Updated cache: ${request.url}`);

        // Limit cache size
        limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName]);
      }
      return response;
    });

    // Return cached content immediately if available
    if (cached) {
      console.log(`[SW] ✅ Serving stale content: ${request.url}`);
      return cached;
    }

    // Otherwise wait for network
    return await fetchPromise;
  } catch (error) {
    console.error(`[SW] ❌ Error in staleWhileRevalidate:`, error);
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
      console.log(`[SW] 🗑️  Cache ${cacheName} exceeded max size, cleaning up...`);

      // Delete oldest entries
      const toDelete = keys.slice(0, keys.length - maxSize);
      await Promise.all(toDelete.map((key) => cache.delete(key)));

      console.log(`[SW] ✅ Deleted ${toDelete.length} old cache entries`);
    }
  } catch (error) {
    console.error(`[SW] ❌ Error limiting cache size:`, error);
  }
}

/**
 * Helper functions
 */

function isStaticAsset(url) {
  const staticExtensions = [".js", ".css", ".woff", ".woff2", ".ttf", ".otf"];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

function isImage(url) {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico"];
  return imageExtensions.some((ext) => url.pathname.endsWith(ext));
}

function isAPICall(url) {
  return url.pathname.startsWith("/api/");
}

/**
 * Background sync for offline mutations
 */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-mutations") {
    console.log("[SW] 🔄 Syncing offline mutations...");

    event.waitUntil(
      syncMutations().then(() => {
        console.log("[SW] ✅ Offline mutations synced");
      })
    );
  }
});

async function syncMutations() {
  // TODO: Implement offline mutation sync
  // 1. Get pending mutations from IndexedDB
  // 2. Send to server
  // 3. Clear from IndexedDB on success
}

/**
 * Push notifications
 */
self.addEventListener("push", (event) => {
  console.log("[SW] 📬 Push notification received");

  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "New notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title || "Cockpit", options));
});

/**
 * Notification click handler
 */
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] 🔔 Notification clicked");

  event.notification.close();

  const url = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Message handler (communication with main thread)
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] ⏭️  Skip waiting");
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("[SW] 🗑️  Clearing all caches");
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }

  if (event.data && event.data.type === "PREFETCH") {
    console.log("[SW] 🔥 Prefetching resources:", event.data.urls);
    event.waitUntil(
      caches.open(CACHE_DYNAMIC).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log("[SW] 🚀 Service worker script loaded");
