// Test setup file
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { TextEncoder, TextDecoder } from 'util';

// Set required environment variables for testing
process.env.NEXTAUTH_SECRET = "test-secret-key-for-jwt-encoding-minimum-32-characters-long";
process.env.ENABLE_MAGIC_LINKS = "true";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/unused";
process.env.DATABASE_URL_UNPOOLED = "postgresql://postgres:postgres@localhost:5432/unused";
process.env.TOTP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.JWT_SECRET_KEY = "test-jwt-secret-key-for-ci-only-32-chars";

// Global next-auth mock
const mockSession = {
  user: {
    id: "mock-user-id",
    email: "admin@example.com",
    name: "Mock Admin",
    role: "ADMIN",
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn().mockResolvedValue(mockSession),
}));

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn().mockResolvedValue(mockSession),
}));

// ============================================================================
// IN-MEMORY PRISMA MOCK WITH STATEFUL STORAGE
// ============================================================================

// Module-level store shared across all mock PrismaClient instances
const _store = new Map<string, any[]>();

function getModelStore(model: string): any[] {
  if (!_store.has(model)) _store.set(model, []);
  return _store.get(model)!;
}

// Relation definitions: parent model → { relationName: { model, fk } }
const RELATION_MAP: Record<string, Record<string, { model: string; fk: string }>> = {
  users: {
    Authenticator: { model: "authenticator", fk: "userId" },
    sessions: { model: "sessions", fk: "userId" },
  },
  ganttProject: {
    collaborators: { model: "projectCollaborator", fk: "projectId" },
  },
};

/**
 * Match a record against a Prisma-style where clause
 */
function matchesWhere(record: any, where: any): boolean {
  if (!where) return true;

  for (const [key, value] of Object.entries(where)) {
    if (key === "OR") {
      if (!(value as any[]).some((clause: any) => matchesWhere(record, clause))) return false;
      continue;
    }
    if (key === "AND") {
      if (!(value as any[]).every((clause: any) => matchesWhere(record, clause))) return false;
      continue;
    }
    if (key === "NOT") {
      if (matchesWhere(record, value)) return false;
      continue;
    }

    const recordValue = record[key];

    // Null match: both null and undefined are considered matching
    if (value === null) {
      if (recordValue !== null && recordValue !== undefined) return false;
      continue;
    }

    // Operator objects (Prisma query filters)
    if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Buffer)) {
      const ops = value as Record<string, any>;
      if ("contains" in ops) {
        if (!String(recordValue || "").includes(ops.contains)) return false;
        continue;
      }
      if ("startsWith" in ops) {
        if (!String(recordValue || "").startsWith(ops.startsWith)) return false;
        continue;
      }
      if ("endsWith" in ops) {
        if (!String(recordValue || "").endsWith(ops.endsWith)) return false;
        continue;
      }
      if ("in" in ops) {
        if (!ops.in.includes(recordValue)) return false;
        continue;
      }
      if ("gte" in ops || "lte" in ops || "gt" in ops || "lt" in ops) {
        if ("gte" in ops && recordValue < ops.gte) return false;
        if ("lte" in ops && recordValue > ops.lte) return false;
        if ("gt" in ops && recordValue <= ops.gt) return false;
        if ("lt" in ops && recordValue >= ops.lt) return false;
        continue;
      }
      if ("equals" in ops) {
        if (recordValue !== ops.equals) return false;
        continue;
      }
      if ("path" in ops) {
        // JSON path query — skip for mock
        continue;
      }
      // Nested relation/sub-query — skip (handled by resolveRelations)
      continue;
    }

    // Direct equality check
    if (recordValue !== value) return false;
  }

  return true;
}

/**
 * Resolve relation includes/selects by looking up related records from the store
 */
