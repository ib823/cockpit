/**
 * Team Capacity Test Helpers
 * Utility functions for testing Team Capacity API endpoints
 */

import { PrismaClient, WeekNumberingType, CostVisibilityLevel } from "@prisma/client";
import { randomUUID } from "crypto";

// Use separate test database
const DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set");
}

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

// ============================================================================
// Request Helpers
// ============================================================================

/**
 * Create mock Next.js request
 */
export function createMockRequest(options: {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}): Request {
  const headers = new Headers(options.headers || {});
  headers.set("content-type", "application/json");

  return new Request(options.url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Parse JSON response
 */
export async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ============================================================================
// Test Fixture Creators
// ============================================================================

/**
 * Create test user with OWNER role for project access
 */
export async function createTestUser(options?: {
  email?: string;
  role?: "USER" | "ADMIN" | "MANAGER";
  name?: string;
}) {
  const userId = `test-user-${randomUUID()}`;
  const email = options?.email || `test-${Date.now()}@example.com`;

  const user = await testPrisma.users.create({
    data: {
      id: userId,
      email,
      name: options?.name || email.split("@")[0],
      role: options?.role || "USER",
      accessExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      exception: false,
      updatedAt: new Date(),
    },
  });

  return user;
}

/**
 * Create test project with costing config
 */
export async function createTestProject(options?: {
  name?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  withCostingConfig?: boolean;
}) {
  const projectId = `test-proj-${randomUUID()}`;
  const startDate = options?.startDate || "2025-01-01";
  const endDate = options?.endDate || "2025-12-31";

  const project = await testPrisma.ganttProject.create({
    data: {
      id: projectId,
      name: options?.name || `Test Project ${Date.now()}`,
      userId: options?.userId || "test-user-default",
      description: "Test project for Team Capacity integration tests",
      startDate: new Date(startDate),
      viewSettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create costing config if requested
  if (options?.withCostingConfig) {
    await testPrisma.projectCostingConfig.create({
      data: {
        projectId: project.id,
        realizationRatePercent: 0.43,
        internalCostPercent: 0.35,
        opeAccommodationPerDay: 150.0,
        opeMealsPerDay: 50.0,
        opeTransportPerDay: 100.0,
        opeTotalDefaultPerDay: 500.0,
        intercompanyMarkupPercent: 1.15,
        baseCurrency: "MYR",
        costVisibilityLevel: CostVisibilityLevel.FINANCE_ONLY,
        createdBy: "SYSTEM_TEST",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return project;
}

/**
 * Create test resource
 */
export async function createTestResource(options?: {
  projectId?: string;
  name?: string;
  category?: string;
  description?: string;
  designation?: string;
  regionCode?: string;
}) {
  const resourceId = `test-res-${randomUUID()}`;

  const resource = await testPrisma.ganttResource.create({
    data: {
      id: resourceId,
      projectId: options?.projectId || "test-project-default",
      name: options?.name || `Test Resource ${Date.now()}`,
      category: options?.category || "Human Resource",
      description: options?.description || "Test resource for Team Capacity integration tests",
      designation: options?.designation || "Manager",
      regionCode: options?.regionCode || "ABMY",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return resource;
}

/**
 * Create test weekly allocation
 */
export async function createTestAllocation(options: {
  projectId: string;
  resourceId: string;
  weekStartDate: string;
  mandays?: number;
  allocationPercent?: number;
  weekNumberingType?: WeekNumberingType;
  weekNumber?: number;
}) {
  const allocationId = `test-alloc-${randomUUID()}`;

  // Calculate mandays from percentage if not provided
  const mandays = options.mandays ?? (options.allocationPercent ? (options.allocationPercent / 100) * 5 : 2.5);
  const allocationPercent = Math.round(options.allocationPercent ?? ((mandays / 5) * 100));

  // Calculate weekEndDate (6 days after weekStartDate for Mon-Sun week)
  const startDate = new Date(options.weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  // Generate weekIdentifier in ISO format (e.g., "2025-W03")
  const year = startDate.getFullYear();
  const weekNum = options.weekNumber || 1;
  const weekIdentifier = `${year}-W${String(weekNum).padStart(2, "0")}`;

  // Calculate workingDays from allocationPercent
  const workingDays = (allocationPercent / 100) * 5;

  const allocation = await testPrisma.resourceWeeklyAllocation.create({
    data: {
      id: allocationId,
      projectId: options.projectId,
      resourceId: options.resourceId,
      weekIdentifier,
      weekStartDate: startDate,
      weekEndDate: endDate,
      mandays,
      allocationPercent,
      workingDays,
      weekNumberingType: options.weekNumberingType || WeekNumberingType.PROJECT_RELATIVE,
      weekNumber: options.weekNumber || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return allocation;
}

/**
 * Create test rate card
 */
export async function createTestRateCard(options: {
  regionCode: string;
  designation: string;
  hourlyRate: number;
  localCurrency?: string;
  forexRate?: number;
  baseCurrency?: string;
}) {
  const rateCardId = `test-rate-${randomUUID()}`;

  const rateCard = await testPrisma.resourceRateLookup.create({
    data: {
      id: rateCardId,
      regionCode: options.regionCode,
      designation: options.designation,
      hourlyRate: options.hourlyRate,
      localCurrency: options.localCurrency || "MYR",
      forexRate: options.forexRate || 1.0,
      baseCurrency: options.baseCurrency || "MYR",
      effectiveFrom: new Date("2025-01-01"),
      effectiveTo: null,
      updatedBy: "SYSTEM_TEST",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return rateCard;
}

/**
 * Create full test scenario with project, resources, and allocations
 */
export async function createTestScenario(options?: {
  projectName?: string;
  resourceCount?: number;
  allocationCount?: number;
}) {
  const user = await createTestUser({ role: "USER" });
  const project = await createTestProject({
    name: options?.projectName,
    userId: user.id,
    withCostingConfig: true,
  });

  const resources = [];
  const allocations = [];

  const resourceCount = options?.resourceCount || 2;
  const allocationCount = options?.allocationCount || 4;

  // Create resources
  for (let i = 0; i < resourceCount; i++) {
    const resource = await createTestResource({
      projectId: project.id,
      name: `Test Resource ${i + 1}`,
      designation: i % 2 === 0 ? "Manager" : "Consultant",
      regionCode: "ABMY",
    });
    resources.push(resource);

    // Create allocations for each resource
    for (let j = 0; j < allocationCount; j++) {
      const weekStartDate = `2025-01-${String(8 + j * 7).padStart(2, "0")}`;
      const allocation = await createTestAllocation({
        projectId: project.id,
        resourceId: resource.id,
        weekStartDate,
        mandays: 2.5,
        weekNumberingType: WeekNumberingType.PROJECT_RELATIVE,
        weekNumber: j + 1,
      });
      allocations.push(allocation);
    }
  }

  return {
    user,
    project,
    resources,
    allocations,
  };
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up Team Capacity test data
 */
export async function cleanupTeamCapacityData() {
  // Delete in order of foreign key dependencies
  await testPrisma.resourceWeeklyAllocation.deleteMany({
    where: {
      OR: [
        { projectId: { startsWith: "test-" } },
        { resourceId: { startsWith: "test-" } },
      ],
    },
  });

  await testPrisma.ganttResource.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "test-" } },
        { projectId: { startsWith: "test-" } },
      ],
    },
  });

  await testPrisma.projectCostingConfig.deleteMany({
    where: {
      projectId: { startsWith: "test-" },
    },
  });

  await testPrisma.ganttProject.deleteMany({
    where: {
      id: { startsWith: "test-" },
    },
  });

  await testPrisma.resourceRateLookup.deleteMany({
    where: {
      id: { startsWith: "test-" },
    },
  });

  await testPrisma.users.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "test-user-" } },
        { email: { contains: "@example.com" } },
      ],
    },
  });
}

/**
 * Setup test database before all tests
 */
export async function setupTeamCapacityTests() {
  await cleanupTeamCapacityData();

  // Ensure at least one rate card exists for testing
  const existingRate = await testPrisma.resourceRateLookup.findFirst({
    where: {
      regionCode: "ABMY",
      designation: "Manager",
    },
  });

  if (!existingRate) {
    await createTestRateCard({
      regionCode: "ABMY",
      designation: "Manager",
      hourlyRate: 1200.0,
      localCurrency: "MYR",
      forexRate: 1.0,
      baseCurrency: "MYR",
    });

    await createTestRateCard({
      regionCode: "ABMY",
      designation: "Consultant",
      hourlyRate: 800.0,
      localCurrency: "MYR",
      forexRate: 1.0,
      baseCurrency: "MYR",
    });
  }
}

/**
 * Teardown test database after all tests
 */
export async function teardownTeamCapacityTests() {
  await cleanupTeamCapacityData();
  await testPrisma.$disconnect();
}

// ============================================================================
// Mock Session Helper
// ============================================================================

/**
 * Mock getServerSession to bypass authentication in tests
 * Returns a mock session with specified user role
 */
export function createMockSession(options?: {
  userId?: string;
  email?: string;
  role?: "USER" | "ADMIN" | "MANAGER";
}) {
  return {
    user: {
      id: options?.userId || "test-user-mock",
      email: options?.email || "test@example.com",
      role: options?.role || "USER",
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
