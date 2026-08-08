# Migrations

## Why this directory now exists

The schema used to be push-managed (`prisma db push`): no migration history, no
rollback path, and no record of what shape any given database was in.
`docs/DEPLOYMENT.md` documented that. But `docs/BACKUP_RESTORE.md` and
`docs/INCIDENT_RUNBOOKS.md` both call `pnpm prisma migrate deploy` across four
restore/recovery procedures — commands that could not succeed, because there
were no migrations to deploy. The disaster-recovery runbooks were untested and
unrunnable.

Commit `a18d723` ("make establishSession tolerate a not-yet-migrated
sessionEpoch column") is what schema drift looks like in practice: application
code working around a column that may or may not exist in a given environment.

`0_init` is a baseline generated from `prisma/schema.prisma` with:

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

It contains 65 `CREATE TABLE` statements (one per model) and 170 indexes.

## Applying it

### A NEW database (empty)

```bash
pnpm prisma migrate deploy
```

Creates everything and records `0_init` as applied. Nothing else to do.

### An EXISTING database (staging, production — anything already carrying data)

**Do not run `migrate deploy` first.** The baseline is written as
`CREATE TABLE`, so against a populated database it will fail on the first table
that already exists — and a partial failure is worse than no migration.

Mark it as already applied instead:

```bash
pnpm prisma migrate resolve --applied 0_init
```

This writes the row into `_prisma_migrations` without executing any SQL. Verify
before you do anything else:

```bash
pnpm prisma migrate status
```

Expect "Database schema is up to date!". If it instead reports drift, the live
database does **not** match `schema.prisma` — resolve that difference explicitly
before the next migration, and do not paper over it with `db push`.

### After baselining

Schema changes go through migrations from here:

```bash
pnpm prisma migrate dev --name <describes_the_change>   # local
pnpm prisma migrate deploy                              # CI / production
```

Stop using `prisma db push` outside a throwaway local database. It is what
produced the drift this baseline exists to end.

## Verification status

Executed against a real PostgreSQL 16 instance on 2026-08-07:

```
$ createdb cockpit_e2e
$ DATABASE_URL=postgresql://.../cockpit_e2e pnpm prisma migrate deploy
All migrations have been successfully applied.

$ DATABASE_URL=postgresql://.../cockpit_e2e pnpm prisma migrate status
1 migration found in prisma/migrations
Database schema is up to date!
```

66 tables created (65 models + `_prisma_migrations`), no drift reported.

The baselining path has since been rehearsed, on 2026-08-08, against a
reconstruction rather than a copy of production — a database built by applying
`0_init`'s SQL directly, which reproduces the shape a `db push` database has
and, crucially, leaves `_prisma_migrations` absent:

```
$ node scripts/deploy-migrate.mjs        # VERCEL_ENV=production
[migrate] REFUSING TO MIGRATE — the database is not baselined.
  It has 65 tables but no record of the '0_init' baseline.

$ pnpm prisma migrate resolve --applied 0_init
Migration 0_init marked as applied.

$ node scripts/deploy-migrate.mjs
[migrate] Database is baselined — applying pending migrations.
Applying migration `20260807140000_add_optimistic_lock_versions`
All migrations have been successfully applied.

$ node scripts/deploy-migrate.mjs        # idempotent
No pending migrations to apply.
```

That verifies the mechanism — `resolve` records the baseline without executing
it, and `deploy` then applies only what is genuinely pending. It does **not**
verify production's data or any drift particular to it: `migrate status` on the
real database is still the check that matters, and it is worth running before
the first restore drill.

## Migrations on deploy

Production builds now apply pending migrations through
`scripts/deploy-migrate.mjs` (see `docs/DEPLOYMENT.md` §4a). That script encodes
the warning above rather than trusting anyone to remember it: given tables with
no `0_init` row, it stops the build instead of running the baseline against
them.
