# Incident Runbooks

Status: Active
Last Updated: 2026-02-20

## Incident Severity Classification

| Severity | Definition | Response Time | Examples |
|---|---|---|---|
| P1 Critical | Service down or data integrity at risk | < 15 minutes | Health check failing, DB unreachable, auth completely broken |
| P2 Major | Significant feature degraded | < 1 hour | High error rate, slow response times, partial auth failure |
| P3 Minor | Non-critical issue | < 4 hours | UI glitch, minor feature broken, elevated cache misses |
| P4 Low | Cosmetic or minor inconvenience | Next business day | Logging noise, minor UI inconsistency |

## Runbook 1: Database Connectivity Failure

**Trigger**: `/api/health` returns `{ status: "unhealthy", checks: { database: "down" } }`

**Diagnosis**:
1. Check database provider status page (Neon/Supabase/etc.)
2. Verify `DATABASE_URL` and `DATABASE_URL_UNPOOLED` environment variables
3. Check connection pool limits: `npx prisma db execute --stdin <<< "SELECT count(*) FROM pg_stat_activity;"`
4. Review recent deployments for schema changes

**Mitigation**:
1. If provider outage: monitor provider status, no action required
2. If connection pool exhausted: restart application (Vercel redeploy)
3. If env var misconfigured: fix in Vercel dashboard, redeploy
4. If schema drift: run `pnpm prisma db push` or `pnpm prisma migrate deploy`

**Recovery verification**: `curl /api/health` returns `{ status: "healthy" }`

## Runbook 2: Authentication Failure Spike

**Trigger**: Auth success rate drops below 80% (P1) or 90% (P2)

**Diagnosis**:
1. Check auth metrics: `GET /api/admin/auth-metrics?action=summary`
2. Check failure breakdown: `GET /api/admin/auth-metrics?action=failures&minutes=30`
3. Check for suspicious activity: `GET /api/admin/auth-metrics?action=alerts`
4. Review rate limiting: check IP block list at `/api/admin/security/blocked-ips`

**Mitigation**:
1. If brute force attack: verify IP blocking is active, increase rate limits
2. If TOTP/passkey provider issue: check `TOTP_ENCRYPTION_KEY` validity
3. If session infrastructure failure: check `NEXTAUTH_SECRET` and `JWT_SECRET_KEY`
4. If widespread: verify NextAuth configuration, check for recent auth code changes

**Recovery verification**: `GET /api/admin/auth-metrics?action=rate&period=1h` shows rate > 95%

## Runbook 3: High Error Rate

**Trigger**: API error rate exceeds 2% for 15+ minutes

**Diagnosis**:
1. Check Vercel deployment logs for recent deploy
2. Check runtime logs for error patterns (Vercel dashboard or `GET /api/admin/audit`)
3. Check if errors are concentrated on specific routes
4. Verify external service dependencies (database, Redis)

**Mitigation**:
1. If caused by recent deploy: rollback via Vercel dashboard
2. If external service down: check provider status, activate fallbacks
3. If code bug: hotfix and deploy
4. If rate-limited by external API: implement backoff, increase limits

**Recovery verification**: Error rate returns below 1%

## Runbook 4: Performance Degradation

**Trigger**: p95 latency exceeds 500ms or slow query rate > 20%

**Diagnosis**:
1. Check database query stats via admin dashboard
2. Check if specific routes are slow (Vercel analytics)
3. Check Redis cache hit/miss ratio (if Redis configured)
4. Review recent code changes for N+1 queries or missing indexes

**Mitigation**:
1. If DB slow: check for missing indexes, long-running queries, connection pool issues
2. If cache cold: warm cache, increase TTL values
3. If specific route: optimize query or add caching
4. If platform-wide: check Vercel edge network status

**Recovery verification**: p95 latency returns below 500ms

## Runbook 5: Security Incident

**Trigger**: Suspicious activity detected, unauthorized access attempt, or data breach indicators

**Diagnosis**:
1. Check suspicious activity: `GET /api/admin/auth-metrics?action=alerts`
2. Check blocked IPs: `GET /api/admin/security/blocked-ips`
3. Check geo analysis: `GET /api/admin/security/geo-analysis`
4. Review audit logs for the affected user/entity

**Mitigation**:
1. Block suspicious IPs: `POST /api/admin/security/unblock-ip` (or block via firewall)
2. Force logout affected sessions: `POST /api/security/revoke`
3. Rotate secrets if credentials compromised (see `scripts/rotate-secrets.ts`)
4. Notify affected users if data breach confirmed

**Post-incident**:
1. Complete postmortem (see template below)
2. Update auth-metrics alerting thresholds if needed
3. Review and update security controls

---

## Postmortem Template

### Incident Title
**Date**: YYYY-MM-DD
**Duration**: Start time — End time (total duration)
**Severity**: P1/P2/P3/P4
**Author**: Name

### Summary
One-paragraph description of what happened, impact, and resolution.

### Timeline
| Time (UTC) | Event |
|---|---|
| HH:MM | First alert / detection |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Recovery confirmed |

### Root Cause
What specifically caused the incident? Be precise and evidence-based.

### Impact
- Users affected: N
- Duration of impact: Xm
- Data loss: Yes/No
- SLO impact: X% of error budget consumed

### Detection
How was the incident detected? Was it automated alerting or user report?

### Resolution
What specific actions resolved the incident?

### Lessons Learned
| Category | Finding |
|---|---|
| What went well | |
| What went poorly | |
| Where we got lucky | |

### Action Items
| Action | Owner | Priority | Due Date |
|---|---|---|---|
| | | | |

### Prevention
What changes will prevent this class of incident from recurring?
