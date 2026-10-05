---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, react, typescript, tailwind-v4, vitest, playwright, eslint, github-actions]

# Dependency graph
requires:
  - phase: none
    provides: "Greenfield repo (only .planning/ and docs/ existed). This plan is Wave 0."
provides:
  - Runnable Next.js 16.3.8 App Router project (src-dir, @/* alias) that lints, type-checks, unit-tests, and builds green
  - npm scripts lint / typecheck / test / test:visual / build / dev / start
  - Declared Node floor `engines.node >=24.21.0`
  - jsdom Vitest harness with `@/` alias parity and a passing .tsx smoke test
  - Playwright 4-project (desktop/mobile x ltr/rtl) visual-regression harness with four committed baselines
  - GitHub Actions CI: `quality` job (lint/typecheck/test/build) + containerized `visual-regression` job with a baseline-drift gate
  - `.env.example` with the two public Supabase names only
affects: [01-02-tokens, 01-03-app-shell, 01-04-motion-and-supabase, 01-05-design-gallery, every later phase in 01]

# Tech tracking
tech-stack:
  added:
    - next@16.3.8, react@19.3.0, react-dom@19.3.0
    - tailwindcss@4.3.3 + @tailwindcss/postcss@4.3.3 (CSS-first, no JS config)
    - motion@^14.0.0 (the renamed Framer Motion; `motion/react` is the React entry)
    - @supabase/supabase-js@^2.117.2, @supabase/ssr@^0.12.7
    - @tanstack/react-query@^5.104.1
    - typescript@^5.9.3 (deliberately 5.x, NOT latest 7.0.2)
    - vitest@^5.0.3 + jsdom@^30.1.2
    - @playwright/test@^1.63.0
    - eslint@^9.39.5 + eslint-config-next@16.3.8
  patterns:
    - "Tailwind v4 CSS-first: `@import \"tailwindcss\";` in globals.css, no tailwind.config.*"
    - "Vitest `resolve.alias['@']` mirrors tsconfig `paths[\"@/*\"]` exactly"
    - "Playwright matrix drives locale/direction by project, never by UI toggle"
    - "CI calls the same npm scripts the executor runs locally"

key-files:
  created:
    - vitest.config.ts
    - playwright.config.ts
    - tests/unit/setup.ts
    - tests/unit/smoke.test.ts
    - tests/unit/smoke-component.test.tsx
    - tests/visual/gallery-scaffold.spec.ts (deleted again by Plan 01-03 Task 3)
    - .env.example
    - .github/workflows/ci.yml
    - src/app/layout.tsx (placeholder; replaced by Plan 01-03)
    - src/app/page.tsx (placeholder)
    - postcss.config.mjs, eslint.config.mjs, next.config.ts
  modified:
    - package.json (engines, scripts, dependencies)
    - package-lock.json
    - tsconfig.json (jsx: preserve, strict, bundler resolution, @/* alias)
    - src/app/globals.css (Tailwind v4 import only)
    - .gitignore (playwright-report, test-results; `.env.example` un-ignored; baselines never ignored)

key-decisions:
  - "TypeScript pinned to the 5.x line (^5.9.3, resolved 5.9.3). `typescript@latest` is 7.0.2 (native Go port) but the rest of the ecosystem's build configs still target 5.x/6.x; research Open Question 1 recommended pinning 5.x and not floating."
  - "ESLint pinned to 9.39.5 rather than the planned 10.12.0: `eslint-config-next@16.3.8` bundles `eslint-plugin-react@7.37.5`, whose peer range stops at `^9.7` and which crashes on ESLint 10 (`contextOrFilename.getFilename is not a function`). 9.39.5 satisfies eslint-config-next's own peer `>=9.0.0`."
  - "`motion`, not `framer-motion`: the vendor renamed the package; installing both would duplicate. `motion/react` is the React entry (Plan 01-04)."
  - "No `d3`, `gsap`, `next-intl`, `shadcn`, or icon package in Phase 1 — d3 is Phase 5, GSAP needs a documented advantage, next-intl is not in the approved stack (research Open Question 2: hand-rolled `[locale]` routing suffices for two locales with no message catalogs yet)."
  - "No `@testing-library/*` in this plan: the smoke component test needs only `react-dom/client`'s `createRoot`, already installed with React. Testing Library arrives with Plan 01-03 Task 4 where multiple components need query APIs."
  - "Visual baselines generated on this Windows machine are PROVISIONAL and must be regenerated inside `mcr.microsoft.com/playwright:v1.63.0-noble` in CI before they count as FND-08 evidence — rendering depends on OS, browser build, fonts, and headless mode."
  - "`tests/visual/gallery-scaffold.spec.ts` and its four baselines are temporary: Plan 01-03 Task 3 deletes them once the app is locale-prefixed."

patterns-established:
  - "No build-time lint assumption: `next lint` was removed in Next 16 and `next build` no longer lints, so `lint` is an explicit `eslint .` script and CI calls the script, not the build."
  - "Vitest component tests need `globalThis.IS_REACT_ACT_ENVIRONMENT = true` (set in tests/unit/setup.ts) plus `act()` — React 19's `createRoot.render` is concurrent and does not flush synchronously."
  - "Playwright determinism rules: `reducedMotion: 'reduce'` globally, `animations: 'disabled'`, `scale: 'css'`, locale and timezoneId pinned, `{projectName}` in `snapshotPathTemplate`, `reuseExistingServer: false`, and no `maxDiffPixels`/`maxDiffPixelRatio` yet."
  - "Playwright browser directory is never cached in CI — Linux OS dependencies are not cacheable."
  - "`--update-snapshots=missing` is always paired with `git diff --exit-code tests/visual/__screenshots__`, otherwise a new assertion without a committed baseline can never fail CI."

requirements-completed: [FND-01]

coverage:
  - id: D1
    description: "Next.js 16 App Router project scaffolds and runs lint, typecheck, unit tests, and build green"
    requirement: FND-01
    verification:
      - kind: other
        ref: "npm run lint && npm run typecheck && npm run test && npm run build (all exit 0, 2026-10-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Required npm scripts exist, including `start`, and package.json declares engines.node >=24.21.0"
    requirement: FND-01
    verification:
      - kind: other
        ref: "node -e \"console.log(require('./package.json').engines.node)\" -> >=24.21.0; scripts dev,build,start,lint,typecheck,test,test:visual"
        status: pass
    human_judgment: false
  - id: D3
    description: "TypeScript major pinned deliberately to the 5.x line (resolved 5.9.3), not floating"
    requirement: FND-01
    verification:
      - kind: other
        ref: "npm view typescript dist-tags -> latest 7.0.2; package.json devDependencies.typescript = ^5.9.3"
        status: pass
    human_judgment: false
  - id: D4
    description: "jsdom Vitest harness with `@/` alias parity plus a passing .ts and .tsx smoke test"
    requirement: FND-01
    verification:
      - kind: unit
        ref: "tests/unit/smoke.test.ts#unit test harness > runs a test and evaluates assertions; tests/unit/smoke-component.test.tsx#renders a JSX component into jsdom; 3 tests passed"
        status: pass
    human_judgment: false
  - id: D5
    description: "Playwright 4-project (desktop/mobile x ltr/rtl) visual-regression matrix configured with determinism settings"
    requirement: FND-08
    verification:
      - kind: automated_ui
        ref: "playwright.config.ts (projects desktop-ltr, desktop-rtl, mobile-ltr, mobile-rtl; reducedMotion reduce; snapshotPathTemplate {projectName}; reuseExistingServer false)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Four committed baselines exist and re-run green"
    requirement: FND-08
    verification:
      - kind: automated_ui
        ref: "npm run test:visual -> 4 passed (second run, baselines matched); tests/visual/__screenshots__/<project>/gallery-scaffold.spec.ts/harness-scaffold.png"
        status: pass
    human_judgment: false
  - id: D7
    description: "Baselines are trusted as FND-08 evidence (must be regenerated inside the pinned Playwright container)"
    verification: []
    human_judgment: true
    rationale: "Playwright rendering is environment-bound (OS, browser build, fonts, headless mode). These baselines were generated on Windows and are provisional until CI runs in mcr.microsoft.com/playwright:v1.63.0-noble."
  - id: D8
    description: "CI runs all four quality gates plus a containerized visual job with a baseline-drift gate"
    requirement: FND-01
    verification:
      - kind: other
        ref: ".github/workflows/ci.yml — npx yaml-lint .github/workflows/ci.yml -> success; grep asserts node-version 24.21.0, npm run lint/typecheck/test/build, mcr.microsoft.com/playwright:v1.63.0-noble, needs: quality, git diff --exit-code tests/visual/__screenshots__, upload-artifact with if: \${{ !cancelled() }}"
        status: pass
    human_judgment: false

# Metrics
duration: 27min
completed: 2026-10-05
status: complete
---

# Phase 01 Plan 01 Summary

**Runnable Next.js 16 foundation: lints, type-checks, unit-tests and builds green, with a jsdom Vitest harness, a 4-project Playwright visual matrix producing four committed baselines, and CI enforcing every gate**

## Performance

- **Duration:** 27 min (excluding a 10 min dependency install)
- **Started:** 2026-10-05T04:12:04+03:00
- **Completed:** 2026-10-05T05:25:52+03:00
- **Tasks:** 4
- **Files modified:** 23

## Accomplishments

- `create-next-app` refused the non-empty repo root (`.planning/` conflict), so the project was scaffolded in a throwaway sibling directory and the generated files copied in — `.git`, `docs/`, and `.planning/` untouched.
- Node floor `>=24.21.0` declared in `engines`, matching every engine range in the stack (`@supabase/supabase-js >=22`, vitest, jsdom, eslint). CI pins `node-version: 24.21.0` in both jobs.
- TypeScript resolved and pinned to `^5.9.3` (5.9.3 is the highest published 5.x patch; `latest` is the 7.0.2 native Go port, deliberately avoided per research Open Question 1).
- Runtime deps limited to `motion`, `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query` — no `framer-motion`, `d3`, `gsap`, `next-intl`, or icon package.
- Tailwind v4 wired CSS-first: `postcss.config.mjs` is exactly `{ plugins: { "@tailwindcss/postcss": {} } }`, `globals.css` starts with `@import "tailwindcss";`, and no `tailwind.config.*` exists anywhere.
- `.tsx` pipeline proven in Wave 1: `smoke-component.test.tsx` renders through `createRoot` + `act()` inside jsdom and imports `@/app/page` so the alias is exercised end to end.
- Playwright matrix runs 4 projects (desktop/mobile x ltr/rtl) against a production `npm run build && npm run start` server and produces four baselines under `__screenshots__/<projectName>/gallery-scaffold.spec.ts/`.
- CI has two jobs: `quality` (four separate steps so a failure names the gate) and `visual-regression` (`needs: quality`, pinned container, mandatory `git diff --exit-code tests/visual/__screenshots__` drift gate, report artifact uploaded with `if: ${{ !cancelled() }}`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold the Next.js 16 project** - `2e5e3fa` (feat)
2. **Task 2: Pin the TypeScript major and configure the unit test runner** - `99698a7` (feat)
3. **Task 3: Configure the Playwright visual-regression harness** - `fbbbc79` (feat)
4. **Task 4: Add CI running every gate** - `9d964a9` (feat)

## Files Created/Modified

- `package.json` — engines floor, 7 npm scripts, pinned deps/devDeps
- `tsconfig.json` — `jsx: preserve`, `strict: true`, `moduleResolution: bundler`, `paths["@/*"]`
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` — from the scaffolder, unmodified
- `src/app/globals.css` — Tailwind v4 import plus a pointer to where `src/styles/tokens.css` lands (Plan 01-02)
- `src/app/layout.tsx` — placeholder `<html lang="en" dir="ltr">`, replaced by Plan 01-03's `[locale]` structure
- `src/app/page.tsx` — renders a single `<h1>` so the build has a route and the harness has an assertion target
- `.env.example` — `NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` only
- `.gitignore` — added `playwright-report/`, `test-results/`, `.playwright/`, and `!.env.example`; explicitly does not ignore `__screenshots__`
- `vitest.config.ts`, `tests/unit/setup.ts`, `tests/unit/smoke.test.ts`, `tests/unit/smoke-component.test.tsx`
- `playwright.config.ts`, `tests/visual/gallery-scaffold.spec.ts`, 4 committed baselines
- `.github/workflows/ci.yml`

## Decisions Made

1. **TypeScript 5.9.3, not 7.0.2.** Read the dist-tags first (`latest: 7.0.2`) and the highest 5.x patch from the full version list. `@supabase/ssr` still builds with `typescript ~5.8` and Next documents only `>=5.1.0`, so the 5.x line is the only line the ecosystem's own build configs target. Recorded deliberately rather than floating.
2. **ESLint 9.39.5 instead of the planned 10.12.0.** `eslint-config-next@16.3.8` bundles `eslint-plugin-react@7.37.5`, whose peer range is `^3 || ... || ^9.7`; on ESLint 10 every JSX rule crashes with `contextOrFilename.getFilename is not a function` because ESLint 10 removed that context method. No published `eslint-plugin-react` version supports ESLint 10 (checked all versions above 7.37.5 — none exist). 9.39.5 satisfies `eslint-config-next`'s own peer `>=9.0.0`, and `eslint@9` is the registry's `maintenance` dist-tag.
3. **React 19 needs `act()` in unit component tests.** `createRoot.render` is concurrent, so the first draft of the smoke test rendered and immediately queried the DOM, got `null`, and failed. Fixed by setting `globalThis.IS_REACT_ACT_ENVIRONMENT = true` in `tests/unit/setup.ts` and wrapping render/unmount in `act()`. This is a harness prerequisite every later component test inherits.
4. **`jsx: preserve` in tsconfig**, per the plan's Task 2 confirmation step. The scaffolder emits `react-jsx`; `preserve` matches the plan text and Next's own handling. Verified typecheck, tests, and build all still pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Task 1 - Blocking] Scaffolded via a throwaway directory instead of in place**
- **Found during:** Task 1 (Scaffold the Next.js 16 project)
- **Issue:** `create-next-app@latest .` aborted with "The directory patient-tracker-system contains files that could conflict: .planning/". The plan anticipated this and prescribed manual file creation as the fallback.
- **Fix:** Scaffolded into a temporary sibling directory `Web_Projects/tmp-scaffold-p01`, copied only the generated project files (`.gitignore`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `public/`, `src/app/*`) into the repo, then deleted the temp directory. No `git init`, no nested repo, nothing under `docs/` or `.planning/` deleted or modified.
- **Files modified:** all Task 1 files
- **Verification:** `git status` after the run shows no deletion or modification under `docs/` or `.planning/`; `git diff --stat HEAD -- docs .planning` is empty
- **Committed in:** `2e5e3fa`

**2. [Task 1 - Dependency] ESLint pinned to 9.39.5, not 10.12.0**
- **Found during:** Task 1 (`npm run lint` in the verify command)
- **Issue:** With the planned `eslint@^10.12.0`, `npm run lint` crashed before reporting a single finding: `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function`, raised inside `eslint-config-next/node_modules/eslint-plugin-react@7.37.5`. ESLint 10 removed `context.getFilename()`; that plugin's peer range (`^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7`) predates ESLint 10 and no published version supports it. This is a hard incompatibility in `eslint-config-next`'s own dependency tree, not a configuration mistake.
- **Fix:** Installed `eslint@^9.39.5` (the registry's `maintenance` dist-tag), which satisfies `eslint-config-next@16.3.8`'s peer `>=9.0.0`. `@playwright/test@1.63.0` has no ESLint coupling, so nothing else is affected.
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npm run lint` exits 0; only remaining output is one `import/no-anonymous-default-export` warning on `postcss.config.mjs`, which the plan pins to an exact one-line form.
- **Committed in:** `2e5e3fa`

**3. [Task 2 - Test failure] Wrapped the React 19 root render in `act()`**
- **Found during:** Task 2 (`npm run test`)
- **Issue:** The first `.tsx` smoke test called `createRoot(container).render(<Smoke />)` and asserted immediately; React 19 schedules the concurrent render, so the query returned `null` and the test failed.
- **Fix:** Set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` in `tests/unit/setup.ts` and wrapped `render`/`unmount` in `act()` from `react`.
- **Files modified:** `tests/unit/setup.ts`, `tests/unit/smoke-component.test.tsx`
- **Verification:** `npm run test` — 3 tests passed across 2 files; stable over 3 consecutive runs
- **Committed in:** `99698a7`

**4. [Task 3 - Expected] First `--update-snapshots=missing` run exits non-zero**
- **Found during:** Task 3 (`npm run test:visual -- --update-snapshots=missing`)
- **Issue:** All 4 projects failed on the first run with "A snapshot doesn't exist at ... writing actual." That is Playwright's normal behavior when creating baselines, and the plan's own `npm run test:visual` criterion requires a *second* run to match.
- **Fix:** None needed — re-ran `npm run test:visual`, which reported `4 passed (14.5s)`.
- **Files modified:** 4 baseline PNGs (committed as artifacts)
- **Verification:** second `npm run test:visual` run: 4 passed; final verification run also 4 passed
- **Committed in:** `fbbbc79`

---

**Total deviations:** 4 auto-fixed (1 blocking scaffold, 1 dependency pin, 1 test-harness correctness, 1 expected-first-run behavior)
**Impact on plan:** All four are necessary for the gates to be genuinely green. No scope creep: the ESLint change is a version-pin correction inside the same dependency, not a swap, and `eslint-config-next` (which the plan pins) is unchanged. Every other value in the plan was applied as written.

## Issues Encountered

- **npm 12 `EALLOWSCRIPTS` error during scaffold.** `create-next-app` aborted its internal install with `npm error code EALLOWSCRIPTS --allow-scripts is not allowed in project-scoped installs`. The generated files were already written before the install step, so the temp-directory copy path sidesteps it entirely; the repo's own `npm install` used the explicit `package.json` the plan specifies and succeeded (430 packages).
- **`EBADENGINE` warning on install is expected.** The local Node is v22.22.3 while `engines.node` is `>=24.21.0`. That is a declared field per the plan, not an enforced one (`engine-strict` is deliberately not added), so installs succeed and every dev-dep engine range is satisfied. CI pins 24.21.0.
- **Vite config-loader warning under Vitest 5.** `Your Vite config uses features that are unsupported by configLoader: 'native'` — informational only; Vitest falls back to the bundler loader and all tests pass. Left as-is rather than adding `"type": "module"` to `package.json`, which would change how `next.config.ts` and `postcss.config.mjs` are interpreted.
- **Visual baselines are provisional.** See Next Phase Readiness.

## Verification Evidence

Plan-level checklist, all run on 2026-10-05 after the final commit:

| Check | Result |
|-------|--------|
| `npm run lint` exits 0 | PASS (0 errors, 1 warning) |
| `npm run typecheck` exits 0 | PASS |
| `npm run test` exits 0 | PASS — 2 files, 3 tests |
| `npm run build` exits 0 | PASS — routes `/` and `/_not-found` |
| `npm run test:visual` exits 0 on re-run | PASS — 4 passed |
| `engines.node` prints `>=24.21.0` | PASS |
| No `tailwind.config.*` file exists | PASS |
| No `middleware.ts` file exists | PASS (also no `proxy.ts` — Phase 2 adds it) |
| `docs/` and `.planning/` intact | PASS — `git diff --stat HEAD -- docs .planning` empty |
| No clinical UI, auth, or database code added | PASS — `src/app/page.tsx` renders one `<h1>` |

Task-level acceptance criteria were each checked with real commands; all 12 for Task 1, 7 for Task 2, 8 for Task 3, and 7 for Task 4 pass.

## User Setup Required

None - no external service configuration required. `.env.example` documents the two public Supabase variable names; no secret key name appears anywhere in the repo, and `.env.local` stays git-ignored via `.env*`.

## Next Phase Readiness

- Plan 01-02 (Wave 2) can start immediately: `npm run test -- tokens` works against the jsdom harness, `@/` resolves into `src/`, and `src/styles/tokens.css` does not yet exist so there is no conflict.
- Plan 01-03 (Wave 3) will replace `src/app/layout.tsx` with the `[locale]` structure and **delete `tests/visual/gallery-scaffold.spec.ts` plus its four baselines** — they are placeholders and should not survive into the locale-prefixed app. `test:visual` carries `--pass-with-no-tests` so the wave gate stays green while `tests/visual/` is legitimately empty.
- **Blocker for trusted visual evidence:** the four committed baselines were generated on Windows and reflect that machine's font rasterization. They must be regenerated inside `mcr.microsoft.com/playwright:v1.63.0-noble` in CI before they are admissible as FND-08 proof. The Arabic companion typeface (FND-06, owner decision) must be chosen *before* trusting them — changing it invalidates every baseline.
- The Arabic font stack is not yet self-hosted; system font availability is still part of the local test contract (research Pitfall 4). Plan 01-02/01-03 should resolve it before the real gallery baselines are generated.
- `eslint@9.39.5` is on the registry's `maintenance` dist-tag and is deprecated upstream. Revisit when `eslint-config-next` ships a release whose `eslint-plugin-react` supports ESLint 10.

---
*Phase: 01-foundation*
*Completed: 2026-10-05*

## Self-Check: PASSED

- All 4 tasks completed and committed atomically (`2e5e3fa`, `99698a7`, `fbbbc79`, `9d964a9`).
- All 7 npm scripts exist; `lint`, `typecheck`, `test`, `test:visual`, `build` all exit 0 on re-run. `dev` and `start` exist and `start` was exercised by the Playwright `webServer`.
- TypeScript pinned to `^5.9.3` (resolved 5.9.3), not floating and not `^7`.
- 4-project Playwright matrix produces and matches four named baselines at paths including `{projectName}` and `{testFilePath}`.
- CI runs lint, type-check, test, build, and the containerized visual job with the baseline-drift gate.
- No unapproved dependency added: `motion` present, `framer-motion`/`d3`/`gsap`/`next-intl`/icon packages absent, `@testing-library/*` deferred to Plan 01-03 Task 4 as the plan specifies.
- No Phase 2/3 scope leaked in: no auth, no database code, no clinical UI, no `middleware.ts`/`proxy.ts`.
- `docs/` and `.planning/` unmodified; the only untracked paths (`.planning/patient-workspace-spec-kit-prompt-pack-v2.md`, `.planning/tmp/`) predate this plan and were left alone.
- Deviations (4) are all recorded above with cause, fix, and verification; the ESLint pin is the only one that changes a value the plan named, and it was forced by an upstream peer incompatibility that made `npm run lint` impossible at ESLint 10.