function resolveRelations(record: any, modelName: string, includeOrSelect: any): any {
  if (!includeOrSelect || typeof includeOrSelect !== "object") return record;

  const result = { ...record };
  const relations = RELATION_MAP[modelName] || {};

  for (const [key, value] of Object.entries(includeOrSelect)) {
    // Detect relation fields: value is true or an object with where/select/include
    const isRelationValue = value === true ||
      (typeof value === "object" && value !== null &&
        ("where" in (value as any) || "select" in (value as any) || "include" in (value as any)));

    if (!isRelationValue) continue;

    if (key in relations) {
      const relDef = relations[key];
      const relStore = getModelStore(relDef.model);

      let related = relStore.filter(r => r[relDef.fk] === record.id);

      // Apply sub-where if present
      if (typeof value === "object" && value !== null && "where" in (value as any)) {
        related = related.filter(r => matchesWhere(r, (value as any).where));
      }

      result[key] = related;
    } else {
      // Unknown relation — return empty array to prevent undefined access errors
      result[key] = result[key] ?? [];
    }
  }

  return result;
}

// Global Prisma Mocking with in-memory store
vi.mock("@prisma/client", async (importOriginal) => {
  const actual = await importOriginal<any>();

  const createMockModel = (modelName: string) => ({
    findUnique: vi.fn().mockImplementation(({ where, include, select }: any = {}) => {
      const store = getModelStore(modelName);
      const match = store.find(r => matchesWhere(r, where));

      if (match) {
        let result = { ...match };
        result = resolveRelations(result, modelName, include || select);
        return Promise.resolve(result);
      }

      // Fallback: return a default admin user for the mock session identity.
      // This supports tests that use the default mock session without explicitly
      // creating user records in the store (architecture tests, security tests, etc.)
      if (modelName === "users") {
        const isDefaultSessionLookup =
          where?.id === "mock-user-id" || where?.email === "admin@example.com";
        if (isDefaultSessionLookup) {
          return Promise.resolve({
            id: "mock-user-id",
            email: "admin@example.com",
            role: "ADMIN",
            name: "Mock Admin",
            status: "ACTIVE",
            exception: true,
            accessExpiresAt: new Date(Date.now() + 86400000),
            Authenticator: [{ id: "auth-id" }],
            recoveryCodes: [],
            passwordHash: "$2b$12$LQY7v.Z6.test.password.hash.placeholder.value.here",
            totpSecret: "JBSWY3DPEHPK3PXP",
          });
        }
      }

      return Promise.resolve(null);
    }),

    findFirst: vi.fn().mockImplementation(({ where, include, select }: any = {}) => {
      // Simulate Prisma type validation: reject non-numeric values for integer fields
      if (where?.duration && typeof where.duration !== "number") {
        return Promise.reject(new Error("Invalid input for integer field"));
      }

      const store = getModelStore(modelName);
      const match = store.find(r => matchesWhere(r, where));

      if (match) {
        let result = { ...match };
        result = resolveRelations(result, modelName, include || select);
        return Promise.resolve(result);
      }

      return Promise.resolve(null);
    }),

    findMany: vi.fn().mockImplementation(({ where, include, select, take, skip }: any = {}) => {
      const store = getModelStore(modelName);
      let matches = where ? store.filter(r => matchesWhere(r, where)) : [...store];

      if (skip) matches = matches.slice(skip);
      if (take) matches = matches.slice(0, take);

      return Promise.resolve(
        matches.map(r => {
          let result = { ...r };
          result = resolveRelations(result, modelName, include || select);
          return result;
        })
      );
    }),

    create: vi.fn().mockImplementation(({ data }: any) => {
      const now = new Date();
      const record = {
        id: data.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: now,
        updatedAt: now,
        calculatedAt: now,
        ...data,
      };
      getModelStore(modelName).push(record);
      return Promise.resolve({ ...record });
    }),

    createMany: vi.fn().mockImplementation(({ data: items }: any = {}) => {
      if (!items) return Promise.resolve({ count: 0 });
      const store = getModelStore(modelName);
      const now = new Date();
      for (const item of items) {
        store.push({
          id: item.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: now,
          updatedAt: now,
          ...item,
        });
      }
      return Promise.resolve({ count: items.length });
    }),

    update: vi.fn().mockImplementation(({ where, data }: any) => {
      const store = getModelStore(modelName);
      const idx = store.findIndex(r => matchesWhere(r, where));
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...data, updatedAt: new Date() };
        return Promise.resolve({ ...store[idx] });
      }
      return Promise.resolve({ id: "mock-id", ...data });
    }),

    updateMany: vi.fn().mockImplementation(({ where, data }: any = {}) => {
      const store = getModelStore(modelName);
      let count = 0;
      for (let i = 0; i < store.length; i++) {
        if (matchesWhere(store[i], where)) {
          store[i] = { ...store[i], ...data, updatedAt: new Date() };
          count++;
        }
      }
      return Promise.resolve({ count });
    }),

    upsert: vi.fn().mockImplementation(({ where, create: createData, update: updateData }: any) => {
      const store = getModelStore(modelName);
      const idx = store.findIndex(r => matchesWhere(r, where));
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...updateData, updatedAt: new Date() };
        return Promise.resolve({ ...store[idx] });
      }
      const now = new Date();
      const record = {
        id: createData.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: now,
        updatedAt: now,
        calculatedAt: now,
        ...createData,
      };
      store.push(record);
      return Promise.resolve({ ...record });
    }),

    delete: vi.fn().mockImplementation(({ where }: any = {}) => {
      const store = getModelStore(modelName);
      const idx = store.findIndex(r => matchesWhere(r, where));
      if (idx >= 0) {
        const [removed] = store.splice(idx, 1);
        return Promise.resolve({ ...removed });
      }
      return Promise.resolve({ id: "mock-id" });
    }),

    deleteMany: vi.fn().mockImplementation(({ where }: any = {}) => {
      const store = getModelStore(modelName);
      if (!where) {
        const count = store.length;
        store.length = 0;
        return Promise.resolve({ count });
      }
      let count = 0;
      for (let i = store.length - 1; i >= 0; i--) {
        if (matchesWhere(store[i], where)) {
          store.splice(i, 1);
          count++;
        }
      }
      return Promise.resolve({ count });
    }),

    count: vi.fn().mockImplementation(({ where }: any = {}) => {
      const store = getModelStore(modelName);
      if (!where) return Promise.resolve(store.length);
      return Promise.resolve(store.filter(r => matchesWhere(r, where)).length);
    }),

    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  });

  const mockPrisma = new Proxy(
    {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $transaction: vi.fn().mockImplementation((cbOrArray: any) => {
        if (typeof cbOrArray === "function") return cbOrArray(mockPrisma);
        return Promise.all(cbOrArray);
      }),
      $extends: vi.fn().mockReturnThis(),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      $executeRaw: vi.fn().mockResolvedValue(0),
      $use: vi.fn(),
    },
    {
      get: (target, prop) => {
        if (prop in target) return (target as any)[prop];
        if (typeof prop === "string" && !prop.startsWith("$")) {
          if (!(target as any)[prop]) {
            (target as any)[prop] = createMockModel(prop);
          }
          return (target as any)[prop];
        }
        return undefined;
      },
    }
  );

  return {
    ...actual,
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
    CostVisibilityLevel: {
      PUBLIC: "PUBLIC",
      INTERNAL: "INTERNAL",
      FINANCE_ONLY: "FINANCE_ONLY",
      PRESALES_AND_FINANCE: "PRESALES_AND_FINANCE",
    },
    WeekNumberingType: {
      PROJECT_RELATIVE: "PROJECT_RELATIVE",
      ISO_WEEK: "ISO_WEEK",
    },
  };
});

// Mock @/lib/db to return the same mock client
vi.mock("@/lib/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db")>();
  const { PrismaClient } = await import("@prisma/client");
  const mockPrisma = new PrismaClient();
  return {
    ...actual,
    prisma: mockPrisma,
  };
});

// Ensure DOM is cleaned up after each test to prevent state leakage
// Only run in browser/jsdom environment (not in node environment for API tests)
afterEach(() => {
  cleanup();
  // Only manipulate DOM if we're in a browser-like environment
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
    // Remove any lingering portals or overlay elements
    document.querySelectorAll('[data-testid], [role="dialog"], [role="presentation"]').forEach(el => el.remove());
  }
});

// Reset any global mocks before each test
beforeEach(() => {
  // Only manipulate DOM if we're in a browser-like environment
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = "";
  }
});

// Force Node.js TextEncoder/TextDecoder globally (for jose library compatibility)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock window.getComputedStyle for AntD components
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: () => '',
      display: 'none',
      width: '0px',
      height: '0px',
    }),
  });

  // Mock matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}
