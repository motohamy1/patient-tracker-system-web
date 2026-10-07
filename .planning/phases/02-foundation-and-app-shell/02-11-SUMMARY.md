---
phase: 02-foundation-and-app-shell
plan: 02-11
subsystem: testing
tags: [playwright, visual-regression, baselines, security-assertions, dev-route-gate, phase-gate, visual-qa, ui-invariants, reduced-motion, asvs]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell
    provides: "the generated token layer + the three machine checks (02-03/02-04), the primitives (02-05/02-06/02-07), the full locked route map rendering as typed empty shells (02-08/02-09) and the dev-only gallery (02-10)"
provides:
  - "playwright.config.ts — the visual-regression harness contract: two motion projects, four pinned viewports, `maxDiffPixelRatio: 0.01` / `threshold: 0.2`, committed baselines, and the repository's single setter of the dev-route flag"
  - "tests/visual/surfaces.spec.ts — the 6-surface x 4-viewport screenshot loop that builds the {surface}/{viewport}/{state}.png path as an array of segments"
  - "tests/visual/security.spec.ts — three automated security assertions (dev-route 404 without the flag; zero off-origin requests; no fixture literal in the client bundle)"
  - "tests/visual/baselines/{surface}/{viewport}/{state}.png — 48 committed baseline PNGs (6 surfaces x 4 viewports x 2 motion states)"
  - ".planning/phases/02-foundation-and-app-shell/02-VERIFICATION.md — the phase acceptance record: per-row QA results, per-ID invariant evaluations, the 52 enumerated token pairings, the workstation-local baseline warning, and the approved human gate"
  - ".planning/phases/02-foundation-and-app-shell/02-SECURITY.md — the four live threats with dispositions and proving tests, plus the explicit ASVS V2–V6 non-applicability statement"
affects: [022 (visual QA regression), 006 (timeline rows 8-10 become applicable), 003 (ASVS V2-V6 become applicable)]

# Tech tracking
tech-stack:
  added: [@playwright/test]
  patterns:
    - "Visual baselines are committed (never gitignored) and captured against a fresh production build via the npm prebuild chain, with `reuseExistingServer: false`; regeneration is a deliberate `--update-snapshots` act recorded in the phase artifact"
    - "The dev-only route flag is named in exactly one source file (src/lib/dev/dev-route-gate.ts) plus the harness config, and its confinement is itself an automated assertion (ASVS V14)"
    - "Reduced motion is exercised as a real media feature (a second Playwright project with `reducedMotion: 'reduce'`), never a test-side flag that could be forgotten (D-15)"
    - "The phase closes against the 12-row QA gate and the INV registry recorded in the verification artifact, not against a green suite (§27)"
    - "Committed baselines are workstation-local: every capturable axis is pinned and no `{platform}` segment is used, so a runner change means regenerate-never-copy"

key-files:
  created:
    - playwright.config.ts
    - tests/visual/surfaces.spec.ts
    - tests/visual/security.spec.ts
    - tests/visual/baselines/{surface}/{viewport}/{state}.png (48 files)
  modified:
    - .planning/phases/02-foundation-and-app-shell/02-VERIFICATION.md

key-decisions:
  - "Two motion states as two Playwright projects (default, reduced-motion) via real `reducedMotion` emulation — the reduced branch is exercised through the media feature rather than a test-side flag (D-15)"
  - "The dev-route flag is set in exactly two files repository-wide (the gate module plus playwright.config.ts) and that confinement is an automated assertion; the harness `webServer.env` is the only place that opens the gallery (D-26, ASVS V14)"
  - "Baselines are committed, pinned on every capturable axis (`deviceScaleFactor: 1`, `animations: 'disabled'`, `caret: 'hide'`, `colorScheme: 'light'`, fixed timezone/locale/baseURL, no `{platform}` segment) and documented as workstation-local, regenerate-never-copy (T-02-80 / T-02-82)"
  - "The matrix spans six surfaces — the dev gallery plus the five D-01 shells — and there is deliberately no `patient-records` surface, because D-01 locks no records route"
  - "The 12-row QA gate and the INV registry are the phase gate; a green `lint`/`unit`/`build`/`test:visual` chain is evidence, not acceptance (§27). Rows 8, 9 and 10 are not applicable in Phase 002 and name Phase 006 as the owning phase"
  - "D-27 outcome accepted by the reviewer: the four `surfaceMuted` controls (search field, icon-toggle off state, tab-bar container, inset note field specimen) render with a visible boundary against their parent, achieved without a border or a third shadow"

