# Backup and Restore Validation

Status: Active
Last Updated: 2026-02-20

## Data Assets Inventory

| Asset | Storage | Backup Method | RPO | RTO |
|---|---|---|---|---|
| PostgreSQL database | Cloud provider (Neon/Supabase) | Provider automated snapshots | 24 hours | 1 hour |
| Prisma schema | Git repository | Version controlled | 0 (committed) | Minutes |
| Environment secrets | Vercel / .env | Manual export + secure vault | Manual | 30 minutes |
| Audit logs | PostgreSQL | Included in DB backup | 24 hours | 1 hour |
| User uploads (if any) | N/A (no file uploads) | — | — | — |
| Application code | GitHub | Git + GitHub backup | 0 (pushed) | Minutes |

**RPO** = Recovery Point Objective (max acceptable data loss)
**RTO** = Recovery Time Objective (max acceptable downtime)

## Backup Strategy

### Database (Primary Data Store)

**Automated backups**:
- Cloud database providers (Neon, Supabase) include automated daily snapshots
- Point-in-time recovery (PITR) available with most cloud providers
- Retention: minimum 7 days of snapshots

**Manual backup**:
```bash
# Export full database
pg_dump "$DATABASE_URL" --format=custom --file=backup-$(date +%Y%m%d).dump

# Export schema only
pg_dump "$DATABASE_URL" --schema-only --file=schema-$(date +%Y%m%d).sql
```

**Schema versioning**:
- Prisma schema tracked in `prisma/schema.prisma`
- Migrations tracked in `prisma/migrations/` directory
- Schema validation: `pnpm prisma validate`

### Application State

| Component | Backup | Notes |
|---|---|---|
| Code | GitHub main branch | Protected branch, CI-gated |
| Dependencies | `pnpm-lock.yaml` in Git | Deterministic installs |
| Build config | `next.config.js` in Git | Version controlled |
| Env vars | `.env.example` template | Actual values in Vercel dashboard |

## Restore Procedures

### Procedure 1: Database Restore from Provider Snapshot

1. Access cloud database provider dashboard
2. Select snapshot closest to desired recovery point
3. Restore to new database instance (avoid overwriting active)
4. Update `DATABASE_URL` to point to restored instance
5. Run `pnpm prisma migrate deploy` to verify schema alignment
6. Verify: `curl /api/health` returns healthy
7. Switch traffic: update Vercel env var to restored DB
8. Redeploy

### Procedure 2: Database Restore from Manual Backup

```bash
# Create fresh database
createdb cockpit_restored

# Restore from dump
pg_restore --dbname=cockpit_restored backup-YYYYMMDD.dump

# Verify schema
DATABASE_URL="postgresql://...cockpit_restored" pnpm prisma migrate deploy

# Verify data integrity
DATABASE_URL="postgresql://...cockpit_restored" pnpm prisma db execute \
  --stdin <<< "SELECT count(*) FROM users; SELECT count(*) FROM gantt_projects;"
```

### Procedure 3: Application Rollback

```bash
# Identify last known good commit
git log --oneline -10

# Rollback to specific commit via Vercel
# Option A: Redeploy from Vercel dashboard (select specific commit)
# Option B: Git revert
git revert HEAD --no-edit
git push origin main
```

### Procedure 4: Secret Rotation

```bash
# Generate new secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in Vercel dashboard:
# - NEXTAUTH_SECRET
# - JWT_SECRET_KEY
# - TOTP_ENCRYPTION_KEY
# - CRON_SECRET_KEY

# Redeploy application
# Note: All active sessions will be invalidated after secret rotation
```

## Validation Drill Protocol

### Quarterly Drill Checklist

| Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 1 | Verify automated backup exists | Provider dashboard shows recent snapshot | |
| 2 | Export schema: `pnpm prisma validate` | Schema valid, no errors | |
| 3 | Verify `.env.example` matches production vars | All required vars documented | |
| 4 | Test health check: `curl /api/health` | Returns `{ status: "healthy" }` | |
| 5 | Verify CI pipeline passes on main | All quality gates green | |
| 6 | Verify secret rotation procedure | New secrets generated and documented | |
| 7 | Review audit log retention | Logs available for required period | |

### Annual Full Restore Drill

1. Create test environment with clean database
2. Restore from backup to test environment
3. Run `pnpm prisma migrate deploy` against restored DB
4. Run full test suite against restored environment
5. Verify user data integrity (row counts, sample records)
6. Document results and any issues found
7. Update procedures based on drill findings

## Disaster Recovery Scenarios

| Scenario | Recovery Path | Expected RTO |
|---|---|---|
| Database corruption | Restore from provider snapshot | < 1 hour |
| Accidental data deletion | Point-in-time recovery | < 2 hours |
| Secret compromise | Rotate all secrets, invalidate sessions | < 30 minutes |
| Code regression | Git revert + Vercel redeploy | < 15 minutes |
| Complete infrastructure loss | Redeploy from Git + restore DB | < 4 hours |
| Provider outage | Wait for provider recovery | Provider SLA dependent |

## Known Limitations

1. No automated backup verification tests in CI (manual drill required).
2. No cross-region database replication configured.
3. IndexedDB client-side data (gantt-tool offline storage) not backed up server-side.
4. Audit log retention depends on database backup retention.
