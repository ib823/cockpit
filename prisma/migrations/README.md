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

Every command below needs **both** URL variables exported, because
`schema.prisma` declares `directUrl = env("DATABASE_URL_UNPOOLED")` and Prisma
validates every env() binding when it loads the schema — for any command, even
one that never opens the direct connection. With only `DATABASE_URL` set you
get `Environment variable not found: DATABASE_URL_UNPOOLED` before anything
runs. Both take the direct (unpooled) URL; migrations carry DDL.

```bash
DIRECT="<direct, unpooled url>"
export DATABASE_URL="$DIRECT"
export DATABASE_URL_UNPOOLED="$DIRECT"
```

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

This writes the row into `_prisma_migrations` without executing any SQL. It
does **not** leave the database up to date: any migration after the baseline is
still pending, and `migrate status` will correctly say so. Apply those, then
check:

```bash
pnpm prisma migrate deploy     # applies only what is genuinely pending
pnpm prisma migrate status     # expect "Database schema is up to date!"
```

Run `migrate status` as the final check, not between the two — reading its
"not yet applied" list at that point as a failure is the easy mistake here.

If the final check reports drift, the live database does **not** match
`schema.prisma` — resolve that difference explicitly before the next migration,
and do not paper over it with `db push`.

### Reading `_prisma_migrations` when something looks wrong

A migration name can legitimately appear **twice**: once rolled back, once
applied. That is a migration that failed and was retried, and it is resolved,
not broken. What distinguishes the two states is which timestamps are set:

| `finished_at` | `rolled_back_at` | meaning                                                   |
| ------------- | ---------------- | --------------------------------------------------------- |
| set           | null             | applied normally                                          |
| null          | set              | failed, then explicitly rolled back — fine                |
| null          | null             | **failed and unresolved** — blocks every future migration |

Only the third row is a problem. Prisma refuses to apply anything while a
migration looks unfinished, failing with `P3009`, which in this repo means the
production build stops (`scripts/deploy-migrate.mjs` runs `migrate deploy`).
The fix is `prisma migrate resolve --rolled-back "<migration_name>"` — or
`--applied` if the change did in fact land and was fixed by hand.

Note that `finished_at IS NULL` alone does not mean failure. Checking only that
column will make a cleanly rolled-back row look like an outage.

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

## What production actually contained (observed 2026-08-08)

Read from the live database rather than inferred, because it does not match
what this file assumed:

- `_prisma_migrations` **already existed**. The note above about the database
  being push-managed is right about `0_init` never having been recorded, but
  wrong that there was no history table at all.
- It carried two migrations that **have never existed in this repository** —
  not in the working tree and not anywhere in git history:
  `20251020150129_add_org_chart_to_gantt_project` and
  `20251119032925_team_capacity_models`. Prisma does not object: with the
  baseline recorded, `migrate status` reports "Database schema is up to date!".
  But the database's history and this repo's disagree.

  **Assessed 2026-08-08 — no reconciliation needed.** `0_init` was generated
  from the post-`db push` schema, which already includes everything those two
  migrations created (`ResourceWeeklyAllocation` and the other team-capacity
  tables, the org-chart column are all in `0_init/migration.sql`). A fresh
  restore replaying the repo's migrations therefore reproduces the live
  schema exactly; the two extra rows are history entries only, and creating
  matching migration files would double-apply their DDL on restore and fail.
  The gap is cosmetic ledger drift, not a restore risk.
- `20251020150129_...` appears twice: rolled back at 03:14:07 on 2025-10-24 and
  re-applied in the same second. Resolved, not broken — see the table above.

The baseline itself was applied as SQL through the Neon console rather than via
the CLI, which is equivalent: `migrate resolve --applied` only inserts a row,
and the checksum it stores is the plain SHA-256 of the migration file.

## Migrations on deploy

Production builds now apply pending migrations through
`scripts/deploy-migrate.mjs` (see `docs/DEPLOYMENT.md` §4a). That script encodes
the warning above rather than trusting anyone to remember it: given tables with
no `0_init` row, it stops the build instead of running the baseline against
them.
