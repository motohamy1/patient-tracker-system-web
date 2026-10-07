// tests/visual/surfaces.spec.ts — the six-surface baseline matrix (D-14, D-15).
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
// exactly the failure this table prevents. Each path below is checked against
// D-01 by plan 02-11's acceptance criteria at commit time.
import { test, expect } from '@playwright/test';

const VIEWPORTS = ['1440x900', '1280x800', '768x1024', '390x844'] as const;

const SURFACES = [
  { surface: 'dev-gallery', path: '/dev/gallery' },
  { surface: 'login', path: '/login' },
  { surface: 'provider-home', path: '/provider' },
  { surface: 'patient-workspace', path: '/provider/patients/placeholder/overview' },
  { surface: 'patient-home', path: '/patient/home' },
  { surface: 'patient', path: '/patient' },
] as const;

for (const { surface, path } of SURFACES) {
  for (const viewport of VIEWPORTS) {
    test(`${surface} @ ${viewport}`, async ({ page }, testInfo) => {
      // The viewport is set explicitly rather than via a device preset: a preset
      // bakes in its own user agent and viewport, and the baseline contract names
      // the exact sizes.
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
