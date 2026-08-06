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
    // Floors are set just below MEASURED coverage (2026-08-06: statements 10.1%,
    // branches 77.59%, functions 62.66%, lines 10.1%) so they act as a real
    // regression floor. They were previously all 0, which meant coverage could
    // fall to nothing with CI still green — the gate could not fail.
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
        statements: 9,
        branches: 74,
        functions: 59,
        lines: 9,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
