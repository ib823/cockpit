/**
 * Team Capacity Data Seeding Script
 *
 * Loads the rate card and the default costing configuration into the database
 * from a file that lives OUTSIDE this repository.
 *
 * Rates, realization, internal-cost percentages and per-diems are commercially
 * confidential and this repository is public, so none of them are committed
 * here. Point the script at your own file:
 *
 *     RATE_CARD_FILE=/secure/path/rate-card.json npx tsx scripts/seed-team-capacity-data.ts
 *
 * It defaults to `rate-card.local.json` in the repository root, which is
 * gitignored. `docs/RATE_CARD.md` documents the schema and
 * `rate-card.example.json` is a runnable, obviously-fake sample.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, WeekNumberingType, CostVisibilityLevel } from "@prisma/client";

const prisma = new PrismaClient();

interface RateCardRow {
  regionCode: string;
  designation: string;
  hourlyRate: number;
  localCurrency: string;
  forexRate: number;
  baseCurrency: string;
}

interface RateCardFile {
  rateCards: RateCardRow[];
  costingConfig: {
    realizationRatePercent: number;
    internalCostPercent: number;
    opeAccommodationPerDay: number;
    opeMealsPerDay: number;
    opeTransportPerDay: number;
    opeTotalDefaultPerDay: number;
    intercompanyMarkupPercent: number;
    baseCurrency: string;
    costVisibilityLevel: CostVisibilityLevel;
  };
}

function loadRateCardFile(): RateCardFile {
  const path = resolve(process.env.RATE_CARD_FILE ?? "rate-card.local.json");

  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    // Failing loudly beats seeding placeholder money into a real database.
    throw new Error(
      `No rate-card file at ${path}.\n` +
        `Rates are confidential and are not committed to this repository.\n` +
        `Copy rate-card.example.json to rate-card.local.json and fill in your own ` +
        `figures, or set RATE_CARD_FILE to point at yours. See docs/RATE_CARD.md.`
    );
  }

  const parsed = JSON.parse(raw) as RateCardFile;
  if (!Array.isArray(parsed.rateCards) || !parsed.costingConfig) {
    throw new Error(
      `${path} is missing "rateCards" or "costingConfig" — see docs/RATE_CARD.md.`
    );
  }
  return parsed;
}

const RATE_CARD_FILE = loadRateCardFile();
const RATE_CARDS = RATE_CARD_FILE.rateCards;
const DEFAULT_COSTING_CONFIG = RATE_CARD_FILE.costingConfig;

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedRateCards() {
  console.log("🔄 Seeding ResourceRateLookup table...");

  const effectiveFrom = new Date("2025-01-01");

  let created = 0;
  let skipped = 0;

  for (const rateCard of RATE_CARDS) {
    const existing = await prisma.resourceRateLookup.findFirst({
      where: {
        regionCode: rateCard.regionCode,
        designation: rateCard.designation,
        effectiveFrom: effectiveFrom,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.resourceRateLookup.create({
      data: {
        ...rateCard,
        effectiveFrom,
        effectiveTo: null, // Current active rate
        updatedBy: "SYSTEM_SEED",
      },
    });

    created++;
  }

  console.log(
    `✅ Rate cards seeded: ${created} created, ${skipped} skipped (already exist)`
  );
}

async function initializeProjectCostingConfigs() {
  console.log("🔄 Initializing ProjectCostingConfig for existing projects...");

  const projects = await prisma.ganttProject.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const project of projects) {
    const existing = await prisma.projectCostingConfig.findUnique({
      where: {
        projectId: project.id,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.projectCostingConfig.create({
      data: {
        projectId: project.id,
        ...DEFAULT_COSTING_CONFIG,
        createdBy: "SYSTEM_SEED",
      },
    });

    created++;
  }

  console.log(
    `✅ Project costing configs initialized: ${created} created, ${skipped} skipped (already exist)`
  );
  console.log(`   Total projects: ${projects.length}`);
}

async function verifySeededData() {
  console.log("\n🔍 Verifying seeded data...");

  const rateCardCount = await prisma.resourceRateLookup.count();
  const projectCostingConfigCount = await prisma.projectCostingConfig.count();
  const activeProjectCount = await prisma.ganttProject.count({
    where: { deletedAt: null },
  });

  console.log(`   Rate cards: ${rateCardCount}`);
  console.log(`   Project costing configs: ${projectCostingConfigCount}`);
  console.log(`   Active projects: ${activeProjectCount}`);

  if (rateCardCount < 16) {
    console.warn(
      `⚠️  WARNING: Expected 16 rate cards, found ${rateCardCount}`
    );
  }

  if (projectCostingConfigCount < activeProjectCount) {
    console.warn(
      `⚠️  WARNING: Some projects missing costing config (${activeProjectCount - projectCostingConfigCount} projects)`
    );
  }

  // Sample rate card query
  const sampleRate = await prisma.resourceRateLookup.findFirst({
    where: {
      regionCode: "ABMY",
      designation: "Principal",
    },
  });

  if (sampleRate) {
    console.log(`\n   Sample rate card (ABMY Principal):`);
    console.log(
      `     Hourly: ${sampleRate.localCurrency} ${sampleRate.hourlyRate}`
    );
    console.log(
      `     Daily (8h): ${sampleRate.localCurrency} ${Number(sampleRate.hourlyRate) * 8}`
    );
    console.log(
      `     In MYR: RM ${Number(sampleRate.hourlyRate) * Number(sampleRate.forexRate)}/hour`
    );
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("🚀 Team Capacity Data Seeding Script\n");

  try {
    // Seed rate cards
    await seedRateCards();

    // Initialize project costing configs
    await initializeProjectCostingConfigs();

    // Verify data
    await verifySeededData();

    console.log("\n✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
