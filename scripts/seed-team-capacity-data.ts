/**
 * Team Capacity Data Seeding Script
 *
 * This script initializes:
 * 1. ResourceRateLookup table with 16 rate cards (4 regions × 4 designations)
 * 2. ProjectCostingConfig for all existing projects
 *
 * Run with: npx tsx scripts/seed-team-capacity-data.ts
 */

import { PrismaClient, WeekNumberingType, CostVisibilityLevel } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// RATE CARD DATA (from YTL Cement RP.xlsx)
// ============================================================================

const RATE_CARDS = [
  // ABMY (Malaysia) - MYR
  {
    regionCode: "ABMY",
    designation: "Principal",
    hourlyRate: 2000.0,
    localCurrency: "MYR",
    forexRate: 1.0,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABMY",
    designation: "Director",
    hourlyRate: 1600.0,
    localCurrency: "MYR",
    forexRate: 1.0,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABMY",
    designation: "Manager",
    hourlyRate: 1200.0,
    localCurrency: "MYR",
    forexRate: 1.0,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABMY",
    designation: "Consultant",
    hourlyRate: 800.0,
    localCurrency: "MYR",
    forexRate: 1.0,
    baseCurrency: "MYR",
  },

  // ABSG (Singapore) - SGD
  {
    regionCode: "ABSG",
    designation: "Principal",
    hourlyRate: 650.0,
    localCurrency: "SGD",
    forexRate: 3.25,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABSG",
    designation: "Director",
    hourlyRate: 520.0,
    localCurrency: "SGD",
    forexRate: 3.25,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABSG",
    designation: "Manager",
    hourlyRate: 390.0,
    localCurrency: "SGD",
    forexRate: 3.25,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABSG",
    designation: "Consultant",
    hourlyRate: 260.0,
    localCurrency: "SGD",
    forexRate: 3.25,
    baseCurrency: "MYR",
  },

  // ABVN (Vietnam) - VND
  {
    regionCode: "ABVN",
    designation: "Principal",
    hourlyRate: 12500000.0,
    localCurrency: "VND",
    forexRate: 0.0001605,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABVN",
    designation: "Director",
    hourlyRate: 10000000.0,
    localCurrency: "VND",
    forexRate: 0.0001605,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABVN",
    designation: "Manager",
    hourlyRate: 7500000.0,
    localCurrency: "VND",
    forexRate: 0.0001605,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABVN",
    designation: "Consultant",
    hourlyRate: 5000000.0,
    localCurrency: "VND",
    forexRate: 0.0001605,
    baseCurrency: "MYR",
  },

  // ABTH (Thailand) - THB
  {
    regionCode: "ABTH",
    designation: "Principal",
    hourlyRate: 15000.0,
    localCurrency: "THB",
    forexRate: 0.13,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABTH",
    designation: "Director",
    hourlyRate: 12000.0,
    localCurrency: "THB",
    forexRate: 0.13,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABTH",
    designation: "Manager",
    hourlyRate: 9000.0,
    localCurrency: "THB",
    forexRate: 0.13,
    baseCurrency: "MYR",
  },
  {
    regionCode: "ABTH",
    designation: "Consultant",
    hourlyRate: 6000.0,
    localCurrency: "THB",
    forexRate: 0.13,
    baseCurrency: "MYR",
  },
];

// ============================================================================
// DEFAULT COSTING CONFIG
// ============================================================================

const DEFAULT_COSTING_CONFIG = {
  realizationRatePercent: 0.43, // 43% from YTL Cement
  internalCostPercent: 0.35, // 35% of standard rate
  opeAccommodationPerDay: 150.0, // RM 150/night
  opeMealsPerDay: 50.0, // RM 50/day
  opeTransportPerDay: 100.0, // RM 100/day
  opeTotalDefaultPerDay: 500.0, // RM 500/day
  intercompanyMarkupPercent: 1.15, // 15% markup
  baseCurrency: "MYR",
  costVisibilityLevel: "FINANCE_ONLY" as CostVisibilityLevel,
};

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
