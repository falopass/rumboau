import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    permissions: ["clipboard-read", "clipboard-write"],
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    env: {
      SESSION_SECRET: "development-only-session-secret-change-me-123456",
      RATE_LIMIT_SALT: "development-only-rate-limit-salt",
      RUMBO_DEMO_MODE: "true",
    },
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
