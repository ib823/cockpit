# Production Readiness & Commercialization Playbook

This playbook translates the current Keystone codebase into an execution plan for production-grade reliability, security, and enterprise commercialization.

## 1) Current-State Assessment (from repository evidence)

### Strengths already present
- Modern, maintainable stack (Next.js App Router + TypeScript + Prisma + PostgreSQL).
- Security-centric capabilities (WebAuthn, RBAC, rate-limiting, audit events).
- Meaningful test layers exist (unit, integration, e2e, performance/security scripts).
- Performance architecture direction is strong (cache layer, virtualization, React Query).

### Gaps to close before enterprise GA
- CI tolerance scripts currently allow lint/typecheck failure (`|| true`) which can hide regressions.
- No explicit runbook in-repo for SLOs, alerting severity matrix, and incident response workflows.
- No centralized "release gates" document covering security, compliance, performance, and recovery criteria.
- Limited explicit evidence artifacts for enterprise buyers (SOC2-style controls mapping, BCP/DR drill cadence, vulnerability-management SLAs).

## 2) Production-Ready Target Architecture & Operating Model

### 2.1 Reliability
- Define service tier and SLOs:
  - Availability target: 99.9% or 99.95% depending on contract tier.
  - Latency SLO: P95 API < 300ms for core CRUD, P95 page interactive < 2.5s.
  - Error budget policy tied to release velocity.
- Implement four golden signals dashboards: latency, traffic, errors, saturation.
- Add synthetic monitoring for:
  - login/passkey flows,
  - critical path project creation/edit/export,
  - admin audit retrieval.

### 2.2 Security & Compliance
- Enforce strict CI gates (lint, types, tests, build) on protected branches.
- Add dependency and container scanning in CI (SCA + secret scanning + SAST).
- Define formal vulnerability SLAs:
  - Critical: patch/mitigate within 24h,
  - High: within 7 days,
  - Medium: within 30 days.
- Security hardening checklist for production:
  - rotate signing and encryption secrets on cadence,
  - enforce least-privilege DB and Redis credentials,
  - mandatory HTTPS, HSTS, CSP with report-only to enforce transition.
- Publish data-handling policy for customer contracts (PII inventory, retention, deletion, export).

### 2.3 Performance & Scalability
- Capacity model by tenant and workload profile:
  - active users/hour,
  - project and milestone volume,
  - export burst rate.
- Add load tests as release gates for login and timeline-heavy operations.
- Introduce query budget checks for N+1 and large payload regressions.
- Define scale playbook:
  - DB connection pooling targets,
  - cache hit-rate thresholds,
  - vertical/horizontal scaling trigger points.

### 2.4 Operability
- Standardize structured logs (request ID, user ID hash, tenant ID, route, latency, status).
- Add tracing across API endpoints, Prisma calls, and outbound services.
- Create runbooks:
  - auth outage,
  - database latency spike,
  - email provider degradation,
  - Redis/rate-limiter failure mode.
- Configure on-call escalation paths and postmortem template (blameless, corrective actions with owners).

### 2.5 Commercialization Readiness
- Publish buyer-facing trust package:
  - security architecture summary,
  - uptime/SLA policy,
  - backup + disaster recovery commitments,
  - release/change-management policy,
  - support matrix (severity response + resolution targets).
- Define SKU tiers with objective platform limits and support entitlements.
- Add product telemetry taxonomy for feature adoption and value realization metrics.

## 3) 90-Day Execution Plan

### Phase 1 (Days 1-30): "Must-pass release gate"
1. Turn on strict CI checks as blocking gate.
2. Baseline observability (logs + metrics + alerts for core APIs).
3. Validate backup and restore procedure in a full environment rehearsal.
4. Produce production checklist with signoff ownership by Engineering/Security/Product.

### Phase 2 (Days 31-60): "Scale and harden"
1. Load and chaos test critical workflows.
2. Implement security scanning automation and vulnerability SLA tracking.
3. Add canary deployment and rollback criteria.
4. Instrument business KPIs and operational SLIs in one dashboard.

### Phase 3 (Days 61-90): "Enterprise launch readiness"
1. Complete incident-response tabletop and DR drill.
2. Finalize trust center artifacts for procurement/security reviews.
3. Lock release train cadence and change advisory workflow.
4. Perform executive go/no-go review against objective launch scorecard.

## 4) Non-Negotiable "Gold Standard" Release Gates
- Build and tests green in strict mode.
- Zero open critical vulnerabilities; high vulnerabilities within SLA or accepted with mitigation signoff.
- SLO dashboard live with pager coverage for Sev-1/Sev-2 alerts.
- Successful backup restore drill documented in previous 30 days.
- Security headers verified in production environment.
- Auth and authorization penetration test with remediations closed.

## 5) Immediate repository-level improvements included in this change
- Added strict lint and strict typecheck scripts that fail on issues.
- Added `ci:strict` script to run deterministic release gates (`lint:strict`, `typecheck:strict`, tests in run mode, production build).

These changes preserve existing developer-friendly scripts while enabling a production-grade gate for protected branches and release pipelines.
