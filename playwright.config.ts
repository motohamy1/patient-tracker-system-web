// playwright.config.ts — the Phase 002 visual-regression harness (D-14, D-15, D-17, D-26).
//
// THE DEV-ROUTE FLAG IS SET HERE AND ONLY HERE. `ALLOW_DEV_ROUTES` makes the
// dev-only primitives gallery reachable for its baselines while it stays absent
// from every real deployment. It appears in exactly two files repository-wide:
// src/lib/dev/dev-route-gate.ts (which reads it) and this file (which sets it
// for the harness's production server, in `webServer.env` below). It is never in
// a .env file or a deployment config, because a dev-only route leaking to
// production is a security finding (ASVS V14 Configuration), not a nitpick.
// tests/visual/security.spec.ts proves the route 404s without the flag.
//
// `gracefulShutdown` IS DELIBERATELY OMITTED. Playwright ignores SIGTERM/SIGINT
// shutdown on Windows, so the option has no effect on this workstation and the
// default forceful kill is relied on instead (02-RESEARCH.md §Environment
// Availability). Omit it rather than ship a knob that silently does nothing.
//
// `reuseExistingServer: false` BECAUSE THE BASELINES ARE CAPTURED AGAINST A
// FRESH PRODUCTION BUILD EVERY TIME. D-17 gates the harness to local runs; a
// stale server left on the port would silently be reused and the baselines
// would be captured against an unknown build.
import { defineConfig } from '@playwright/test';

// The four contract viewports (docs/governance/visual-qa-rules.md §2). Declared
// here as the single source and re-applied per test in surfaces.spec.ts, so no
// device preset bakes in its own user agent or viewport.
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
] as const;

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/visual',
  // FORWARD SLASHES IN THE TEMPLATE. Playwright resolves a relative template
  // against configDir and accepts forward slashes on any platform
  // (02-RESEARCH.md §Environment Availability). The mandated path shape is
  // produced by the test (it builds an array of segments), so this template only
  // prepends the baselines root and the extension.
  //
  // NO PLATFORM SEGMENT. With committed baselines, a platform-suffixed path
  // would make the committed set look valid on a runner it was never verified
  // on; the baselines are workstation-local and must be regenerated, never
  // copied, when the runner changes (02-RESEARCH.md Pitfall 3).
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  // Serial, single-worker execution keeps the capture deterministic and stops
  // the security spec's second production server from colliding on its port.
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // visual-qa-rules.md §2
      threshold: 0.2, // per-pixel YIQ tolerance; Playwright default, pinned here
      animations: 'disabled', // visual-qa-rules.md §2 "CSS animations disabled during capture"
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: BASE_URL,
    deviceScaleFactor: 1, // pin it — 02-RESEARCH.md Pitfall 3
    colorScheme: 'light', // tokens.json ships light values only; no dark mode in scope
    timezoneId: 'UTC',
    locale: 'en-US',
  },
  projects: [
    // Two motion states as two projects (D-15): the reduced branch is exercised
    // through the real media feature, not a test-side flag that could be
    // forgotten.
    { name: 'default', use: { browserName: 'chromium', reducedMotion: null } },
    { name: 'reduced-motion', use: { browserName: 'chromium', reducedMotion: 'reduce' } },
  ],
  webServer: {
    // The npm build-and-start chain, never a bare `next build` (02-RESEARCH.md
    // Pitfall 5): `prebuild` is what runs the token generator and the design
    // checks, so only the npm script re-proves D-05 and D-13 end to end.
    command: 'npm run build && npm run start -- --port 3100',
    url: `${BASE_URL}/login`,
    reuseExistingServer: false,
    timeout: 240_000,
    // The one place in the repository that sets the dev-route flag (D-26).
    env: { ALLOW_DEV_ROUTES: '1' },
  },
});
