# Enterprise Production & Utopian UI/UX Master Plan

Status: Active  
Version: 1.0.0  
Last Updated (UTC): 2026-02-19  
Scope: Entire repository (`/workspaces/cockpit`)  
Canonical: This is the single source of truth for transformation planning and execution order.

## 1. Mission
Transform this codebase into an enterprise-grade, production-ready platform with world-class UI/UX quality.

The objective has four simultaneous outcomes:
1. Security and privacy hardening to incident-ready standards.
2. Zero-trust engineering quality gates with no bypass paths.
3. Systemic UI/UX excellence (consistency, accessibility, performance, and interaction quality).
4. Public-repo hygiene with strict IP protection and minimum exposed material.

## 2. Non-Negotiable Program Rules
1. No overclaiming. Every claim must map to verifiable evidence (command output, diff, file reference).
2. No assumptions. Unknowns must be explicitly logged and resolved before implementation decisions.
3. No silent scope drift. Any new scope must be approved in this plan and logged in `docs/HANDOFF.md`.
4. No quality bypass. Failing gates block commit and push.
5. No sensitive/public leakage. Secrets, personal identifiers, and internal-only artifacts are prohibited.
6. No branch sprawl. Single long-lived branch policy (`main`) with strict commit gating.

## 3. Consolidated Inputs (Superseded Sources)
This master plan absorbs and supersedes prior planning/policy artifacts:
1. `docs/PRODUCTION_READINESS_ENTERPRISE_PLAYBOOK.md`
2. `policy/ULTIMATE GLOBAL QUALITY.md`
3. `policy/UX System.md`
4. `.project-knowledge/PROJECT_DOCUMENTATION.md`
5. `.project-knowledge/PROJECT_STATE.md`
6. `tests/README.md`
7. `tests/QUICK_START.md`
8. `tests/TEST_SUITE_GUIDE.md`
9. `tests/ULTIMATE_TEST_GUIDE.md`
10. `tests/LOG_MANAGEMENT.md`
11. `tests/e2e-manual-validation.md`

All execution must now follow this plan plus `docs/AI_EXECUTION_PROTOCOL.md`.

## 4. Current Baseline (Evidence Snapshot)
Date of baseline: 2026-02-19.

### 4.1 Repo and architecture baseline
1. ~878 files scanned.
2. Primary source density in `src` with heavy concentration in `src/components`, `src/app`, and `src/lib`.
3. Route surface includes app routes and ~84 API routes.

### 4.2 Quality baseline
1. Strict lint currently fails with high issue volume.
2. Strict typecheck currently fails with high error volume.
3. Test suite partially passes; integration/security paths are environment-coupled and not fully reliable.
4. Build can succeed while masking quality failures due to bypass configs.

### 4.3 Security baseline (critical)
1. Auth middleware logic contains a high-risk public-path matching flaw.
2. Multiple debug/admin-like endpoints require stricter access policy.
3. Committed production-like env files existed and required immediate sanitization/rotation.
4. Secret fallback patterns and environment validation enforcement require hardening.

### 4.4 UI/UX baseline
1. Design token/theme fragmentation across multiple CSS sources.
2. Duplicate UI component stacks and inconsistent usage patterns.
3. Heavy inline style/hardcoded color debt.
4. Monolithic UI files with high complexity in critical workflows.
5. Accessibility and route-to-test drift requiring systemic correction.

## 5. Target State Definition
A release is considered enterprise-ready only when all of the following are true:
1. Security: no known critical auth/access control flaws; no exposed secrets; no unsafe debug surface in production.
2. Reliability: deterministic CI/CD quality gates block regressions.
3. Code health: strict lint/type/test/build all pass without bypass flags.
4. UX system: one design token source, one primary component system, consistent interaction rules.
5. Accessibility: WCAG 2.2 AA compliance for core workflows with automated and manual verification.
6. Performance: defined budgets and measured compliance on core pages.
7. Operability: observability, runbooks, and incident response procedures in place.
8. Public repo posture: minimal, clean, proprietary-protected, no personal/company leakage.

## 6. Program Workstreams

### WS-A Security & Privacy Hardening
Objective: close all high-risk auth/secrets/exposure gaps.

