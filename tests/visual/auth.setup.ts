// tests/visual/auth.setup.ts — the setup project: sign in once, persist state.
//
// WHY THIS FILE EXISTS. The Phase-3 visual baselines (03-VERIFICATION.md Gap 1)
// need three authenticated surfaces (D-13 denial, UX-03 offline strip, D-15
// audit) and the four Phase-2 workspace shells (Gap 2) captured in their real,
// signed-in state. This setup project drives the REAL /login credential form
// for each seeded principal in auth.ts and writes a Playwright storageState
// file; the `default` and `reduced-motion` projects declare
// `dependencies: ['setup']`, so sign-in completes before any motion project
// captures. Its `testMatch` (playwright.config.ts) deliberately matches only
// this file — the default `*.spec.ts`/`*.test.ts` glob excludes it from the
// motion projects, so the sign-in is not re-run per capture.
//
// THE SIGN-IN IS THE PRODUCTION FORM. It fills the exact labels declared in
// src/app/(auth)/login/login-form.tsx ("Email", "Password") and clicks the
// button named "Sign in" — the same form a human uses. It then waits for the
// role's D-12 landing URL: a missing or renamed seed account fails the setup
// loudly rather than silently saving an unauthenticated `{cookies:[]}` state
// that would make every "authenticated" baseline capture the login page.
import { test as setup, expect } from '@playwright/test';
import { AUTH_USERS } from './auth';

for (const user of AUTH_USERS) {
  setup(`authenticate ${user.role}`, async ({ page }) => {
    await page.goto('/login');

    // Fail loudly if the login surface did not render (server down, route
    // regressed) before attempting to fill or submit.
    await expect(page.getByLabel('Email')).toBeVisible();

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // The layout slot resolves the role server-side and routes from here; wait
    // for the role's own workspace (staff -> /provider, patient -> /patient).
    await page.waitForURL(user.landing);

    await page.context().storageState({ path: user.statePath });
  });
}
