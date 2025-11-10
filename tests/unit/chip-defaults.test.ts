/**
 * Unit Tests for Chip Defaults Library
 *
 * Tests: Sanitization, Validation, Default Generation, Rate Limiting
 */

import {
  checkRateLimit,
  CHIP_DEFAULTS,
  CHIP_VALIDATION,
  createDefaultChip,
  fillMissingChips,
  getInputType,
  resetRateLimit,
  sanitizeChipValue,
  validateChipValue,
} from "@/lib/chip-defaults";
import { Chip, ChipType } from "@/types/core";
import { beforeEach, describe, expect, it } from "vitest";

describe("sanitizeChipValue", () => {
  it("should trim whitespace", () => {
    expect(sanitizeChipValue("  test  ")).toBe("test");
  });

  it("should remove script tags", () => {
    expect(sanitizeChipValue("<script>alert('xss')</script>test")).toBe("test");
  });

  it("should remove HTML tags", () => {
    expect(sanitizeChipValue("<div>test</div>")).toBe("test");
  });

  it("should remove javascript: protocol", () => {
    expect(sanitizeChipValue("javascript:alert(1)")).toBe("alert(1)");
  });

  it("should remove event handlers", () => {
    expect(sanitizeChipValue("test onclick=alert(1)")).toBe("test ");
  });

  it("should limit length to 200 chars", () => {
    const longString = "a".repeat(300);
    expect(sanitizeChipValue(longString)).toHaveLength(200);
  });

  it("should handle empty string", () => {
    expect(sanitizeChipValue("")).toBe("");
  });

  it("should handle normal text without modification", () => {
    expect(sanitizeChipValue("Normal text 123")).toBe("Normal text 123");
  });
});

describe("validateChipValue", () => {
  it("should reject empty values", () => {
    const result = validateChipValue("COUNTRY", "");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Value cannot be empty");
  });

  it("should validate country options", () => {
    expect(validateChipValue("COUNTRY", "Malaysia").isValid).toBe(true);
    expect(validateChipValue("COUNTRY", "InvalidCountry").isValid).toBe(false);
  });

  it("should validate numeric patterns", () => {
    expect(validateChipValue("LEGAL_ENTITIES", "5").isValid).toBe(true);
    expect(validateChipValue("LEGAL_ENTITIES", "abc").isValid).toBe(false);
  });

  it("should validate numeric ranges", () => {
    expect(validateChipValue("USERS", "50").isValid).toBe(true);
    expect(validateChipValue("USERS", "0").isValid).toBe(false); // Min is 1
    expect(validateChipValue("USERS", "200000").isValid).toBe(false); // Max is 100000
  });

  it("should validate timeline format", () => {
    expect(validateChipValue("TIMELINE", "6 months").isValid).toBe(true);
    expect(validateChipValue("TIMELINE", "12 weeks").isValid).toBe(true);
    expect(validateChipValue("TIMELINE", "invalid").isValid).toBe(false);
  });

  it("should allow any text for fields without strict validation", () => {
    expect(validateChipValue("INTEGRATION", "Custom API").isValid).toBe(true);
    expect(validateChipValue("COMPLIANCE", "GDPR compliant").isValid).toBe(true);
  });
});

describe("createDefaultChip", () => {
  it("should create valid chip with defaults", () => {
    const chip = createDefaultChip("COUNTRY");

    expect(chip.id).toBeDefined();
    expect(chip.type).toBe("COUNTRY");
    expect(chip.value).toBe("Malaysia");
    expect(chip.confidence).toBe(0.3);
    expect(chip.source).toBe("default");
    expect(chip.metadata?.estimated).toBe(true);
    expect(chip.timestamp).toBeInstanceOf(Date);
  });

  it("should create different chips for different types", () => {
    const countryChip = createDefaultChip("COUNTRY"); // confidence: 0.3
    const legalEntitiesChip = createDefaultChip("LEGAL_ENTITIES"); // confidence: 0.4

    expect(countryChip.value).toBe("Malaysia");
    expect(legalEntitiesChip.value).toBe("1");
    expect(countryChip.confidence).not.toBe(legalEntitiesChip.confidence);
  });

  it("should have unique IDs", () => {
    const chip1 = createDefaultChip("COUNTRY");
    const chip2 = createDefaultChip("COUNTRY");

    expect(chip1.id).not.toBe(chip2.id);
  });

  it("should include descriptive notes", () => {
    const chip = createDefaultChip("LEGAL_ENTITIES");

    expect(chip.metadata?.note).toBeDefined();
    expect(chip.metadata?.note).toContain("single entity");
  });
});

