/**
 * Timeline Generation Flow Test
 * Verifies FIX 1-4: Presales → Timeline auto-generation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { Chip } from "@/types/core";

describe("Timeline Generation Flow (FIX 1-4)", () => {
  beforeEach(() => {
    // Reset all stores
    usePresalesStore.getState().reset();
    useProjectStore.getState().reset();
    useTimelineStore.getState().reset();
  });

  it("should generate timeline when regenerateTimeline is called with chips", () => {
    // Add some test chips
    const testChips: Chip[] = [
      {
        id: "chip-1",
        type: "COUNTRY",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
      },
      {
        id: "chip-2",
        type: "INDUSTRY",
        value: "Manufacturing",
        confidence: 0.9,
        source: "paste",
      },
      {
        id: "chip-3",
        type: "MODULES",
        value: "Finance, HR, Supply Chain",
        confidence: 0.9,
        source: "paste",
      },
      {
        id: "chip-4",
        type: "EMPLOYEES",
        value: "500",
        confidence: 0.9,
        source: "paste",
      },
    ];

    // Add chips to presales store
    testChips.forEach((chip) => usePresalesStore.getState().addChip(chip));

    // Add some decisions
    usePresalesStore.getState().updateDecision("moduleCombo", "finance_p2p");
    usePresalesStore.getState().updateDecision("rateRegion", "ABMY");

    // Verify chips were added (get fresh state)
    expect(usePresalesStore.getState().chips.length).toBeGreaterThanOrEqual(4);
    expect(usePresalesStore.getState().completeness).toBeDefined();
    expect(usePresalesStore.getState().completeness.score).toBeGreaterThan(0);

    // Trigger timeline generation
    console.log("[TEST] Triggering timeline regeneration...");
    useProjectStore.getState().regenerateTimeline(true);

    // Check timeline store was updated
    const updatedPhases = useTimelineStore.getState().phases;
    console.log(`[TEST] After regeneration: ${updatedPhases.length} phases`);

    // Verify phases were generated
    expect(updatedPhases.length).toBeGreaterThan(0);
    expect(useTimelineStore.getState().selectedPackages.length).toBeGreaterThan(0);
    expect(useTimelineStore.getState().profile.company).toBeDefined();
  });

  it("should use setPhases method to update timeline store", () => {
    // Test setPhases method
    const testPhases = [
      {
        id: "phase-1",
        name: "Test Phase 1",
        category: "Finance - Prepare",
        startBusinessDay: 0,
        workingDays: 10,
        effort: 50,
        color: "#3B82F6",
        skipHolidays: true,
        dependencies: [],
        status: "idle" as const,
        resources: [],
      },
      {
        id: "phase-2",
        name: "Test Phase 2",
        category: "Finance - Realize",
        startBusinessDay: 10,
        workingDays: 20,
        effort: 100,
        color: "#8B5CF6",
        skipHolidays: true,
        dependencies: ["phase-1"],
        status: "idle" as const,
        resources: [],
      },
    ];

    useTimelineStore.getState().setPhases(testPhases);

    const updatedStore = useTimelineStore.getState();
    expect(updatedStore.phases).toHaveLength(2);
    expect(updatedStore.phases[0].id).toBe("phase-1");
    expect(updatedStore.phases[1].id).toBe("phase-2");
  });

  it("should use setSelectedPackages method", () => {
    const testPackages = ["Finance_1", "Finance_3", "HCM_1"];
    useTimelineStore.getState().setSelectedPackages(testPackages);

    expect(useTimelineStore.getState().selectedPackages).toEqual(testPackages);
  });

  it("should not generate timeline if no chips exist", () => {
    // Try to generate with no chips
    useProjectStore.getState().regenerateTimeline(true);

    // Should not have created phases
    expect(useTimelineStore.getState().phases.length).toBe(0);
  });

  it("should log diagnostic messages during generation", () => {
    // Add minimal chips
    usePresalesStore.getState().addChip({
      type: "MODULES",
      value: "Finance",
      confidence: 0.9,
      source: "paste",
    });

    // Spy on console.log
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    useProjectStore.getState().regenerateTimeline(true);

    // Restore console.log
    console.log = originalLog;

    // Verify diagnostic logs were emitted
    const hasProjectStoreLogs = logs.some((log) => log.includes("[ProjectStore]"));
    const hasTimelineStoreLogs = logs.some((log) => log.includes("[TimelineStore]"));

    expect(hasProjectStoreLogs).toBe(true);
    expect(hasTimelineStoreLogs).toBe(true);
  });
});
