import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { Redis } from '@upstash/redis';

export const rpName = 'Cockpit';
const dev = process.env.NODE_ENV !== 'production';

function getWebAuthnConfig() {
  const rpID = process.env.WEBAUTHN_RP_ID;
  const origin = process.env.WEBAUTHN_ORIGIN;

  if (!dev) {
    if (!rpID || !origin) {
      throw new Error(
        'WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN environment variables are required in production'
      );
    }
  }

  return {
    rpID: rpID ?? 'localhost',
    origin: origin ?? 'http://localhost:3002',
  };
}

const config = getWebAuthnConfig();
export const rpID = config.rpID;
export const origin = config.origin;

// Challenge store with automatic fallback to in-memory (dev-safe)
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
let redis: Redis | null = null;
try {
  if (url && token && /^https:\/\//i.test(url)) redis = new Redis({ url, token });
} catch { redis = null; }

// Use global to survive HMR in development
const globalForChallenges = global as typeof globalThis & {
  __challenges?: Map<string, { v: string; exp: number }>;
};

if (!globalForChallenges.__challenges) {
  globalForChallenges.__challenges = new Map();
}

const mem = globalForChallenges.__challenges;
const ttlSec = 600; // 10 minutes - enough time for user to complete passkey prompt

export const challenges = {
  async set(key: string, val: string) {
    const k = `chal:${key}`;
    if (redis) return void (await redis.set(k, val, { ex: ttlSec }));
    mem.set(k, { v: val, exp: Date.now() + ttlSec * 1000 });
  },
  async get(key: string) {
    const k = `chal:${key}`;
    if (redis) return (await redis.get<string>(k)) ?? null;
    const entry = mem.get(k);
    if (!entry) return null;
    if (Date.now() > entry.exp) {
      mem.delete(k);
      return null;
    }
    return entry.v;
  },
  async del(key: string) {
    const k = `chal:${key}`;
    if (redis) return void (await redis.del(k));
    mem.delete(k);
  },
};

export {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
};
