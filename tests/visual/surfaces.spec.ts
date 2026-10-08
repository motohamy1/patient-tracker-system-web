// tests/visual/surfaces.spec.ts — the six-surface baseline matrix (D-14, D-15;
// authenticated contexts added in plan 03-07).
//
// Five of the six entries are D-01 locked shells: /login, /provider,
// /provider/patients/[patientId] (captured through its overview tab with a
// literal `placeholder` segment), /patient and /patient/home. `/patient` is a
// real locked shell that renders the patient group layout at its root, and it is
// baselined separately from /patient/home because they are different pages with
// different bodies. The sixth entry is /dev/gallery, the only non-D-01 route: it
// exists because D-26 makes it the dev-only harness surface.
//
// THE `placeholder` SEGMENT IS A LITERAL IN THIS FILE, NEVER A FIXTURE VALUE.
// It is a path segment chosen here so the workspace route has a concrete
// [patientId] for the baseline; no dev fixture is imported or rendered.
//
// THERE IS NO `patient-records` SURFACE and no records route anywhere in this
// phase: D-01 locks no such path, and inventing one outside the locked map is
// exactly the failure this table prevents.
//
// WHY THE FOUR WORKSPACE SURFACES ARE CAPTURED AUTHENTICATED (plan 03-07, Gap 2).
// Phase 3 wired server-side role resolution + redirect into the
// (provider)/(patient) layouts, so an unauthenticated visit to /provider,
// /patient, /patient/home or the workspace deep route now lands on /login. The
// baselines exist to lock the authenticated workspace SHELLS (Phase 2 D-14): a
// baseline that captured /login would assert nothing about its named surface and
// would permanently blind the matrix to an auth regression on exactly those
// routes — regenerating them to the login page would bless the regression rather
// than detect it. The fix is therefore to render each surface in its real signed
// -in context via the storageState fixture in tests/visual/auth.ts (the same
// mechanism used for the Phase-3 authenticated surfaces), preserving every
// baseline surface name so plan 03-08 regenerates the committed baselines in
// place.
//
// Each path below is checked against D-01 by plan 02-11's acceptance criteria at
// commit time.
import { test, expect } from '@playwright/test';
import { AUTH_STATE } from './auth';

const VIEWPORTS = ['1440x900', '1280x800', '768x1024', '390x844'] as const;

// Group 1 — unauthenticated shells. These render with an empty context; neither
// requires a signed-in principal.
test.describe('unauthenticated shells', () => {
  const SURFACES = [
    { surface: 'dev-gallery', path: '/dev/gallery' },
    { surface: 'login', path: '/login' },
  ] as const;

  for (const { surface, path } of SURFACES) {
    for (const viewport of VIEWPORTS) {
      test(`${surface} @ ${viewport}`, async ({ page }, testInfo) => {
        // The viewport is set explicitly rather than via a device preset: a
        // preset bakes in its own user agent and viewport, and the baseline
        // contract names the exact sizes.
        const [width, height] = viewport.split('x').map(Number);
        await page.setViewportSize({ width, height });
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
        // The path is built here as an array of segments, so the mandated
        // {surface}/{viewport}/{state}.png shape is produced by the test rather
        // than guessed by a path template (02-RESEARCH.md Pitfall 9).
        await expect(page).toHaveScreenshot([surface, viewport, `${state}.png`]);
      });
    }
  }
});

// Group 2 — authenticated provider shells. A staff/owner principal (D-12) keeps
// the (provider) layout; the deep workspace route renders its own shell for the
// owner. `?preview=doctor` on the dev gallery does not affect `dev-gallery`'s
// default render, so its baseline is unchanged.
test.describe('authenticated provider shells', () => {
  test.use({ storageState: AUTH_STATE.owner });

  const SURFACES = [
    { surface: 'provider-home', path: '/provider' },
    { surface: 'patient-workspace', path: '/provider/patients/placeholder/overview' },
  ] as const;

  for (const { surface, path } of SURFACES) {
    for (const viewport of VIEWPORTS) {
      test(`${surface} @ ${viewport}`, async ({ page }, testInfo) => {
        const [width, height] = viewport.split('x').map(Number);
        await page.setViewportSize({ width, height });
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const state = testInfo.project.name === 'reduced-motion' ? 'reduced-motion' : 'default';
        // Phase 4 (04-05): the folder card prints an AGE computed from dob at
        // render time — it changes on every birthday, so the fragment is
        // masked (03-08's created_at masking precedent). Everything else in
        // frame comes from the fixed seed.sql fixture rows. The mask locator
        // matches nothing on patient-workspace, so the shared loop is safe.
        await expect(page).toHaveScreenshot([surface, viewport, `${state}.png`], {
          mask: [page.getByTestId('folder-identity')],
        });
      });
    }
  }
});

// Group 3 — authenticated patient shells. The patient principal renders the
// (patient) group at /patient and at /patient/home.
test.describe('authenticated patient shells', () => {
  test.use({ storageState: AUTH_STATE.patient });

  const SURFACES = [
    { surface: 'patient-home', path: '/patient/home' },
    { surface: 'patient', path: '/patient' },
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
});
