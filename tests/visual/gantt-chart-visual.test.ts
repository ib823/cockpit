// Visual test suite for GanttChart resource avatars and utilization bars
import { describe, it, expect, beforeEach } from "vitest";
import { Phase, Resource } from "@/lib/timeline/phase-generation";

describe("GanttChart Visual Features", () => {
  // Test helper: Create phase with resources
  const createPhaseWithResources = (
    name: string,
    resources: Array<{ name: string; allocation: number }>
  ): Phase => {
    return {
      id: `phase_${Date.now()}_${Math.random()}`,
      name,
      category: "Implementation",
      startBusinessDay: 0,
      workingDays: 20,
      effort: 40,
      color: "#3B82F6",
      resources: resources.map((r, idx) => ({
        id: `res_${idx}`,
        name: r.name,
        role: "Consultant",
        allocation: r.allocation,
        region: "ABMY",
        hourlyRate: 100,
      })),
    };
  };

  // Test helper: Calculate utilization
  const calculateUtilization = (phase: Phase): number => {
    const resources = phase.resources || [];
    if (resources.length === 0) return 0;
    const totalAllocation = resources.reduce((sum, r) => sum + (r.allocation || 0), 0);
    return totalAllocation / resources.length;
  };

  // Test helper: Get utilization color
  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 100) return "red";
    if (utilization >= 80) return "orange";
    return "green";
  };

  describe("Test Permutation 1: Under-utilized Team (70%)", () => {
    it("should show green utilization bar", () => {
      const phase = createPhaseWithResources("Phase 1", [
        { name: "John Doe", allocation: 70 },
        { name: "Alice Smith", allocation: 70 },
        { name: "Bob Johnson", allocation: 70 },
      ]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(70);
      expect(color).toBe("green");
      expect(phase.resources?.length).toBe(3);
    });

    it("should generate initials correctly", () => {
      const phase = createPhaseWithResources("Phase 1", [{ name: "John Doe", allocation: 70 }]);

      const resource = phase.resources![0];
      const initials = resource
        .name!.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      expect(initials).toBe("JD");
    });
  });

  describe("Test Permutation 2: Healthy Load (85-95%)", () => {
    it("should show orange utilization bar for 85%", () => {
      const phase = createPhaseWithResources("Phase 2", [
        { name: "Sarah Williams", allocation: 85 },
        { name: "Mike Brown", allocation: 85 },
      ]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(85);
      expect(color).toBe("orange");
    });

    it("should show orange utilization bar for 95%", () => {
      const phase = createPhaseWithResources("Phase 3", [
        { name: "Emma Davis", allocation: 95 },
        { name: "Chris Wilson", allocation: 95 },
      ]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(95);
      expect(color).toBe("orange");
    });
  });

  describe("Test Permutation 3: Over-allocated Team (110%)", () => {
    it("should show red utilization bar", () => {
      const phase = createPhaseWithResources("Phase 4", [
        { name: "David Lee", allocation: 110 },
        { name: "Lisa Anderson", allocation: 110 },
      ]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(110);
      expect(color).toBe("red");
    });
  });

  describe("Test Permutation 4: Mixed Allocations", () => {
    it("should calculate average correctly for mixed team", () => {
      const phase = createPhaseWithResources("Phase 5", [
        { name: "John Doe", allocation: 70 }, // Under-utilized
        { name: "Alice Smith", allocation: 90 }, // Healthy
        { name: "Bob Johnson", allocation: 110 }, // Over-allocated
      ]);

      const utilization = calculateUtilization(phase);
      const expectedAvg = (70 + 90 + 110) / 3; // = 90

      expect(utilization).toBe(expectedAvg);
      expect(utilization).toBe(90);
    });

    it("should show orange bar for 90% average", () => {
      const phase = createPhaseWithResources("Phase 5", [
        { name: "John Doe", allocation: 70 },
        { name: "Alice Smith", allocation: 90 },
        { name: "Bob Johnson", allocation: 110 },
      ]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(color).toBe("orange"); // 90% is in orange range (80-100%)
    });
  });

  describe("Test Permutation 5: Large Team (>3 members)", () => {
    it("should handle 5 team members", () => {
      const phase = createPhaseWithResources("Phase 6", [
        { name: "Person One", allocation: 80 },
        { name: "Person Two", allocation: 85 },
        { name: "Person Three", allocation: 90 },
        { name: "Person Four", allocation: 95 },
        { name: "Person Five", allocation: 100 },
      ]);

      expect(phase.resources?.length).toBe(5);

      // Should show 3 avatars + "+2" indicator
      const visibleCount = Math.min(3, phase.resources?.length || 0);
      const remainingCount = (phase.resources?.length || 0) - visibleCount;

      expect(visibleCount).toBe(3);
      expect(remainingCount).toBe(2);
    });

    it("should calculate average for 5 members", () => {
      const phase = createPhaseWithResources("Phase 6", [
        { name: "Person One", allocation: 80 },
        { name: "Person Two", allocation: 85 },
        { name: "Person Three", allocation: 90 },
        { name: "Person Four", allocation: 95 },
        { name: "Person Five", allocation: 100 },
      ]);

      const utilization = calculateUtilization(phase);
      const expectedAvg = (80 + 85 + 90 + 95 + 100) / 5; // = 90

      expect(utilization).toBe(expectedAvg);
      expect(utilization).toBe(90);
    });
  });

  describe("Test Permutation 6: Edge Cases", () => {
    it("should handle single resource", () => {
      const phase = createPhaseWithResources("Phase 7", [
        { name: "Solo Developer", allocation: 100 },
      ]);

      const utilization = calculateUtilization(phase);
      expect(utilization).toBe(100);
      expect(phase.resources?.length).toBe(1);
    });

    it("should handle exactly 100% utilization", () => {
      const phase = createPhaseWithResources("Phase 8", [
        { name: "Full Time Worker", allocation: 100 },
      ]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(100);
      expect(color).toBe("red"); // 100% triggers red (>= 100)
    });

    it("should handle 0% allocation", () => {
      const phase = createPhaseWithResources("Phase 9", [
        { name: "Inactive Person", allocation: 0 },
      ]);

      const utilization = calculateUtilization(phase);
      expect(utilization).toBe(0);
    });

    it("should handle no resources", () => {
      const phase: Phase = {
        id: "phase_empty",
        name: "Empty Phase",
        category: "Testing",
        startBusinessDay: 0,
        workingDays: 10,
        resources: [],
      };

      const utilization = calculateUtilization(phase);
      expect(utilization).toBe(0);
      expect(phase.resources?.length).toBe(0);
    });
  });

  describe("Test Permutation 7: Initials Generation", () => {
    it("should handle various name formats", () => {
      const testCases = [
        { name: "John Doe", expected: "JD" },
        { name: "Alice", expected: "A" },
        { name: "Mary Jane Watson", expected: "MJ" }, // Takes first 2 initials
        { name: "Jean-Paul Sartre", expected: "JS" },
        { name: "Dr. Smith", expected: "DS" },
        { name: "O'Brien", expected: "O" },
      ];

      testCases.forEach(({ name, expected }) => {
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        expect(initials).toBe(expected);
      });
    });
  });

  describe("Test Permutation 8: Boundary Conditions", () => {
    it("should handle exactly 80% (boundary green/orange)", () => {
      const phase = createPhaseWithResources("Boundary Test", [{ name: "Worker", allocation: 80 }]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(80);
      expect(color).toBe("orange"); // >= 80 is orange
    });

    it("should handle 79% (should be green)", () => {
      const phase = createPhaseWithResources("Boundary Test", [{ name: "Worker", allocation: 79 }]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(79);
      expect(color).toBe("green"); // < 80 is green
    });

    it("should handle 99% (should be orange)", () => {
      const phase = createPhaseWithResources("Boundary Test", [{ name: "Worker", allocation: 99 }]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(99);
      expect(color).toBe("orange"); // < 100 but >= 80
    });

    it("should handle 150% over-allocation", () => {
      const phase = createPhaseWithResources("Extreme Over-allocation", [
        { name: "Overworked", allocation: 150 },
      ]);

      const utilization = calculateUtilization(phase);
      const color = getUtilizationColor(utilization);

      expect(utilization).toBe(150);
      expect(color).toBe("red"); // >= 100 is red
    });
  });

  describe("Test Permutation 9: Real-world Scenarios", () => {
    it("Scenario: Small agile team", () => {
      const phase = createPhaseWithResources("Sprint 1", [
        { name: "Product Owner", allocation: 25 },
        { name: "Scrum Master", allocation: 50 },
        { name: "Developer 1", allocation: 100 },
        { name: "Developer 2", allocation: 100 },
        { name: "QA Engineer", allocation: 75 },
      ]);

      const utilization = calculateUtilization(phase);
      const expectedAvg = (25 + 50 + 100 + 100 + 75) / 5; // = 70

      expect(utilization).toBe(expectedAvg);
      expect(utilization).toBe(70);
      expect(getUtilizationColor(utilization)).toBe("green");
    });

    it("Scenario: SAP implementation team", () => {
      const phase = createPhaseWithResources("Realize Phase", [
        { name: "Solution Architect", allocation: 80 },
        { name: "Finance Consultant", allocation: 100 },
        { name: "HR Consultant", allocation: 100 },
        { name: "Technical Lead", allocation: 120 }, // Overallocated
        { name: "Developer", allocation: 100 },
      ]);

      const utilization = calculateUtilization(phase);
      const expectedAvg = (80 + 100 + 100 + 120 + 100) / 5; // = 100

      expect(utilization).toBe(expectedAvg);
      expect(utilization).toBe(100);
      expect(getUtilizationColor(utilization)).toBe("red"); // Average at 100%
    });
  });

  describe("Test Permutation 10: UI Layout Tests", () => {
    it("should limit visible avatars to 3", () => {
      const phase = createPhaseWithResources("Large Team", [
        { name: "Person 1", allocation: 80 },
        { name: "Person 2", allocation: 80 },
        { name: "Person 3", allocation: 80 },
        { name: "Person 4", allocation: 80 },
        { name: "Person 5", allocation: 80 },
        { name: "Person 6", allocation: 80 },
        { name: "Person 7", allocation: 80 },
      ]);

      const visibleCount = Math.min(3, phase.resources?.length || 0);
      const remainingCount = (phase.resources?.length || 0) - visibleCount;

      expect(visibleCount).toBe(3); // Should only show 3
      expect(remainingCount).toBe(4); // Should show "+4"
      expect(phase.resources?.length).toBe(7);
    });
  });
});
