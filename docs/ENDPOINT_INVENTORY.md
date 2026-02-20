# API Endpoint Inventory

Status: Active
Last Updated: 2026-02-20
Total Routes: 82

## Summary

| Metric | Count | % |
|--------|-------|---|
| Total endpoints | 82 | 100% |
| Authenticated | 63 | 77% |
| Zod validation | 12 | 15% |
| Public (no auth) | 19 | 23% |

## Inventory

| Route | Methods | Auth | Zod |
|-------|---------|------|-----|
| /api/account/passkeys | GET, POST | session | No |
| /api/account/passkeys/[id] | DELETE | session | No |
| /api/account/profile | GET, PATCH | session | No |
| /api/account/sessions | GET | session | No |
| /api/account/sessions/[id] | DELETE | session | No |
| /api/admin/approvals | GET, POST, PATCH | admin | No |
| /api/admin/approve-email | POST | admin | No |
| /api/admin/audit | GET | admin | No |
| /api/admin/auth-metrics | GET | admin | No |
| /api/admin/create-access | POST | admin | No |
| /api/admin/email-approvals | GET, POST | admin | No |
| /api/admin/force-login | GET | cron | No |
| /api/admin/recovery | GET | admin | No |
| /api/admin/recovery/[requestId]/approve | POST | admin | No |
| /api/admin/recovery/[requestId]/reject | POST | admin | No |
| /api/admin/security/blocked-ips | GET | admin | No |
| /api/admin/security/geo-analysis | GET | admin | No |
| /api/admin/security/unblock-ip | POST | admin | No |
| /api/admin/stats | GET | admin | No |
| /api/admin/users | GET, POST | admin | No |
| /api/admin/users/[id] | PATCH, DELETE | admin | No |
| /api/admin/users/[id]/exception | POST | admin | No |
| /api/admin/users/[id]/extend | POST | admin | No |
| /api/admin/users/[id]/generate-code | POST | admin | No |
| /api/architecture | GET, POST | session | No |
| /api/architecture/[projectId] | GET, PUT, DELETE | session | No |
| /api/auth/[...nextauth] | GET, POST | nextauth | No |
| /api/auth/admin-login | POST | none | No |
| /api/auth/begin-login | POST | none | Yes |
| /api/auth/begin-register | POST | none | Yes |
| /api/auth/check-admin | POST | none | No |
| /api/auth/email-status | GET | none | Yes |
| /api/auth/finish-login | POST | none | Yes |
| /api/auth/finish-register | POST | none | Yes |
| /api/auth/login-secure | POST | none | Yes |
| /api/auth/logout | POST | session | No |
| /api/auth/magic-login | POST | none | Yes |
| /api/auth/me | GET | session | No |
| /api/auth/passkey/register/begin | POST | session | No |
| /api/auth/passkey/register/finish | POST | session | Yes |
| /api/auth/register-complete | POST | none | Yes |
| /api/auth/send-magic-link | POST | none | Yes |
| /api/auth/send-otp | POST | none | Yes |
| /api/auth/verify-magic-link | POST | none | Yes |
| /api/auth/verify-otp | POST | none | Yes |
| /api/cron/password-expiry-warnings | GET | cron | No |
| /api/dashboard/scenarios | GET, POST, DELETE | session | No |
| /api/dashboard/snapshots | GET, POST | session | No |
| /api/dashboard/stats | GET | session | No |
| /api/gantt-tool/invites/[token] | GET, POST | partial | No |
| /api/gantt-tool/projects | GET, POST | session | Yes |
| /api/gantt-tool/projects/[projectId] | GET, PUT, DELETE, PATCH | session | Yes |
| /api/gantt-tool/projects/[projectId]/access | GET | session | No |
| /api/gantt-tool/projects/[projectId]/collaborators/[userId] | PATCH, DELETE | session | Yes |
| /api/gantt-tool/projects/[projectId]/context | GET | session | No |
| /api/gantt-tool/projects/[projectId]/costing-config | GET, PUT | session | Yes |
| /api/gantt-tool/projects/[projectId]/delta | POST | session | Yes |
| /api/gantt-tool/projects/[projectId]/presence | POST | session | Yes |
| /api/gantt-tool/projects/[projectId]/recover | POST | session | Yes |
| /api/gantt-tool/projects/[projectId]/share | POST, DELETE | session | Yes |
| /api/gantt-tool/resources | GET, POST | session | Yes |
| /api/gantt-tool/resources/[id] | GET, PATCH, DELETE | session | Yes |
| /api/gantt-tool/resources/validate | GET | session | No |
| /api/gantt-tool/team-capacity/allocations | GET, POST, DELETE | session | Yes |
| /api/gantt-tool/team-capacity/conflicts | GET, POST | session | Yes |
| /api/gantt-tool/team-capacity/costing | GET, POST | session | Yes |
| /api/health | GET | none | No |
| /api/import/gantt | POST | session | No |
| /api/l3-catalog | GET | none | No |
| /api/lobs | GET | none | No |
| /api/projects | GET | session | No |
| /api/projects/[projectId]/chips | GET | session | No |
| /api/revalidate-admin | POST | admin | No |
| /api/security/revoke | POST | session | No |
| /api/user/email/change-request | POST | session | No |
| /api/user/email/revoke | POST | session | No |
| /api/user/email/verify | POST | session | No |
| /api/user/recovery/request | POST | none | No |
| /api/user/sessions | GET | session | No |
| /api/user/sessions/[sessionId] | DELETE | session | No |
| /api/ws/collaboration | GET, POST | session | No |

## Auth Legend

| Key | Meaning |
|-----|---------|
| session | Requires valid NextAuth session (getServerSession) |
| admin | Requires admin role (requireAdmin helper) |
| cron | Protected by CRON_SECRET_KEY |
| none | Public endpoint (auth entry points, health check) |
| partial | Auth optional (guest read, session required for write) |
| nextauth | Handled by NextAuth internally |

## Known Gaps

1. **Admin mutation routes lack Zod** — POST/PATCH for users, approvals, and email-approvals use manual validation.
2. **Account routes lack Zod** — profile PATCH uses typeof checks instead of schemas.
3. **Centralized schemas unused** — `src/lib/api-validators.ts` defines 17 schemas but 0 routes import from it (all use inline schemas).