patterns-established:
  - "A visual-regression harness captures against a fresh production build through the npm `prebuild` chain, so the token generator and the three machine checks re-run end to end on every capture"
  - "A reduced-motion contract is verified as a real Playwright media-feature project, giving 24 reduced-state baselines across every surface"
  - "Committed visual baselines carry a written workstation-local regeneration warning so a future CI addition does not assume the PNGs transfer"
  - "The phase-close gate records a verdict per QA row and per applicable invariant in the verification artifact; not-applicable rows name the owning phase rather than being counted as passes"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, UX-06]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "The Playwright harness contract: two motion projects (`default`, `reduced-motion`) over four pinned viewports on Chromium, `maxDiffPixelRatio: 0.01` / `threshold: 0.2`, `animations: 'disabled'`, `caret: 'hide'`, `scale: 'css'`, pinned `deviceScaleFactor`/`baseURL`/`colorScheme`/`timezoneId`/`locale`, and a fresh-production-build `webServer` whose env is the repository's single setter of the dev-route flag"
    requirement: "FOUND-03"
    verification:
      - kind: other
        ref: "npm run test:visual -> exit 0 (56 passed); acceptance greps: TOLERANCE-OK, reducedMotion >= 2, ALLOW_DEV_ROUTES present, no gracefulShutdown, no platform segment"
        status: pass
    human_judgment: false
  - id: D2
    description: "The 48-baseline matrix at tests/visual/baselines/{surface}/{viewport}/{state}.png across dev-gallery, login, provider-home, patient-workspace, patient-home and patient, captured against a fresh production build and committed (not gitignored)"
    requirement: "UX-06"
    verification:
      - kind: other
        ref: "npm run test:visual -> 48 surface screenshots pass; find tests/visual/baselines -name '*.png' | wc -l = 48; matrix check prints MATRIX-COMPLETE-6x4x2; git check-ignore exits non-zero"
        status: pass
    human_judgment: true
    rationale: "The suite proves the matrix exists, is the mandated shape and is stable; whether each rasterized surface visually agrees with the reference at four viewports is a reviewer judgment exercised at the task-3 gate."
  - id: D3
    description: "The three automated security assertions in tests/visual/security.spec.ts: /dev/gallery returns 404 under a production server started without the flag; the built client makes zero off-origin requests; no dev-fixture literal reaches the client bundle"
    requirement: "FOUND-01"
    verification:
      - kind: e2e
        ref: "tests/visual/security.spec.ts (3 tests x 2 projects = the 8 security tests inside npm run test:visual)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The phase acceptance artifacts: 02-VERIFICATION.md records a row per QA row and an entry per applicable invariant with automated/reviewer markers, the 52 enumerated token pairings, and the workstation-local baseline warning; 02-SECURITY.md records the four live threats with proving tests and the explicit ASVS V2–V6 non-applicability with per-category reason"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "02-VERIFICATION.md + 02-SECURITY.md exist; node -e \"require('./docs/governance/tokens.json').review.gateStatus\" = approved-with-changes; npm run lint && npx vitest run tests/unit && npm run build && npm run test:visual -> exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The reduced-motion branch exercised across every surface through a real media feature: the `reduced-motion` project captures 24 reduced-state baselines — the machine evidence for the shell's reduced branch complementing the `useShellMotion` unit contract from plan 02-06"
    requirement: "FOUND-05"
    verification:
      - kind: automated_ui
        ref: "npx playwright test --project=reduced-motion (inside npm run test:visual)"
        status: pass
    human_judgment: true
    rationale: "That the reduced branch degenerates to opacity-only (or removes the animation) rather than merely being captured is a motion judgment; the reduced-motion baselines are the evidence the reviewer confirms."
  - id: D6
    description: "The blocking phase-close human gate: a verdict for each of the 12 QA rows (rows 1-7 and 11-12 PASS; rows 8, 9 and 10 NOT APPLICABLE in Phase 002, owned by Phase 006), a verdict for each applicable INV, the D-27 surfaceMuted-boundary outcome accepted, and the reviewer identity/date recorded"
    requirement: "FOUND-04"
    verification: []
    human_judgment: true
    rationale: "Contrast against the frozen palette, focus-ring appearance, perceived focus order and the 44px touch target are not machine-verifiable (jsdom computes no layout or color; a screenshot diff detects change, not ratio). The gate is the twelve QA rows and the reviewer-evaluated invariants, judged by a human against the reference images."