Tasks:
1. A-01 Middleware authorization model correction.
2. A-02 API endpoint auth classification and mandatory guard policy.
3. A-03 Debug/emergency/admin endpoint lifecycle policy (remove, gate, or isolate).
4. A-04 Centralized env validation enforcement at startup.
5. A-05 Secret fallback removal and secret rotation protocol.
6. A-06 Error response sanitization (no stack/secrets/PII leakage).
7. A-07 Security regression test suite for authz and IDOR patterns.

Exit criteria:
1. Threat model updated for all authenticated flows.
2. All sensitive endpoints have explicit, test-covered authz rules.
3. Secret scanner passes clean.

### WS-B Quality Gate Enforcement
Objective: remove all bypasses and enforce deterministic pass/fail gates.

Tasks:
1. B-01 Remove `|| true` quality bypasses from scripts.
2. B-02 Remove Next build ignore settings for lint/type errors.
3. B-03 Add strict CI pipeline with blocking status checks.
4. B-04 Add pre-commit and pre-push local checks.
5. B-05 Enforce minimum coverage and failing-threshold policies.
6. B-06 Standardize test environments (unit/integration/e2e) with stable fixtures.

Exit criteria:
1. Any lint/type/test/build failure blocks merge/push.
2. CI reproducibility achieved across fresh environments.

### WS-C UI/UX System Unification
Objective: create one coherent design and interaction system.

Tasks:
1. C-01 Canonical token system selection and migration.
2. C-02 Canonical component library selection and migration.
3. C-03 Deprecation/removal of duplicate UI stacks.
4. C-04 Replace inline styles with token-driven styling.
5. C-05 Remove hardcoded color literals outside approved token files.
6. C-06 Typography, spacing, and motion standards baseline.
7. C-07 UX writing and state-pattern consistency (empty/loading/error/success).

Exit criteria:
1. One token source and one component source for new development.
2. No new inline style debt.
3. Style lint checks enforce token-only color usage.

### WS-D Accessibility & Real-Device UX Validation
Objective: guarantee accessibility and high-quality behavior on real devices.

Tasks:
1. D-01 Fix semantic/a11y violations in high-traffic workflows first.
2. D-02 Keyboard navigation and focus management standards.
3. D-03 Screen-reader landmarks/labels for critical screens.
4. D-04 Automated a11y checks in CI.
5. D-05 Manual real-device validation protocol (iOS Safari, Android Chrome).
6. D-06 Accessibility test evidence archive for each release.

Exit criteria:
1. Core user journeys meet WCAG 2.2 AA targets.
2. Manual + automated a11y checks pass.

### WS-E Performance & Frontend Architecture Refactor
Objective: reduce latency, bundle weight, and UI instability.

Tasks:
1. E-01 Break up monolithic UI files with domain boundaries.
2. E-02 Route-level code splitting for heavy pages.
3. E-03 Remove unnecessary global scripts and expensive polling.
4. E-04 Define and enforce bundle/page performance budgets.
5. E-05 Server/client rendering strategy review for hydration stability.
6. E-06 Introduce performance regression checks in CI.

Exit criteria:
1. Core pages meet budget thresholds.
2. Largest surfaces no longer depend on massive single-file components.

### WS-F API/Data/Domain Consistency
Objective: ensure predictable API behavior and data integrity.

Tasks:
1. F-01 API contract validation with schema-first request/response checks.
2. F-02 Standardized auth wrappers and permission checks.
3. F-03 Consistent error codes and response envelopes.
4. F-04 Data validation rules centralized and reused.
5. F-05 Endpoint inventory published and maintained in handoff ledger.

Exit criteria:
1. No unclassified endpoints.
2. Contract tests cover all critical APIs.

### WS-G Operability, Reliability, and Incident Readiness
Objective: operational excellence for enterprise customers.

Tasks:
1. G-01 Structured logging baseline.
2. G-02 Metrics and tracing baseline.
3. G-03 SLOs/SLIs and alerting policy.
4. G-04 Incident runbooks and postmortem template.
5. G-05 Backup/restore validation drills.

Exit criteria:
1. P1 incidents are diagnosable within defined MTTR goals.
2. Recovery procedures are tested and documented.

### WS-H Public Repo Hygiene & IP Control
Objective: keep the public repository minimal, clean, and protected.

Tasks:
1. H-01 Remove sensitive env files and generated artifacts from tracking.
2. H-02 Remove personal/company identifiers from source and scripts.
3. H-03 Keep only canonical operational docs.
4. H-04 Add strict proprietary license and policy.
5. H-05 Enforce no-secret and no-PII checks pre-commit and in CI.

