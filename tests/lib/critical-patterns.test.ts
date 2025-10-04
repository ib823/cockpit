import { detectEmployeeCount, detectMultiEntityFactors } from "@/lib/critical-patterns";
import { describe, expect, it } from "vitest";

describe("Critical Patterns Detection", () => {
  it("detects Bahasa Malaysia branches", () => {
    const text = "Syarikat dengan 5 cawangan di Malaysia";
    const result = detectMultiEntityFactors(text);

    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.factors[0].type).toBe("branch");
    expect(result.factors[0].count).toBe(5);
    expect(result.totalMultiplier).toBeGreaterThan(1);
  });

  it("handles multiple entity types", () => {
    const text = "Operating 3 legal entities with 5 branches each";
    const result = detectMultiEntityFactors(text);

    expect(result.factors.length).toBe(2); // entities + branches
    expect(result.warnings.length).toBeGreaterThan(0); // Should warn about overlap
  });

  it("detects employee count in Bahasa", () => {
    const text = "500 orang pekerja";
    const result = detectEmployeeCount(text);

    expect(result.count).toBe(500);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
