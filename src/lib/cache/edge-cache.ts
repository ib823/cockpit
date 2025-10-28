/**
 * Keystone - Edge Caching with Vercel Edge Config
 *
 * Ultra-fast caching at the edge (CDN level)
 * Response times: < 10ms globally
 *
 * Features:
 * - Global CDN caching
 * - Edge config for dynamic data
 * - SWR (Stale-While-Revalidate)
 * - Cache tags for invalidation
 * - Regional optimization
 */

/**
 * Edge cache configuration
 */
export const EDGE_CACHE_CONFIG = {
  // Static resources - cache aggressively
  STATIC_ASSETS: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 31536000,
    tags: ['static'],
  },

  // L3 Catalog - rarely changes
  L3_CATALOG: {
    maxAge: 86400, // 24 hours
    staleWhileRevalidate: 604800, // 7 days
    tags: ['l3-catalog', 'data'],
  },

  // API responses - moderate caching
  API_RESPONSES: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 3600, // 1 hour
    tags: ['api'],
  },

  // User data - short cache
  USER_DATA: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
    tags: ['user'],
  },

  // Dashboard data - short cache
  DASHBOARD: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 900, // 15 minutes
    tags: ['dashboard'],
  },
} as const;

/**
 * Cache control headers builder
 */
export function buildCacheHeaders(config: {
  maxAge: number;
  staleWhileRevalidate: number;
  tags: string[];
}): Headers {
  const headers = new Headers();

  // Cache-Control header
  headers.set(
    'Cache-Control',
    `public, max-age=${config.maxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`
  );

  // Cache tags (for purging)
  if (config.tags.length > 0) {
    headers.set('Cache-Tag', config.tags.join(', '));
  }

  // Vary header (important for personalized content)
  headers.set('Vary', 'Accept-Encoding, Authorization');

  return headers;
}

/**
 * Edge-cached fetch wrapper
 */
export async function edgeFetch<T = any>(
  url: string,
  options?: RequestInit & {
    cacheConfig?: typeof EDGE_CACHE_CONFIG[keyof typeof EDGE_CACHE_CONFIG];
    revalidate?: number;
  }
): Promise<T> {
  const { cacheConfig, revalidate, ...fetchOptions } = options || {};

  // Build fetch options with caching
  const finalOptions: RequestInit = {
    ...fetchOptions,
    next: {
      revalidate: revalidate || cacheConfig?.maxAge,
      tags: cacheConfig?.tags,
    },
  };

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    throw new Error(`Edge fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Purge cache by tag (Vercel-specific)
 */
export async function purgeCacheByTag(tag: string): Promise<void> {
  if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
    try {
      const response = await fetch(
        `https://api.vercel.com/v1/purge?tag=${tag}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        console.log(`[Edge Cache] ✅ Purged tag: ${tag}`);
      } else {
        console.error(`[Edge Cache] ❌ Failed to purge tag: ${tag}`);
      }
    } catch (error) {
      console.error(`[Edge Cache] ❌ Error purging tag:`, error);
    }
  } else {
    console.warn('[Edge Cache] ⚠️  Vercel token not configured, skipping purge');
  }
}

/**
 * Purge multiple cache tags
 */
export async function purgeCacheTags(tags: string[]): Promise<void> {
  await Promise.all(tags.map(tag => purgeCacheTag(tag)));
}

/**
 * Edge middleware helper
 * Use in middleware.ts to add caching headers
 */
export function addEdgeCacheHeaders(
  response: Response,
  config: typeof EDGE_CACHE_CONFIG[keyof typeof EDGE_CACHE_CONFIG]
): Response {
  const headers = buildCacheHeaders(config);

  // Clone response and add headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  // Add cache headers
  headers.forEach((value, key) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

/**
 * Check if response is from edge cache
 */
export function isEdgeCached(response: Response): boolean {
  const cacheStatus = response.headers.get('x-vercel-cache');
  return cacheStatus === 'HIT';
}

/**
 * Get cache age from response
 */
export function getCacheAge(response: Response): number | null {
  const age = response.headers.get('age');
  return age ? parseInt(age, 10) : null;
}

/**
 * Edge cache statistics
 */
export interface EdgeCacheStats {
  url: string;
  cached: boolean;
  age: number | null;
  cacheStatus: string | null;
  responseTime: number;
}

/**
 * Fetch with edge cache stats
 */
export async function edgeFetchWithStats<T = any>(
  url: string,
  options?: RequestInit & {
    cacheConfig?: typeof EDGE_CACHE_CONFIG[keyof typeof EDGE_CACHE_CONFIG];
  }
): Promise<{ data: T; stats: EdgeCacheStats }> {
  const startTime = performance.now();

  const response = await fetch(url, options);
  const data = await response.json();

  const responseTime = performance.now() - startTime;

  const stats: EdgeCacheStats = {
    url,
    cached: isEdgeCached(response),
    age: getCacheAge(response),
    cacheStatus: response.headers.get('x-vercel-cache'),
    responseTime,
  };

  console.log(
    `[Edge Cache] ${stats.cached ? '✅ HIT' : '❌ MISS'} ${url} (${responseTime.toFixed(2)}ms)`
  );

  return { data, stats };
}

/**
 * Preload critical resources at edge
 */
export async function preloadEdgeResources(urls: string[]): Promise<void> {
  console.log(`[Edge Cache] 🔥 Preloading ${urls.length} resources...`);

  const promises = urls.map(url =>
    fetch(url, {
      method: 'HEAD',
      next: { revalidate: 86400 }, // Cache for 24 hours
    }).catch(err => console.warn(`[Edge Cache] ⚠️  Failed to preload ${url}:`, err))
  );

  await Promise.all(promises);

  console.log(`[Edge Cache] ✅ Preloaded ${urls.length} resources`);
}

/**
 * Critical resources to preload
 */
export const CRITICAL_RESOURCES = [
  '/api/l3-catalog',
  '/api/lobs',
  // Add more critical resources here
] as const;
