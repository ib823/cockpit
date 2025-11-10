/**
 * Test Setup & Database Utilities
 * Provides test database setup, cleanup, and fixture management
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

// Use separate test database
const DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set");
}

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

/**
 * Clean up all test data
 */
/*export async function cleanupTestData() {
  await testPrisma.$transaction([
    testPrisma.auditEvent.deleteMany({ where: { meta: { path: ['test_marker'], equals: true } } }),
    testPrisma.authenticator.deleteMany({ where: { userId: { startsWith: 'test-' } } }),
    testPrisma.emailApproval.deleteMany({ where: { email: { contains: 'test-' } } }),
    testPrisma.magic_tokens.deleteMany({ where: { email: { contains: 'test-' } } }),
    testPrisma.sessions.deleteMany({ where: { userId: { startsWith: 'test-' } } }),
    testPrisma.users.deleteMany({ where: { id: { startsWith: 'test-' } } }),
  ]);*/
export async function cleanupTestData() {
  // Delete child records first (in order of foreign key dependencies)
  // Run sequentially to avoid foreign key constraint violations
  await testPrisma.auditEvent.deleteMany({ where: { meta: { path: ["test_marker"], equals: true } } });
  await testPrisma.authenticator.deleteMany({ where: { userId: { startsWith: "test-" } } });
  await testPrisma.sessions.deleteMany({ where: { userId: { startsWith: "test-" } } });
  await testPrisma.emailApproval.deleteMany({
    where: {
      OR: [{ email: { contains: "test-" } }, { email: { contains: "@example.com" } }],
    },
  });
  await testPrisma.magic_tokens.deleteMany({
    where: {
      OR: [{ email: { contains: "test-" } }, { email: { contains: "@example.com" } }],
    },
  });
  // Delete parent records last
  await testPrisma.users.deleteMany({
    where: {
      OR: [{ id: { startsWith: "test-" } }, { email: { contains: "@example.com" } }],
    },
  });
}

/**
 * Setup test database before all tests
 */
export async function setupTestDatabase() {
  await cleanupTestData();
}

/**
 * Teardown test database after all tests
 */
export async function teardownTestDatabase() {
  await cleanupTestData();
  await testPrisma.$disconnect();
}

/**
 * Create test user with authenticator (passkey)
 */
export async function createTestUserWithPasskey(options: {
  email: string;
  role?: "USER" | "ADMIN" | "MANAGER";
  accessExpiresAt?: Date;
  exception?: boolean;
  name?: string;
}) {
  const userId = `test-${randomUUID()}`;
  const authenticatorId = randomUUID();

  const user = await testPrisma.users.create({
    data: {
      id: userId,
      email: options.email,
      name: options.name || options.email.split("@")[0],
      role: options.role || "USER",
      accessExpiresAt: options.accessExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      exception: options.exception || false,
      updatedAt: new Date(),
    },
  });

  const authenticator = await testPrisma.authenticator.create({
    data: {
      id: authenticatorId,
      userId: user.id,
      publicKey: Buffer.from("test-public-key"),
      counter: 0,
      transports: ["internal"],
      deviceType: "platform",
      backedUp: false,
    },
  });

  return { user, authenticator };
}

/**
 * Create test user without passkey (needs registration)
 */
export async function createTestUserWithoutPasskey(options: {
  email: string;
  role?: "USER" | "ADMIN" | "MANAGER";
  hasApproval?: boolean;
}) {
  const userId = `test-${randomUUID()}`;

  const user = await testPrisma.users.create({
    data: {
      id: userId,
      email: options.email,
      name: options.email.split("@")[0],
      role: options.role || "USER",
      accessExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      exception: false,
      updatedAt: new Date(),
    },
  });

  if (options.hasApproval) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = await hash(code, 10);

    await testPrisma.emailApproval.create({
      data: {
        email: options.email,
        tokenHash,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        approvedByUserId: "test-admin",
      },
    });
  }

  return { user };
}

/**
 * Create test admin with code
 */
export async function createTestAdmin(options: {
  email: string;
  code: string;
  codeExpired?: boolean;
  codeUsed?: boolean;
  accessExpired?: boolean;
}) {
  const userId = `test-${randomUUID()}`;
  const tokenHash = await hash(options.code, 10);

  const user = await testPrisma.users.create({
    data: {
      id: userId,
      email: options.email,
      name: "Test Admin",
      role: "ADMIN",
      accessExpiresAt: options.accessExpired
        ? new Date(Date.now() - 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      exception: !options.accessExpired,
      updatedAt: new Date(),
    },
  });

  await testPrisma.emailApproval.create({
    data: {
      email: options.email,
      tokenHash,
      tokenExpiresAt: options.codeExpired
        ? new Date(Date.now() - 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      approvedByUserId: "system",
      usedAt: options.codeUsed ? new Date() : null,
    },
  });

  return { user, code: options.code };
}

/**
 * Create test magic token
 */
export async function createTestMagicToken(options: {
  email: string;
  expired?: boolean;
  used?: boolean;
}) {
  const token = randomUUID();

  await testPrisma.magic_tokens.create({
    data: {
      id: randomUUID(),
      email: options.email,
      token,
      expiresAt: options.expired
        ? new Date(Date.now() - 1000)
        : new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      usedAt: options.used ? new Date() : null,
    },
  });

  return token;
}

/**
 * Mock WebAuthn challenge storage
 */
export class MockChallengeStore {
  private challenges = new Map<string, string>();

  async set(key: string, value: string): Promise<void> {
    this.challenges.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.challenges.get(key) || null;
  }

  async del(key: string): Promise<void> {
    this.challenges.delete(key);
  }

  clear(): void {
    this.challenges.clear();
  }
}

export const mockChallenges = new MockChallengeStore();
