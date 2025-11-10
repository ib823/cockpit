/**
 * IP Geolocation Service
 *
 * Provides geographic analysis of IP addresses for security monitoring.
 * Uses ip-api.com for free geolocation lookups (no API key required for non-commercial use).
 */

export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export interface GeoLocationAnalysis {
  location: GeoLocation | null;
  suspicious: boolean;
  suspiciousReasons: string[];
  risk: "low" | "medium" | "high";
}

// In-memory cache to avoid excessive API calls
const geoCache = new Map<string, { data: GeoLocation; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Known suspicious countries/regions (customize based on your threat model)
const HIGH_RISK_COUNTRIES = [
  "CN", // China
  "RU", // Russia
  "KP", // North Korea
  "IR", // Iran
  // Add more based on your security requirements
];

// Known datacenter/VPN/proxy ASNs (partial list)
const DATACENTER_KEYWORDS = [
  "amazon",
  "google cloud",
  "microsoft azure",
  "digitalocean",
  "linode",
  "vultr",
  "ovh",
  "hetzner",
  "vpn",
  "proxy",
  "tor",
];

/**
 * Get geolocation data for an IP address
 */
export async function getIPGeolocation(ip: string): Promise<GeoLocation | null> {
  // Check if IP is private/local
  if (isPrivateIP(ip) || ip === "unknown" || ip === "127.0.0.1") {
    return {
      ip,
      country: "Local",
      countryCode: "LOCAL",
      region: "",
      regionName: "Local Network",
      city: "Local",
      zip: "",
      lat: 0,
      lon: 0,
      timezone: "",
      isp: "Local Network",
      org: "Local Network",
      as: "",
    };
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Use ip-api.com (free, no API key needed, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`, {
      headers: {
        "User-Agent": "SAP-Cockpit-Security-Monitor/1.0",
      },
    });

    if (!response.ok) {
      console.error("[geolocation] API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status === "fail") {
      console.error("[geolocation] Lookup failed:", data.message);
      return null;
    }

    const geoData: GeoLocation = {
      ip,
      country: data.country || "Unknown",
      countryCode: data.countryCode || "XX",
      region: data.region || "",
      regionName: data.regionName || "",
      city: data.city || "",
      zip: data.zip || "",
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || "",
      isp: data.isp || "",
      org: data.org || "",
      as: data.as || "",
    };

    // Cache the result
    geoCache.set(ip, { data: geoData, timestamp: Date.now() });

    return geoData;
  } catch (error) {
    console.error("[geolocation] Error fetching geolocation:", error);
    return null;
  }
}

/**
 * Analyze IP address for suspicious indicators
 */
export async function analyzeIPGeolocation(ip: string): Promise<GeoLocationAnalysis> {
  const location = await getIPGeolocation(ip);

  if (!location) {
    return {
      location: null,
      suspicious: false,
      suspiciousReasons: [],
      risk: "low",
    };
  }

  const suspiciousReasons: string[] = [];
  let riskScore = 0;

  // Check country risk
  if (HIGH_RISK_COUNTRIES.includes(location.countryCode)) {
    suspiciousReasons.push(`High-risk country: ${location.country}`);
    riskScore += 30;
  }

  // Check if from known datacenter/VPN/proxy
  const orgLower = (location.org + " " + location.isp + " " + location.as).toLowerCase();
  const isDatacenter = DATACENTER_KEYWORDS.some((keyword) => orgLower.includes(keyword));
  if (isDatacenter) {
    suspiciousReasons.push(`Datacenter/VPN/Proxy detected: ${location.org}`);
    riskScore += 20;
  }

  // Check for TOR exit nodes (simplified check)
  if (orgLower.includes("tor")) {
    suspiciousReasons.push("TOR exit node detected");
    riskScore += 40;
  }

  // Determine overall risk level
  let risk: "low" | "medium" | "high" = "low";
  if (riskScore >= 50) {
    risk = "high";
  } else if (riskScore >= 20) {
    risk = "medium";
  }

  return {
    location,
    suspicious: suspiciousReasons.length > 0,
    suspiciousReasons,
    risk,
  };
}

/**
 * Get geographic distribution of failed login attempts
 */
export async function getFailureGeoDistribution(
  failures: Array<{ ipAddress: string | null }>
): Promise<
  Array<{
    country: string;
    countryCode: string;
    count: number;
    ips: string[];
    risk: "low" | "medium" | "high";
  }>
> {
  const countryMap = new Map<
    string,
    { count: number; ips: Set<string>; risk: "low" | "medium" | "high" }
  >();

  // Process each failure
  for (const failure of failures) {
    if (!failure.ipAddress || failure.ipAddress === "unknown") continue;

    const analysis = await analyzeIPGeolocation(failure.ipAddress);
    if (!analysis.location) continue;

    const key = analysis.location.countryCode;
    const existing = countryMap.get(key);

    if (existing) {
      existing.count++;
      existing.ips.add(failure.ipAddress);
      // Update risk to highest level
      if (analysis.risk === "high" || existing.risk === "high") {
        existing.risk = "high";
      } else if (analysis.risk === "medium" || existing.risk === "medium") {
        existing.risk = "medium";
      }
    } else {
      countryMap.set(key, {
        count: 1,
        ips: new Set([failure.ipAddress]),
        risk: analysis.risk,
      });
    }
  }

  // Convert to array and sort by count
  const distribution = Array.from(countryMap.entries())
    .map(([countryCode, data]) => ({
      country: countryCode === "LOCAL" ? "Local Network" : countryCode,
      countryCode,
      count: data.count,
      ips: Array.from(data.ips),
      risk: data.risk,
    }))
    .sort((a, b) => b.count - a.count);

  return distribution;
}

/**
 * Check if IP is private/internal
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return true;
  if (ip.startsWith("127.")) return true;
  if (ip === "::1") return true; // IPv6 localhost
  if (ip.startsWith("fe80:")) return true; // IPv6 link-local

  return false;
}

/**
 * Get distance between two geographic coordinates (in kilometers)
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
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
 * Detect impossible travel (user logging in from distant locations in short time)
 */
export async function detectImpossibleTravel(
  locations: Array<{ ip: string; timestamp: Date }>
): Promise<
  Array<{
    from: { ip: string; location: string; timestamp: Date };
    to: { ip: string; location: string; timestamp: Date };
    distance: number;
    timeDiff: number;
    speedKmh: number;
    suspicious: boolean;
  }>
> {
  const impossibleTravel: Array<{
    from: { ip: string; location: string; timestamp: Date };
    to: { ip: string; location: string; timestamp: Date };
    distance: number;
    timeDiff: number;
    speedKmh: number;
    suspicious: boolean;
  }> = [];

  // Sort by timestamp
  const sorted = [...locations].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentGeo = await getIPGeolocation(current.ip);
    const nextGeo = await getIPGeolocation(next.ip);

    if (!currentGeo || !nextGeo) continue;

    const distance = getDistance(currentGeo.lat, currentGeo.lon, nextGeo.lat, nextGeo.lon);
    const timeDiff = (next.timestamp.getTime() - current.timestamp.getTime()) / 1000 / 60 / 60; // hours
    const speedKmh = distance / timeDiff;

    // Flag as suspicious if speed > 1000 km/h (faster than commercial flights)
    const suspicious = speedKmh > 1000;

    if (suspicious) {
      impossibleTravel.push({
        from: {
          ip: current.ip,
          location: `${currentGeo.city}, ${currentGeo.country}`,
          timestamp: current.timestamp,
        },
        to: {
          ip: next.ip,
          location: `${nextGeo.city}, ${nextGeo.country}`,
          timestamp: next.timestamp,
        },
        distance,
        timeDiff,
        speedKmh,
        suspicious,
      });
    }
  }

  return impossibleTravel;
}

/**
 * Clear geolocation cache
 */
export function clearGeoCache(): void {
  geoCache.clear();
}

/**
 * Get cache statistics
 */
export function getGeoCacheStats(): { size: number; oldestEntry: number; newestEntry: number } {
  let oldest = Date.now();
  let newest = 0;

  geoCache.forEach((entry) => {
    if (entry.timestamp < oldest) oldest = entry.timestamp;
    if (entry.timestamp > newest) newest = entry.timestamp;
  });

  return {
    size: geoCache.size,
    oldestEntry: oldest,
    newestEntry: newest,
  };
}
