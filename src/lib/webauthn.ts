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

const mem = new Map<string, { v: string; t: ReturnType<typeof setTimeout> }>();
const ttlSec = 300; // 5 minutes - enough time for user to complete passkey prompt

export const challenges = {
  async set(key: string, val: string) {
    const k = `chal:${key}`;
    if (redis) return void (await redis.set(k, val, { ex: ttlSec }));
    const prev = mem.get(k); if (prev?.t) clearTimeout(prev.t);
    const t = setTimeout(() => mem.delete(k), ttlSec * 1000);
    mem.set(k, { v: val, t });
  },
  async get(key: string) {
    const k = `chal:${key}`;
    if (redis) return (await redis.get<string>(k)) ?? null;
    return mem.get(k)?.v ?? null;
  },
  async del(key: string) {
    const k = `chal:${key}`;
    if (redis) return void (await redis.del(k));
    const e = mem.get(k); if (e?.t) clearTimeout(e.t);
    mem.delete(k);
  },
};

export {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
};
