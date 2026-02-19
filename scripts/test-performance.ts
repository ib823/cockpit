/**
 * Cockpit - Performance Test Script
 *
 * Run comprehensive performance tests
 *
 * Usage:
 *   tsx scripts/test-performance.ts
 */

import { runAllBenchmarks, formatBenchmarkTable } from "../src/lib/performance/benchmarks";

async function main() {
  console.log("🚀 Cockpit Performance Test Suite\n");
  console.log("Running all benchmarks...\n");

  const { results, summary } = await runAllBenchmarks();

  console.log("\n📊 Benchmark Results:\n");
  console.log(formatBenchmarkTable(results));

  console.log("\n📈 Summary:");
  console.log(`  Total tests: ${summary.totalTests}`);
  console.log(`  Successful: ${summary.successful}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`  Total time: ${summary.totalTime.toFixed(2)}ms`);

  console.log("\n✅ Performance tests complete!");

  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("❌ Performance test failed:", error);
  process.exit(1);
});
