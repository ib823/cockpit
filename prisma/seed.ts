/**
 * Keystone - Database Seed Script
 *
 * Seeds:
 * 1. L3 Catalog: 12 LOBs + 158 L3 items from structured catalog
 * 2. Holidays: Regional calendars for MY, SG, VN
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { L3_SCOPE_ITEMS } from "../src/data/l3-catalog";

const prisma = new PrismaClient();

/**
 * Seed complete L3 Catalog with complexity metrics
 * Data source: /src/data/l3-catalog.ts + database L3 scope items document
 */
async function seedL3Catalog() {
  console.log("📚 Seeding L3 Catalog...");

  // Step 1: Seed LOBs
  await seedLOBs();

  // Step 2: Seed all L3 Items from catalog data
  await seedAllL3Items();

  console.log("✅ L3 Catalog seeded successfully");
}

/**
 * Seed 12 Lines of Business
 */
async function seedLOBs() {
  const lobs = [
    {
      lobName: "Finance",
      l3Count: 52,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/Finance",
    },
    {
      lobName: "Sourcing & Procurement",
      l3Count: 37,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/SourcingAndProcurement",
    },
    {
      lobName: "Sales",
      l3Count: 35,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/Sales",
    },
    {
      lobName: "Manufacturing",
      l3Count: 32,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/Manufacturing",
    },
    {
      lobName: "Quality Management",
      l3Count: 10,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/QualityManagement",
    },
    {
      lobName: "Asset Management",
      l3Count: 12,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/AssetManagement",
    },
    {
      lobName: "Service",
      l3Count: 15,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/Service",
    },
    {
      lobName: "Supply Chain",
      l3Count: 36,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/SupplyChain",
    },
    {
      lobName: "Project Management/Professional Services",
      l3Count: 19,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/ProjectManagement",
    },
    {
      lobName: "R&D/Engineering",
      l3Count: 12,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/RDEngineering",
    },
    {
      lobName: "GRC/Compliance",
      l3Count: 8,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/GRC",
    },
    {
      lobName: "Cross-Topics/Analytics/Group Reporting",
      l3Count: 25,
      releaseTag: "2508",
      navigatorSectionUrl: "https://me.sap.com/processnavigator/CrossTopics",
    },
  ];

  for (const lob of lobs) {
    await prisma.lob.upsert({
      where: { lobName: lob.lobName },
      update: lob,
      create: lob,
    });
  }

  console.log(`  ✓ Seeded ${lobs.length} LOBs`);
}

/**
 * Helper function to upsert L3 item with complexity and integration
 */
async function upsertL3Item(data: {
  lobName: string;
  module: string | null;
  l3Code: string;
  l3Name: string;
  processNavigatorUrl: string;
  formerCode: string | null;
  releaseTag: string;
  complexity: {
    defaultTier: string;
    coefficient: number | null;
    tierRationale: string;
    crossModuleTouches: string | null;
    localizationFlag: boolean;
    extensionRisk: string;
  };
  integration: {
    integrationPackageAvailable: string;
    testScriptExists: boolean;
  };
}) {
  const lob = await prisma.lob.findUnique({ where: { lobName: data.lobName } });
  if (!lob) throw new Error(`LOB not found: ${data.lobName}`);

  const l3Item = await prisma.l3ScopeItem.upsert({
    where: { l3Code: data.l3Code },
    update: {
      lobId: lob.id,
      module: data.module,
      l3Name: data.l3Name,
      processNavigatorUrl: data.processNavigatorUrl,
      formerCode: data.formerCode,
      releaseTag: data.releaseTag,
    },
    create: {
      lobId: lob.id,
      module: data.module,
      l3Code: data.l3Code,
      l3Name: data.l3Name,
      processNavigatorUrl: data.processNavigatorUrl,
      formerCode: data.formerCode,
      releaseTag: data.releaseTag,
    },
  });

  await prisma.complexityMetrics.upsert({
    where: { l3Id: l3Item.id },
    update: data.complexity,
    create: { l3Id: l3Item.id, ...data.complexity },
  });

  await prisma.integrationDetails.upsert({
    where: { l3Id: l3Item.id },
    update: data.integration,
    create: { l3Id: l3Item.id, ...data.integration },
  });
}

/**
 * Seed all L3 Items from catalog data (158 items)
 * Maps module names to LOB names for proper foreign key relationships
 */
