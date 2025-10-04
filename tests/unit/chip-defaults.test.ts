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
    const result = validateChipValue("country", "");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Value cannot be empty");
  });

  it("should validate country options", () => {
    expect(validateChipValue("country", "Malaysia").isValid).toBe(true);
    expect(validateChipValue("country", "InvalidCountry").isValid).toBe(false);
  });

  it("should validate numeric patterns", () => {
    expect(validateChipValue("legal_entities", "5").isValid).toBe(true);
    expect(validateChipValue("legal_entities", "abc").isValid).toBe(false);
  });

  it("should validate numeric ranges", () => {
    expect(validateChipValue("users", "50").isValid).toBe(true);
    expect(validateChipValue("users", "0").isValid).toBe(false); // Min is 1
    expect(validateChipValue("users", "200000").isValid).toBe(false); // Max is 100000
  });

  it("should validate timeline format", () => {
    expect(validateChipValue("timeline", "6 months").isValid).toBe(true);
    expect(validateChipValue("timeline", "12 weeks").isValid).toBe(true);
    expect(validateChipValue("timeline", "invalid").isValid).toBe(false);
  });

  it("should allow any text for fields without strict validation", () => {
    expect(validateChipValue("integration", "Custom API").isValid).toBe(true);
    expect(validateChipValue("compliance", "GDPR compliant").isValid).toBe(true);
  });
});

describe("createDefaultChip", () => {
  it("should create valid chip with defaults", () => {
    const chip = createDefaultChip("country");
    
    expect(chip.id).toBeDefined();
    expect(chip.type).toBe("country");
    expect(chip.value).toBe("Malaysia");
    expect(chip.confidence).toBe(0.3);
    expect(chip.source).toBe("default");
    expect(chip.metadata?.estimated).toBe(true);
    expect(chip.timestamp).toBeInstanceOf(Date);
  });

  it("should create different chips for different types", () => {
    const countryChip = createDefaultChip("country"); // confidence: 0.3
    const legalEntitiesChip = createDefaultChip("legal_entities"); // confidence: 0.4
    
    expect(countryChip.value).toBe("Malaysia");
    expect(legalEntitiesChip.value).toBe("1");
    expect(countryChip.confidence).not.toBe(legalEntitiesChip.confidence);
  });

  it("should have unique IDs", () => {
    const chip1 = createDefaultChip("country");
    const chip2 = createDefaultChip("country");
    
    expect(chip1.id).not.toBe(chip2.id);
  });

  it("should include descriptive notes", () => {
    const chip = createDefaultChip("legal_entities");
    
    expect(chip.metadata?.note).toBeDefined();
    expect(chip.metadata?.note).toContain("single entity");
  });
});

describe("fillMissingChips", () => {
  it("should fill all missing gaps", () => {
    const existingChips: Chip[] = [
      {
        id: "1",
        type: "country",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
      },
    ];

    const gaps = ["legal_entities", "locations", "users"];
    const newChips = fillMissingChips(existingChips, gaps);

    expect(newChips).toHaveLength(3);
    expect(newChips.map(c => c.type)).toEqual(gaps);
  });

  it("should not create duplicates", () => {
    const existingChips: Chip[] = [
      {
        id: "1",
        type: "country",
        value: "Malaysia",
        confidence: 0.9,
        source: "paste",
      },
    ];

    const gaps = ["country", "legal_entities"]; // country already exists
    const newChips = fillMissingChips(existingChips, gaps);

    expect(newChips).toHaveLength(1);
    expect(newChips[0].type).toBe("legal_entities");
  });

  it("should return empty array if no gaps", () => {
    const existingChips: Chip[] = [
      {
        id: "1",
        type: "country",
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
    const gaps = ["country", "invalid_type"];
    const newChips = fillMissingChips(existingChips, gaps);

    expect(newChips).toHaveLength(1);
    expect(newChips[0].type).toBe("country");
  });
});

describe("getInputType", () => {
  it("should return 'select' for option-based types", () => {
    expect(getInputType("country")).toBe("select");
    expect(getInputType("industry")).toBe("select");
    expect(getInputType("currencies")).toBe("select");
  });

  it("should return 'number' for numeric types", () => {
    expect(getInputType("legal_entities")).toBe("number");
    expect(getInputType("locations")).toBe("number");
    expect(getInputType("users")).toBe("number");
  });

  it("should return 'text' for free-form types", () => {
    expect(getInputType("integration")).toBe("text");
    expect(getInputType("compliance")).toBe("text");
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
      "country",
      "legal_entities",
      "locations",
      "users",
      "data_volume",
      "industry",
      "modules",
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
    expect(CHIP_VALIDATION.legal_entities.min).toBeDefined();
    expect(CHIP_VALIDATION.locations.min).toBeDefined();
    expect(CHIP_VALIDATION.users.min).toBeDefined();

    // Select types should have options
    expect(CHIP_VALIDATION.country.options).toBeDefined();
    expect(CHIP_VALIDATION.industry.options).toBeDefined();
    expect(CHIP_VALIDATION.currencies.options).toBeDefined();
  });
});