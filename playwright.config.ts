import { defineConfig, devices } from "@playwright/test";

/**
 * Dev-server port. Defaults to the port `pnpm dev` binds (see package.json);
 * override with PLAYWRIGHT_PORT to test against an already-running server.
 */
const E2E_PORT = process.env.PLAYWRIGHT_PORT ?? "3002";
const E2E_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${E2E_PORT}`;

/**
 * Playwright Configuration for Cockpit E2E Tests
 *
 * Focused on responsive design testing across multiple devices
 */

export default defineConfig({
  testDir: "./tests/e2e",

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Global test settings
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Device/browser configurations
  projects: [
    // Mobile devices
    {
      name: "iphone-se",
      use: {
        ...devices["iPhone SE"],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: "iphone-12",
      use: {
        ...devices["iPhone 12"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "iphone-14-pro-max",
      use: {
        ...devices["iPhone 14 Pro Max"],
        viewport: { width: 430, height: 932 },
      },
    },

    // Tablets
    {
      name: "ipad-mini",
      use: {
        ...devices["iPad Mini"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "ipad-pro",
      use: {
        ...devices["iPad Pro 11"],
        viewport: { width: 1024, height: 1366 },
      },
    },

    // Desktop browsers
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "firefox-desktop",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "webkit-desktop",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 800 },
      },
    },

    // Large desktop
    {
      name: "desktop-fullhd",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Web server configuration.
  //
  // The port must match the one `pnpm dev` actually binds (package.json runs
  // `next dev -p 3002`). This previously launched the dev server and then waited
  // on port 3000, so the server never became "ready" and every project failed on
  // the 120s timeout — the whole E2E suite was unrunnable.
  webServer: {
    // CI runs the PRODUCTION build. A dev server has different bundling,
    // different error overlays and no CSP-relevant minification, so passing
    // e2e against `next dev` says little about what actually ships. Locally it
    // stays on the dev server, where the fast refresh loop matters more.
    command: process.env.CI
      ? `pnpm start --port ${E2E_PORT}`
      : `pnpm dev --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