async function seedAllL3Items() {
  const moduleToLOB: Record<string, string> = {
    "Asset Management": "Asset Management",
    "Cross-Topics/Analytics/Group Reporting": "Cross-Topics/Analytics/Group Reporting",
    Finance: "Finance",
    "GRC/Compliance": "GRC/Compliance",
    Manufacturing: "Manufacturing",
    "Project Management/Professional Services": "Project Management/Professional Services",
    "Quality Management": "Quality Management",
    "R&D/Engineering": "R&D/Engineering",
    Sales: "Sales",
    Service: "Service",
    "Sourcing & Procurement": "Sourcing & Procurement",
    "Supply Chain": "Supply Chain",
  };

  let count = 0;
  for (const item of L3_SCOPE_ITEMS) {
    const lobName = moduleToLOB[item.module] || item.module;

    await upsertL3Item({
      lobName,
      module: item.module,
      l3Code: item.code,
      l3Name: item.name,
      processNavigatorUrl: `https://me.sap.com/processnavigator/SolmanItems/${item.code}`,
      formerCode: null,
      releaseTag: "2508",
      complexity: {
        defaultTier: item.tier,
        coefficient: item.tier === "D" ? null : item.coefficient,
        tierRationale: item.description,
        crossModuleTouches: null,
        localizationFlag: false,
        extensionRisk: item.tier === "D" ? "High" : item.tier === "C" ? "Med" : "Low",
      },
      integration: {
        integrationPackageAvailable: item.tier === "D" ? "NA" : "Yes",
        testScriptExists: true,
      },
    });
    count++;
  }

  console.log(`  ✓ Seeded ${count} L3 items from catalog`);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // Phase 1: Seed L3 Catalog (158 items)
  // ============================================
  await seedL3Catalog();

  // ============================================
  // Phase 2: Seed Holidays
  // ============================================
  const holidays = [
    // Malaysia
    { name: "New Year", date: new Date("2025-01-01"), region: "ABMY" },
    { name: "Chinese New Year", date: new Date("2025-01-29"), region: "ABMY" },
    { name: "Chinese New Year", date: new Date("2025-01-30"), region: "ABMY" },
    { name: "Hari Raya Aidilfitri", date: new Date("2025-03-31"), region: "ABMY" },
    { name: "Hari Raya Aidilfitri", date: new Date("2025-04-01"), region: "ABMY" },
    { name: "Labour Day", date: new Date("2025-05-01"), region: "ABMY" },
    { name: "Wesak Day", date: new Date("2025-05-12"), region: "ABMY" },
    { name: "Agong Birthday", date: new Date("2025-06-07"), region: "ABMY" },
    { name: "Hari Raya Aidiladha", date: new Date("2025-06-07"), region: "ABMY" },
    { name: "Awal Muharram", date: new Date("2025-06-27"), region: "ABMY" },
    { name: "Merdeka Day", date: new Date("2025-08-31"), region: "ABMY" },
    { name: "Malaysia Day", date: new Date("2025-09-16"), region: "ABMY" },
    { name: "Prophet Muhammad Birthday", date: new Date("2025-09-05"), region: "ABMY" },
    { name: "Deepavali", date: new Date("2025-10-20"), region: "ABMY" },
    { name: "Christmas", date: new Date("2025-12-25"), region: "ABMY" },

    // Singapore
    { name: "New Year", date: new Date("2025-01-01"), region: "ABSG" },
    { name: "Chinese New Year", date: new Date("2025-01-29"), region: "ABSG" },
    { name: "Chinese New Year", date: new Date("2025-01-30"), region: "ABSG" },
    { name: "Good Friday", date: new Date("2025-04-18"), region: "ABSG" },
    { name: "Hari Raya Puasa", date: new Date("2025-03-31"), region: "ABSG" },
    { name: "Labour Day", date: new Date("2025-05-01"), region: "ABSG" },
    { name: "Vesak Day", date: new Date("2025-05-12"), region: "ABSG" },
    { name: "Hari Raya Haji", date: new Date("2025-06-07"), region: "ABSG" },
    { name: "National Day", date: new Date("2025-08-09"), region: "ABSG" },
    { name: "Deepavali", date: new Date("2025-10-20"), region: "ABSG" },
    { name: "Christmas", date: new Date("2025-12-25"), region: "ABSG" },

    // Vietnam
    { name: "New Year", date: new Date("2025-01-01"), region: "ABVN" },
    { name: "Tet Holiday", date: new Date("2025-01-28"), region: "ABVN" },
    { name: "Tet Holiday", date: new Date("2025-01-29"), region: "ABVN" },
    { name: "Tet Holiday", date: new Date("2025-01-30"), region: "ABVN" },
    { name: "Tet Holiday", date: new Date("2025-01-31"), region: "ABVN" },
    { name: "Hung Kings Festival", date: new Date("2025-04-18"), region: "ABVN" },
    { name: "Reunification Day", date: new Date("2025-04-30"), region: "ABVN" },
    { name: "Labour Day", date: new Date("2025-05-01"), region: "ABVN" },
    { name: "National Day", date: new Date("2025-09-02"), region: "ABVN" },
  ];

  for (const holiday of holidays) {
    await prisma.holidays.upsert({
      where: { date_region: { date: holiday.date, region: holiday.region } },
      update: {},
      create: {
        id: createId(),
        ...holiday,
      },
    });
  }

  console.log(`✅ Seeded ${holidays.length} holidays`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
