---
phase: 01-foundation-app-shell-design-system-infrastructure-i18n-rtl-b
plan: 04
subsystem: infra
tags: [motion, reduced-motion, supabase, eslint, vitest, rsc, env-vars]

# Dependency graph
requires:
  - phase: 01-foundation-app-shell-design-system-infrastructure-i18n-rtl-b
    provides: "plan 01-02 locale routing + Western-digit formatting; plan 01-03 the eleven UI primitives on the token layer; the single @theme static token layer with --motion-* tokens"
provides:
  - "Single app-wide MotionConfig reducedMotion=\"user\" provider mounted at the [locale] root layout"
  - "Four motion primitives (Fade, RevealUp, PressScale, ExpandCollapse) with internal reduced-motion branches"
  - "Shared motion variants with a test-enforced pairing to the CSS --motion-* tokens"
  - "ESLint no-restricted-imports guards that make the motion primitive layer unbypassable"
  - "Supabase browser and server client factories reading only the two NEXT_PUBLIC_* variables"
  - "Executed proof that no privileged credential exists in src/ or in the production bundle"
affects: [04-patient-workspace, 05-d3-timeline, 06-provider-home, 07-medications, 21-telehealth, 02-identity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client boundary parked at one provider: the locale layout stays a Server Component so lang/dir resolve on the server, while MotionConfig/useReducedMotion stay on the client"
    - "Motion reaches components only through src/components/motion/* primitives; direct motion/react imports are a lint error"
    - "CSS owns hover/focus affordances (motion-safe/motion-reduce), Motion owns enter/exit/layout — both configured independently"
    - "Supabase wiring is factory-shape only in Phase 1; no admin client, no route protection, no getClaims(), no session refresh"

key-files:
  created:
    - src/components/motion/motion-provider.tsx
    - src/components/motion/variants.ts
    - src/components/motion/motion-primitives.tsx
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - tests/unit/motion.test.tsx
    - tests/unit/supabase.test.ts
  modified:
    - src/app/[locale]/layout.tsx
    - eslint.config.mjs

key-decisions:
  - "reducedMotion=\"user\" is set on exactly one MotionConfig at the root; Motion's own default is \"never\", so without it FND-05 fails silently"
  - "Each primitive absorbs the reduced-motion policy internally via useReducedMotion, so no caller ever writes the hook"
  - "Under reduced motion ExpandCollapse uses an instant `hidden` state change instead of an animated height, which is also the correct accessibility state"
  - "The ESLint rule objects are ordered narrow-without-ignores FIRST, broad-with-ignores LAST, because flat config replaces rule options last-wins rather than accumulating them"
  - "The browser client is a plain factory with no manual cache: createBrowserClient is already a singleton"
  - "The server client is documented as NOT working auth; Phase 2 is a cutover, not a rewrite"

patterns-established:
  - "Single policy provider: app-wide behavior (reduced motion) is configured once at the root, not per usage"
  - "Primitives absorb policy: callers compose behavior without knowing the policy exists"
  - "Enforcement over documentation: a lint rule plus a belt-and-braces test, not a comment"
  - "Bundle-level security check: a security requirement about the shipped product is proven against .next/static, not against the source tree"
  - "Comment-stripped source scans: prose documenting a prohibition must not be mistaken for a use of it"

requirements-completed: [FND-05, FND-09]

coverage:
  - id: D1
    description: "A single MotionConfig reducedMotion=\"user\" provider wraps the root locale layout, and the layout remains a Server Component"
    requirement: FND-05
    verification:
      - kind: unit
        ref: "tests/unit/motion.test.tsx#motion primitives render inside the app-wide provider"
        status: pass
      - kind: other
        ref: "npm run build (prerendered .next/server/app/en.html and ar.html keep lang/dir from the server)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four motion primitives exist, each with an internal reduced-motion branch that callers never write"
    requirement: FND-05
    verification:
      - kind: unit
        ref: "tests/unit/motion.test.tsx#reduced-motion branches"
        status: pass
    human_judgment: false
  - id: D3
    description: "The motion primitive layer is unbypassable: lint bans motion/react outside the layer and framer-motion everywhere, verified by probing both scopes"
    requirement: FND-05
    verification:
      - kind: other
        ref: "npm run lint + eslint --print-config on a file inside and outside src/components/motion/"
        status: pass
      - kind: unit
        ref: "tests/unit/motion.test.tsx#the motion layer cannot be bypassed"
        status: pass
    human_judgment: false
  - id: D4
    description: "Motion numeric durations/easing cannot drift from the CSS --motion-* tokens"
    verification:
      - kind: unit
        ref: "tests/unit/motion.test.tsx#motion tokens stay paired with the CSS tokens"
        status: pass
    human_judgment: false
  - id: D5
    description: "Supabase browser and server client factories read only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, with no Phase 2 scope"
    requirement: FND-09
    verification:
      - kind: unit
        ref: "tests/unit/supabase.test.ts#Supabase browser client (FND-09)"
        status: pass
    human_judgment: false
  - id: D6
    description: "FND-09 proven as an executed check against the production bundle, not by inspection"
    requirement: FND-09
    verification:
      - kind: unit
        ref: "tests/unit/supabase.test.ts#production bundle carries no privileged credential"
        status: pass
    human_judgment: false
  - id: D7
    description: "Owner review of how the reduced-motion resting states actually LOOK (Phase 4 tab underline, Phase 6 folder peek, timeline node expansion become instant jumps)"
    verification: []
    human_judgment: true
    rationale: "The reduced-motion branches are proven correct in code and by test, but whether each indicator's instant resting state is visually acceptable is a design judgment only the owner can make, and the ref-A reference images are still missing (Phase 1 prerequisite)."

# Metrics
duration: 14min
completed: 2026-10-05
status: complete
---

# Phase 1 Plan 04 Summary

**App-wide `reducedMotion="user"` policy behind four lint-enforced motion primitives, plus a Supabase browser/server client pair proven to ship no privileged credential in source or bundle**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-05T04:59Z
- **Completed:** 2026-10-05T05:13Z
- **Tasks:** 4
- **Files modified:** 9

## Accomplishments

- Reduced-motion policy installed at the root: `<MotionConfig reducedMotion="user">` in `src/components/motion/motion-provider.tsx`, wrapping the `[locale]` layout body. Motion's own default is `"never"`, so this single line is what stops FND-05 failing invisibly. The layout itself remains a Server Component, so `lang`/`dir` are still resolved on the server (verified in the prerendered `en.html`/`ar.html`).
- `Fade`, `RevealUp`, `PressScale`, and `ExpandCollapse` compose the motion surface. Each absorbs the policy internally via `useReducedMotion()`, so no caller ever writes the hook; `ExpandCollapse` degrades to an instant `hidden` state rather than an animated height.
- The primitive layer cannot be bypassed. Both lint scopes were probed with real offending imports and confirmed to error, and `--print-config` shows `motion/react` + `framer-motion` banned outside the layer and `framer-motion` alone inside it.
- Supabase wiring exists in the documented shape only: the browser client is a two-variable factory, the server client is factory-plus-cookies with no route protection, no `getClaims()`, and no session refresh, so Phase 2 is a cutover rather than a rewrite.
- FND-09 is proven by execution, not inspection: a test walks `src/` for privileged key names and another walks `.next/static` for `sb_secret_`/`service_role` after a real build (0 hits across the bundle).

## Task Commits

1. **Task 1: Create the app-wide reduced-motion provider** - `a3619e5` (feat)
2. **Task 2: Build motion primitives with internal reduced-motion branches** - `cb7234b` (feat)
3. **Task 3: Enforce the primitive layer with a lint rule and tests** - `cbbeedf` (feat)
4. **Task 4: Wire the Supabase browser client and prove no privileged credential is reachable** - `1398f74` (feat)

## Files Created/Modified

- `src/components/motion/motion-provider.tsx` — the single app-wide `MotionConfig reducedMotion="user"` policy
- `src/components/motion/variants.ts` — shared durations/easing/variants; plain data, no client directive, so Server Components may import it
- `src/components/motion/motion-primitives.tsx` — `Fade`, `RevealUp`, `PressScale`, `ExpandCollapse`, each with an internal reduced-motion branch
- `src/app/[locale]/layout.tsx` — wraps `<body>` children in `<MotionProvider>`; still a Server Component
- `eslint.config.mjs` — two ordered `no-restricted-imports` objects: broad ban outside the motion layer, `framer-motion`-only ban inside it
- `src/lib/supabase/client.ts` — browser client factory over the two `NEXT_PUBLIC_*` variables
- `src/lib/supabase/server.ts` — server client factory (cookies via `next/headers`); factory shape only, documented as not-working-auth
- `tests/unit/motion.test.tsx` — 14 tests: primitive renders, reduced-motion branches, CSS/JS token pairing, no-bypass scans
- `tests/unit/supabase.test.ts` — 6 tests: client env-var scope, source-tree scan, module inventory, and the `.next/static` bundle scan

## Decisions Made

- **`variants.ts` carries no client directive and the layout carries no client directive.** Motion needs numeric seconds and CSS needs length strings, so the two token sets cannot literally be one declaration; `tests/unit/motion.test.tsx` pins the pairing in both directions (`120ms` ↔ `0.12`, `200ms` ↔ `0.2`, and the `cubic-bezier` control points).
- **Motion assertions target the animation definition, not a rendered frame.** `motion` schedules style work after mount; the suite drives `useReducedMotion` through `vi.mock` with everything else left real, and asserts the presence/absence of a `translateY` transform.
- **No admin/privileged client was created, and `src/lib/supabase/` is pinned to exactly two modules by test.** Phase 2 owns that decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Blocking] Reversed the two ESLint config objects so both import bans are actually live**
- **Found during:** Task 3 (Enforce the primitive layer with a lint rule and tests)
- **Issue:** The plan placed the object with `ignores` first and the narrower `framer-motion` ban second. Flat config does not accumulate rule options — the later object replaces the earlier one wholesale. Probing a file outside `src/components/motion/` with a `motion/react` import produced **no error**, and `--print-config` confirmed only the `framer-motion` pattern survived. The plan's stated ordering would have shipped a rule that looked correct and enforced nothing.
- **Fix:** Swapped the order — the narrower no-`ignores` object first, the broader one with `ignores` last. Same two rule bodies, same scopes, opposite order.
- **Files modified:** `eslint.config.mjs`
- **Verification:** A `framer-motion` import inside the motion layer errors; a `motion/react` import in `src/components/ui/Chip.tsx` errors; `--print-config` reports `["motion/react","framer-motion"]` outside the layer and `["framer-motion"]` inside it; both probes removed; `npm run lint` clean.
- **Committed in:** `cbbeedf`

