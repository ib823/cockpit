# Advanced Security Features Guide

## Overview

This guide covers the advanced security features implemented to enhance threat detection and automated response capabilities.

## Table of Contents

1. [Admin Security Dashboard](#admin-security-dashboard)
2. [Automated IP Blocking](#automated-ip-blocking)
3. [Geographic Analysis](#geographic-analysis)
4. [Integration & Configuration](#integration--configuration)

---

## Admin Security Dashboard

### Overview

A comprehensive real-time security monitoring dashboard for administrators to track authentication metrics, failed attempts, blocked IPs, and security alerts.

### Accessing the Dashboard

```
URL: /admin/security
Permission Required: ADMIN role
```

### Features

#### 1. Real-Time Metrics Cards

- **24 Hour Success Rate**: Authentication success percentage
- **7 Day Success Rate**: Weekly authentication trends
- **30 Day Success Rate**: Monthly authentication patterns

**Color Coding:**

- 🟢 Green: ≥95% (Healthy)
- 🟡 Yellow: 85-94% (Warning)
- 🔴 Red: <85% (Critical)

#### 2. Security Alerts Panel

Displays active security threats:

- **High Failure Rate**: Success rate dropped below 50%
- **Repeated Failures**: Same IP/email multiple failures
- **Distributed Attack**: Many IPs failing simultaneously

#### 3. Recent Failed Attempts

Shows last 60 minutes of failed logins with:

- User email
- IP address
- Failure reason
- Timestamp
- Auth method (passkey, OTP, magic-link, admin)

#### 4. Blocked IPs Management

Real-time list of blocked IP addresses with:

- IP address
- Block reason (with failure count)
- Block timestamp
- Expiration (or "Permanent")
- **Unblock button** for manual intervention

#### 5. Top Failure Reasons

Ranked list of most common failure causes:

1. Invalid OTP code
2. User not found
3. Access expired
4. Passkey verification failed
5. Rate limit exceeded

#### 6. Auto-Refresh

- Automatically refreshes every 30 seconds
- Toggle on/off in dashboard
- Shows last update timestamp

### API Endpoints

```bash
# Get security summary
GET /api/admin/auth-metrics?action=summary

# Get recent failures
GET /api/admin/auth-metrics?action=failures&minutes=60

# Get security alerts
GET /api/admin/auth-metrics?action=alerts

# Get blocked IPs
GET /api/admin/security/blocked-ips

# Unblock IP
POST /api/admin/security/unblock-ip
Body: { "ip": "192.168.1.1" }

# Get geographic analysis
GET /api/admin/security/geo-analysis?minutes=60
```

### Screenshots

```
┌─────────────────────────────────────────────────────────────┐
│ Security Monitoring                    [Auto-refresh: ON ✓] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ⚠️  Security Alerts (2)                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 HIGH | high_failure_rate                             │ │
│ │ Authentication success rate dropped to 45.2% in the     │ │
│ │ last 15 minutes                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌───────────────┬───────────────┬───────────────┐          │
│ │ 24h: 96.7% ✅ │ 7d: 94.2% ⚠️  │ 30d: 95.8% ✅  │          │
│ │ 145/150       │ 452/480       │ 1150/1200     │          │
│ └───────────────┴───────────────┴───────────────┘          │
│                                                               │
│ Recent Failures         │   Blocked IPs (3)                  │
│ ┌─────────────────────┐ │ ┌──────────────────────────────┐  │
│ │ user@example.com    │ │ │ 192.168.1.100   [Unblock]   │  │
│ │ 192.168.1.100       │ │ │ 5 failures in 15 min        │  │
│ │ Invalid OTP code    │ │ │ Temporary (expires 60 min)  │  │
│ │ 10:30 AM            │ │ └──────────────────────────────┘  │
│ └─────────────────────┘ │                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Automated IP Blocking

### Overview

Automatically blocks IP addresses that exhibit suspicious authentication patterns. Supports temporary and permanent blocks with automatic escalation.

### How It Works

```
Failed Attempt → Log Event → Check Threshold → Block IP → Notify
                     ↓
              Count Failures
           (15-minute window)
                     ↓
              ≥5 failures?
                     ↓
            Block IP (60 min)
                     ↓
         3+ temporary blocks?
                     ↓
        Permanent Block ⛔
```

### Configuration

**Default Thresholds:**

```typescript
{
  maxFailures: 5,              // failures before block
  windowMinutes: 15,           // time window for counting
  blockDurationMinutes: 60,    // temporary block duration
  permanentBlockThreshold: 3   // temp blocks before permanent
}
```

**Customization:**

```typescript
// src/lib/security/ip-blocker.ts
export async function checkAndBlockIP(
  ip: string,
  config: Partial<BlockConfig> = {
    maxFailures: 10, // More lenient
    windowMinutes: 30, // Longer window
    blockDurationMinutes: 120, // 2-hour block
    permanentBlockThreshold: 5, // More chances
  }
): Promise<{ blocked: boolean; reason?: string }>;
```

### Block Types

#### 1. Temporary Block

- **Duration**: 60 minutes (default)
- **Trigger**: 5 failures in 15 minutes
- **Reason**: "Temporary block: 5 failures in 15 minutes"
- **Auto-expires**: Yes

#### 2. Permanent Block

- **Duration**: Indefinite
- **Trigger**: 3 temporary blocks
- **Reason**: "Permanent block: 5 failures in 15 minutes (3 previous blocks)"
- **Auto-expires**: No
- **Removal**: Manual admin intervention only

### Integration with Auth Endpoints

All authentication endpoints now include IP blocking:

```typescript
// 1. Check if IP is blocked (at start of request)
const blockCheck = await isIPBlocked(ipAddress);
if (blockCheck.blocked) {
  return NextResponse.json(
    {
      ok: false,
      message: "Access denied. Your IP has been blocked.",
      blocked: true,
    },
    { status: 403 }
  );
}

// 2. On authentication failure
await logAuthEvent("login_failure", {
  /* ... */
});
await checkAndBlockIP(ipAddress); // Auto-block if threshold exceeded

// 3. Return appropriate error
return NextResponse.json({ ok: false, message: "Invalid credentials" });
```

### Affected Endpoints

✅ `/api/auth/finish-login` (Passkey)
✅ `/api/auth/verify-otp` (OTP)
✅ `/api/auth/magic-login` (Magic Link)
✅ `/api/auth/admin-login` (Admin)

### Manual Management

#### Unblock IP (Admin Dashboard)

```typescript
// Via UI: Click "Unblock" button on Security Dashboard

// Via API:
POST /api/admin/security/unblock-ip
Content-Type: application/json

{
  "ip": "192.168.1.100"
}
```

#### Programmatic Unblock

```typescript
import { unblockIP } from "@/lib/security/ip-blocker";

await unblockIP("192.168.1.100");
```

### Monitoring

#### Get All Blocked IPs

```typescript
import { getBlockedIPs } from "@/lib/security/ip-blocker";

const blocked = await getBlockedIPs();
console.log(`Currently ${blocked.length} IPs blocked`);
```

#### Get IP Block History

```typescript
import { getIPBlockHistory } from "@/lib/security/ip-blocker";

const history = await getIPBlockHistory("192.168.1.100");
// Returns: [{ type, createdAt, reason, permanent }, ...]
```

#### Clean Up Expired Blocks

```typescript
import { cleanupExpiredBlocks } from "@/lib/security/ip-blocker";

// Run periodically (e.g., daily cron job)
const cleaned = await cleanupExpiredBlocks();
console.log(`Removed ${cleaned} expired blocks`);
```

### Database Schema

```prisma
model SecurityEvent {
  id        String   @id
  type      String   // 'ip_blocked', 'ip_unblocked'
  ipAddress String?
  userId    String?
  createdAt DateTime @default(now())
  meta      Json?    // { reason, blockedAt, expiresAt, permanent }

  @@index([type, createdAt])
  @@index([ipAddress])
}
```

### Storage

**Redis (Production):**

- Key: `ipblock:{ip}`
- TTL: Auto-expires temporary blocks
- Permanent blocks: No expiry

**In-Memory Fallback (Development):**

- Used when Redis not configured
- Per-instance (not distributed)
- Cleared on restart

---

## Geographic Analysis

### Overview

Provides geographic intelligence on failed authentication attempts to identify patterns, high-risk countries, and potential distributed attacks.

### Features

#### 1. IP Geolocation

Automatically resolves IP addresses to geographic locations:

- Country, region, city
- Latitude/longitude
- ISP/Organization
- Datacenter detection
- VPN/Proxy detection
- TOR exit node detection

#### 2. Geographic Distribution

Analyzes failures by country with risk scoring:

```json
{
  "distribution": [
    {
      "country": "United States",
      "countryCode": "US",
      "count": 45,
      "ips": ["192.168.1.1", "10.0.0.1"],
      "risk": "low"
    },
    {
      "country": "Russia",
      "countryCode": "RU",
      "count": 12,
      "ips": ["5.6.7.8"],
      "risk": "high"
    }
  ],
  "statistics": {
    "totalFailures": 57,
    "totalCountries": 15,
    "highRiskCountries": 3,
    "totalIPs": 47
  }
}
```

#### 3. Risk Scoring

Automatic risk assessment based on:

- **Country Risk** (+30 points): High-risk countries (CN, RU, KP, IR)
- **Datacenter/VPN** (+20 points): Known hosting providers
- **TOR Network** (+40 points): TOR exit nodes

**Risk Levels:**

- **Low**: <20 points (Normal traffic)
- **Medium**: 20-49 points (Potential VPN/proxy)
- **High**: ≥50 points (High-risk country + VPN/TOR)

#### 4. Impossible Travel Detection

Identifies suspicious login patterns:

```typescript
// Example: User logs in from New York, then Beijing 30 minutes later
{
  "from": {
    "ip": "1.2.3.4",
    "location": "New York, United States",
    "timestamp": "2025-10-22T10:00:00Z"
  },
  "to": {
    "ip": "5.6.7.8",
    "location": "Beijing, China",
    "timestamp": "2025-10-22T10:30:00Z"
  },
  "distance": 11000,      // km
  "timeDiff": 0.5,        // hours
  "speedKmh": 22000,      // 22,000 km/h (impossible!)
  "suspicious": true
}
```

### Configuration

**Geolocation Provider:**

- Service: ip-api.com (free tier)
- Rate Limit: 45 requests/minute
- No API key required
- Cache: 24 hours per IP

**High-Risk Countries (Customize):**

```typescript
// src/lib/security/geolocation.ts
const HIGH_RISK_COUNTRIES = [
  "CN", // China
  "RU", // Russia
  "KP", // North Korea
  "IR", // Iran
  // Add more based on your threat model
];
```

**Datacenter Detection:**

```typescript
const DATACENTER_KEYWORDS = [
  "amazon",
  "google cloud",
  "microsoft azure",
  "digitalocean",
  "linode",
  "vultr",
  "vpn",
  "proxy",
  "tor",
];
```

### API Usage

#### Get Geographic Analysis

```bash
GET /api/admin/security/geo-analysis?minutes=60
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "distribution": [
      /* country distribution */
    ],
    "statistics": {
      "totalFailures": 123,
      "totalCountries": 25,
      "highRiskCountries": 5,
      "totalIPs": 98,
      "minutes": 60
    }
  }
}
```

#### Programmatic Usage

```typescript
import {
  getIPGeolocation,
  analyzeIPGeolocation,
  getFailureGeoDistribution,
  detectImpossibleTravel,
} from "@/lib/security/geolocation";

// 1. Get geolocation for single IP
const location = await getIPGeolocation("8.8.8.8");
console.log(location);
// { country: 'United States', city: 'Mountain View', ... }

// 2. Analyze IP for suspicious indicators
const analysis = await analyzeIPGeolocation("1.2.3.4");
console.log(analysis);
// {
//   location: { ... },
//   suspicious: true,
//   suspiciousReasons: ['High-risk country: Russia', 'VPN detected'],
//   risk: 'high'
// }

// 3. Get geographic distribution of failures
const failures = await getRecentFailedAttempts(60, 100);
const distribution = await getFailureGeoDistribution(failures);
console.log(distribution);
// [{ country: 'US', count: 45, risk: 'low' }, ...]

// 4. Detect impossible travel
const locations = [
  { ip: "1.2.3.4", timestamp: new Date("2025-10-22T10:00:00Z") },
  { ip: "5.6.7.8", timestamp: new Date("2025-10-22T10:30:00Z") },
];
const impossibleTravel = await detectImpossibleTravel(locations);
console.log(impossibleTravel);
// [{ from: {...}, to: {...}, speedKmh: 22000, suspicious: true }]
```

### Visualization Ideas

#### World Map Heatmap

```typescript
// Show failures by country on world map
const distribution = await getFailureGeoDistribution(failures);
// Render with Leaflet, Google Maps, or Chart.js
```

#### Geographic Timeline

```typescript
// Show how attack patterns move geographically over time
const hourly = await getGeoDistributionByHour(24);
// Animate on map to show attack progression
```

#### Risk Matrix

```
              Low Risk  │ Medium Risk │ High Risk
────────────────────────┼─────────────┼──────────
Datacenter/VPN    12    │     8       │    3
Residential       45    │     2       │    1
TOR               0     │     0       │    5
```

### Performance

**Caching:**

- IP geolocation cached for 24 hours
- Reduces API calls by ~95%
- Cache stored in memory (consider Redis for production)

**Rate Limiting:**

- ip-api.com: 45 req/min (free tier)
- Implement request queuing for high-volume:
  ```typescript
  // Queue requests to respect rate limits
  const queue = new PQueue({ concurrency: 1, interval: 1350 });
  await queue.add(() => getIPGeolocation(ip));
  ```

**Cost:**

- Free tier sufficient for most use cases
- Pro tier ($13/month): Unlimited requests, HTTPS, commercial use

### Privacy Considerations

⚠️ **Important:** IP geolocation may reveal PII (Personally Identifiable Information)

**Best Practices:**

1. **Minimize Data Collection**: Only collect what's needed for security
2. **Data Retention**: Delete geolocation data after 90 days
3. **Access Control**: Limit admin access to geographic data
4. **User Disclosure**: Update privacy policy to mention IP logging
5. **GDPR Compliance**: Allow users to request IP data deletion

**Anonymization:**

```typescript
// Anonymize IPs in logs (keep first 3 octets only)
function anonymizeIP(ip: string): string {
  return ip.split(".").slice(0, 3).join(".") + ".0";
}

// Example: 192.168.1.100 → 192.168.1.0
```

---

## Integration & Configuration

### Prerequisites

1. **Database Migration**

   ```bash
   # Add SecurityEvent model
   npx prisma db push
   ```

2. **Redis (Optional but Recommended)**

   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```

3. **Admin Access**
   - Requires ADMIN role
   - Update user role in database if needed

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Optional (for distributed IP blocking)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional (for external geolocation service)
# Free tier of ip-api.com used by default (no key needed)
```

### Testing

#### Test IP Blocking

```bash
# Simulate 6 failed logins to trigger block
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","otp":"000000"}'
  echo "Attempt $i"
done

# 6th attempt should return 403 Forbidden
```

#### Test Geographic Analysis

```bash
# Get geo distribution of recent failures
curl http://localhost:3000/api/admin/security/geo-analysis?minutes=60 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

#### Test Dashboard

```bash
# Access admin security dashboard
open http://localhost:3000/admin/security
```

### Monitoring & Alerts

#### Set Up Alerts

**1. Slack Notifications**

```typescript
// scripts/security-monitor.ts
import { checkForSuspiciousActivity } from "@/lib/monitoring/auth-metrics";
import { getBlockedIPs } from "@/lib/security/ip-blocker";

async function sendSlackAlert(message: string) {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}

async function monitor() {
  const activity = await checkForSuspiciousActivity();
  if (activity.hasAlert) {
    for (const alert of activity.alerts) {
      await sendSlackAlert(`🚨 ${alert.message}`);
    }
  }

  const blocked = await getBlockedIPs();
  if (blocked.length > 10) {
    await sendSlackAlert(`⚠️ ${blocked.length} IPs currently blocked`);
  }
}

// Run every 5 minutes
setInterval(monitor, 5 * 60 * 1000);
```

**2. Email Notifications**

```typescript
// Use Resend API to send email alerts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "security@your-domain.com",
  to: "admin@your-domain.com",
  subject: "🚨 Security Alert: High Failure Rate",
  html: `<p>${alert.message}</p>`,
});
```

**3. PagerDuty Integration**

```typescript
// For critical alerts (distributed attacks, etc.)
await fetch("https://events.pagerduty.com/v2/enqueue", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    routing_key: process.env.PAGERDUTY_KEY,
    event_action: "trigger",
    payload: {
      summary: alert.message,
      severity: alert.severity,
      source: "Keystone Security Monitor",
    },
  }),
});
```

### Troubleshooting

#### Dashboard Not Loading

**Issue:** 403 Forbidden
**Solution:** Check user has ADMIN role:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

#### IP Blocking Not Working

**Issue:** IPs not being blocked after failures
**Solutions:**

1. Check Prisma schema includes SecurityEvent model
2. Run database migration: `npx prisma db push`
3. Verify auth endpoints are calling `checkAndBlockIP()`

#### Geographic Analysis Empty

**Issue:** No geographic data showing
**Solutions:**

1. Check ip-api.com rate limits (45/min)
2. Verify internet access from server
3. Check geolocation cache: `getGeoCacheStats()`

#### High Memory Usage

**Issue:** Geolocation cache growing too large
**Solution:** Clear cache periodically:

```typescript
import { clearGeoCache } from "@/lib/security/geolocation";

// Clear cache daily
setInterval(clearGeoCache, 24 * 60 * 60 * 1000);
```

---

## Best Practices

### 1. Regular Review

- Check security dashboard daily
- Review blocked IPs weekly
- Analyze geographic patterns monthly

### 2. Adjust Thresholds

- Start conservative (5 failures / 15 min)
- Monitor false positive rate
- Adjust based on your user base

### 3. Whitelist Trusted IPs

```typescript
// src/lib/security/ip-blocker.ts
const TRUSTED_IPS = [
  "203.0.113.0/24", // Office network
  "198.51.100.0/24", // VPN network
];

function isTrustedIP(ip: string): boolean {
  return TRUSTED_IPS.some((range) => ipInRange(ip, range));
}
```

### 4. User Communication

- Inform users why they're blocked
- Provide unblock request process
- Update terms of service

### 5. Compliance

- Document IP blocking policy
- Maintain audit trail (SecurityEvent table)
- Allow users to request their data

---

## Support

For questions or issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [SECURITY_MONITORING_IMPLEMENTATION.md](./SECURITY_MONITORING_IMPLEMENTATION.md)
3. Create GitHub issue with label `security`
4. Contact security team

---

**Implemented:** October 22, 2025
**Last Updated:** October 22, 2025
**Maintained by:** Security Team
