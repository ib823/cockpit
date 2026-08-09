-- Neutralise the commercial defaults on ProjectCostingConfig.
--
-- The column defaults created by 0_init were the organisation's real
-- realization rate, internal-cost percentage, intercompany markup and daily
-- per-diems. This repository is public, so those figures are removed from the
-- schema and replaced with neutral ones:
--
--   realization 1.0    = no discount   (visibly unconfigured, never a plausible
--   markup      1.0    = no markup      figure someone might act on)
--   internal    0.0    = not recorded
--   per-diems   0.00   = not recorded
--
-- Real values are loaded per organisation from a rate-card file kept outside
-- the repository — see docs/RATE_CARD.md and scripts/seed-team-capacity-data.ts.
--
-- Defaults only: rows already carrying configured values are untouched, so no
-- existing project's costing changes.
--
-- 0_init itself is deliberately NOT edited: it is a baselined migration and
-- rewriting it would change its checksum and block `migrate deploy`. Its
-- historical text still contains the old figures, which is one of the things a
-- git-history scrub has to cover.

ALTER TABLE "ProjectCostingConfig"
  ALTER COLUMN "realizationRatePercent" SET DEFAULT 1.0000,
  ALTER COLUMN "internalCostPercent" SET DEFAULT 0.0000,
  ALTER COLUMN "opeAccommodationPerDay" SET DEFAULT 0.00,
  ALTER COLUMN "opeMealsPerDay" SET DEFAULT 0.00,
  ALTER COLUMN "opeTransportPerDay" SET DEFAULT 0.00,
  ALTER COLUMN "opeTotalDefaultPerDay" SET DEFAULT 0.00,
  ALTER COLUMN "intercompanyMarkupPercent" SET DEFAULT 1.0000;
