---
phase: 02-foundation-and-app-shell
plan: 02-02
subsystem: infra
tags: [nextjs, tailwindcss-v4, typescript, playwright, vitest, npm-scaffold, tokens]

# Dependency graph
requires:
  - phase: 01-project-constitution-reference-ui-specification
    provides: docs/governance/tokens.json (the frozen 15-token set the generators will read), project-constitution §8 rule text, motion-rules two-layer contract
provides:
  - package.json with the exact 11-script contract (predev, dev, prebuild, build, start, lint, tokens:generate, tokens:check, test, test:unit, test:visual) later plans wire into
  - Committed package-lock.json pinning the resolved dependency tree (199 packages)
  - Thirteen audited packages at pinned versions, installed (node_modules/ untracked)
  - Playwright Chromium installed (chromium-1243, Chrome for Testing 153.0.8010.12)
  - tsconfig.json (strict: true, bundler resolution, @/* → ./src/*)
  - postcss.config.mjs (single plugin @tailwindcss/postcss)
  - next.config.ts (empty config + D-03 no-middleware comment)
  - .gitignore making src/styles/tokens.generated.{css,ts} uncommittable (D-06) and all .env* variants ignored
  - .npmrc (engine-strict=true, audit=true)
affects: [02-03 next app shell, 02-04 token scripts, 02-05 primitives, 02-07 overlays, playwright.config.ts, vitest.config.ts]

# Tech tracking
tech-stack:
  added: [next 16.3.8, react 19.3.0, react-dom 19.3.0, tailwindcss 4.3.3, @tailwindcss/postcss 4.3.3, motion 14.0.0, gsap 3.15.0, lucide-react 1.52.0, typescript ~5.9 (→5.9.3), @types/node 26.6.4, @types/react 19.3.0, @types/react-dom 19.3.0, @playwright/test 1.63.0, vitest 5.0.3, @vitejs/plugin-react 6.1.2, jsdom 30.1.2]
  patterns: [npm pre-hooks as the token-layer enforcement mechanism (D-05/D-13), gitignored generated artifacts with a committed governance source (D-06), CSS-first Tailwind v4 with no JS config]

key-files:
  created: [package.json, package-lock.json, .npmrc, tsconfig.json, next.config.ts, postcss.config.mjs, .gitignore]
  modified: []

key-decisions:
  - "All 13 packages pinned to exact versions (no ^/~) except the plan's own deliberate typescript@~5.9 range; npm's install-time caret normalization of package.json was reverted so the manifest carries the exact pins the plan requires"
  - "gasp-free allowlist held: no ESLint/Prettier/Biome/Storybook/Supabase/D3/zod/testing-library/headless-UI; runtime set is exactly the 8 audited packages"
  - "next.config.ts intentionally empty of routing options with a D-03 comment: no middleware exists and none is planned this phase; routes are open by decision until Phase 003"
  - "predev/prebuild/lint reference scripts/generate-tokens.mjs and scripts/check-design-tokens.mjs which do not exist yet — the loud failure is intended (02-RESEARCH Pitfall 5); verified live: npm run tokens:generate → exit 1, Cannot find module ...\\scripts\\generate-tokens.mjs"

patterns-established:
  - "Token layer enforced through npm lifecycle hooks: prebuild = generate-tokens && check-design-tokens; lint = check-design-tokens only (never routed through a general linter)"
  - "Generated token artifacts are structurally uncommittable; docs/governance/tokens.json stays the only committed source of token values (D-06)"

requirements-completed: [FOUND-01]  # FOUND-01 is the plan's requirement; scaffold-level contribution (route map work lands in 02-03+)

# Metrics
duration: 19min
completed: 2026-10-06
status: complete

---

# Phase 02 Plan 02-02: Repository Scaffold and Build Hooks Summary

**Installable Next.js 16.3.8 + React 19.3 + Tailwind v4 scaffold with 13 exactly-pinned audited packages, a committed lockfile, the 11-script hook contract that enforces the token layer (D-05/D-13), and a `.gitignore` that makes generated token artifacts uncommittable (D-06).**

## Performance

- **Duration:** 19 min
- **Started:** 2026-10-06T18:12:35Z
- **Completed:** 2026-10-06T18:45:20Z
- **Tasks:** 2/2
- **Files modified:** 7 created

## Accomplishments
- `package.json` created with `private: true`, `engines.node >= 22`, the exact 11-script set, a `_comment` field making D-13's load-bearing lint contract explicit to future readers, and all 13 audited packages pinned exactly (runtime: next 16.3.8, react/react-dom 19.3.0, tailwindcss + @tailwindcss/postcss 4.3.3, motion 14.0.0, gsap 3.15.0, lucide-react 1.52.0; dev: typescript ~5.9, @types/node, @types/react@19, @types/react-dom@19, @playwright/test 1.63.0, vitest 5.0.3, @vitejs/plugin-react 6.1.2, jsdom 30.1.2)
- Both exact install commands from `02-RESEARCH.md` §Standard Stack ran verbatim from the repo root; `package-lock.json` (lockfileVersion 3, 199 packages, committed) records the resolved tree; resolved installed versions verified on disk and all match the pins
- Playwright Chromium installed: chromium-1243 / Chrome for Testing 153.0.8010.12 under `%LOCALAPPDATA%\ms-playwright`; `npx playwright install --dry-run chromium` resolves the revision
- `tsconfig.json` (`strict: true`, `moduleResolution: bundler`, `paths: {"@/*": ["./src/*"]}`), `postcss.config.mjs` (single plugin `@tailwindcss/postcss`, no extras), `next.config.ts` (empty config + D-03 no-middleware comment), `.gitignore` (node_modules, .next, report/coverage dirs, every `.env*` variant, and both generated token artifacts), `.npmrc` (`engine-strict=true`, `audit=true`)
- Expected loud failure proven live (recorded, not a gate): `npm run tokens:generate` → exit 1, `Error: Cannot find module '...\scripts\generate-tokens.mjs'` — the intended state until plan 02-03 creates the generator (02-RESEARCH Pitfall 5)

## Task Commits

1. **Task 1: package.json with exact script set and pinned dependency versions** - `a69156a` (chore)
2. **Task 2: build configs and the gitignore that makes generated tokens uncommittable** - `3c33ecf` (feat)

**Plan metadata:** pending (docs commit follows this summary)

## Files Created/Modified
- `package.json` - the script contract + 13 exact pins + `_comment` (D-13 append-never-replace note)
- `package-lock.json` - committed resolved tree (199 packages), reproducible install
- `.npmrc` - `engine-strict=true`, `audit=true`; the only package in the lockfile declaring an install script is the macOS-optional `fsevents`
- `tsconfig.json` - strict TS 5.9.3, bundler resolution, `@/*` alias matching what vitest.config.ts (plan 02-03) must declare
- `next.config.ts` - empty config; comment records D-03 (no middleware this phase, do not add a placeholder gate)
- `postcss.config.mjs` - the single `@tailwindcss/postcss` plugin; no tailwind.config.js exists (v4 is CSS-first)
- `.gitignore` - node_modules/, .next/, out/, coverage/, playwright-report/, test-results/, blob-report/, `.env`/`.env.local`/`.env.production`/`.env*.local`, `src/styles/tokens.generated.css`, `src/styles/tokens.generated.ts`, OS noise

## Decisions Made
- npm normalized exact versions to carets during `npm install` (documented npm behavior); after both installs completed, package.json's dependency versions were set back to the exact pins and verified that every installed `node_modules/<pkg>/package.json` version already matches the pinned value — so the manifest carries the plan's exact pins and the tree is unchanged. `typescript` resolved to 5.9.3 on the ~5.9 line.
- `scripts/generate-tokens.mjs` and `scripts/check-design-tokens.mjs` were NOT created and the hooks were NOT made lenient — per plan constraint, the loud failure until plans 02-03/02-04 is intended behavior, proven live and recorded above.
- No `src/`, route, component, test file, tailwind.config.js, CI config, or dark-mode token set was created, per the plan prohibitions.

## Deviations from Plan

None — plan executed exactly as written. (npm's caret normalization of package.json during `npm install` was corrected back to exact pins within task-1; see Decisions Made.)

## Issues Encountered
- `npm install --package-lock-only` errored refused-to-fetch for `@tailwindcss/oxide-wasm32-wasi` (this npm config disables remote-type fetch for that wasm optional dep); it was unnecessary — the real install had already produced a complete valid lockfile including that optional entry with integrity hash, plus the `@emnapi/runtime` bundle member. The erroneous command left no damage and the committed lockfile is the one produced by the real installs.
- `gsap`: installed at 3.15.0, unconsumed — `src/` does not exist yet, so the phase-gate check `grep -rn "gsap" src/ | wc -l` == 0 is recorded for plan 02-11 per the plan's own instruction.

## User Setup Required
None — no external service configuration required. Playwright Chromium is installed workstation-local (per 02-RESEARCH §Environment Availability, baseline PNGs are workstation-local too).

## Next Phase Readiness
- Plan 02-03 can create `src/`, the route groups, `scripts/generate-tokens.mjs`, `vitest.config.ts` and `playwright.config.ts` against this scaffold; the `@/*` alias is already declared in tsconfig.json and must be matched there.
- `npm run dev`/`npm run build`/`npm run lint` fail loudly until the token scripts exist (plans 02-03/02-04) — this is the designed state, not a defect; from plan 02-04 onward both must pass.
- Windows notes inherited for later plans: Playwright `webServer.gracefulShutdown` ignored on Windows; `snapshotPathTemplate` uses forward slashes.

## Self-Check: PASSED

- Files: package.json, package-lock.json, .npmrc, tsconfig.json, next.config.ts, postcss.config.mjs, .gitignore — all FOUND on disk.
- Commits: `a69156a` (task 1), `3c33ecf` (task 2) — both FOUND in `git log`.
- All acceptance-criteria probes printed their OK tokens: SCRIPTS-OK, PREBUILD-OK, LINT-OK, RUNTIME-ALLOWLIST-OK:8, EXACT-PINS-OK, GSAP-PINNED:3.15.0, NO-RENDERER-DEPS, NO-FORBIDDEN-DEPS, TS-5.9-OK:~5.9, TSCONFIG-OK, GITIGNORE-OK, ENV-IGNORE-OK, NO-MIDDLEWARE-CONFIG/FILES, NO-TAILWIND-CONFIG, playwright 1.63.0 + chromium-1243 dry-run resolved.

---
*Phase: 02-foundation-and-app-shell*
*Completed: 2026-10-06*
