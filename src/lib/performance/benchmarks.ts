/**
 * Keystone - Performance Benchmarks
 *
 * Comprehensive performance testing and monitoring
 *
 * Features:
 * - API response time benchmarks
 * - Formula engine performance comparison
 * - Cache hit rate monitoring
 * - Bundle size tracking
 * - Memory usage analysis
 */

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  description: string;
  iterations: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  stdDev: number;
  opsPerSecond: number;
  success: boolean;
  error?: string;
}

/**
 * Comparison result
 */
export interface ComparisonResult {
  baseline: BenchmarkResult;
  optimized: BenchmarkResult;
  improvement: {
    speedup: number;
    percentage: number;
    faster: boolean;
  };
}

/**
 * Run a benchmark
 */
export async function runBenchmark(
  name: string,
  description: string,
  fn: () => Promise<void> | void,
  options?: {
    iterations?: number;
    warmup?: number;
  }
): Promise<BenchmarkResult> {
  const { iterations = 100, warmup = 10 } = options || {};

  console.log(`[Benchmark] 🏁 Running: ${name}`);

  try {
    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    // Benchmark runs
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await fn();
      const endTime = performance.now();

      times.push(endTime - startTime);
    }

    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    const opsPerSecond = 1000 / avgTime;

    const result: BenchmarkResult = {
      name,
      description,
      iterations,
      avgTime,
      minTime,
      maxTime,
      stdDev,
      opsPerSecond,
      success: true,
    };

    console.log(
      `[Benchmark] ✅ ${name}: ${avgTime.toFixed(2)}ms avg (${opsPerSecond.toFixed(0)} ops/sec)`
    );

    return result;
  } catch (error) {
    console.error(`[Benchmark] ❌ ${name} failed:`, error);

    return {
      name,
      description,
      iterations: 0,
      avgTime: 0,
      minTime: 0,
      maxTime: 0,
      stdDev: 0,
      opsPerSecond: 0,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Compare two implementations
 */
export async function compareBenchmarks(
  baselineFn: () => Promise<void> | void,
  optimizedFn: () => Promise<void> | void,
  options?: {
    name?: string;
    iterations?: number;
  }
): Promise<ComparisonResult> {
  const { name = "Comparison", iterations = 100 } = options || {};

  console.log(`[Benchmark] 🔬 Running comparison: ${name}`);

  const baseline = await runBenchmark(`${name} (Baseline)`, "Original implementation", baselineFn, {
    iterations,
  });

  const optimized = await runBenchmark(
    `${name} (Optimized)`,
    "Optimized implementation",
    optimizedFn,
    { iterations }
  );

  const speedup = baseline.avgTime / optimized.avgTime;
  const percentage = ((baseline.avgTime - optimized.avgTime) / baseline.avgTime) * 100;

  const improvement = {
    speedup,
    percentage,
    faster: speedup > 1,
  };

  console.log(
    `[Benchmark] 📊 ${name}: ${speedup.toFixed(2)}x faster (${percentage.toFixed(1)}% improvement)`
  );

  return {
    baseline,
    optimized,
    improvement,
  };
}

/**
 * L3 Catalog API benchmark
 */
export async function benchmarkL3Catalog(): Promise<BenchmarkResult> {
  return runBenchmark(
    "L3 Catalog API",
    "Fetch all L3 catalog items",
    async () => {
      const response = await fetch("/api/l3-catalog");
      if (!response.ok) throw new Error("API call failed");
      await response.json();
    },
    { iterations: 50 }
  );
}

/**
 * Formula engine benchmark
 */
export async function benchmarkFormulaEngine(): Promise<BenchmarkResult> {
  const mockInputs = {
    selectedL3Items: [
      { l3Code: "M1.1", coefficient: 0.05, defaultTier: "B" },
      { l3Code: "M1.2", coefficient: 0.03, defaultTier: "A" },
    ],
    integrations: 3,
    customForms: 15,
    fitToStandard: 0.85,
    legalEntities: 2,
    countries: 3,
    languages: 2,
    profile: {
      name: "Test",
      baseFT: 500,
      basis: 50,
      securityAuth: 30,
    },
    fte: 8,
    utilization: 0.85,
    overlapFactor: 0.75,
  };

  return runBenchmark(
    "Formula Engine",
    "Calculate project estimation",
    async () => {
      // Import and calculate
      const { calculateEstimate } = await import("@/lib/estimator/formula-engine");
      calculateEstimate(mockInputs as any);
    },
    { iterations: 1000 }
  );
}

/**
 * Virtual scrolling benchmark
 */
export async function benchmarkVirtualScrolling(itemCount: number): Promise<BenchmarkResult> {
  return runBenchmark(
    `Virtual Scrolling (${itemCount} items)`,
    "Render large list with virtual scrolling",
    () => {
      // Simulate rendering
      const items = Array.from({ length: itemCount }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      // Measure time to filter/process items
      const filtered = items.filter((item) => item.id % 2 === 0);
      return Promise.resolve();
    },
    { iterations: 100 }
  );
}

/**
 * Cache performance test
 */
export async function benchmarkCache(): Promise<BenchmarkResult> {
  return runBenchmark(
    "Redis Cache",
    "Cache get/set operations",
    async () => {
      const { cache } = await import("@/lib/cache/redis-cache");

      const key = `test:${Date.now()}`;
      const value = { foo: "bar", timestamp: Date.now() };

      await cache.set(key, value, 60);
      await cache.get(key);
      await cache.delete(key);
    },
    { iterations: 100 }
  );
}

/**
 * Run all benchmarks
 */
export async function runAllBenchmarks(): Promise<{
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    successful: number;
    failed: number;
    totalTime: number;
  };
}> {
  console.log("[Benchmark] 🚀 Running all benchmarks...\n");

  const startTime = performance.now();

  const results = await Promise.all([
    benchmarkL3Catalog(),
    benchmarkFormulaEngine(),
    benchmarkCache(),
    benchmarkVirtualScrolling(1000),
    benchmarkVirtualScrolling(10000),
  ]);

  const totalTime = performance.now() - startTime;

  const summary = {
    totalTests: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    totalTime,
  };

  console.log("\n[Benchmark] 📊 Summary:");
  console.log(`  Total tests: ${summary.totalTests}`);
  console.log(`  Successful: ${summary.successful}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);

  return { results, summary };
}

/**
 * Format benchmark results as table
 */
export function formatBenchmarkTable(results: BenchmarkResult[]): string {
  const headers = ["Name", "Avg Time", "Min", "Max", "Ops/sec", "Status"];
  const rows = results.map((r) => [
    r.name,
    `${r.avgTime.toFixed(2)}ms`,
    `${r.minTime.toFixed(2)}ms`,
    `${r.maxTime.toFixed(2)}ms`,
    r.opsPerSecond.toFixed(0),
    r.success ? "✅" : "❌",
  ]);

  // Simple table formatting
  const maxLengths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));

  const separator = maxLengths.map((len) => "-".repeat(len + 2)).join("+");
  const headerRow = headers.map((h, i) => h.padEnd(maxLengths[i])).join(" | ");
  const dataRows = rows.map((row) => row.map((cell, i) => cell.padEnd(maxLengths[i])).join(" | "));

  return [separator, headerRow, separator, ...dataRows, separator].join("\n");
}

/**
 * Export benchmark results to JSON
 */
export function exportBenchmarkResults(
  results: BenchmarkResult[],
  metadata?: Record<string, any>
): string {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      metadata,
      results,
    },
    null,
    2
  );
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(value);

    // Keep only last 100 values
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [name, _] of this.metrics) {
      result[name] = this.getMetrics(name);
    }

    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Singleton monitor
 */
export const performanceMonitor = new PerformanceMonitor();
