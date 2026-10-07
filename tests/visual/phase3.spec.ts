// tests/visual/phase3.spec.ts — Phase-3 surface baselines (plan 03-06 Task 4).
//
// Covers the unauthenticated additions introduced by Phase 3:
//   - /login at rest
//   - /login with rejected credentials (the no-leak error state)
//   - /invite/[token] valid (seeded fixture token) and invalid
//
// AUTHENTICATED surfaces (the D-13 denial page, the D-15 admin audit surface,
// and the UX-03 offline strip inside the authed layouts) require a Playwright
// storageState fixture; the harness has no auth-state helper yet, so those
// baselines are deferred and recorded in 03-06-SUMMARY.md as a verification
// gap rather than faked here.
//
// The seeded fixture invitation lives in supabase/seed.sql; only its digest is
// stored, and the raw token is 'phase3-fixture-invite'.
import { test, expect } from '@playwright/test';

const VIEWPORTS = ['1440x900', '1280x800', '768x1024', '390x844'] as const;

const SURFACES = [
  { surface: 'login-p3', path: '/login' },
  { surface: 'invite-valid', path: '/invite/phase3-fixture-invite' },
  { surface: 'invite-invalid', path: '/invite/not-a-real-token' },
] as const;

for (const { surface, path } of SURFACES) {
  for (const viewport of VIEWPORTS) {
    test(`${surface} @ ${viewport}`, async ({ page }, testInfo) => {
      const [width, height] = viewport.split('x').map(Number);
      await page.setViewportSize({ width, height });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
      await expect(page).toHaveScreenshot([surface, viewport, `${state}.png`]);
    });
  }
}

for (const viewport of VIEWPORTS) {
  test(`login-rejected @ ${viewport}`, async ({ page }, testInfo) => {
    const [width, height] = viewport.split('x').map(Number);
    await page.setViewportSize({ width, height });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('nobody@clinic.test');
    await page.getByLabel(/password/i).fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');
    const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
    await expect(page).toHaveScreenshot(['login-rejected', viewport, `${state}.png`]);
  });
}