**2. [Rule 1 - Correctness] Scan comment-stripped source for env-var references and privileged key names**
- **Found during:** Task 4 (Supabase browser client)
- **Issue:** `client.ts` carries a comment warning future editors away from the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`. A raw-source scan counted that prose as a third referenced variable and failed the suite. The same class of problem would let a comment later hide — or fake — a real finding.
- **Fix:** Both source scans now strip comments first, matching the existing convention in `tests/unit/tokens.test.ts`.
- **Files modified:** `tests/unit/supabase.test.ts`
- **Verification:** `npm run test -- supabase` passes 6/6 after a real `npm run build`.
- **Committed in:** `1398f74`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 correctness)
**Impact on plan:** Both were required for the plan's own acceptance criteria to be satisfiable — the first because the specified lint ordering enforced nothing, the second because the specified scan failed on a correct file. No scope change; no file added or removed beyond the plan's list.

## Issues Encountered

- A first attempt at the Task 3 lint probe was placed inside the provider's block comment, so lint correctly stayed silent. Re-read the file, moved the probe below the comment, and both probes then errored as expected. Probe edits were fully reverted.
- One edit to `tests/unit/supabase.test.ts` left the file syntactically broken (a helper inserted inside an `it` block). Caught by the edit tool's parse warning, repaired by re-reading the region and replacing the exact range.

## User Setup Required

None — no external service configuration required. `.env.example` already declares exactly the two variables the clients read; no placeholder URL or key was hardcoded anywhere, and `process.env.X!` is only read at call time, so the factories compile without a configured Supabase project.

## Verification

All five quality gates exit 0: `npm run lint` (0 errors, 1 pre-existing `import/no-anonymous-default-export` warning in `postcss.config.mjs`), `npm run typecheck`, `npm run test` (8 files / 61 tests), `npm run build`, `npm run test:visual`.

Plan checklist, each executed:
- `MotionConfig reducedMotion="user"` wraps the root layout — verified in source and present in the shipped client chunk.
- No file outside `src/components/motion/` imports `motion/react` — verified by scan and by lint.
- No `framer-motion` import exists anywhere — the only occurrence in `src/` is prose inside a comment, confirmed comment-only.
- Motion CSS/JS token values agree — pinned by test in both directions.
- The production bundle contains no `sb_secret_` or `service_role` — 0 hits across every file under `.next/static`.
- No route protection, session refresh, or admin client was built — `src/lib/supabase/` holds exactly two files and `getClaims`/`getSession`/`redirect` appear only in the comment that explains their absence.
- The Wave 2 token guard tests were not modified and still pass.

## Next Phase Readiness

- Plan 01-05 (design gallery) can compose the motion primitives directly; the lint rule already forbids importing `motion/react` in the gallery.
- Phase 2 adds route protection, `getClaims()`, session refresh, and `proxy.ts` on top of `src/lib/supabase/server.ts`, which currently contains only the factory.
- Blockers unchanged and owned by the plan, not by this one: the five ref-A reference images are still missing, so how the reduced-motion resting states actually look cannot be reviewed yet (coverage D7).

## Self-Check: PASSED

- All 4 tasks completed and committed atomically: `a3619e5`, `cb7234b`, `cbbeedf`, `1398f74`.
- Full gate re-run after the final task commit: `npm run lint` (0 errors, 1 pre-existing `import/no-anonymous-default-export` warning in `postcss.config.mjs`), `npm run typecheck`, `npm run test` (8 files / 61 tests), `npm run build`, `npm run test:visual` — all exit 0.
- Task acceptance gates each executed with real output, not inspection: Task 1's six criteria checked by node assertions over the three files plus lint/typecheck/build; Task 2's five by export/useReducedMotion assertions plus typecheck/lint; Task 3's six by two live lint probes plus `--print-config` on a file inside and outside the motion layer; Task 4's seven by `npm run build` and the 6/6 supabase suite.
- Lint rules are proven, not shipped untested: a `framer-motion` import inside `src/components/motion/` errored, a `motion/react` import in `src/components/ui/Chip.tsx` errored, `--print-config` reported `["motion/react","framer-motion"]` outside the layer and `["framer-motion"]` inside it, both probes were removed, and `npm run lint` returned clean.
- Wave 2 token guards still pass: `tests/unit/tokens.test.ts` runs unmodified inside the 8-file suite, with no new `@theme` block and no physical direction property introduced.
- FND-09 proven by an executed check: 0 hits for `sb_secret_`/`service_role` across every file under `.next/static` after a real production build, and 0 in any of the 25 files under `src/`. The only `framer-motion` string in `src/` is prose inside a comment, confirmed comment-only with a stripped-source scan.
- Plan checklist items confirmed independently: the prerendered `.next/server/app/{en,ar}.html` still open with the correct `lang`/`dir`; `reducedMotion` + `"user"` is present in the shipped client chunk; `src/lib/supabase/` contains exactly `client.ts` and `server.ts`; `getClaims`/`getSession`/`redirect` appear only in the comment documenting their deliberate absence.
- Non-goals respected: no gallery (plan 01-05), no auth/RBAC (Phase 2), no schema or migrations (Phase 3), no clinical UI, no new `@theme` block, and `framer-motion` was NOT installed alongside `motion`.
- Dependencies added: none. `package.json` and `package-lock.json` are untouched by this plan's commits — the two devDependency lines visible against `9452e85` were added by plan 01-03.
- No privileged key name appears in any client-reachable file: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are the only two variables either client reads, no placeholder URL or key is hardcoded anywhere, and no admin/privileged client module exists.
- No Phase 2 scope leaked in: no route protection, no session refresh, no `proxy.ts`, no `getClaims()` call, no admin client.
- `docs/` and `.planning/` intact: `git diff --stat 56b14e8 HEAD -- docs` is empty and this plan's commits touch no other `.planning/` file.

---
*Phase: 01-foundation-app-shell-design-system-infrastructure-i18n-rtl-b*
*Completed: 2026-10-05*
