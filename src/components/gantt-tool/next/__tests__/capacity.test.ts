/**
 * The capacity mapping's contract: the matrix must be a pure reshaping of the
 * calculator's output — no new arithmetic — and the search haystack must
 * reproduce legacy's four searchable fields, because "search finds it in one
 * panel but not the other" is the parity break that erodes trust fastest.
 */

import { describe, expect, it } from "vitest";
import type { Resource } from "@/types/gantt-tool";
import type { ResourceCapacityResult } from "@/lib/gantt-tool/resource-capacity-calculator";
import { toCapacityMatrix } from "../capacity";

function week(id: string, start: string, end: string, percent: number) {
  return {
    weekIdentifier: id,
    weekStartDate: new Date(start),
    weekEndDate: new Date(end),
    allocatedPercent: percent,
    allocatedDays: 0,
    availablePercent: Math.max(0, 100 - percent),
    availableDays: 0,
    taskAllocations: [],
    isOverallocated: percent > 100,
    isAtRisk: percent > 80 && percent <= 100,
    isManualOverride: false,
  };
}

function result(
  resourceId: string,
  name: string,
  percents: number[]
): ResourceCapacityResult {
  return {
    resourceId,
    resourceName: name,
    resourceCategory: "technical",
    weeks: percents.map((p, i) =>
      week(`W0${i + 1}`, "2026-01-05", "2026-01-11", p)
    ),
    summary: {
      totalAllocatedDays: 0,
      totalAvailableDays: 0,
      averageUtilization: 0,
      overallocatedWeeks: 0,
      atRiskWeeks: 0,
    },
  };
}

function resource(over: Partial<Resource> & Pick<Resource, "id" | "name">): Resource {
  return {
    category: "technical",
    designation: "consultant",
    ...over,
  } as Resource;
}

describe("toCapacityMatrix", () => {
  it("reshapes the calculator's percentages without touching them", () => {
    const matrix = toCapacityMatrix(
      [result("r1", "Ada Lovelace", [40, 120, 0])],
      [resource({ id: "r1", name: "Ada Lovelace" })]
    );

    // Including the 120: over-allocation is a real state the cell renders,
    // not something to clamp away in the mapping.
    expect(matrix.rows[0].percents).toEqual([40, 120, 0]);
    expect(matrix.columns.map((c) => c.key)).toEqual(["W01", "W02", "W03"]);
  });

  it("titles a column with the week and its dates", () => {
    const matrix = toCapacityMatrix(
      [result("r1", "Ada", [40])],
      [resource({ id: "r1", name: "Ada" })]
    );

    expect(matrix.columns[0].title).toBe("W01, 5 Jan – 11 Jan 26");
  });

  it("builds the haystack from legacy's four fields, lower-cased", () => {
    const matrix = toCapacityMatrix(
      [result("r1", "Ada Lovelace", [40])],
      [
        resource({
          id: "r1",
          name: "Ada Lovelace",
          category: "technical",
          companyName: "ABeam",
          projectRole: "Integration Lead",
        }),
      ]
    );

    const haystack = matrix.rows[0].searchText;
    // Name, category LABEL (not the key), company, role — findable by any.
    expect(haystack).toContain("ada lovelace");
    expect(haystack).toContain("abeam");
    expect(haystack).toContain("integration lead");
    expect(haystack).toBe(haystack.toLowerCase());
  });

  it("survives a result whose resource record is missing", () => {
    // The calculator ran against a resource since deleted from the list; the
    // row must still render rather than take the panel down.
    const matrix = toCapacityMatrix([result("ghost", "Departed", [10])], []);

    expect(matrix.rows[0].name).toBe("Departed");
    expect(matrix.rows[0].searchText).toContain("departed");
  });

  it("returns an empty matrix for no results", () => {
    expect(toCapacityMatrix([], [])).toEqual({ columns: [], rows: [] });
  });
});
