import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaConnecting?: Promise<void>;
};

// Connection pool configuration optimized for serverless/edge
const prismaClientSingleton = () => {
  // Build connection URL with pooling parameters
  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT
    ? parseInt(process.env.DATABASE_CONNECTION_LIMIT)
    : 5; // Conservative default for serverless

  // Add connection pooling parameters to URL if DATABASE_URL doesn't already have them
  let databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl += `${separator}connection_limit=${connectionLimit}&pool_timeout=20`;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],

    // Override datasource URL with pooling parameters
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// In development, store the client globally to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  const cleanup = async () => {
    await prisma.$disconnect();
  };

  process.on('beforeExit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

/**
 * Execute a database operation with automatic retry on connection errors
 * Handles transient connection failures gracefully
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Test connection health before operation
      if (attempt > 0) {
        await prisma.$queryRaw`SELECT 1`;
      }

      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection error worth retrying
      const isConnectionError =
        error?.message?.includes('connection') ||
        error?.message?.includes('Connection') ||
        error?.message?.includes('Closed') ||
        error?.code === 'P1001' || // Can't reach database
        error?.code === 'P1002' || // Database timeout
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P1017';   // Server closed connection

      if (!isConnectionError || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = delayMs * Math.pow(2, attempt) + Math.random() * 100;
      console.warn(`[DB] Connection error, retrying in ${delay.toFixed(0)}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    return false;
  }
}
