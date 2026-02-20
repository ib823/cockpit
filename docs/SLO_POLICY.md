# SLOs, SLIs, and Alerting Policy

Status: Active
Last Updated: 2026-02-20

## Service Level Indicators (SLIs)

| SLI | Definition | Measurement |
|---|---|---|
| Availability | % of successful health checks over rolling window | `GET /api/health` returns 200 |
| Latency | p95 response time for core user journeys | Server-side timing (health endpoint `responseTimeMs`) |
| Error Rate | % of API requests returning 5xx | HTTP status codes from API routes |
| Auth Success Rate | % of authentication attempts that succeed | `auth-metrics.ts` success rate calculation |
| DB Latency | p95 database query time | `QueryMonitor.getStats().avgQueryTime` |

## Service Level Objectives (SLOs)

| Service | SLI | Target | Window | Error Budget |
|---|---|---|---|---|
| Core API | Availability | 99.5% | 30 days | 3.6 hours/month |
| Core API | Latency (p95) | < 500ms | 30 days | — |
| Core API | Error Rate | < 1% | 30 days | — |
| Authentication | Auth Success Rate | > 95% | 7 days | — |
| Database | DB Latency (p95) | < 300ms | 30 days | — |
| Health Check | Response Time | < 2s | Continuous | — |
| Build/Deploy | Build Success | 100% of merged PRs | Per deploy | — |

## Alerting Tiers

### P1 — Critical (Immediate Response)
- Health check returns unhealthy for > 3 consecutive checks
- Auth success rate drops below 80% in 15-minute window
- Database connectivity lost
- Error rate exceeds 10% for > 5 minutes

**Response**: Page on-call, begin incident process (see `docs/INCIDENT_RUNBOOKS.md`)

### P2 — Warning (Investigate Within 1 Hour)
- Auth success rate drops below 90% in 1-hour window
- Slow query rate exceeds 20% of total queries
- Error rate between 2-10% for > 15 minutes
- Suspicious activity alert from auth-metrics (high severity)

**Response**: Investigate root cause, file issue if not resolved within 2 hours

### P3 — Informational (Review Next Business Day)
- Error budget consumption exceeds 50% of monthly allocation
- Auth success rate below 95% for 24-hour window
- Suspicious activity alert from auth-metrics (medium/low severity)
- Cache miss rate above 50% (performance degradation signal)

**Response**: Review during next operational check, optimize as needed

## Current Monitoring Capabilities

| Capability | Status | Tool |
|---|---|---|
| Health check | Active | `/api/health` endpoint |
| Auth metrics | Active | `auth-metrics.ts` + admin API |
| DB query stats | Active | `QueryMonitor` in `db.ts` |
| Error alerting | Placeholder | Sentry (not yet installed) |
| Uptime monitoring | Not configured | External monitor needed |
| Log aggregation | Not configured | JSON logs ready for ingestion |

## Alerting Implementation Path

1. **Current**: Health check endpoint available for external monitoring services
2. **Next**: Connect Vercel deployment to uptime monitoring (Vercel has built-in)
3. **Scale**: Install Sentry for error tracking with alert rules
4. **Enterprise**: Full observability stack (Datadog/Grafana) with SLO dashboards

## Error Budget Policy

When error budget is exhausted (SLO breached):
1. Freeze non-critical feature deployments
2. Prioritize reliability improvements
3. Conduct postmortem for any P1 incident
4. Resume normal operations when budget recovers above 50%

## Review Cadence

- **Weekly**: Check auth success rates and error trends
- **Monthly**: Review SLO compliance, error budget consumption
- **Quarterly**: Adjust SLO targets based on operational data
