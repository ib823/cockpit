# Rate Limiting Verification Guide

## Overview

The application implements multiple layers of rate limiting to protect against brute force attacks, DoS attempts, and API abuse. This document explains how rate limiting works and how to verify it's functioning correctly.

## Rate Limiting Layers

### 1. Edge Middleware Rate Limiting

**Location**: `src/middleware.ts`

- **Scope**: All incoming requests
- **Limit**: 100 requests per minute per IP
- **Implementation**: In-memory (per server instance)
- **Purpose**: Basic DoS protection at the edge

### 2. Server-Side Rate Limiting

**Location**: `src/lib/server-rate-limiter.ts`

- **Scope**: Authentication endpoints
- **Backend**: Upstash Redis (with in-memory fallback)
- **Purpose**: Precise rate limiting with distributed state

**Pre-configured Limiters**:

```typescript
// OTP verification: 5 attempts per 15 minutes
otpVerifyLimiter;

// OTP sending: 3 attempts per 15 minutes
otpSendLimiter;

// Login attempts: 10 attempts per hour
loginLimiter;

// WebAuthn: 10 attempts per 15 minutes
webauthnLimiter;
```

### 3. API Endpoint Protection

**Location**: `src/lib/security/api-protection.ts`

- **Scope**: Individual API endpoints
- **Features**:
  - Per-endpoint custom limits
  - IP allowlist/blocklist
  - Bot detection
  - CAPTCHA integration

### 4. Generic Rate Limiting

**Location**: `src/lib/security/rate-limiter.ts`

- **Scope**: Application-level operations
- **Limits**:
  - PROJECT_CREATE: 10 per hour
  - PROJECT_UPDATE: 60 per minute
  - PROJECT_DELETE: 5 per hour
  - EXCEL_IMPORT: 5 per minute
  - API_GENERAL: 100 per minute

## Verification Methods

### Automated Testing

Run the comprehensive verification script:

```bash
npx tsx scripts/verify-rate-limiting.ts
```

This tests:

1. ✅ Basic rate limit enforcement
2. ✅ Window expiry and reset
3. ✅ Identifier isolation (per-user limits)
4. ✅ Pre-configured limiters functionality
5. ✅ Manual reset capability
6. ✅ Environment configuration

Expected output:

```
🚀 Starting Rate Limiting Verification

============================================================

📊 Test Results:

✅ Environment Setup
   Upstash Redis credentials are configured correctly

✅ Server Rate Limiter - Basic Functionality
   Rate limiter correctly enforces limits

✅ Server Rate Limiter - Window Expiry
   Rate limit window correctly expires and resets

✅ Server Rate Limiter - Identifier Isolation
   Rate limits are correctly isolated per identifier

✅ Pre-configured Limiters
   All pre-configured limiters are functional

✅ Rate Limiter - Reset Functionality
   Rate limit reset works correctly

============================================================

📈 Summary: 6 passed, 0 failed

✅ All tests passed! Rate limiting is working correctly.
```

### Manual Testing

#### Test OTP Rate Limiting

1. Attempt to send OTP 3 times rapidly:

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected: 4th request should return 429 with `Retry-After` header

2. Check response headers:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 900
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1729594800000
```

#### Test Login Rate Limiting

1. Attempt 11 failed logins rapidly:

```bash
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/auth/finish-login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","response":{"invalid":"data"}}'
  echo "Attempt $i"
done
```

Expected: 11th request should be rate limited

#### Test Edge Middleware

1. Send 101 requests rapidly to any endpoint:

```bash
for i in {1..101}; do
  curl http://localhost:3000/api/health
done
```

Expected: 101st request returns 429

### Production Verification

#### Check Redis Connection

Verify Upstash Redis is configured:

```bash
# Check environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Test Redis connectivity (if using Upstash CLI)
upstash redis get "ratelimit:test:key"
```

#### Monitor Rate Limit Events

Check server logs for rate limiting events:

```bash
# Look for rate limit warnings
grep "Too many" /var/log/app.log

# Check auth metrics for rate_limit_exceeded events
curl http://localhost:3000/api/admin/auth-metrics?action=failures&minutes=60 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Verify with Auth Metrics API

