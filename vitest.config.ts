import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    // Run auth tests sequentially to avoid database race conditions
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Exclude Playwright e2e tests from Vitest
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/tests/e2e/**",
      "**/tests/**/e2e/**",
      "**/*.spec.ts", // Playwright uses .spec.ts, Vitest uses .test.ts
    ],
    // Coverage configuration (B-05: regression floor thresholds)
    //
    // Floors are set just below MEASURED coverage (2026-08-07, after the dead-code
    // deletion: statements 16.42%, branches 76.06%, functions 54.81%, lines 16.42%)
    // so they act as a real regression floor. They were previously all 0, which
    // meant coverage could fall to nothing with CI still green.
    //
    // Re-baselined once: the first floors were measured BEFORE 262 unreachable
    // files were deleted, and removing that much code changes the denominator.
    // Statements/lines rose sharply (10.1% -> 16.42%) because most deleted files
    // reported 0%; functions fell (62.66% -> 54.81%). Re-baselining after a
    // deliberate composition change is legitimate; lowering a floor to make a
    // red build pass is not. Do the former, never the latter.
    //
    // Raise these as coverage improves; never lower them to make a build pass.
    //
    // Why statements/lines sit so far below branches/functions: a large share of
    // src/ is unreachable from any route (dead components, abandoned features),
    // and every one of those files reports 0%. Deleting that code raises the
    // statement figure without writing a single new test.
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 15,
        branches: 73,
        functions: 52,
        lines: 15,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
