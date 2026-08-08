# Deployment & Test Login

This is a Next.js 15 app targeting **Vercel + Neon Postgres**. It cannot run
without a database and secrets, so it can't be "made live" without your Vercel
and Neon accounts. The steps below are turnkey — ~15 minutes end to end.

> Security note: generate secrets locally and set them only in Vercel's encrypted
> env store. Never commit them or paste them into chat/issues.

## 1. Database — Neon
1. Create a project at https://neon.tech and copy the connection strings.
2. You need two:
   - `DATABASE_URL` — the **pooled** string (host contains `-pooler`), `?sslmode=require`
   - `DATABASE_URL_UNPOOLED` — the **direct** string (no `-pooler`)

## 2. Secrets — generate locally
```bash
openssl rand -base64 32   # NEXTAUTH_SECRET   (must be >= 32 chars)
openssl rand -base64 32   # JWT_SECRET_KEY
openssl rand -hex 32      # TOTP_ENCRYPTION_KEY (64 hex chars)
```

## 3. Vercel — import the repo and set env vars
Import `ib823/cockpit` in Vercel (Framework preset: **Next.js**). Under
**Settings → Environment Variables** (Production + Preview), set:

| Key | Value |
|---|---|
| `DATABASE_URL` | Neon pooled URL |
| `DATABASE_URL_UNPOOLED` | Neon direct URL |
| `NEXTAUTH_SECRET` | generated (step 2) |
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` |
| `JWT_SECRET_KEY` | generated (step 2) |
| `TOTP_ENCRYPTION_KEY` | generated (step 2) |

Optional (recommended for production, app degrades gracefully without them):
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limiting),
`RESEND_API_KEY` or SMTP vars (email). Install command `pnpm install`,
build command `pnpm build` (auto-detected). `build` runs `prisma generate`,
then `scripts/deploy-migrate.mjs`, then `next build` — see §4a.

Pushing the branch (or merging to `main`) triggers the deploy.

## 4. Create the schema + seed reference data (run once, locally)

**Export both URL variables.** `prisma/schema.prisma` declares
`directUrl = env("DATABASE_URL_UNPOOLED")`, and Prisma validates every
env() binding when it loads the schema — for *any* command, whether or not it
needs the direct connection. Setting only `DATABASE_URL` fails before anything
runs:

```
error: Environment variable not found: DATABASE_URL_UNPOOLED.
Validation Error Count: 1
```

Both take the Neon **direct** (unpooled) URL here: migrations carry DDL, which
the pooler does not reliably support.

```bash
DIRECT="<Neon DIRECT url>"
export DATABASE_URL="$DIRECT"
export DATABASE_URL_UNPOOLED="$DIRECT"

pnpm prisma migrate deploy  # applies prisma/migrations (creates all 65 tables)
pnpm prisma db seed         # seeds L3 catalog + regional holidays (reference data)
```

> **If the target database already has tables** (any environment created before
> migrations existed), do NOT run `migrate deploy` first — it will fail on the
> first table that already exists. Baseline it instead:
>
> ```bash
> pnpm prisma migrate resolve --applied 0_init
> pnpm prisma migrate deploy     # now applies only what is genuinely pending
> pnpm prisma migrate status     # expect "Database schema is up to date!"
> ```
>
> `migrate status` will **not** say "up to date" between the resolve and the
> deploy — it correctly reports the remaining migrations as pending. Only run
> it as the final check. See `prisma/migrations/README.md`.

## 4a. Migrations on deploy

Production builds apply pending migrations automatically. `pnpm build` runs
`scripts/deploy-migrate.mjs` between `prisma generate` and `next build`.

This exists because a deploy that ships code without its schema is silent and
severe: Prisma selects every scalar field by default, so a missing column makes
even a plain read fail. When the optimistic-lock migration shipped without
being applied, opening a Gantt project broke — not just saving one.

**It only runs when `VERCEL_ENV=production`.** Preview deploys are excluded on
purpose: unless `DATABASE_URL` is scoped per environment in Vercel, a preview
build points at the production database, and a migration from an unmerged
branch would land on live data. Local and CI builds are excluded for the same
reason — `pnpm build` must not mutate a database as a side effect. Set
`RUN_DEPLOY_MIGRATIONS=1` to opt in elsewhere.

**It refuses to migrate an un-baselined database.** If the target has tables
but no `0_init` row in `_prisma_migrations` — the signature of a database
created by `prisma db push` before this repo had migrations — the build stops
with instructions rather than attempting `0_init` against populated tables.
Baseline it once (§4 note above, or `prisma/migrations/README.md`) and every
migration after that applies on its own.

A build failing here is the intended outcome, not a regression: the deploy it
stopped would have gone green while production broke.


## 5. Your test login (no email service required)
The app authenticates with **passkeys**; a one-time **admin code** bootstraps the
first account. Run against the deployed DB:
```bash
DIRECT="<Neon DIRECT url>"
export DATABASE_URL="$DIRECT"
export DATABASE_URL_UNPOOLED="$DIRECT"   # required — see §4
export NEXTAUTH_URL="https://<your-vercel-domain>"
pnpm admin:generate-code you@example.com "Your Name"
```
It prints a **6-digit access code** (valid 7 days). Then:
1. Open `https://<your-vercel-domain>/login`
2. Enter the email, then the 6-digit code
3. Register a passkey (fingerprint / Face ID / security key) when prompted
4. From then on you log in with the passkey

A passkey-capable device/browser is required (any modern phone or laptop).

## 6. Verify without logging in
The design-system showcase is **public**: `https://<your-vercel-domain>/design`
(light/dark toggle). Use it to confirm the deploy and theming render correctly.

---

### Why this can't be fully automated here
The assistant's Vercel tooling is read-only (runtime logs + review comments — no
deploy/env APIs), and it has no access to your Neon/Vercel accounts or secrets.
So provisioning the DB, setting secrets, and triggering the live deploy are yours
to run (or grant access for). Everything in the code is deploy-ready.