```bash
# Get recent failed attempts including rate limits
curl http://localhost:3000/api/admin/auth-metrics?action=failures \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

Look for events with `failureReason: "OTP verification rate limit exceeded"`

## Configuration

### Environment Variables

Required for production (Upstash Redis):

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

Optional - if not set, falls back to in-memory storage (not recommended for production).

### Adjusting Limits

To modify rate limits, edit `src/lib/server-rate-limiter.ts`:

```typescript
// Example: Change OTP verification to 10 attempts per 30 minutes
export const otpVerifyLimiter = new ServerRateLimiter(
  "otp-verify",
  10, // limit
  30 * 60 * 1000 // 30 minutes in ms
);
```

### Customizing Per-Endpoint Limits

Edit `src/lib/security/rate-limiter.ts`:

```typescript
export const RATE_LIMITS = {
  PROJECT_CREATE: { limit: 10, windowMs: 60 * 60 * 1000 },
  // Add custom limits
  CUSTOM_ENDPOINT: { limit: 5, windowMs: 60 * 1000 },
};
```

## Troubleshooting

### Rate Limiting Not Working

**Symptoms**: Unlimited requests are accepted

**Causes**:

1. Missing Upstash credentials (using in-memory fallback across multiple instances)
2. Middleware not running (check `middleware.ts` matcher config)
3. Rate limiter not called in endpoint

**Solutions**:

```bash
# 1. Verify environment
npx tsx scripts/verify-rate-limiting.ts

# 2. Check middleware is applied
# Verify matcher in middleware.ts matches your routes

# 3. Ensure endpoint uses rate limiter
# Example for custom endpoint:
import { loginLimiter } from '@/lib/server-rate-limiter';
const result = await loginLimiter.check(email);
if (!result.success) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
}
```

### Rate Limits Too Strict

**Symptoms**: Legitimate users are getting rate limited

**Solutions**:

1. Increase limits in `server-rate-limiter.ts`
2. Implement user-specific allowlists
3. Use CAPTCHA for edge cases
4. Add manual reset capability for admins

### Redis Connection Issues

**Symptoms**: Errors like "Redis initialization failed"

**Solutions**:

```bash
# 1. Verify credentials
curl https://YOUR_REDIS_URL \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Check URL format (must be HTTPS)
echo $UPSTASH_REDIS_REST_URL | grep "^https://"

# 3. Test from application
npx tsx -e "
  import { Redis } from '@upstash/redis';
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  redis.ping().then(console.log).catch(console.error);
"
```

### In-Memory Fallback in Production

**Issue**: Multiple server instances have separate rate limit counters

**Impact**: Limits are per-instance, not global (e.g., 10 attempts per server = 30 attempts total across 3 servers)

**Solutions**:

1. **Required**: Set up Upstash Redis for production
2. Alternative: Use Redis/Memcached compatible service
3. Workaround: Use sticky sessions (not recommended)

## Monitoring

### Metrics to Track

1. **Rate Limit Hit Rate**: % of requests that hit rate limits
2. **False Positive Rate**: Legitimate users blocked
3. **Attack Detection**: Spike in rate limit events from same IP
4. **Redis Performance**: Latency, error rate

### Alerting Rules

Set up alerts for:

- High rate limit hit rate (>5% of requests)
- Distributed attacks (many IPs hitting limits)
- Redis connection failures
- Unusual patterns (e.g., all from one geography)

### Dashboard Queries

```typescript
// Get rate limit metrics for last hour
import { getRecentFailedAttempts } from "@/lib/monitoring/auth-metrics";

const failures = await getRecentFailedAttempts(60, 1000);
const rateLimitEvents = failures.filter((f) => f.failureReason?.includes("rate limit"));

console.log(`Rate limit events: ${rateLimitEvents.length}`);
```

## Best Practices

### 1. Defense in Depth

Use multiple layers (edge + endpoint + application) for comprehensive protection.

### 2. Graceful Degradation

Always provide clear error messages with `Retry-After` headers.

### 3. User Experience

- Show countdown timers for rate-limited users
- Implement CAPTCHA as alternative to blocking
- Allow admins to manually reset limits

### 4. Monitoring

- Log all rate limit events
- Alert on unusual patterns
- Track false positive rate

### 5. Testing

- Run verification script in CI/CD pipeline
- Load test with realistic traffic patterns
- Test edge cases (clock skew, concurrent requests)

## Integration with Auth Metrics

Rate limiting events are automatically logged to auth metrics:

```typescript
import { logAuthEvent } from "@/lib/monitoring/auth-metrics";

// Automatic logging on rate limit
await logAuthEvent("rate_limit_exceeded", {
  email,
  ipAddress,
  userAgent,
  failureReason: "OTP verification rate limit exceeded",
  method: "otp",
});
```

View rate limit events:

```bash
curl http://localhost:3000/api/admin/auth-metrics?action=failures
```

## References

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [OWASP Rate Limiting Guide](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
