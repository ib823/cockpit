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

## Known gap

This baseline was generated and verified structurally (model and index counts
checked against the schema), but it has **not** been executed against a real
Postgres instance, because no database was reachable from the environment that
created it. Before relying on it in a restore drill, run it once against a
scratch database and confirm `prisma migrate status` comes back clean.
