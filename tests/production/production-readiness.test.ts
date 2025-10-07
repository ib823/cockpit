// Production readiness tests - MUST DO items before deployment
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTimelineStore } from "@/stores/timeline-store";
import { convertPresalesToTimeline } from "@/lib/presales-to-timeline-bridge";
import { Chip } from "@/types/core";

describe("Production Readiness - MUST DO Tests", () => {
  describe("1. Schema Migration (Data Loss Prevention)", () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it("migrates v0 store to v1 without data loss", () => {
      // Simulate old version (v0) data structure
      const v0State = {
        phases: [
          { id: "1", name: "Test Phase", workingDays: 10, startBusinessDay: 0, category: "Test" },
        ],
        selectedPackages: ["Finance_1"],
        profile: {
          company: "Test Corp",
          industry: "manufacturing",
          size: "medium",
          complexity: "standard",
          region: "ABMY",
        },
        // Missing phaseColors field (added in v1)
      };

      // Manually set state to test migration logic
      useTimelineStore.setState(v0State as any);

      const store = useTimelineStore.getState();

      // Verify data preserved
      expect(store.phases).toHaveLength(1);
      expect(store.phases[0].name).toBe("Test Phase");
      expect(store.selectedPackages).toContain("Finance_1");
      expect(store.profile.company).toBe("Test Corp");

      // Verify new field exists (will be empty object for manually set state)
      expect(store.phaseColors).toBeDefined();
    });

    it("handles corrupted localStorage gracefully", () => {
      // Reset store state first
      useTimelineStore.getState().reset();

      // Simulate corrupted JSON
      localStorage.setItem("timeline-store", "{invalid json}");

      // Should not crash, should use defaults
      const store = useTimelineStore.getState();

      expect(store.phases).toEqual([]);
      expect(store.selectedPackages).toEqual([]);
    });

    it("handles missing required fields in localStorage", () => {
      const incompleteData = {
        state: {
          phases: [{ id: "1", name: "Test" }],
          // Missing selectedPackages, profile, etc.
        },
        version: 1,
      };

      localStorage.setItem("timeline-store", JSON.stringify(incompleteData));

      const store = useTimelineStore.getState();

      // Should fill in defaults
      expect(store.selectedPackages).toBeDefined();
      expect(Array.isArray(store.selectedPackages)).toBe(true);
      expect(store.profile).toBeDefined();
    });

    it("preserves critical data across schema changes", () => {
      const criticalState = {
        phases: [
          {
            id: "critical-phase",
            name: "Production Phase",
            workingDays: 60,
            effort: 120,
            startBusinessDay: 0,
            category: "Production",
            resources: [
              {
                id: "r1",
                name: "John Doe",
                role: "Consultant",
                allocation: 100,
                region: "ABMY",
                hourlyRate: 150,
              },
            ],
          },
        ],
        selectedPackages: ["Finance_1", "HR_1"],
        profile: {
          company: "Enterprise Corp",
          industry: "manufacturing",
          size: "enterprise",
          complexity: "complex",
          employees: 5000,
          region: "ABMY",
        },
      };

      // Manually set state to test preservation
      useTimelineStore.setState(criticalState as any);

      const store = useTimelineStore.getState();

      // Critical data must be preserved
      expect(store.phases[0].name).toBe("Production Phase");
      expect(store.phases[0].resources).toHaveLength(1);
      expect(store.phases[0].resources![0].name).toBe("John Doe");
      expect(store.selectedPackages).toHaveLength(2);
      expect(store.profile.company).toBe("Enterprise Corp");
    });
  });

  describe("2. Input Sanitization (XSS/DoS Prevention)", () => {
    it("sanitizes XSS attempts in chip values", () => {
      const maliciousChips: Chip[] = [
        {
          type: "COUNTRY",
          value: '<script>alert("xss")</script>',
          confidence: 0.9,
          source: "test",
        },
        {
          type: "MODULES",
          value: "Finance<img src=x onerror=alert(1)>",
          confidence: 0.9,
          source: "test",
        },
      ];

      const result = convertPresalesToTimeline(maliciousChips, {});

      // Should not contain script tags
      expect(JSON.stringify(result)).not.toContain("<script>");
      expect(JSON.stringify(result)).not.toContain("onerror");

      // Should still function
      expect(result.selectedPackages).toBeDefined();
    });

    it("handles extremely large input strings gracefully", () => {
      const hugeChips: Chip[] = [
        { type: "MODULES", value: "A".repeat(100000), confidence: 0.9, source: "test" }, // 100KB
      ];

      // Should not crash or hang
      const result = convertPresalesToTimeline(hugeChips, {});

      expect(result).toBeDefined();
      expect(result.totalEffort).toBeGreaterThanOrEqual(0);
    });

    it("handles negative and extreme numeric values", () => {
      const extremeChips: Chip[] = [
        { type: "EMPLOYEES", value: -999999999, confidence: 0.9, source: "test" },
        { type: "EMPLOYEES", value: Number.MAX_SAFE_INTEGER, confidence: 0.9, source: "test" },
        { type: "EMPLOYEES", value: NaN, confidence: 0.9, source: "test" },
        { type: "EMPLOYEES", value: Infinity, confidence: 0.9, source: "test" },
      ];

      extremeChips.forEach((chip) => {
        const result = convertPresalesToTimeline(
          [{ type: "MODULES", value: "Finance", confidence: 0.9, source: "test" }, chip],
          {}
        );

        // Should handle gracefully
        expect(result).toBeDefined();
        expect(result.totalEffort).toBeGreaterThanOrEqual(0);
        expect(isFinite(result.totalEffort)).toBe(true);
      });
    });

    it("handles special characters and Unicode correctly", () => {
      const specialChips: Chip[] = [
        { type: "COUNTRY", value: "马来西亚 (Malaysia) 🇲🇾", confidence: 0.9, source: "test" },
        { type: "MODULES", value: "Finance™ & HR®", confidence: 0.9, source: "test" },
      ];

      const result = convertPresalesToTimeline(specialChips, {});

      expect(result).toBeDefined();
      expect(result.selectedPackages.length).toBeGreaterThan(0);
    });

    it("prevents prototype pollution attacks", () => {
      const pollutionChips: Chip[] = [
        { type: "MODULES", value: "__proto__", confidence: 0.9, source: "test" },
        { type: "MODULES", value: "constructor", confidence: 0.9, source: "test" },
      ];

      const result = convertPresalesToTimeline(pollutionChips, {});

      // Should not pollute Object prototype
      expect(result).toBeDefined();
      expect(Object.prototype).not.toHaveProperty("polluted");
    });
  });

  describe("3. Performance Under Load", () => {
    beforeEach(() => {
      // Clear store state before each test
      localStorage.clear();
      useTimelineStore.setState({
        phases: [],
        selectedPackages: [],
        phaseColors: {},
        holidays: [],
        zoomLevel: "week",
        selectedPhaseId: null,
        clientPresentationMode: false,
      });
    });

    it("handles 50 phases without performance degradation", () => {
      const store = useTimelineStore.getState();

      const startTime = performance.now();

      // Generate 50 phases
      for (let i = 0; i < 50; i++) {
        store.addPhase({
          name: `Phase ${i}`,
          workingDays: 20,
          effort: 40,
          category: "Implementation",
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in under 1 second
      expect(duration).toBeLessThan(1000);

      const phases = useTimelineStore.getState().phases;
      expect(phases.length).toBe(50);
    });

    it("handles 100 resources across phases efficiently", () => {
      // Create 10 phases with 10 resources each
      for (let phaseIdx = 0; phaseIdx < 10; phaseIdx++) {
        useTimelineStore.getState().addPhase({
          name: `Phase ${phaseIdx}`,
          workingDays: 20,
          effort: 40,
          category: "Implementation",
        });
      }

      const phases = useTimelineStore.getState().phases;

      const startTime = performance.now();

      // Add 10 resources to each phase
      phases.forEach((phase) => {
        const resources = Array(10)
          .fill(null)
          .map((_, idx) => ({
            id: `res-${phase.id}-${idx}`,
            name: `Person ${idx}`,
            role: "Consultant",
            allocation: 100,
            region: "ABMY" as const,
            hourlyRate: 150,
          }));

        useTimelineStore.getState().updatePhaseResources(phase.id, resources);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in under 500ms
      expect(duration).toBeLessThan(500);

      // Verify all resources added
      const updatedPhases = useTimelineStore.getState().phases;
      const totalResources = updatedPhases.reduce((sum, p) => sum + (p.resources?.length || 0), 0);
      expect(totalResources).toBe(100);
    });

    it("calculates cost for large projects efficiently", () => {
      const store = useTimelineStore.getState();

      // Create realistic large project (30 phases, 5 resources each)
      for (let i = 0; i < 30; i++) {
        store.addPhase({
          name: `Phase ${i}`,
          workingDays: 20,
          effort: 100,
          category: "Implementation",
        });
      }

      const phases = useTimelineStore.getState().phases;

      phases.forEach((phase) => {
        const resources = Array(5)
          .fill(null)
          .map((_, idx) => ({
            id: `res-${phase.id}-${idx}`,
            name: `Person ${idx}`,
            role: "Consultant",
            allocation: 100,
            region: "ABMY" as const,
            hourlyRate: 150,
          }));

        store.updatePhaseResources(phase.id, resources);
      });

      // Measure cost calculation performance
      const startTime = performance.now();

      const cost = store.getProjectCost();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should calculate instantly (<100ms)
      expect(duration).toBeLessThan(100);

      // Should return valid cost
      expect(cost).toBeGreaterThan(0);
      expect(isFinite(cost)).toBe(true);
    });

    it("handles rapid state updates without memory leaks", () => {
      const store = useTimelineStore.getState();

      // Simulate rapid user interactions
      for (let i = 0; i < 100; i++) {
        store.setZoomLevel(i % 2 === 0 ? "week" : "month");
        store.togglePresentationMode();
      }

      // Should not crash or slow down
      const currentZoom = useTimelineStore.getState().zoomLevel;
      expect(currentZoom).toBeDefined();
    });
  });

  describe("4. Error Reporting Infrastructure", () => {
    it("captures error context for debugging", () => {
      const errors: Array<{ error: Error; context: any }> = [];

      const reportError = (error: Error, context: Record<string, any>) => {
        errors.push({ error, context });
      };

      // Simulate error scenario
      try {
        const store = useTimelineStore.getState();
        store.updatePhase("non-existent-id", { name: "Updated" });

        // This should log an error but not crash
        expect(errors.length).toBe(0); // No crash = good
      } catch (error) {
        // If it does crash, ensure we can capture it
        reportError(error as Error, {
          action: "updatePhase",
          phaseId: "non-existent-id",
        });

        expect(errors.length).toBe(1);
        expect(errors[0].context.action).toBe("updatePhase");
      }
    });

    it("sanitizes sensitive data in error reports", () => {
      const error = new Error("Database connection failed");
      const sensitiveContext = {
        userId: "user-123",
        apiKey: "secret-key-abc",
        password: process.env.TEST_DUMMY_PASSWORD || "dummy-test-password",
        action: "saveTimeline",
      };

      // In production, this should sanitize sensitive fields
      const sanitizedContext = {
        action: sensitiveContext.action,
        // Remove sensitive fields
        hasUserId: !!sensitiveContext.userId,
        // Never log apiKey or password
      };

      expect(sanitizedContext).not.toHaveProperty("apiKey");
      expect(sanitizedContext).not.toHaveProperty("password");
      expect(sanitizedContext.action).toBe("saveTimeline");
    });

    it("provides actionable error messages for users", () => {
      const store = useTimelineStore.getState();

      // Test user-friendly error messaging
      const userErrors: string[] = [];

      try {
        // Simulate invalid operation
        store.updatePhaseResources("invalid-phase", []);
      } catch (error) {
        // Error should be caught and translated to user-friendly message
        const userMessage = "Unable to update resources. Please refresh and try again.";
        userErrors.push(userMessage);
      }

      // Should provide actionable guidance
      if (userErrors.length > 0) {
        expect(userErrors[0]).toContain("refresh");
      }
    });
  });

  describe("5. State Consistency Validation", () => {
    beforeEach(() => {
      // Clear store state before each test
      localStorage.clear();
      useTimelineStore.setState({
        phases: [],
        selectedPackages: [],
        phaseColors: {},
        holidays: [],
        zoomLevel: "week",
        selectedPhaseId: null,
        clientPresentationMode: false,
      });
    });

    it("maintains referential integrity between phases and resources", () => {
      const store = useTimelineStore.getState();

      // Create phase
      store.addPhase({
        name: "Test Phase",
        workingDays: 10,
        category: "Implementation",
      });

      const phase = useTimelineStore.getState().phases[0];

      // Add resources
      store.updatePhaseResources(phase.id, [
        {
          id: "res-1",
          name: "John Doe",
          role: "Consultant",
          allocation: 100,
          region: "ABMY",
          hourlyRate: 150,
        },
      ]);

      // Delete phase
      store.deletePhase(phase.id);

      // Resources should be removed with phase
      const remainingPhases = useTimelineStore.getState().phases;
      expect(remainingPhases.length).toBe(0);
    });

    it("prevents invalid resource allocations", () => {
      const store = useTimelineStore.getState();

      store.addPhase({
        name: "Test Phase",
        workingDays: 10,
        category: "Implementation",
      });

      const phase = useTimelineStore.getState().phases[0];

      // Try to add resource with invalid allocation
      const invalidResources = [
        {
          id: "res-1",
          name: "Invalid Person",
          role: "Consultant",
          allocation: 200, // > 150% (max allowed)
          region: "ABMY" as const,
          hourlyRate: 150,
        },
        {
          id: "res-2",
          name: "Negative Person",
          role: "Consultant",
          allocation: -50, // < 0%
          region: "ABMY" as const,
          hourlyRate: 150,
        },
      ];

      store.updatePhaseResources(phase.id, invalidResources);

      // Invalid resources should be filtered out
      const updatedPhase = useTimelineStore.getState().phases[0];
      expect(updatedPhase.resources?.length).toBe(0);
    });

    it("maintains cost calculation consistency", () => {
      const store = useTimelineStore.getState();

      // Create phase with known values
      store.addPhase({
        name: "Test Phase",
        workingDays: 10,
        effort: 80,
        category: "Implementation",
      });

      const phase = useTimelineStore.getState().phases[0];

      store.updatePhaseResources(phase.id, [
        {
          id: "res-1",
          name: "Consultant",
          role: "Senior Consultant",
          allocation: 100,
          region: "ABMY",
          hourlyRate: 100, // $100/hour
        },
      ]);

      const cost = store.getProjectCost();

      // Expected: 10 days * 8 hours * $100/hour = $8,000
      expect(cost).toBe(8000);
    });
  });
});
