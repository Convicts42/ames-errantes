import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  globalSetup: "./tests/global-setup.mjs",
  use: {
    baseURL: "http://127.0.0.1:4184",
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    viewport: { width: 1440, height: 1100 },
    trace: "retain-on-failure",
  },
});
