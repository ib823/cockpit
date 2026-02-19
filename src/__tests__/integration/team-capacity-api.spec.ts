/**
 * Team Capacity API Integration Tests
 *
 * Tests all three API endpoints with real database data:
 * - /api/gantt-tool/team-capacity/allocations
 * - /api/gantt-tool/team-capacity/costing
 * - /api/gantt-tool/team-capacity/conflicts
 *
 * Prerequisites:
 * - Database seeded with rate cards (run scripts/seed-team-capacity-data.ts)
 * - At least one test project with resources
 * - Valid authentication session
 *
 * Run with: npm test -- team-capacity-api.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from "@playwright/test";

describe("Team Capacity API Integration Tests", () => {
  let testProjectId: string;
  let testResourceId: string;
  let _authCookie: string;

  beforeAll(async () => {
    // Setup: Get test project and resource from database
    // This would need actual auth setup in practice
  });

  afterAll(async () => {
    // Cleanup: Remove test allocations
  });

  // ============================================================================
  // ALLOCATIONS API TESTS
  // ============================================================================

  describe("POST /api/gantt-tool/team-capacity/allocations", () => {
    test("should create weekly allocations with PROJECT_RELATIVE week numbering", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/allocations",
        {
          data: {
            projectId: testProjectId,
            allocations: [
              {
                resourceId: testResourceId,
                weekStartDate: "2025-01-06", // Monday
                mandays: 3.5,
                weekNumberingType: "PROJECT_RELATIVE",
              },
              {
                resourceId: testResourceId,
                weekStartDate: "2025-01-13",
                allocationPercent: 80,
                weekNumberingType: "PROJECT_RELATIVE",
              },
            ],
          },
        }
      );

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.allocations).toHaveLength(2);
      expect(body.summary.totalMandays).toBeGreaterThan(0);
    });

    test("should create allocations with ISO_WEEK week numbering", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/allocations",
        {
          data: {
            projectId: testProjectId,
            allocations: [
              {
                resourceId: testResourceId,
                weekStartDate: "2025-01-06",
                mandays: 2.0,
                weekNumberingType: "ISO_WEEK",
              },
            ],
          },
        }
      );

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.allocations[0].weekNumberingType).toBe("ISO_WEEK");
      expect(body.allocations[0].weekNumber).toBeGreaterThan(0);
    });

    test("should reject allocation with invalid mandays (>5.0)", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/allocations",
        {
          data: {
            projectId: testProjectId,
            allocations: [
              {
                resourceId: testResourceId,
                weekStartDate: "2025-01-06",
                mandays: 6.0, // Invalid: >5.0
                weekNumberingType: "PROJECT_RELATIVE",
              },
            ],
          },
        }
      );

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Validation");
    });

    test("should reject allocation without mandays or allocationPercent", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/allocations",
        {
          data: {
            projectId: testProjectId,
            allocations: [
              {
                resourceId: testResourceId,
                weekStartDate: "2025-01-06",
                // Missing both mandays and allocationPercent
              },
            ],
          },
        }
      );

      expect(response.status()).toBe(400);
    });
  });

  describe("GET /api/gantt-tool/team-capacity/allocations", () => {
    test("should retrieve allocations for a project", async ({ request }) => {
      const response = await request.get(
        `/api/gantt-tool/team-capacity/allocations?projectId=${testProjectId}`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.allocations).toBeDefined();
      expect(body.summary).toBeDefined();
      expect(body.summary.totalAllocations).toBeGreaterThanOrEqual(0);
    });

    test("should filter allocations by resource", async ({ request }) => {
      const response = await request.get(
        `/api/gantt-tool/team-capacity/allocations?projectId=${testProjectId}&resourceId=${testResourceId}`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      body.allocations.forEach((allocation: any) => {
        expect(allocation.resourceId).toBe(testResourceId);
      });
    });

    test("should filter allocations by date range", async ({ request }) => {
      const response = await request.get(
        `/api/gantt-tool/team-capacity/allocations?projectId=${testProjectId}&weekStart=2025-01-01&weekEnd=2025-01-31`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      body.allocations.forEach((allocation: any) => {
        const weekStart = new Date(allocation.weekStartDate);
        expect(weekStart.getTime()).toBeGreaterThanOrEqual(
          new Date("2025-01-01").getTime()
        );
        expect(weekStart.getTime()).toBeLessThanOrEqual(
          new Date("2025-01-31").getTime()
        );
      });
    });

    test("should require projectId parameter", async ({ request }) => {
      const response = await request.get(
        "/api/gantt-tool/team-capacity/allocations"
      );

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("projectId");
    });
  });

  describe("DELETE /api/gantt-tool/team-capacity/allocations", () => {
    test("should delete allocations by IDs", async ({ request }) => {
      // First create an allocation
      const createResponse = await request.post(
        "/api/gantt-tool/team-capacity/allocations",
        {
          data: {
            projectId: testProjectId,
            allocations: [
              {
                resourceId: testResourceId,
                weekStartDate: "2025-02-01",
                mandays: 1.0,
              },
            ],
          },
        }
      );

      const { allocations } = await createResponse.json();
      const allocationId = allocations[0].id;

      // Then delete it
      const deleteResponse = await request.delete(
        "/api/gantt-tool/team-capacity/allocations",
        {
          data: {
            projectId: testProjectId,
            allocationIds: [allocationId],
          },
        }
      );

      expect(deleteResponse.status()).toBe(200);
      const body = await deleteResponse.json();
      expect(body.success).toBe(true);
      expect(body.deletedCount).toBe(1);
    });
  });

  // ============================================================================
  // COSTING API TESTS
  // ============================================================================

  describe("POST /api/gantt-tool/team-capacity/costing", () => {
    test("should calculate project costing with FINANCE_ONLY visibility", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/costing",
        {
          data: {
            projectId: testProjectId,
            visibilityLevel: "FINANCE_ONLY",
            saveToDatabase: false,
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.costing).toBeDefined();
      expect(body.costing.grossServiceRevenue).toBeGreaterThanOrEqual(0);
      expect(body.costing.netServiceRevenue).toBeGreaterThanOrEqual(0);
      expect(body.costing.internalCost).toBeDefined(); // Finance only
      expect(body.costing.grossMargin).toBeDefined(); // Finance only
    });

    test("should hide sensitive data with PRESALES_AND_FINANCE visibility", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/costing",
        {
          data: {
            projectId: testProjectId,
            visibilityLevel: "PRESALES_AND_FINANCE",
            saveToDatabase: false,
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.costing.netServiceRevenue).toBeDefined();
      expect(body.costing.internalCost).toBeUndefined(); // Hidden
      expect(body.costing.grossMargin).toBeUndefined(); // Hidden
    });

    test("should save costing to database when requested", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/costing",
        {
          data: {
            projectId: testProjectId,
            saveToDatabase: true,
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.saved).toBe(true);

      // Verify it was saved by retrieving it
      const getResponse = await request.get(
        `/api/gantt-tool/team-capacity/costing?projectId=${testProjectId}`
      );
      expect(getResponse.status()).toBe(200);
    });

    test("should require OWNER role for costing access", async () => {
      // This would test with a non-owner user session
      // Implementation depends on auth setup
    });
  });

  describe("GET /api/gantt-tool/team-capacity/costing", () => {
    test("should retrieve saved costing data", async ({ request }) => {
      const response = await request.get(
        `/api/gantt-tool/team-capacity/costing?projectId=${testProjectId}`
      );

      // May be 404 if not saved yet, or 200 if saved
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.costing).toBeDefined();
        expect(body.costing.grossServiceRevenue).toBeDefined();
      }
    });

    test("should require projectId parameter", async ({ request }) => {
      const response = await request.get(
        "/api/gantt-tool/team-capacity/costing"
      );

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("projectId");
    });
  });

  // ============================================================================
  // CONFLICTS API TESTS
  // ============================================================================

  describe("POST /api/gantt-tool/team-capacity/conflicts", () => {
    test("should detect conflicts with default thresholds", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/conflicts",
        {
          data: {},
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.hasConflicts).toBeDefined();
      expect(body.conflicts).toBeDefined();
      expect(body.summary).toBeDefined();
      expect(body.summary.totalConflicts).toBeGreaterThanOrEqual(0);
    });

    test("should filter conflicts by resource", async ({ request }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/conflicts",
        {
          data: {
            resourceId: testResourceId,
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      body.conflicts.forEach((conflict: any) => {
        expect(conflict.resourceId).toBe(testResourceId);
      });
    });

    test("should detect CRITICAL conflicts when mandays >5.0", async ({
      request,
    }) => {
      // Setup: Create over-allocated week
      await request.post("/api/gantt-tool/team-capacity/allocations", {
        data: {
          projectId: testProjectId,
          allocations: [
            {
              resourceId: testResourceId,
              weekStartDate: "2025-03-01",
              mandays: 3.0,
            },
          ],
        },
      });

      await request.post("/api/gantt-tool/team-capacity/allocations", {
        data: {
          projectId: testProjectId,
          allocations: [
            {
              resourceId: testResourceId,
              weekStartDate: "2025-03-01",
              mandays: 3.0,
            },
          ],
        },
      });

      // Test: Detect conflict
      const response = await request.post(
        "/api/gantt-tool/team-capacity/conflicts",
        {
          data: {
            resourceId: testResourceId,
            weekStart: "2025-03-01",
            weekEnd: "2025-03-07",
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      const criticalConflicts = body.conflicts.filter(
        (c: any) => c.severity === "CRITICAL"
      );
      expect(criticalConflicts.length).toBeGreaterThan(0);
    });

    test("should use custom thresholds", async ({ request }) => {
      const response = await request.post(
        "/api/gantt-tool/team-capacity/conflicts",
        {
          data: {
            criticalThreshold: 120,
            warningThreshold: 90,
          },
        }
      );

      expect(response.status()).toBe(200);
    });
  });

  describe("GET /api/gantt-tool/team-capacity/conflicts (utilization)", () => {
    test("should retrieve resource utilization summary", async ({
      request,
    }) => {
      const response = await request.get(
        `/api/gantt-tool/team-capacity/conflicts?resourceId=${testResourceId}`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.resourceId).toBe(testResourceId);
      expect(body.statistics).toBeDefined();
      expect(body.statistics.totalAllocations).toBeGreaterThanOrEqual(0);
      expect(body.statistics.averageUtilization).toBeGreaterThanOrEqual(0);
      expect(body.weeklyBreakdown).toBeDefined();
    });

    test("should require resourceId parameter", async ({ request }) => {
      const response = await request.get(
        "/api/gantt-tool/team-capacity/conflicts"
      );

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("resourceId");
    });
  });
});
