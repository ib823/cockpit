# Authentication Metrics Tracking

## Overview

The application now tracks comprehensive authentication metrics including success rates, failed attempts, and security events. This enables real-time monitoring and alerting for security incidents.

## Features

### 1. Automatic Event Logging

All authentication attempts are automatically logged with the following information:
- Event type (success/failure)
- Authentication method (passkey, OTP, magic-link, admin)
- IP address
- User agent
- Timestamp
- Failure reason (for failures)

### 2. Tracked Events

- `webauthn_success` / `webauthn_failure` - Passkey authentication
- `otp_success` / `otp_failure` - OTP verification
- `magic_link_success` / `magic_link_failure` - Magic link authentication
- `admin_login_success` / `admin_login_failure` - Admin login
- `rate_limit_exceeded` - Rate limiting triggered
- `account_locked` - Account locked due to suspicious activity
- `session_expired` - Session expiration events

### 3. API Endpoints

#### Get Metrics Summary
```bash
GET /api/admin/auth-metrics?action=summary
```

Returns authentication metrics for the last 24 hours, 7 days, and 30 days:
```json
{
  "ok": true,
  "data": {
    "last24Hours": {
      "total": 150,
      "successful": 145,
      "failed": 5,
      "successRate": 96.67
    },
    "last7Days": { ... },
    "last30Days": { ... },
    "recentFailures": 3,
    "topFailureReasons": [
      { "reason": "Invalid OTP code", "count": 12 },
      { "reason": "Access expired", "count": 8 }
    ]
  }
}
```

#### Get Success Rate for Period
```bash
GET /api/admin/auth-metrics?action=rate&period=24h&method=passkey
```

Parameters:
- `period`: `1h`, `24h`, `7d`, `30d`
- `method` (optional): `passkey`, `otp`, `magic-link`, `admin`

Returns:
```json
{
  "ok": true,
  "data": {
    "period": "24h",
    "method": "passkey",
    "total": 100,
    "successful": 98,
    "failed": 2,
    "successRate": 98.0,
    "byMethod": {
      "passkey": { "total": 100, "successful": 98, "failed": 2, "rate": 98.0 },
      "otp": { "total": 50, "successful": 48, "failed": 2, "rate": 96.0 }
    }
  }
}
```

#### Get Recent Failed Attempts
```bash
GET /api/admin/auth-metrics?action=failures&minutes=15&limit=50
```

Returns recent failed authentication attempts with details:
```json
{
  "ok": true,
  "data": {
    "minutes": 15,
    "count": 3,
    "failures": [
      {
        "email": "user@example.com",
        "ipAddress": "192.168.1.1",
        "failureReason": "Invalid OTP code",
        "timestamp": "2025-10-22T10:30:00Z",
        "method": "otp"
      }
    ]
  }
}
```

#### Check for Suspicious Activity
```bash
GET /api/admin/auth-metrics?action=alerts
```

Returns alerts for suspicious authentication patterns:
```json
{
  "ok": true,
  "data": {
    "hasAlert": true,
    "alerts": [
      {
        "type": "high_failure_rate",
        "severity": "high",
        "message": "Authentication success rate dropped to 45.2% in the last 15 minutes",
        "data": { ... }
      },
      {
        "type": "repeated_failures",
        "severity": "medium",
        "message": "IP 192.168.1.1 has 5 failed authentication attempts in the last 15 minutes",
        "data": { "ip": "192.168.1.1", "count": 5 }
      }
    ]
  }
}
```

## Programmatic Usage

### Log Custom Auth Events

```typescript
import { logAuthEvent } from '@/lib/monitoring/auth-metrics';

// Log a successful login
await logAuthEvent('login_success', {
  email: 'user@example.com',
  ipAddress: req.headers.get('x-forwarded-for'),
  userAgent: req.headers.get('user-agent'),
  method: 'passkey',
  deviceType: 'desktop',
}, userId);

// Log a failed attempt
await logAuthEvent('login_failure', {
  email: 'user@example.com',
  ipAddress: req.headers.get('x-forwarded-for'),
  userAgent: req.headers.get('user-agent'),
  failureReason: 'Invalid credentials',
  method: 'otp',
});
```

### Get Success Rate Programmatically

```typescript
import { getAuthSuccessRate } from '@/lib/monitoring/auth-metrics';

const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
const now = new Date();

const stats = await getAuthSuccessRate(last24Hours, now, 'passkey');
console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
```

