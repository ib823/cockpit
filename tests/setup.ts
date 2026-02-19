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

// Global Prisma Mocking
// This prevents tests from trying to connect to a real database
vi.mock("@prisma/client", async (importOriginal) => {
  const actual = await importOriginal<any>();
  
  const createMockModel = (modelName: string) => ({
    findUnique: vi.fn().mockImplementation(({ where }) => {
      // Security test: simulate null for injection attempts
      if (where?.email && (where.email.includes("'") || where.email.includes("--") || where.email.includes(";"))) {
        return Promise.resolve(null);
      }
      
      // Return a valid user if email looks like a standard one
      if (where?.email && !where.email.includes("notfound")) {
        const isExpired = where.email.includes("expired");
        const hasNoPasskey = where.email.includes("nopasskey");
        
        return Promise.resolve({
          id: "mock-user-id",
          email: where.email,
          role: "ADMIN",
          name: "Mock Admin",
          status: "ACTIVE",
          accessExpiresAt: isExpired ? new Date(Date.now() - 86400000) : new Date(Date.now() + 86400000),
          Authenticator: hasNoPasskey ? [] : [{ id: "auth-id" }],
          recoveryCodes: [],
          passwordHash: "$2b$12$LQY7v.Z6.test.password.hash.placeholder.value.here", // Valid bcrypt hash format
          totpSecret: "JBSWY3DPEHPK3PXP", // Valid base32 secret
        });
      }
      return Promise.resolve(null);
    }),
    findFirst: vi.fn().mockImplementation(({ where }) => {
      // Security test: simulate database type error for non-numeric input in integer fields
      if (where?.duration && typeof where.duration !== 'number') {
        return Promise.reject(new Error("Invalid input for integer field"));
      }
      return Promise.resolve(null);
    }),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "mock-id", ...data })),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "mock-id", ...data })),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({ id: "mock-id", ...create })),
    delete: vi.fn().mockResolvedValue({ id: "mock-id" }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  });

  const mockPrisma = new Proxy(
    {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $transaction: vi.fn().mockImplementation((cb) => {
        if (typeof cb === 'function') return cb(mockPrisma);
        return Promise.resolve(cb);
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
