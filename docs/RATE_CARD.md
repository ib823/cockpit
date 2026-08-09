# Rate card and costing configuration

**No rates live in this repository.** It is public, and billing rates,
realization, internal-cost percentages and per-diems are commercially
confidential. The application reads them from the database; the database is
loaded from a file you keep outside version control.

## Where rates live at runtime

| Layer | Source |
|---|---|
| Server costing (`lib/team-capacity/costing.ts`) | `ResourceRateLookup` table |
| Rates API (`/api/gantt-tool/team-capacity/rates`) | `ResourceRateLookup` table |
| Client editor (`useRateLookupCache`) | that API |
| Per-project costing settings | `ProjectCostingConfig` row |

There is no code-side fallback by design. A fallback is a copy, and a copy of a
rate card in a public repository is the leak. Against an unseeded database the
rate card is simply empty: affected resources come back in `unratedResources`
and are shown as unrated rather than costed at a guess — a plausible-looking
invented rate is worse than a visible gap.

Realization defaults to `1` (no discount) wherever a project has none
configured. That is visibly wrong rather than quietly wrong, so an
unconfigured project cannot silently under-report revenue.

## Loading your rate card

```bash
cp rate-card.example.json rate-card.local.json
# edit rate-card.local.json with your real figures
npx tsx scripts/seed-team-capacity-data.ts
```

`rate-card.local.json` is gitignored. To keep the file somewhere else:

```bash
RATE_CARD_FILE=/secure/path/rate-card.json npx tsx scripts/seed-team-capacity-data.ts
```

The seed is create-only: it skips rows that already exist, so re-running it
never overwrites a rate someone has since adjusted in the database. To change a
rate after seeding, update `ResourceRateLookup` directly — no code change and
no redeploy.

## File schema

```jsonc
{
  "rateCards": [
    {
      "regionCode": "ABMY",        // region key used by resources
      "designation": "principal",  // one of the DESIGNATIONS in lib/team-capacity/rate-card.ts
      "hourlyRate": 100,           // PER HOUR, in localCurrency (day rate = × 8)
      "localCurrency": "MYR",
      "forexRate": 1,              // multiplier: localCurrency → baseCurrency
      "baseCurrency": "MYR"
    }
  ],
  "costingConfig": {
    "realizationRatePercent": 1,      // standard → commercial discount
    "internalCostPercent": 0.5,       // internal cost as a share of standard
    "opeAccommodationPerDay": 0,      // out-of-pocket expenses, per day
    "opeMealsPerDay": 0,
    "opeTransportPerDay": 0,
    "opeTotalDefaultPerDay": 0,
    "intercompanyMarkupPercent": 1,   // 1 = no markup; 1.15 = 15%
    "baseCurrency": "MYR",
    "costVisibilityLevel": "FINANCE_ONLY"
  }
}
```

The rate card may be sparse — not every designation needs a rate in every
region. Missing combinations are reported as unrated, not guessed.

## If you are forking this repository

Nothing here is pre-filled, so a fresh install has no rates until you seed one.
That is intentional. Do not commit your filled-in file, and do not reintroduce
a "sensible default" rate card in code: that is exactly the shape of the leak
this arrangement removes.
