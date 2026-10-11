// tests/visual/phase3.spec.ts — Phase-3 surface baselines (plans 03-06 + 03-07).
//
// Covers the UI-SPEC "Visual Baseline Additions" set:
//   - /login at rest (login-p3)
//   - /login with rejected credentials (the no-leak error state)
//   - /invite/[token] valid (seeded fixture token) and invalid
//   - the D-13 denial page (denial)
//   - the UX-03 offline strip under offline emulation (offline-strip)
//   - the D-15 admin audit surface with seeded fixtures (admin-audit)
//
// The three authenticated surfaces render inside a signed-in context via the
// storageState fixture in tests/visual/auth.ts (plan 03-07): the setup project
// (auth.setup.ts) signs in as the seeded owner first, and each group below
// applies `test.use({ storageState: AUTH_STATE.owner })`.
//
// The seeded fixture invitation lives in the acceptance seed (retired
// supabase/seed.sql); only its digest is stored, and the raw token is
// 'phase3-fixture-invite'.
import { test, expect } from '@playwright/test';
import { AUTH_STATE } from './auth';

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

// The D-13 denial surface. Deterministic copy (denied/page.tsx): the title and
// the single capability body line are fixed strings, and the action destination
// is the owner's own resolved workspace, so the capture is stable across runs.
test.describe('denial (authenticated)', () => {
  test.use({ storageState: AUTH_STATE.owner });

  for (const viewport of VIEWPORTS) {
    test(`denial @ ${viewport}`, async ({ page }, testInfo) => {
      const [width, height] = viewport.split('x').map(Number);
      await page.setViewportSize({ width, height });
      await page.goto('/provider/denied');
      await page.waitForLoadState('networkidle');
      const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
      await expect(page).toHaveScreenshot(['denial', viewport, `${state}.png`]);
    });
  }
});

// The UX-03 offline strip. setOffline runs AFTER navigation: emulating offline
// before the document request would abort the page load. Once the built page
// has hydrated, the real `offline` browser event drives OfflineSyncStrip from
// its hidden state to the offline sentence, which we assert before capture.
test.describe('offline strip (authenticated)', () => {
  test.use({ storageState: AUTH_STATE.owner });

  for (const viewport of VIEWPORTS) {
    test(`offline-strip @ ${viewport}`, async ({ page, context }, testInfo) => {
      const [width, height] = viewport.split('x').map(Number);
      await page.setViewportSize({ width, height });
      await page.goto('/provider');
      await page.waitForLoadState('networkidle');
      await context.setOffline(true);
      await expect(page.getByRole('status')).toContainText(
        "You're offline. Changes will sync when the connection returns.",
      );
      const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
      await expect(page).toHaveScreenshot(['offline-strip', viewport, `${state}.png`]);
    });
  }
});

// The D-15 admin audit surface. Two determinism moves keep the baseline stable:
//   1. Filter to the single `organizations` row. The seeded org-A list has
//      several rows sharing one transaction timestamp and an identical
//      action='INSERT', so their order is a tie; narrowing to one row removes
//      that nondeterminism.
//   2. Mask the timestamp. created_at is rendered raw from the DB and is local
//      to machine state, so its text is masked out of the diff (the actor /
//      action / entity text stays deterministic because the seeded UUIDs and
//      strings are fixed).
test.describe('admin audit (authenticated)', () => {
  test.use({ storageState: AUTH_STATE.owner });

  for (const viewport of VIEWPORTS) {
    test(`admin-audit @ ${viewport}`, async ({ page }, testInfo) => {
      const [width, height] = viewport.split('x').map(Number);
      await page.setViewportSize({ width, height });
      await page.goto('/provider/admin/audit');
      await page.waitForLoadState('networkidle');
      await page.getByPlaceholder('Filter audit entries').fill('organizations');
      await expect(page.locator('li')).toHaveCount(1);
      const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
      await expect(page).toHaveScreenshot(['admin-audit', viewport, `${state}.png`], {
        mask: [page.locator('li .tabular-nums')],
      });
    });
  }
});
