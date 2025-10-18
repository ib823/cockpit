import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { Redis } from '@upstash/redis';

export const rpName = 'Cockpit';
const dev = process.env.NODE_ENV !== 'production';
export const rpID = process.env.WEBAUTHN_RP_ID ?? (dev ? 'localhost' : '');
export const origin = process.env.WEBAUTHN_ORIGIN ?? (dev ? 'http://localhost:3001' : '');

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
