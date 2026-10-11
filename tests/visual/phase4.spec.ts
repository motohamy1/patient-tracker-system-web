// tests/visual/phase4.spec.ts — Phase-4 new surface: the provider-home
// new-patient modal (04-UI-SPEC §Visual Baseline Additions; plan 04-05 Task 1).
//
// 4 viewports × 2 motion states = 8 baselines under
// tests/visual/baselines/provider-home-new-patient/.
//
// DETERMINISM: the modal opens EMPTY (Chromium's native date input shows only
// its dd/mm/yyyy placeholder, never today's value) and the grid behind it is
// the fixed seeded fixture set — no now()-derived text is in frame,
// so no mask is needed on THIS surface (the computed age fragment on the
// provider-home surface is masked in surfaces.spec.ts instead).
//
// The CTA exists twice per 04-UI-SPEC §4.5 (top bar + md:hidden body row);
// `.first()` picks whichever is visible at the current viewport.
import { test, expect } from '@playwright/test';
import { AUTH_STATE } from './auth';

const VIEWPORTS = ['1440x900', '1280x800', '768x1024', '390x844'] as const;

test.describe('provider-home new-patient modal', () => {
  test.use({ storageState: AUTH_STATE.owner });

  for (const viewport of VIEWPORTS) {
    test(`provider-home-new-patient @ ${viewport}`, async ({ page }, testInfo) => {
      const [width, height] = viewport.split('x').map(Number);
      await page.setViewportSize({ width, height });
      await page.goto('/provider');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'Add new patient' }).first().click();

      // The MRN helper line is unique to the open modal (04-UI-SPEC copy).
      await expect(
        page.getByText('The medical record number is assigned automatically.'),
      ).toBeVisible();

      const state =
        testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
      await expect(page).toHaveScreenshot([
        'provider-home-new-patient',
        viewport,
        `${state}.png`,
      ]);
    });
  }
});