Exit criteria:
1. Public repo contains minimum necessary implementation materials.
2. No personal/company leakage in tracked content.

## 7. Phase Plan and Gates

### Phase 0: Containment and Trust Reset
Required completion before feature work.

Mandatory tasks:
1. A-01, A-03, A-05, H-01, H-02.

Gate P0 (must all pass):
1. No committed secrets.
2. No known auth bypass in middleware.
3. No personal/company identifiers remaining in tracked content.
4. All debug endpoints reviewed and classified.

### Phase 1: Gate Enforcement Foundation
Mandatory tasks:
1. B-01, B-02, B-03, B-04, F-02.

Gate P1:
1. CI blocks on strict quality commands.
2. Local hooks enforce the same policy.

### Phase 2: UI/UX System Foundation
Mandatory tasks:
1. C-01, C-02, C-03, C-04, D-02.

Gate P2:
1. One canonical UI system active.
2. No new duplicate stack usage allowed.

### Phase 3: Core Experience Refactor
Mandatory tasks:
1. E-01, E-02, D-01, D-04, F-01.

Gate P3:
1. Core workflows pass usability, accessibility, and performance budgets.

### Phase 4: Enterprise Hardening
Mandatory tasks:
1. G-01, G-02, G-03, G-04, G-05, D-05.

Gate P4:
1. Operational readiness verified by drill and documented evidence.

### Phase 5: Release Certification
Mandatory tasks:
1. Full workstream closure and evidence review.

Gate P5:
1. Certification checklist fully green.
2. Release approval note entered in `docs/HANDOFF.md`.

## 8. Deterministic Quality Commands (Single Source)
These commands are mandatory checkpoints for all substantial changes.

1. `pnpm lint:strict`
2. `pnpm typecheck:strict`
3. `pnpm test --run`
4. `pnpm build`
5. `pnpm test:e2e` (when route-aligned and environment ready)

Rule: if a command cannot run due to environment limitations, this must be logged explicitly with blocker reason and a compensating validation plan.

## 9. Commit and Push Policy (Strict)
1. No commit if any strict local gate fails.
2. No push if CI strict gate fails.
3. No force-push to `main`.
4. Every commit message must map to task IDs (example: `A-01 B-02: enforce middleware auth guard`).
5. Every push must include updated `docs/HANDOFF.md` when task status changes.

## 10. Plan Update Protocol (When Due)
This plan must be updated when any of the following occurs:
1. A task status changes.
2. A new blocker is discovered.
3. A risk severity changes.
4. A gate fails unexpectedly.
5. A scope or objective changes.
6. At least once every 7 calendar days during active work.

Update method:
1. Update relevant section in this file.
2. Add timestamped log entry in `docs/HANDOFF.md`.
3. Include evidence references (file paths, command names, outcomes).

## 11. Evidence Standards
For every completed task, capture:
1. What changed (files and rationale).
2. Validation executed (commands + status).
3. Residual risk (if any).
4. Rollback path.

No task can be marked complete without evidence.

## 12. Risk Register (Initial)
1. R-01: Security regressions while refactoring auth paths.
2. R-02: UX inconsistency during component migration.
3. R-03: Build instability after removing bypasses.
4. R-04: Performance regressions from partial file splits.
5. R-05: Hidden endpoint dependencies causing runtime failures.

Mitigation policy:
1. Small-batch changes.
2. Contract tests before and after critical edits.
3. Explicit rollback plan per workstream.

## 13. Definition of Done (Program Level)
The program is complete only when:
1. All phase gates P0-P5 are green.
2. All workstream tasks are closed or formally deferred with approval.
3. All strict quality commands pass without bypass.
4. Public repository hygiene checks are clean.
5. Final release evidence is recorded in `docs/HANDOFF.md`.

## 14. Execution Order (No Deviation Default)
Default execution sequence:
1. WS-H (repo hygiene and leakage control)
2. WS-A (security containment)
3. WS-B (quality gate enforcement)
4. WS-C + WS-D (UI/UX and accessibility foundation)
5. WS-E + WS-F (architecture and API integrity)
6. WS-G (operability and reliability)
7. Certification (Phase 5)

Any deviation requires explicit rationale and handoff log entry.
