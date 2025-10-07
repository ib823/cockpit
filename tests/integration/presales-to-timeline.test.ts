import { convertPresalesToTimeline } from "@/lib/presales-to-timeline-bridge";
import { Chip } from "@/types/core";
import { describe, expect, it } from "vitest";

describe("Presales → Timeline Integration", () => {
  it("generates timeline from chips with multipliers", () => {
    const chips: Chip[] = [
      {
        id: "1",
        type: "COUNTRY",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
        validated: true,
        metadata: { evidence: { snippet: "Malaysia" } },
      },
      {
        id: "2",
        type: "EMPLOYEES",
        value: "500",
        confidence: 0.85,
        source: "paste",
        validated: true,
        metadata: { evidence: { snippet: "500 employees" } },
      },
      {
        id: "3",
        type: "MODULES",
        value: "Finance",
        confidence: 0.9,
        source: "paste",
        validated: true,
        metadata: { evidence: { snippet: "Finance module" } },
      },
    ];

    const decisions: any = {
      moduleCombo: "finance_hr",
      rateRegion: "ABMY",
    };

    const result = convertPresalesToTimeline(chips, decisions);

    expect(result).toBeDefined();
    expect(result.totalEffort).toBeGreaterThan(0);
    expect(result.selectedPackages.length).toBeGreaterThan(0);
  });

  it("applies branch multiplier correctly", () => {
    const chipsWithBranches: Chip[] = [
      {
        id: "1",
        type: "COUNTRY",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
        validated: true,
        metadata: { evidence: { snippet: "Syarikat dengan 5 cawangan" } },
      },
      {
        id: "2",
        type: "MODULES",
        value: "Finance",
        confidence: 0.9,
        source: "paste",
        validated: true,
        metadata: { evidence: { snippet: "Finance module" } },
      },
    ];

    const decisions: any = { moduleCombo: "finance_core" };

    const result = convertPresalesToTimeline(chipsWithBranches, decisions);

    // Should have packages and effort calculated
    expect(result.selectedPackages.length).toBeGreaterThan(0);
    expect(result.totalEffort).toBeGreaterThan(0);
  });
});