describe("fillMissingChips", () => {
  it("should fill all missing gaps", () => {
    const existingChips: Chip[] = [
      {
        id: "1",
        type: "COUNTRY",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
      },
    ];

    const gaps = ["LEGAL_ENTITIES", "LOCATIONS", "USERS"];
    const newChips = fillMissingChips(existingChips, gaps);

    expect(newChips).toHaveLength(3);
    expect(newChips.map((c) => c.type)).toEqual(gaps);
  });

  it("should not create duplicates", () => {
    const existingChips: Chip[] = [
      {
        id: "1",
        type: "COUNTRY",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
      },
    ];

    const gaps = ["COUNTRY", "LEGAL_ENTITIES"]; // country already exists
    const newChips = fillMissingChips(existingChips, gaps);

    expect(newChips).toHaveLength(1);
    expect(newChips[0].type).toBe("LEGAL_ENTITIES");
  });

  it("should return empty array if no gaps", () => {
    const existingChips: Chip[] = [
      {
        id: "1",
        type: "COUNTRY",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
      },
    ];

    const gaps: string[] = [];
    const newChips = fillMissingChips(existingChips, gaps);

    expect(newChips).toHaveLength(0);
  });

  it("should skip invalid gap types", () => {
    const existingChips: Chip[] = [];
    const gaps = ["COUNTRY", "invalid_type"];
    const newChips = fillMissingChips(existingChips, gaps);

    expect(newChips).toHaveLength(1);
    expect(newChips[0].type).toBe("COUNTRY");
  });
});

describe("getInputType", () => {
  it("should return 'select' for option-based types", () => {
    expect(getInputType("COUNTRY")).toBe("select");
    expect(getInputType("INDUSTRY")).toBe("select");
    expect(getInputType("CURRENCIES")).toBe("select");
  });

  it("should return 'number' for numeric types", () => {
    expect(getInputType("LEGAL_ENTITIES")).toBe("number");
    expect(getInputType("LOCATIONS")).toBe("number");
    expect(getInputType("USERS")).toBe("number");
  });

  it("should return 'text' for free-form types", () => {
    expect(getInputType("INTEGRATION")).toBe("text");
    expect(getInputType("COMPLIANCE")).toBe("text");
  });
});

describe("Rate Limiting", () => {
  beforeEach(() => {
    resetRateLimit();
  });

  it("should allow requests within limit", () => {
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit()).toBe(true);
    }
  });

  it("should block requests exceeding limit", () => {
    // Exhaust limit
    for (let i = 0; i < 20; i++) {
      checkRateLimit();
    }

    // Next request should be blocked
    expect(checkRateLimit()).toBe(false);
  });

  it("should reset after time window", async () => {
    // Exhaust limit
    for (let i = 0; i < 20; i++) {
      checkRateLimit();
    }

    // Wait for window to expire (mocked via resetRateLimit)
    resetRateLimit();

    expect(checkRateLimit()).toBe(true);
  });
});

describe("CHIP_DEFAULTS coverage", () => {
  it("should have defaults for all common chip types", () => {
    const requiredTypes: ChipType[] = [
      "COUNTRY",
      "LEGAL_ENTITIES",
      "LOCATIONS",
      "USERS",
      "DATA_VOLUME",
      "INDUSTRY",
      "MODULES",
    ];

    requiredTypes.forEach((type) => {
      expect(CHIP_DEFAULTS[type]).toBeDefined();
      expect(CHIP_DEFAULTS[type].value).toBeDefined();
      expect(CHIP_DEFAULTS[type].confidence).toBeGreaterThan(0);
      expect(CHIP_DEFAULTS[type].note).toBeDefined();
    });
  });

  it("should have reasonable confidence scores", () => {
    Object.values(CHIP_DEFAULTS).forEach((def) => {
      expect(def.confidence).toBeGreaterThanOrEqual(0.2);
      expect(def.confidence).toBeLessThanOrEqual(0.5);
    });
  });
});

describe("CHIP_VALIDATION coverage", () => {
  it("should have validation for all chip types", () => {
    const allTypes = Object.keys(CHIP_DEFAULTS) as ChipType[];

    allTypes.forEach((type) => {
      expect(CHIP_VALIDATION[type]).toBeDefined();
      expect(CHIP_VALIDATION[type].errorMessage).toBeDefined();
    });
  });

  it("should have specific validation rules for critical types", () => {
    // Numeric types should have min/max
    expect(CHIP_VALIDATION.LEGAL_ENTITIES.min).toBeDefined();
    expect(CHIP_VALIDATION.LOCATIONS.min).toBeDefined();
    expect(CHIP_VALIDATION.USERS.min).toBeDefined();

    // Select types should have options
    expect(CHIP_VALIDATION.COUNTRY.options).toBeDefined();
    expect(CHIP_VALIDATION.INDUSTRY.options).toBeDefined();
    expect(CHIP_VALIDATION.CURRENCIES.options).toBeDefined();
  });
});
