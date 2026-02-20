/**
 * F-01: API Contract Validation Tests
 *
 * Verifies that Zod schemas in src/lib/api-validators.ts enforce
 * expected constraints. Guards against accidental schema relaxation.
 */

import { describe, it, expect } from "vitest";
import {
  ProjectCreateSchema,
  ProjectUpdateSchema,
  PhaseCreateSchema,
  ResourceSchema,
  MilestoneSchema,
  CommentCreateSchema,
  CommentUpdateSchema,
  ChipSchema,
  ChipBulkCreateSchema,
  ExportSchema,
  ShareCreateSchema,
  UserUpdateSchema,
  AdminAccessSchema,
  AdminApprovalSchema,
  RICEFWItemSchema,
  IntegrationItemSchema,
  ProjectFilterSchema,
  validateRequest,
  ValidationError,
} from "@/lib/api-validators";

// ───────────────────────────────────────────────────────────────
// ProjectCreateSchema
// ───────────────────────────────────────────────────────────────
describe("ProjectCreateSchema", () => {
  const valid = { name: "Project Alpha" };

  it("accepts minimal valid input", () => {
    expect(ProjectCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts full valid input", () => {
    const full = {
      name: "Project Alpha",
      description: "A description",
      clientName: "Acme Corp",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "DRAFT",
      complexity: "complex",
      region: "EMEA",
      industry: "Tech",
      employees: 500,
      revenue: 1000000,
    };
    expect(ProjectCreateSchema.safeParse(full).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(ProjectCreateSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    expect(ProjectCreateSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });

  it("rejects endDate before startDate", () => {
    const result = ProjectCreateSchema.safeParse({
      name: "Test",
      startDate: "2026-12-31",
      endDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative revenue", () => {
    expect(
      ProjectCreateSchema.safeParse({ name: "Test", revenue: -1 }).success
    ).toBe(false);
  });

  it("rejects invalid status enum", () => {
    expect(
      ProjectCreateSchema.safeParse({ name: "Test", status: "INVALID" }).success
    ).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// ProjectUpdateSchema (partial of create)
// ───────────────────────────────────────────────────────────────
describe("ProjectUpdateSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(ProjectUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update", () => {
    expect(ProjectUpdateSchema.safeParse({ name: "New Name" }).success).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────
// PhaseCreateSchema
// ───────────────────────────────────────────────────────────────
describe("PhaseCreateSchema", () => {
  const valid = {
    name: "Phase 1",
    workingDays: 30,
    category: "build",
    effort: 100,
    order: 0,
  };

  it("accepts valid phase", () => {
    expect(PhaseCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects workingDays=0", () => {
    expect(PhaseCreateSchema.safeParse({ ...valid, workingDays: 0 }).success).toBe(false);
  });

  it("rejects workingDays>365", () => {
    expect(PhaseCreateSchema.safeParse({ ...valid, workingDays: 400 }).success).toBe(false);
  });

  it("validates color hex format", () => {
    expect(PhaseCreateSchema.safeParse({ ...valid, color: "#FF0000" }).success).toBe(true);
    expect(PhaseCreateSchema.safeParse({ ...valid, color: "red" }).success).toBe(false);
    expect(PhaseCreateSchema.safeParse({ ...valid, color: "#GG0000" }).success).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// ResourceSchema
// ───────────────────────────────────────────────────────────────
describe("ResourceSchema", () => {
  const valid = {
    name: "John Doe",
    role: "Developer",
    allocation: 100,
    hourlyRate: 150,
    region: "US-East",
  };

  it("accepts valid resource", () => {
    expect(ResourceSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects allocation over 150%", () => {
    expect(ResourceSchema.safeParse({ ...valid, allocation: 200 }).success).toBe(false);
  });

  it("rejects negative hourlyRate", () => {
    expect(ResourceSchema.safeParse({ ...valid, hourlyRate: -10 }).success).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// MilestoneSchema
// ───────────────────────────────────────────────────────────────
describe("MilestoneSchema", () => {
  const valid = {
    name: "Go Live",
    date: "2026-06-15",
    status: "PENDING",
  };

  it("accepts valid milestone", () => {
    expect(MilestoneSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all status values", () => {
    for (const status of ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"]) {
      expect(MilestoneSchema.safeParse({ ...valid, status }).success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    expect(MilestoneSchema.safeParse({ ...valid, status: "DONE" }).success).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// CommentCreateSchema / CommentUpdateSchema
// ───────────────────────────────────────────────────────────────
describe("CommentCreateSchema", () => {
  it("accepts valid comment", () => {
    expect(CommentCreateSchema.safeParse({ content: "LGTM" }).success).toBe(true);
  });

  it("rejects empty content", () => {
    expect(CommentCreateSchema.safeParse({ content: "" }).success).toBe(false);
  });

  it("rejects content over 2000 chars", () => {
    expect(CommentCreateSchema.safeParse({ content: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("CommentUpdateSchema", () => {
  it("accepts partial update", () => {
    expect(CommentUpdateSchema.safeParse({ resolved: true }).success).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────
// ChipSchema / ChipBulkCreateSchema
// ───────────────────────────────────────────────────────────────
describe("ChipSchema", () => {
  const valid = { type: "COUNTRY", value: "Germany", confidence: 0.95 };

  it("accepts valid chip", () => {
    expect(ChipSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all chip types", () => {
    const types = [
      "COUNTRY", "EMPLOYEES", "REVENUE", "INDUSTRY", "MODULES",
      "TIMELINE", "INTEGRATION", "COMPLIANCE", "LEGAL_ENTITIES",
      "SSO", "BANKING", "EXISTING_SYSTEM", "LOCATIONS", "USERS",
      "DATA_VOLUME", "CURRENCIES", "LANGUAGES",
    ];
    for (const type of types) {
      expect(ChipSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it("rejects confidence out of [0,1]", () => {
    expect(ChipSchema.safeParse({ ...valid, confidence: -0.1 }).success).toBe(false);
    expect(ChipSchema.safeParse({ ...valid, confidence: 1.1 }).success).toBe(false);
  });
});

describe("ChipBulkCreateSchema", () => {
  it("rejects more than 100 items", () => {
    const chips = Array.from({ length: 101 }, () => ({
      type: "COUNTRY",
      value: "X",
      confidence: 0.5,
    }));
    expect(ChipBulkCreateSchema.safeParse(chips).success).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// ExportSchema
// ───────────────────────────────────────────────────────────────
describe("ExportSchema", () => {
  it("accepts valid export", () => {
    expect(ExportSchema.safeParse({ format: "excel" }).success).toBe(true);
    expect(ExportSchema.safeParse({ format: "pdf" }).success).toBe(true);
    expect(ExportSchema.safeParse({ format: "pptx" }).success).toBe(true);
  });

  it("rejects unsupported format", () => {
    expect(ExportSchema.safeParse({ format: "csv" }).success).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// ShareCreateSchema
// ───────────────────────────────────────────────────────────────
describe("ShareCreateSchema", () => {
  it("accepts valid share", () => {
    const result = ShareCreateSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID projectId", () => {
    expect(ShareCreateSchema.safeParse({ projectId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects expiresInDays over 365", () => {
    expect(
      ShareCreateSchema.safeParse({
        projectId: "123e4567-e89b-12d3-a456-426614174000",
        expiresInDays: 400,
      }).success
    ).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// UserUpdateSchema / AdminAccessSchema / AdminApprovalSchema
// ───────────────────────────────────────────────────────────────
describe("UserUpdateSchema", () => {
  it("accepts valid update", () => {
    expect(UserUpdateSchema.safeParse({ name: "Alice" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(UserUpdateSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });

  it("rejects invalid role", () => {
    expect(UserUpdateSchema.safeParse({ role: "SUPERADMIN" }).success).toBe(false);
  });
});

describe("AdminAccessSchema", () => {
  it("requires email and expiresInDays", () => {
    expect(AdminAccessSchema.safeParse({}).success).toBe(false);
    expect(
      AdminAccessSchema.safeParse({ email: "a@b.com", expiresInDays: 30 }).success
    ).toBe(true);
  });
});

describe("AdminApprovalSchema", () => {
  it("accepts approve/deny actions", () => {
    expect(
      AdminApprovalSchema.safeParse({ email: "a@b.com", action: "approve" }).success
    ).toBe(true);
    expect(
      AdminApprovalSchema.safeParse({ email: "a@b.com", action: "deny" }).success
    ).toBe(true);
  });

  it("rejects unknown action", () => {
    expect(
      AdminApprovalSchema.safeParse({ email: "a@b.com", action: "ban" }).success
    ).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// RICEFWItemSchema
// ───────────────────────────────────────────────────────────────
describe("RICEFWItemSchema", () => {
  const valid = {
    type: "REPORT",
    name: "Sales Report",
    complexity: "MEDIUM",
    count: 5,
    effortPerItem: 40,
    phase: "Build",
  };

  it("accepts valid RICEFW item", () => {
    expect(RICEFWItemSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all RICEFW types", () => {
    for (const type of ["REPORT", "INTERFACE", "CONVERSION", "ENHANCEMENT", "FORM", "WORKFLOW"]) {
      expect(RICEFWItemSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });
});

// ───────────────────────────────────────────────────────────────
// IntegrationItemSchema
// ───────────────────────────────────────────────────────────────
describe("IntegrationItemSchema", () => {
  const valid = {
    name: "SAP Gateway",
    type: "API",
    source: "SAP",
    target: "CRM",
    complexity: "HIGH",
    volume: "MEDIUM",
    effort: 200,
  };

  it("accepts valid integration item", () => {
    expect(IntegrationItemSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unsupported type", () => {
    expect(IntegrationItemSchema.safeParse({ ...valid, type: "GRAPHQL" }).success).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// ProjectFilterSchema
// ───────────────────────────────────────────────────────────────
describe("ProjectFilterSchema", () => {
  it("accepts empty filters", () => {
    expect(ProjectFilterSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid filters", () => {
    expect(
      ProjectFilterSchema.safeParse({
        status: "DRAFT",
        search: "alpha",
        page: 1,
        limit: 25,
      }).success
    ).toBe(true);
  });

  it("rejects limit > 100", () => {
    expect(ProjectFilterSchema.safeParse({ limit: 200 }).success).toBe(false);
  });

  it("rejects page < 1", () => {
    expect(ProjectFilterSchema.safeParse({ page: 0 }).success).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// validateRequest helper
// ───────────────────────────────────────────────────────────────
describe("validateRequest helper", () => {
  it("returns validated data on success", () => {
    const result = validateRequest(CommentCreateSchema, { content: "OK" });
    expect(result.content).toBe("OK");
  });

  it("throws ValidationError on invalid input", () => {
    expect(() => validateRequest(CommentCreateSchema, { content: "" })).toThrow(
      ValidationError
    );
  });

  it("ValidationError has fieldErrors", () => {
    try {
      validateRequest(CommentCreateSchema, { content: "" });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fieldErrors).toBeDefined();
    }
  });
});
