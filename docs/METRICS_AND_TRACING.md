# Metrics and Tracing Baseline

Status: Active
Last Updated: 2026-02-20

## Current Instrumentation

### Health Check (`/api/health`)
- Database connectivity and latency measurement
- Overall system status: healthy/unhealthy/error
- Response time tracking

### Database Query Monitoring (`src/lib/db.ts`)
- `QueryMonitor` class tracks: total queries, slow queries (>300ms), average/max query time
- Rolling window of last 100 query times
- Slow query warnings in development

### Authentication Metrics (`src/lib/monitoring/auth-metrics.ts`)
- 14 event types tracked (login/OTP/magic-link/WebAuthn success+failure, session expiry, account lock, rate limit)
- Success rate calculation by time period (1h, 24h, 7d, 30d) and by method
- Failed attempt tracking with email, IP, timestamp, failure reason
- Suspicious activity detection (high failure rates, repeated IP/email failures, distributed attacks)
- Admin API endpoint: `GET /api/admin/auth-metrics?action=summary|rate|failures|alerts`

### Product Analytics (PostHog)
- Client-side event tracking for estimator, scenario, timeline, export, decision support
- User identification and feature flags
- Not suitable for operational metrics

### Audit Trail (`src/lib/audit.ts`)
- DB-backed audit logging for security-sensitive operations
- Suspicious activity detection (unusual deletes, failed access)
- Admin query endpoints for entity/user audit history

## Key Metrics to Monitor

### Application Metrics

| Metric | Type | Source | Current Status |
|---|---|---|---|
| Request count by route | Counter | Middleware | Not implemented |
| Request latency (p50/p95/p99) | Histogram | Middleware | Not implemented |
| Error rate by route | Counter | API routes | Partial (console.error) |
| Auth success/failure rate | Gauge | auth-metrics.ts | Implemented |
| DB query latency | Histogram | QueryMonitor | Implemented |
| Slow query count | Counter | QueryMonitor | Implemented |
| Active sessions | Gauge | DB query | Not implemented |
| Cache hit/miss ratio | Gauge | redis-cache.ts | Console only |

### Infrastructure Metrics

| Metric | Source | Current Status |
|---|---|---|
| Health check status | /api/health | Implemented |
| DB connection status | checkDatabaseHealth() | Implemented |
| Memory usage | Node.js process | Not implemented |
| Event loop lag | Node.js process | Not implemented |

## Tracing Strategy

### Current State
No distributed tracing. No request correlation IDs. Logs cannot be traced across service boundaries.

### Recommended Implementation Path

1. **Phase 1 (Current)**: Document baseline, establish metric definitions
2. **Phase 2 (When needed)**: Add request ID middleware to inject `x-request-id` header
3. **Phase 3 (Scale)**: Install OpenTelemetry SDK for full distributed tracing
4. **Phase 4 (Production)**: Connect to observability backend (Datadog, Grafana, etc.)

### Request ID Pattern (Ready to Implement)

```typescript
// middleware.ts addition
const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
response.headers.set("x-request-id", requestId);
```

## Integration Points

| System | Purpose | Status |
|---|---|---|
| Sentry | Error tracking + performance | Placeholder ready, SDK not installed |
| PostHog | Product analytics | Active |
| Vercel Analytics | Web vitals, deployment metrics | Available via Vercel platform |
| OpenTelemetry | Distributed tracing | Not installed |

## Known Gaps

1. No request-level metrics collection (counter, histogram).
2. No request correlation IDs propagated through the stack.
3. Cache metrics logged to console only, not aggregated.
4. No memory/event-loop monitoring.
5. Auth metrics require database connectivity (no degraded-mode fallback).
