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
build command `pnpm build` (auto-detected; `build` runs `prisma generate`).

Pushing the branch (or merging to `main`) triggers the deploy.

## 4. Create the schema + seed reference data (run once, locally)
```bash
export DATABASE_URL="<Neon DIRECT url>"
pnpm prisma db push     # creates all tables from prisma/schema.prisma
pnpm prisma db seed     # seeds L3 catalog + regional holidays (reference data)
```

## 5. Your test login (no email service required)
The app authenticates with **passkeys**; a one-time **admin code** bootstraps the
first account. Run against the deployed DB:
```bash
export DATABASE_URL="<Neon DIRECT url>"
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
