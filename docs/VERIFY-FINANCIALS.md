# Deploy & Verify — Gantt Financials

> Branch: `claude/gallant-johnson-g3qgL`. Verifies the costing/Financials work
> (forex, breakdowns, rate consolidation, intercompany markup, authoritative
> rate card) end-to-end on a real database — the one thing unit tests can't prove.

## 1. Get a preview deployment

This is a Vercel app (`vercel.json`) with GitHub Actions CI that runs on **PRs to
`main`**. Either:
- **Open a PR to `main`** → triggers CI + a Vercel preview deployment, or
- grab the **per-branch Vercel preview** if your Vercel project auto-deploys branches.

**Preview env vars** (Vercel → Project → Settings → Environment Variables, "Preview"):
`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (the
preview URL), `TOTP_ENCRYPTION_KEY`, `JWT_SECRET_KEY`, `WEBAUTHN_RP_ID`,
`WEBAUTHN_ORIGIN`. To show the Financials tab without wiring a FINANCE/ADMIN user,
add (preview only): `NEXT_PUBLIC_DEV_ENABLE_FINANCIALS=true`.

## 2. Apply the schema change — REQUIRED

The branch adds `ProjectCostingConfig.intercompanyHomeRegion`. There are no
migration files (this repo uses `db push`), and the Vercel build only runs
`prisma generate`. So push the schema to the preview DB once:

```bash
DATABASE_URL='<preview-db-url>' npx prisma db push
```

(Additive, nullable column — safe; existing rows default to NULL = markup off.)

## 3. Seed / refresh the rate cards

The seed is **create-only** (it skips existing rows).

```bash
# Fresh DB — loads the 27 authoritative rate cards + default costing config:
DATABASE_URL='<preview-db-url>' npx tsx scripts/seed-team-capacity-data.ts
```

For a DB already seeded with the old placeholder rates, update `ResourceRateLookup`
directly (or clear those rows and re-seed). Note: the app's canonical fallback
already serves the new values for any rows the DB lacks, so missing rows are fine.

## 4. Verify in the UI

1. Log in; open a project that has resources **with weekly allocations** (costing
   reads `weeklyAllocations`, not just the Gantt resource list).
2. **Financials tab → Recalculate.** GSR / NSR / Gross Margin should populate.
3. **Costing sanity checks** (defaults RR 43%, internal 35%, no intercompany):

   | Resource | Mandays | Expect (MYR) |
   |---|---|---|
   | **ABMY** Principal | 10 | GSR **160,000** · NSR **68,800** · internal **56,000** · margin **12,800** (18.6%) |
   | **ABSG** Principal | 10 | GSR **≈345,117** (112,000 SGD × forex 3.0814) — proves **forex + ×8 basis** |

4. **Breakdowns:** "By Region" / "By Designation" now populate (were empty stubs).
5. **Intercompany markup:** Costing Config → set **Home Region = ABMY**, markup
   15%, save → an **ABSG** resource's internal cost rises 15% and margin drops; set
   Home Region = **None** → reverts. (This is the user-controlled toggle.)
6. **RBAC:** a MANAGER sees GSR/NSR but **not** margins/internal cost; a USER sees
   no Financials tab at all.
7. **Unrated resources:** a resource whose region/designation has no rate card
   (e.g. an ABSG `analyst`, or a non-subcontractor `subcontractor`) is skipped and
   reported in `unratedResources` rather than breaking the calculation.

## 5. Known data caveats to confirm with Finance

- **VND / THB forex** in the seed are flagged *unofficial* (Yahoo Finance) — set
  authoritative values in `ResourceRateLookup.forexRate`.
- **Gaps:** no `subcontractor` rate-card row (they use `SubcontractorRate`); ABSG
  has no `analyst` grade. Add to the rate card if those combinations are needed.
