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
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 10,
        branches: 70,
        functions: 50,
        lines: 10,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
