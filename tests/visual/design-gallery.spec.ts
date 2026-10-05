import { test, expect } from "@playwright/test";

/*
 * Design gallery visual regression (FND-07, FND-08).
 *
 * ORDER IS THE POINT: locators first, screenshots second. A screenshot can pass while a
 * primitive has silently disappeared, so every section id is asserted structurally before
 * anything is captured.
 *
 * NO TOLERANCE INFLATION: no pixel-diff tolerance option is passed to any screenshot
 * assertion, by design. Start strict; loosen only with a documented, measured reason.
 *
 * NO SLEEPS: nothing waits on time. Waits are on state (`toBeVisible`) or on
 * `document.fonts.ready`, because unresolved fonts are the most common source of
 * visual-regression flake between a Windows dev machine and the Linux CI container.
 *
 * BASELINES ARE PROVISIONAL. The committed PNGs were generated on a dev machine and must be
 * regenerated inside `mcr.microsoft.com/playwright:v1.63.0-noble` before they are trusted,
 * because font rasterization differs by OS. Changing the Arabic companion typeface (an open
 * owner decision, FND-06) invalidates every baseline.
 */

const sections = [
  "frame",
  "notch-header",
  "primary-tabs",
  "secondary-pills",
  "icon-button",
  "chip",
  "module",
  "status-label",
  "dark-scrubber",
  "accent-node",
  "icons",
] as const;

test("design gallery renders every primitive section", async ({ page }) => {
  await page.goto("/en/design-gallery");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  for (const id of sections) {
    await expect(page.locator(`[data-gallery-section="${id}"]`)).toBeVisible();
  }
});

test("design gallery renders in rtl when the locale says so", async ({ page }) => {
  await page.goto("/ar/design-gallery");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  for (const id of sections) {
    await expect(page.locator(`[data-gallery-section="${id}"]`)).toBeVisible();
  }
});

test("design gallery matches the reference baseline", async ({ page }) => {
  await page.goto("/en/design-gallery");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("design-gallery.png", { fullPage: true });
});

test("design gallery matches the reference baseline in rtl", async ({ page }) => {
  await page.goto("/ar/design-gallery");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("design-gallery-rtl.png", { fullPage: true });
});

/*
 * FND-02 runtime proof. The unit tests in Plan 01-02 only string-match tokens.css, so nothing
 * so far proves a token actually reached Tailwind as a utility AND the DOM as a CSS custom
 * property. Both halves are asserted in the browser.
 *
 * CASE NOTE: `getPropertyValue` returns the custom property as the browser re-serializes it,
 * and Chromium lowercases hex digits (`#f2fe46`). The assertions below therefore compare
 * uppercase-normalized values against the uppercase spelling recorded in tokens.css. That is
 * normalization of the same value, not a tolerance: any other difference still fails.
 */
test("tokens reach both Tailwind utilities and CSS custom properties", async ({ page }) => {
  await page.goto("/en/design-gallery");
  const resolved = await page.evaluate(() => {
    // Two probes, because both classes set `background-color` on the same element and the
    // later declaration in the stylesheet wins. One element cannot report both.
    const accentProbe = document.createElement("div");
    accentProbe.className = "bg-accent rounded-module shadow-module";
    const oliveProbe = document.createElement("div");
    oliveProbe.className = "bg-frame-olive rounded-module";
    document.body.append(accentProbe, oliveProbe);
    const accentCs = getComputedStyle(accentProbe);
    const oliveCs = getComputedStyle(oliveProbe);
    const out = {
      accentVar: accentCs.getPropertyValue("--color-accent").trim(),
      shadowVar: accentCs.getPropertyValue("--shadow-module").trim(),
      oliveVar: oliveCs.getPropertyValue("--color-frame-olive").trim(),
      accentBg: accentCs.backgroundColor,
      oliveBg: oliveCs.backgroundColor,
    };
    accentProbe.remove();
    oliveProbe.remove();
    return out;
  });
  // CSS custom properties exist (FND-02, second half)
  expect(resolved.accentVar.toUpperCase()).toBe("#F2FE46");
  expect(resolved.oliveVar.toUpperCase()).toBe("#4F4F28");
  expect(resolved.shadowVar).not.toBe("");
  // Tailwind utilities exist and resolve (FND-02, first half)
  expect(resolved.accentBg).toBe("rgb(242, 254, 70)");
  expect(resolved.oliveBg).toBe("rgb(79, 79, 40)");
});

test("gallery contains no forbidden visual patterns", async ({ page }) => {
  await page.goto("/en/design-gallery");
  const html = await page.content();
  expect(html).not.toMatch(/gradient|backdrop-filter|confetti/);
});