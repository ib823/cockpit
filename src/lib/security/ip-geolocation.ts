/**
 * IP Geolocation Service
 *
 * Detects user location from IP address:
 * - Uses ipapi.co (free tier: 1,000 requests/day, no API key needed)
 * - Falls back to ip-api.com if primary fails
 * - Caches results to minimize API calls
 * - Detects VPN/proxy usage (basic)
 * - Alerts on country/city changes
 */

import { headers } from "next/headers";

export interface IPGeolocation {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  isp: string | null;
  isVPN: boolean;
}

interface IPAPIResponse {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  org?: string;
}

// In-memory cache for IP lookups (expires after 1 hour)
const ipCache = new Map<string, { data: IPGeolocation; expiry: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get client IP address from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Try various headers in order of reliability
  const ip =
    headersList.get("x-real-ip") ||
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("cf-connecting-ip") || // Cloudflare
    headersList.get("x-client-ip") ||
    "127.0.0.1";

  return ip;
}

/**
 * Lookup IP geolocation (with caching)
 */
export async function lookupIP(ip: string): Promise<IPGeolocation> {
  // Check cache first
  const cached = ipCache.get(ip);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  // Skip lookup for localhost/private IPs
  if (isPrivateIP(ip)) {
    const result: IPGeolocation = {
      ip,
      country: null,
      countryCode: null,
      region: null,
      city: null,
      timezone: null,
      latitude: null,
      longitude: null,
      isp: null,
      isVPN: false,
    };
    return result;
  }

  // Try primary API (ipapi.co)
  let result = await lookupIPAPIco(ip);

  // Fallback to secondary API if primary fails
  if (!result) {
    result = await lookupIPAPIcom(ip);
  }

  // If both fail, return empty result
  if (!result) {
    result = {
      ip,
      country: null,
      countryCode: null,
      region: null,
      city: null,
      timezone: null,
      latitude: null,
      longitude: null,
      isp: null,
      isVPN: false,
    };
  }

  // Cache the result
  ipCache.set(ip, {
    data: result,
    expiry: Date.now() + CACHE_TTL,
  });

  return result;
}

/**
 * Lookup IP using ipapi.co (primary, free tier: 1k/day)
 */
async function lookupIPAPIco(ip: string): Promise<IPGeolocation | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        "User-Agent": "Cockpit-Security/1.0",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`[IPAPIco] Failed to lookup ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Check for rate limit or error
    if (data.error) {
      console.error(`[IPAPIco] Error: ${data.reason}`);
      return null;
    }

    return {
      ip,
      country: data.country_name || null,
      countryCode: data.country_code || null,
      region: data.region || null,
      city: data.city || null,
      timezone: data.timezone || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      isp: data.org || null,
      isVPN: detectVPN(data.org),
    };
  } catch (error) {
    console.error("[IPAPIco] Lookup failed:", error);
    return null;
  }
}

/**
 * Lookup IP using ip-api.com (fallback, free with limits)
 */
async function lookupIPAPIcom(ip: string): Promise<IPGeolocation | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,timezone,lat,lon,isp,proxy`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error(`[IPAPIcom] Failed to lookup ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== "success") {
      console.error(`[IPAPIcom] Status: ${data.status}`);
      return null;
    }

    return {
      ip,
      country: data.country || null,
      countryCode: data.countryCode || null,
      region: data.region || null,
      city: data.city || null,
      timezone: data.timezone || null,
      latitude: data.lat || null,
      longitude: data.lon || null,
      isp: data.isp || null,
      isVPN: data.proxy || false,
    };
  } catch (error) {
    console.error("[IPAPIcom] Lookup failed:", error);
    return null;
  }
}

/**
 * Check if IP is private/localhost
 */
function isPrivateIP(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "localhost" || ip === "::1") {
    return true;
  }

  // Check private ranges
  const parts = ip.split(".");
  if (parts.length !== 4) return false;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // 10.0.0.0/8
  if (first === 10) return true;

  // 172.16.0.0/12
  if (first === 172 && second >= 16 && second <= 31) return true;

  // 192.168.0.0/16
  if (first === 192 && second === 168) return true;

  return false;
}

/**
 * Basic VPN detection (checks ISP/org name for common VPN providers)
 */
function detectVPN(org: string | undefined): boolean {
  if (!org) return false;

  const vpnKeywords = [
    "vpn",
    "proxy",
    "tunnel",
    "relay",
    "nordvpn",
    "expressvpn",
    "mullvad",
    "protonvpn",
    "privateinternetaccess",
    "surfshark",
    "cyberghost",
    "tor",
    "torbrowser",
  ];

  const orgLower = org.toLowerCase();
  return vpnKeywords.some((keyword) => orgLower.includes(keyword));
}

/**
 * Compare two locations to detect significant change
 */
export function hasLocationChanged(
  prev: { country: string | null; city: string | null },
  current: { country: string | null; city: string | null }
): {
  countryChanged: boolean;
  cityChanged: boolean;
  significant: boolean;
} {
  const countryChanged = prev.country !== current.country;
  const cityChanged = prev.city !== current.city;

  // Country change is always significant
  // City change within same country is less significant
  const significant = countryChanged;

  return { countryChanged, cityChanged, significant };
}

/**
 * Format location for display
 */
export function formatLocation(geo: IPGeolocation): string {
  const parts: string[] = [];

  if (geo.city) parts.push(geo.city);
  if (geo.region && geo.region !== geo.city) parts.push(geo.region);
  if (geo.country) parts.push(geo.country);

  if (parts.length === 0) {
    return geo.ip;
  }

  return parts.join(", ");
}

/**
 * Calculate distance between two coordinates (in km)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if location change is suspicious (e.g., impossible travel)
 */
export function isSuspiciousTravel(
  prevLocation: { latitude: number; longitude: number; timestamp: Date },
  currentLocation: { latitude: number; longitude: number; timestamp: Date }
): {
  suspicious: boolean;
  distance: number;
  timeDiff: number;
  speed: number;
} {
  const distance = calculateDistance(
    prevLocation.latitude,
    prevLocation.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );

  const timeDiff =
    (currentLocation.timestamp.getTime() - prevLocation.timestamp.getTime()) / 1000 / 60 / 60; // hours
  const speed = distance / timeDiff; // km/h

  // Average commercial flight speed is ~900 km/h
  // If speed exceeds 1000 km/h, it's suspicious (unless using VPN)
  const suspicious = speed > 1000 && timeDiff < 6; // Less than 6 hours between logins

  return { suspicious, distance, timeDiff, speed };
}

/**
 * Clear IP cache (useful for testing)
 */
export function clearIPCache(): void {
  ipCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ ip: string; expiresIn: number }>;
} {
  const entries = Array.from(ipCache.entries()).map(([ip, data]) => ({
    ip,
    expiresIn: Math.max(0, Math.floor((data.expiry - Date.now()) / 1000)),
  }));

  return {
    size: ipCache.size,
    entries,
  };
}