# Metrics
duration: 42min
completed: 2026-10-07
status: complete
---

# Phase 2 Plan 11: The Playwright visual-regression harness, the committed baselines, and the phase gate

**A Playwright harness capturing 6 surfaces × 4 viewports × 2 motion states (48 committed baselines) against a fresh production build, three automated security assertions (dev-route 404 without the flag, zero off-origin egress, no fixture literal in the client bundle), and a phase close approved against the 12-row QA gate and the INV registry — rows 8–10 N/A to Phase 006 and the D-27 `surfaceMuted` boundary accepted.**

## Performance

- **Duration:** 42 min (includes the pause at the blocking human-verify gate)
- **Started:** 2026-10-06T23:38:00Z
- **Completed:** 2026-10-07T00:20:00Z
- **Tasks:** 3 (2 auto + 1 blocking human-verify, approved)
- **Files modified:** 4 committed paths (3 created, 1 modified; plus the 48-baseline directory)

## Accomplishments

- **The harness contract.** `playwright.config.ts` declares two motion projects (`default`, `reduced-motion`), the four contract viewports (`1440x900`, `1280x800`, `768x1024`, `390x844`) on Chromium, `maxDiffPixelRatio: 0.01` and `threshold: 0.2` exactly as `docs/governance/visual-qa-rules.md` §2 specifies, `animations: 'disabled'`, `caret: 'hide'`, `scale: 'css'`, pinned `deviceScaleFactor`/`baseURL`/`colorScheme`/`timezoneId`/`locale`, and a `webServer` running the npm build-and-start chain with `reuseExistingServer: false`. `gracefulShutdown` is omitted deliberately (ignored on Windows) and no `{platform}` segment appears in `snapshotPathTemplate`.
- **48 committed baselines.** `tests/visual/surfaces.spec.ts` loops the six surfaces × four viewports, building the `{surface}/{viewport}/{state}.png` path as an array of segments; the captured set is `dev-gallery`, `login`, `provider-home`, `patient-workspace`, `patient-home` and `patient` in both `default` and `reduced-motion` states. There is no `patient-records` surface — D-01 locks no records route.
- **Three automated security assertions.** `tests/visual/security.spec.ts` proves `/dev/gallery` 404s under a production server started with the flag deleted; that the built client makes zero off-origin requests; and that the dev-fixture placeholder literal never reaches the client bundle.
- **The phase acceptance artifacts.** `02-VERIFICATION.md` carries a row for each of the 12 QA rows and an entry for each applicable `INV-xx`, the machine-checked subset (`INV-01`/`INV-03`/`INV-13`/`INV-14`), the 52 enumerated `text-*`/`bg-*` token pairings, the explicit statement that contrast and the 44px target are not machine-verifiable, and the workstation-local baseline warning. `02-SECURITY.md` records the four live threats with their proving tests, the explicit ASVS V2–V6 not-yet-applicable statement with a per-category reason, and V4's hard negative rule.
- **The approved phase-close gate.** The blocking `checkpoint:human-verify` was presented to the product owner and **APPROVED on 2026-10-07**: every applicable QA row and every applicable invariant PASS; rows 8, 9 and 10 are **not applicable** in Phase 002 (no timeline/scrubber — owned by **Phase 006**); the D-27 `surfaceMuted`-boundary outcome is **accepted**. The reviewer identity and date are recorded in `02-VERIFICATION.md` §7.

## Task Commits

Each task was committed atomically:

1. **Task 1: the Playwright harness, the surface/security specs and 48 committed baselines** - `be3e665` (feat)
2. **Task 2: the phase verification and security artifacts** - `e37f8d5` (docs)
3. **Task 3: the approved phase-close verification, the SUMMARY and the 11/11 tracking** - `docs(02-11): record the approved phase-close verification and complete the plan` (docs)

**Plan metadata:** the `docs(02-11): record the approved phase-close verification and complete the plan` close-out commit (SUMMARY + STATE + ROADMAP).

