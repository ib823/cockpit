/**
 * Device Fingerprinting Service
 *
 * Creates unique device signatures for detecting new devices:
 * - Browser fingerprinting (User-Agent, screen, timezone, etc.)
 * - Hashed fingerprint storage (privacy-preserving)
 * - Trusted device management
 * - GDPR-compliant (no PII in fingerprint)
 */

import crypto from 'crypto';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

export interface DeviceFingerprint {
  fingerprint: string;      // Hashed fingerprint
  userAgent: string;
  platform?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

export interface TrustedDeviceInfo {
  id: string;
  nickname: string | null;
  lastSeenAt: Date;
  lastSeenIp: string;
  country: string | null;
  city: string | null;
  userAgent: string;
  createdAt: Date;
}

/**
 * Generate device fingerprint from client data
 * This should be called with data from the client-side FingerprintJS
 */
export function generateDeviceFingerprint(data: {
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  canvas?: string;      // Canvas fingerprint
  webgl?: string;       // WebGL fingerprint
  fonts?: string[];     // Installed fonts
}): DeviceFingerprint {
  // Create a deterministic string from device properties
  const components = [
    data.userAgent,
    data.screenResolution || '',
    data.timezone || '',
    data.language || '',
    data.platform || '',
    data.canvas || '',
    data.webgl || '',
    (data.fonts || []).sort().join(',')
  ].join('|');

  // Hash the fingerprint for privacy
  const fingerprint = crypto
    .createHash('sha256')
    .update(components)
    .digest('hex');

  return {
    fingerprint,
    userAgent: data.userAgent,
    platform: data.platform,
    screenResolution: data.screenResolution,
    timezone: data.timezone,
    language: data.language
  };
}

/**
 * Generate server-side fingerprint from request headers
 * Less accurate than client-side but useful for API-only requests
 */
export async function generateServerFingerprint(): Promise<DeviceFingerprint> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const acceptLanguage = headersList.get('accept-language') || '';

  const components = [
    userAgent,
    acceptLanguage
  ].join('|');

  const fingerprint = crypto
    .createHash('sha256')
    .update(components)
    .digest('hex');

  return {
    fingerprint,
    userAgent,
    language: acceptLanguage.split(',')[0]
  };
}

/**
 * Generate server-side fingerprint from provided headers
 * Synchronous version for use with already-obtained headers
 */
export function getServerSideFingerprint(headersList: Awaited<ReturnType<typeof headers>>): DeviceFingerprint {
  const userAgent = headersList.get('user-agent') || 'unknown';
  const acceptLanguage = headersList.get('accept-language') || '';

  const components = [
    userAgent,
    acceptLanguage
  ].join('|');

  const fingerprint = crypto
    .createHash('sha256')
    .update(components)
    .digest('hex');

  return {
    fingerprint,
    userAgent,
    language: acceptLanguage.split(',')[0]
  };
}

/**
 * Check if device is trusted for a user
 */
export async function isDeviceTrusted(
  userId: string,
  fingerprint: string
): Promise<boolean> {
  const device = await prisma.trustedDevice.findUnique({
    where: {
      userId_fingerprint: {
        userId,
        fingerprint
      }
    }
  });

  return device !== null;
}

/**
 * Add device to trusted list
 */
export async function trustDevice(
  userId: string,
  fingerprint: string,
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    country?: string;
    city?: string;
    nickname?: string;
  }
): Promise<void> {
  await prisma.trustedDevice.upsert({
    where: {
      userId_fingerprint: {
        userId,
        fingerprint
      }
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      fingerprint,
      userAgent: deviceInfo.userAgent,
      lastSeenIp: deviceInfo.ipAddress,
      lastSeenAt: new Date(),
      country: deviceInfo.country,
      city: deviceInfo.city,
      nickname: deviceInfo.nickname,
      createdAt: new Date()
    },
    update: {
      lastSeenIp: deviceInfo.ipAddress,
      lastSeenAt: new Date(),
      country: deviceInfo.country,
      city: deviceInfo.city
    }
  });
}

/**
 * Get all trusted devices for a user
 */
export async function getTrustedDevices(userId: string): Promise<TrustedDeviceInfo[]> {
  return prisma.trustedDevice.findMany({
    where: { userId },
    orderBy: { lastSeenAt: 'desc' }
  });
}

/**
 * Remove a trusted device
 */
export async function removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
  const result = await prisma.trustedDevice.deleteMany({
    where: {
      id: deviceId,
      userId // Ensure user owns this device
    }
  });

  return result.count > 0;
}

/**
 * Update device nickname
 */
export async function updateDeviceNickname(
  userId: string,
  deviceId: string,
  nickname: string
): Promise<boolean> {
  const result = await prisma.trustedDevice.updateMany({
    where: {
      id: deviceId,
      userId
    },
    data: { nickname }
  });

  return result.count > 0;
}

/**
 * Get device info from user agent string
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  // Simple user agent parsing (consider using a library like ua-parser-js for production)
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  // Device type detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'Mobile';
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'Tablet';

  return { browser, os, device };
}

/**
 * Generate a friendly device name from fingerprint data
 */
export function generateDeviceName(userAgent: string): string {
  const { browser, os, device } = parseUserAgent(userAgent);
  return `${browser} on ${os} (${device})`;
}

/**
 * Check if fingerprint has changed (potential device switch)
 */
export async function detectFingerprintChange(
  userId: string,
  currentFingerprint: string
): Promise<{
  changed: boolean;
  previousFingerprint?: string;
  isNewDevice: boolean;
}> {
  const devices = await prisma.trustedDevice.findMany({
    where: { userId },
    orderBy: { lastSeenAt: 'desc' },
    take: 1
  });

  if (devices.length === 0) {
    return {
      changed: true,
      isNewDevice: true
    };
  }

  const lastDevice = devices[0];
  const changed = lastDevice.fingerprint !== currentFingerprint;

  return {
    changed,
    previousFingerprint: lastDevice.fingerprint,
    isNewDevice: changed
  };
}

/**
 * Clean up old trusted devices (e.g., not seen in 90 days)
 */
export async function cleanupOldDevices(userId: string, daysInactive: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  const result = await prisma.trustedDevice.deleteMany({
    where: {
      userId,
      lastSeenAt: {
        lt: cutoffDate
      }
    }
  });

  return result.count;
}
