import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      threshold: 0.2,
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    // Playwright's default is 'no-preference', which lets the runner OS
    // setting leak into the baselines.
    reducedMotion: "reduce",
    locale: "en-GB",
    timezoneId: "Africa/Cairo",
  },
  projects: [
    {
      name: "desktop-ltr",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "desktop-rtl",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        locale: "ar-EG",
      },
    },
    { name: "mobile-ltr", use: { ...devices["Pixel 7"] } },
    { name: "mobile-rtl", use: { ...devices["Pixel 7"], locale: "ar-EG" } },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    // false, NOT !process.env.CI: later phases add routes, and reusing a
    // server started before the route existed surfaces as a misleading
    // "route not found" failure.
    reuseExistingServer: false,
    timeout: 180_000,
  },
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
});