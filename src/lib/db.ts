import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaConnecting?: Promise<void>;
};

/**
 * Query performance monitoring
 */
interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  avgQueryTime: number;
  maxQueryTime: number;
}

class QueryMonitor {
  private stats: QueryStats = {
    totalQueries: 0,
    slowQueries: 0,
    avgQueryTime: 0,
    maxQueryTime: 0,
  };

  private queryTimes: number[] = [];
  private readonly slowQueryThreshold = 100; // ms

  recordQuery(duration: number) {
    this.stats.totalQueries++;
    this.queryTimes.push(duration);

    if (duration > this.slowQueryThreshold) {
      this.stats.slowQueries++;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[DB] ⚠️  Slow query: ${duration.toFixed(2)}ms`);
      }
    }

    // Keep only last 100 query times
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }

    // Update stats
    this.stats.avgQueryTime =
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    this.stats.maxQueryTime = Math.max(...this.queryTimes);
  }

  getStats(): QueryStats {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      avgQueryTime: 0,
      maxQueryTime: 0,
    };
    this.queryTimes = [];
  }
}

const queryMonitor = new QueryMonitor();

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

  const client = new PrismaClient({
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

  // Add query performance monitoring using Prisma Extensions (Prisma 5+)
  const extendedClient = client.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const startTime = performance.now();
          const result = await query(args);
          const duration = performance.now() - startTime;

          queryMonitor.recordQuery(duration);

          if (process.env.NODE_ENV === 'development' && duration > 50) {
            console.log(`[DB] ${model}.${operation} - ${duration.toFixed(2)}ms`);
          }

          return result;
        },
      },
    },
  });

  return extendedClient;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// In development, store the client globally to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Warm up database connection on serverless cold start
 * This helps prevent timeouts on the first request after deployment
 */
async function warmupConnection() {
  if (globalForPrisma.prismaConnecting) {
    return globalForPrisma.prismaConnecting;
  }

  globalForPrisma.prismaConnecting = (async () => {
    try {
      const startTime = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = performance.now() - startTime;
      console.log(`[DB] Connection warmed up in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('[DB] Failed to warm up connection:', error);
    } finally {
      globalForPrisma.prismaConnecting = undefined;
    }
  })();

  return globalForPrisma.prismaConnecting;
}

// Warm up connection in production on module load (for serverless cold starts)
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  warmupConnection().catch(err => {
    console.error('[DB] Connection warmup failed:', err);
  });
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
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = performance.now() - startTime;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    const latency = performance.now() - startTime;
    console.error('[DB] Health check failed:', error);

    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get query statistics
 */
export function getQueryStats(): QueryStats {
  return queryMonitor.getStats();
}

/**
 * Reset query statistics
 */
export function resetQueryStats(): void {
  queryMonitor.reset();
}
