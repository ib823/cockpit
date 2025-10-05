/**
 * MILESTONE 4: DATABASE CLIENT (Enhanced)
 *
 * Prisma client singleton for database operations.
 * Follows Next.js best practices for dev/prod environments.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database connection status check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown (alias for backward compatibility)
export async function disconnect() {
  await prisma.$disconnect();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
