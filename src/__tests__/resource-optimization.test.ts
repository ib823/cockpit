import type { TaskWithState } from "@/stores/resource-planning-store";
import { useResourcePlanningStore } from "@/stores/resource-planning-store";
import { beforeEach, describe, expect, it } from "vitest";

describe("Resource Planning Store", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    useResourcePlanningStore.getState().reset();
  });

  describe("getTotalEffort", () => {
    it("calculates total effort correctly with full delta", () => {
      const store = useResourcePlanningStore.getState();

      const tasks: TaskWithState[] = [
        {
          id: "t1",
          name: "Task 1",
          category: "functional",
          stream: "FI",
          baseEffort: 10,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
          completed: 0,
          delta: 100,
          assignedResource: null,
        },
        {
          id: "t2",
          name: "Task 2",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
          completed: 0,
          delta: 100,
          assignedResource: null,
        },
      ];

      store.setTasks(tasks);

      // Re-get state after update
      const updatedStore = useResourcePlanningStore.getState();
      expect(updatedStore.getTotalEffort()).toBe(15); // 10 + 5
    });

    it("calculates total effort with partial delta", () => {
      const store = useResourcePlanningStore.getState();

      const tasks: TaskWithState[] = [
        {
          id: "t1",
          name: "Task 1",
          category: "functional",
          stream: "FI",
          baseEffort: 10,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
          completed: 50,
          delta: 50,
          assignedResource: null,
        },
      ];

      store.setTasks(tasks);

      const updatedStore = useResourcePlanningStore.getState();
      expect(updatedStore.getTotalEffort()).toBe(5); // 10 * 0.5
    });
  });

  describe("getBottlenecks", () => {
    it("detects overallocated resources", () => {
      const store = useResourcePlanningStore.getState();

      store.addResource({
        role: "Senior Consultant",
        region: "ABMY",
        skills: ["SAP FI"],
        dailyRate: 450,
      });

      // Re-get state after adding resource
      let updatedStore = useResourcePlanningStore.getState();
      expect(updatedStore.resources.length).toBe(1);

      const resourceId = updatedStore.resources[0].id;
      updatedStore.updateResource(resourceId, { utilization: 120 });

      // Re-get state after update
      updatedStore = useResourcePlanningStore.getState();
      const bottlenecks = updatedStore.getBottlenecks();

      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0].type).toBe("overallocation");
      expect(bottlenecks[0].severity).toBe("critical");
    });

    it("detects skill gaps", () => {
      const store = useResourcePlanningStore.getState();

      const tasks: TaskWithState[] = [
        {
          id: "t1",
          name: "Task 1",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP Security", "GRC"],
          sharable: true,
          riskLevel: "high",
          completed: 0,
          delta: 100,
          assignedResource: null,
        },
      ];

      store.setTasks(tasks);

      store.addResource({
        role: "Consultant",
        region: "ABMY",
        skills: ["SAP FI"], // Missing SAP Security
        dailyRate: 350,
      });

      const updatedStore = useResourcePlanningStore.getState();
      const bottlenecks = updatedStore.getBottlenecks();
      const skillGapBottleneck = bottlenecks.find((b) => b.type === "skill_gap");

      expect(skillGapBottleneck).toBeDefined();
      expect(skillGapBottleneck?.description).toContain("SAP Security");
    });
  });

  describe("runOptimization", () => {
    it("runs without errors when tasks and resources exist", () => {
      const store = useResourcePlanningStore.getState();

      const tasks: TaskWithState[] = [
        {
          id: "t1",
          name: "Task 1",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
          completed: 0,
          delta: 100,
          assignedResource: null,
        },
      ];

      store.setTasks(tasks);

      store.addResource({
        role: "Senior Consultant",
        region: "ABMY",
        skills: ["SAP FI"],
        dailyRate: 450,
      });

      // Re-get state before optimization
      let updatedStore = useResourcePlanningStore.getState();
      expect(updatedStore.resources.length).toBe(1);
      expect(updatedStore.tasks.length).toBe(1);

      updatedStore.runOptimization();

      // Re-get state after optimization
      updatedStore = useResourcePlanningStore.getState();
      expect(updatedStore.optimizationResult).not.toBeNull();
      expect(updatedStore.optimizationResult?.totalCost).toBeGreaterThan(0);
    });

    it("handles case with no matching skills gracefully", () => {
      const store = useResourcePlanningStore.getState();

      const tasks: TaskWithState[] = [
        {
          id: "t1",
          name: "Task 1",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP ABAP", "Development"],
          sharable: true,
          riskLevel: "low",
          completed: 0,
          delta: 100,
          assignedResource: null,
        },
      ];

      store.setTasks(tasks);

      store.addResource({
        role: "Consultant",
        region: "ABMY",
        skills: ["SAP FI"], // Doesn't match
        dailyRate: 350,
      });

      let updatedStore = useResourcePlanningStore.getState();
      expect(() => updatedStore.runOptimization()).not.toThrow();

      // Re-get state after optimization
      updatedStore = useResourcePlanningStore.getState();
      const unassignedTask = updatedStore.tasks.find((t) => t.id === "t1");
      expect(unassignedTask?.assignedResource).toBeNull();
    });
  });

  describe("resource management", () => {
    it("adds resource with auto-generated ID", () => {
      const store = useResourcePlanningStore.getState();

      store.addResource({
        role: "Manager",
        region: "ABSG",
        skills: ["Project Management"],
        dailyRate: 900,
      });

      // Re-get state after adding
      const updatedStore = useResourcePlanningStore.getState();

      expect(updatedStore.resources).toHaveLength(1);
      expect(updatedStore.resources[0].id).toContain("res_");
      expect(updatedStore.resources[0].role).toBe("Manager");
    });

    it("removes resource and clears assignments", () => {
      const store = useResourcePlanningStore.getState();

      store.addResource({
        role: "Consultant",
        region: "ABMY",
        skills: ["SAP FI"],
        dailyRate: 350,
      });

      // Re-get state after adding
      let updatedStore = useResourcePlanningStore.getState();
      expect(updatedStore.resources.length).toBe(1);

      const resourceId = updatedStore.resources[0].id;

      const tasks: TaskWithState[] = [
        {
          id: "t1",
          name: "Task 1",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
          completed: 0,
          delta: 100,
          assignedResource: resourceId,
        },
      ];

      store.setTasks(tasks);
      store.removeResource(resourceId);

      // Re-get state after removal
      updatedStore = useResourcePlanningStore.getState();

      expect(updatedStore.resources).toHaveLength(0);
      expect(updatedStore.tasks[0].assignedResource).toBeNull();
    });
  });
});
