import { test, expect } from "@playwright/test";

/**
 * Harness self-test. Proves the 4-project matrix, the webServer, and the
 * snapshot path template work end to end before any real gallery content
 * exists. DELETED by Plan 01-03 Task 3 once the app is locale-prefixed.
 */
test("harness captures a page in every project", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page).toHaveScreenshot("harness-scaffold.png", {
    fullPage: true,
  });
});