## Files Created/Modified

- `playwright.config.ts` - the two-project harness: four pinned viewports, tolerance, pinned capture, committed baselines, and the repository's single setter of the dev-route flag
- `tests/visual/surfaces.spec.ts` - six surfaces × four viewports screenshot loop; path built as segments
- `tests/visual/security.spec.ts` - the dev-route 404, zero-egress and no-fixture-literal assertions
- `tests/visual/baselines/{surface}/{viewport}/{state}.png` - 48 committed baseline PNGs
- `.planning/phases/02-foundation-and-app-shell/02-VERIFICATION.md` - phase acceptance record; §7 completed with the approved human verdicts
- `.planning/phases/02-foundation-and-app-shell/02-SECURITY.md` - the four threats + ASVS V2–V6 non-applicability (written in task 2)
- `.planning/phases/02-foundation-and-app-shell/02-11-SUMMARY.md` - this summary

## Decisions Made

- **Two motion states as two projects via real emulation (D-15).** The reduced branch is exercised through the `prefers-reduced-motion` media feature, not a test-side flag that could be forgotten.
- **The dev-route flag is confined and the confinement is asserted.** `ALLOW_DEV_ROUTES` is named in exactly two files (the gate module plus `playwright.config.ts`); the harness `webServer.env` is the only place that opens the gallery (D-26, ASVS V14).
- **Baselines are committed and workstation-local (T-02-80/82).** All capturable axes are pinned and no `{platform}` segment is used; a runner change means regenerate-never-copy, recorded in the phase artifact.
- **The matrix is six surfaces, not seven.** The five D-01 shells plus the dev-only gallery; no `patient-records` surface exists because D-01 locks no records route.
- **The gate is the QA rows and the INV registry, not a green suite (§27).** Rows 8–10 are N/A in Phase 002 and name Phase 006 as owner; they were never recorded as passes.
- **D-27 outcome accepted.** The four `surfaceMuted` controls render with a visible boundary against their parent, achieved without a border (INV-15/16) or a third shadow (INV-13).

## Deviations from Plan

None - plan executed as written. Task-3 was the plan's pre-planned blocking `checkpoint:human-verify`; it was approved, and the verdicts were recorded in `02-VERIFICATION.md` §7 without editing any token, component or route, and without altering any recorded machine-check result.

## Issues Encountered

- `npm run build` (invoked through the `test:visual` webServer) rewrote `tsconfig.json` and created `next-env.d.ts`, as it did in plan 02-10. Both side effects were reverted after the acceptance re-run (`git checkout -- tsconfig.json`, `rm -f next-env.d.ts`); neither was committed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Phase 2 is complete (11/11 plans).** The application shell, the primitives, the motion foundation, the full locked route map and the visual harness are all in place; the phase closed against the 12-row QA gate and the INV registry, with the approved human verdict on record.
- **Ready for Phase 3** (authentication, organizations, RBAC and RLS): the ASVS V2–V6 categories that are not-yet-applicable in Phase 002 become the phase's core, and the Phase 003 server-side resolution slot is already marked in both role layouts and `/login`.
- **Rows 8, 9 and 10 defer to Phase 006** (D3 clinical timeline and scrubber); they were recorded as not-applicable, not as passes.
- **The baselines are workstation-local.** Whoever adds CI must regenerate them on that runner with `--update-snapshots` — never copy the committed PNGs (T-02-80/82). No CI configuration exists (D-17).

---

*Phase: 02-foundation-and-app-shell*
*Completed: 2026-10-07*

## Self-Check: PASSED

- `02-VERIFICATION.md` §7 now carries a verdict for all 12 QA rows (rows 1-7 and 11-12 PASS; rows 8, 9, 10 NOT APPLICABLE → Phase 006), a verdict for each reviewer-evaluated INV, the machine-checked subset named, the D-27 outcome, the reviewer identity `motohamy1` and the date `2026-10-07`. No recorded machine-check result was altered.
- This SUMMARY exists with the full template (frontmatter dependency graph, tech-stack, key-files, key-decisions, patterns-established, `requirements-completed: FOUND-01..FOUND-05 + UX-06`, and a six-entry coverage block).
- Plan commits exist: `be3e665` (task 1), `e37f8d5` (task 2), plus the plan close-out commit below.