### Check for Suspicious Activity

```typescript
import { checkForSuspiciousActivity } from '@/lib/monitoring/auth-metrics';

const activity = await checkForSuspiciousActivity();
if (activity.hasAlert) {
  for (const alert of activity.alerts) {
    console.warn(`[${alert.severity.toUpperCase()}] ${alert.message}`);
    // Send notification to security team
  }
}
```

## Alert Types

### High Failure Rate
Triggered when authentication success rate drops below 50% with at least 10 attempts in 15 minutes.
**Action**: Investigate potential service issues or attacks.

### Repeated Failures
Triggered when:
- Single IP has 5+ failed attempts in 15 minutes
- Single email has 3+ failed attempts in 15 minutes

**Action**: Consider blocking IP or locking account.

### Distributed Attack
Triggered when 50+ failed attempts from 20+ unique IPs in 15 minutes.
**Action**: Activate DDoS protection, rate limiting adjustments.

## Monitoring Recommendations

### Real-time Monitoring
Set up a cron job or scheduled task to check for suspicious activity:

```typescript
// scripts/check-auth-security.ts
import { checkForSuspiciousActivity } from '@/lib/monitoring/auth-metrics';

async function monitorAuthSecurity() {
  const activity = await checkForSuspiciousActivity();

  if (activity.hasAlert) {
    // Send alerts via email, Slack, PagerDuty, etc.
    for (const alert of activity.alerts) {
      await sendSecurityAlert(alert);
    }
  }
}

// Run every 5 minutes
setInterval(monitorAuthSecurity, 5 * 60 * 1000);
```

### Dashboard Integration
Display key metrics on admin dashboard:

```typescript
import { getAuthMetricsSummary } from '@/lib/monitoring/auth-metrics';

export async function AdminDashboard() {
  const metrics = await getAuthMetricsSummary();

  return (
    <div>
      <MetricCard
        title="24h Success Rate"
        value={`${metrics.last24Hours.successRate.toFixed(1)}%`}
        trend={metrics.last24Hours.successRate > 95 ? 'up' : 'down'}
      />
      <MetricCard
        title="Recent Failures"
        value={metrics.recentFailures}
        alert={metrics.recentFailures > 10}
      />
    </div>
  );
}
```

### PostHog Analytics
Authentication events are automatically sent to PostHog for:
- Success/failure trend analysis
- Funnel analysis (login attempts → success)
- User cohort analysis
- Geographic distribution of failures

Access these metrics in PostHog dashboard under "Auth Events".

## Database Schema

Authentication events are stored in the `AuditEvent` table:

```prisma
model AuditEvent {
  id        String   @id
  userId    String?
  type      String   // Event type (e.g., 'webauthn_success')
  createdAt DateTime @default(now())
  meta      Json?    // { ipAddress, userAgent, method, failureReason, etc. }
  users     users?   @relation(fields: [userId], references: [id])

  @@index([userId, type, createdAt])
}
```

## Security Considerations

1. **PII Protection**: Email addresses in logs should be hashed in production environments
2. **Retention**: Audit events should be retained for 90 days minimum for compliance
3. **Access Control**: Only ADMIN role can access `/api/admin/auth-metrics` endpoints
4. **Rate Limiting**: Metrics API has rate limiting to prevent abuse

## Troubleshooting

### High False Positive Rate
If you see many "Invalid OTP code" failures:
- Check if users are experiencing OTP delivery delays
- Verify OTP expiration time is reasonable (currently 15 minutes)

### Missing Events
If events are not being logged:
- Check PostHog configuration (`NEXT_PUBLIC_POSTHOG_KEY`)
- Verify database connection for audit event storage
- Check server logs for auth-metrics errors

### Performance Impact
Authentication logging is asynchronous and should not impact login performance. If you observe slowdowns:
- Check database query performance on `AuditEvent` table
- Consider archiving old audit events (>90 days)
- Optimize indexes on frequently queried fields

## Next Steps

1. **Set up alerting**: Configure webhooks or email notifications for high-severity alerts
2. **Dashboard**: Build admin dashboard displaying real-time auth metrics
3. **Automated response**: Implement automatic IP blocking for repeated failures
4. **Compliance**: Export audit logs for compliance requirements (SOC2, GDPR, etc.)
