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
import { canonicalRateRows } from "../src/lib/team-capacity/rate-card-data";

const prisma = new PrismaClient();

// ============================================================================
// RATE CARD DATA (from YTL Cement RP.xlsx)
// ============================================================================

// Rate cards come from the canonical baseline (single source of truth, shared
// with the rates API and the client fallback). Adjust rates in the DB after
// seeding, or update the baseline in src/lib/team-capacity/rate-card-data.ts.
const RATE_CARDS = canonicalRateRows();

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
