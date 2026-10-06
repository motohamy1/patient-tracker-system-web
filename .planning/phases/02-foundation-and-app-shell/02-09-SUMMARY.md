---
phase: 02-foundation-and-app-shell
plan: 02-09
subsystem: ui
tags: [nextjs, app-router, route-groups, auth-shell, patient-shell, not-found, dev-fixtures, fixture-scope, no-fake-clinical-data, tokens]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell
    provides: "Surface/Button/Icon (02-05), Pill/TabBar/CompactControl/motion (02-06), EmptyState/Overlay (02-07), the generated token layer and the three machine checks (02-03/02-04), and the provider group + route-group pattern + D-03 slot comment (02-08)"
provides:
  - "The (auth) route group: a bare canvas layout and the /login empty shell carrying the D-03 marker"
  - "The (patient) route group: canvas + PatientTopBar + MobileNav, with /patient and /patient/home empty shells carrying the D-03 marker"
  - "PatientTopBar — the patient chrome component (menu iconOnly, Patient label, avatar with a decorative success dot, bell; no CTA, no sidebar)"
  - "src/app/not-found.tsx — the root 404 that `/` resolves to; no src/app/page.tsx exists"
  - "src/lib/dev/fixtures.ts — the only Patient-shaped literal in the repository, plus tests/unit/dev-fixtures.test.ts enforcing its scope and unreachability"
affects: [02-10, 02-11, 003, 004, 005]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A role group with no persistent chrome is expressed as a route-group layout (the (auth) group proves the pattern supports a bare group, so no chrome leaks into the root layout)"
    - "`/` is deliberately undefined and resolves to the root not-found.tsx rather than a root page.tsx, so the locked D-01 route map is not silently widened (02-RESEARCH.md Open Questions 2)"
    - "A `Patient`-shaped literal is permitted in exactly one directory (src/lib/dev/), and a unit test walks src/ to enforce that rather than trusting a reviewer"
    - "Dev fixtures carry the shape and never a value: every clinical collection is empty by construction"

key-files:
  created:
    - src/components/shell/PatientTopBar.tsx
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(patient)/layout.tsx
    - src/app/(patient)/patient/page.tsx
    - src/app/(patient)/patient/home/page.tsx
    - src/app/not-found.tsx
    - src/lib/dev/fixtures.ts
    - tests/unit/dev-fixtures.test.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "The PatientTopBar menu and bell glyphs are rendered to elements and passed to the client Button as children, because a Luce component reference is a function and cannot cross the Server-to-Client boundary (same fix as plan 02-08)"
  - "The (patient) group renders MobileNav with a single Home affordance; it has no primary tab set (UI-SPEC §6.5), so the strip is not a tab set and the top-bar menu control is the navigation affordance"
  - "The avatar state dot is aria-hidden and decorative; the 'Patient' label carries the meaning textually, per §4.3 (status is never hue-only)"

patterns-established:
  - "A test that reads the filesystem runs in the Vitest `node` project; a top-level tests/unit/*.test.ts is a non-component test and is collected by the node project"
  - "No auth route renders a form or an action; the D-03 server-side role-resolution marker is repeated on every role layout and on /login"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, UX-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The (auth) group is bare: a canvas field with one centred column and no rail/top bar/nav, and /login renders the fixed 8.1 empty state with no form, no input, no password field and no submit, carrying the D-03 marker"
    requirement: "FOUND-03"
    verification:
      - kind: other
        ref: "grep -v comment src/app/(auth)/layout.tsx | grep -c 'Rail|ProviderRail|ProviderTopBar' -> 0; grep -v comment login/page.tsx | grep -ci 'input|password|<form|type=\"submit\"' -> 0"
        status: pass
      - kind: other
        ref: "npm run build -> exit 0; route listing names /login; grep -c 'server-side' on login/page.tsx -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "The (patient) group renders canvas + PatientTopBar + MobileNav, /patient renders 'No record yet' and /patient/home renders 'No care activity yet' with no action, both carrying the D-03 marker and no sidebar"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "npm run build -> exit 0; route listing names /patient and /patient/home; grep -c 'server-side' patient/layout.tsx -> 1"
        status: pass
      - kind: other
        ref: "find src/app -name page.tsx | wc -l -> 13; grep -v comment patient/page.tsx | grep -c 'action=' -> 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "PatientTopBar exists, is token-pure, ships accessible names on both icon-only controls (type-level required) and renders no CTA"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "npm run lint (check-design-tokens: 0 violations across 40 files, token-reference-required passes)"
        status: pass
      - kind: other
        ref: "grep -o -E '#[0-9A-Fa-f]{6}' -r src/app src/components | wc -l -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rendered appearance of the (auth) and (patient) shells and the patient top bar: layout frame, label/background contrast, the decorative state dot, band behaviour and 44px touch targets"
    verification: []
    human_judgment: true
    rationale: "jsdom computes no layout and no color, so the frame geometry, the contrast of every label and the 44px target cannot be asserted by a unit test; 02-VALIDATION.md routes these to plan 02-11's visual baselines and a reviewer against docs/governance/visual-qa-rules.md §1."
  - id: D5
    description: "The root not-found.tsx renders the 404 from the primitive set (title 'Page not found', no action), and no src/app/page.tsx exists so / resolves to it"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "grep -c 'Page not found' src/app/not-found.tsx -> 1; ls src/app/page.tsx fails; npm run build route listing shows /_not-found"
        status: pass
    human_judgment: false
  - id: D6
    description: "Dev fixtures are typed stubs: EMPTY_PATIENT_LIST has zero elements and PLACEHOLDER_PATIENT carries all seven clinical collections empty; the module carries no dosage, record-number or date literal and no clinical value"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "tests/unit/dev-fixtures.test.ts#carries every one of the seven clinical collections as an empty array"
        status: pass
      - kind: other
        ref: "node clinical-value scan over src/lib/dev/fixtures.ts -> NO-CLINICAL-VALUES; collections-empty-by-construction -> true"
        status: pass
    human_judgment: false
  - id: D7
    description: "Fixture scope and reachability are machine-enforced: no Patient-shaped declaration outside src/lib/dev, no import of the fixture module from src/app/** or src/components/**"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "tests/unit/dev-fixtures.test.ts#declares no Patient-shaped literal outside src/lib/dev"
        status: pass
      - kind: unit
        ref: "tests/unit/dev-fixtures.test.ts#is imported by no file under src/app or src/components"
        status: pass
      - kind: other
        ref: "temporary src/components/__tmp-patient-probe.ts with 'export type Patient' made the scope assertion fail (proves the test is not a no-op); grep -rn 'lib/dev' src/app src/components -> 0"
        status: pass
    human_judgment: false

# Metrics
duration: 46min
completed: 2026-10-06
status: complete
---

# Phase 2 Plan 09: The `(auth)` and `(patient)` groups, the root 404 and the dev fixtures

**The locked route map is complete — a bare `(auth)` group with `/login`, the `(patient)` group with `/patient` and `/patient/home`, the root `not-found.tsx` that `/` resolves to, and typed dev fixtures whose `Patient` shape is machine-confined to `src/lib/dev/` — every route rendered from the frozen tokens with no form, no sidebar, no access control and no clinical content.**

## Performance

- **Duration:** 46 min
- **Started:** 2026-10-06T22:00:51Z
- **Completed:** 2026-10-06T22:47:15Z
- **Tasks:** 2
- **Files modified:** 9 created, 1 modified (`vitest.config.ts` — see Deviations)

## Accomplishments

- The `(auth)` group is bare by construction: a `canvas` field with one centred column and no rail, top bar or nav. Its existence proves the route-group pattern supports a chrome-free group, so no role chrome was pushed up into the shared root layout (D-02).
- `/login` renders the fixed §9.1 empty state ("Sign in is not active yet") with no form, no input, no password field and no submit button, and carries the full D-03 obligation in a comment: no authentication, no `middleware.ts`, and Phase 003's role resolution must be server-side and never read `localStorage`, browser state or a URL parameter.
- The `(patient)` group renders `canvas` + `PatientTopBar` + `MobileNav`; `/patient` ("No record yet", second person) and `/patient/home` ("No care activity yet") render the §9.1 copy with no action. Patient surfaces have no persistent sidebar.
- `PatientTopBar` carries a menu `Button` `iconOnly` with an accessible name, the "Patient" label in `textPrimary`, an avatar with a decorative `success` state dot (labelled meaning, not hue-only), and a bell `iconOnly`; it ships no CTA.
- `src/app/not-found.tsx` is the root 404 that `/` resolves to; no `src/app/page.tsx` was created, so the locked D-01 route map is not silently widened.
- `src/lib/dev/fixtures.ts` declares the `Patient` shape with all seven clinical collections empty by construction, plus `EMPTY_PATIENT_LIST` and `PLACEHOLDER_PATIENT`; `tests/unit/dev-fixtures.test.ts` enforces the scope (no `Patient`-shaped literal outside `src/lib/dev/`), the unreachability from any product route, the clinical-vocabulary and the dosage/date/record-number absence.
- No access control, no `middleware.ts`, no client boundary in either new group, and no fake clinical content: `npm run build` lists `/login`, `/patient`, `/patient/home`, `/provider` and the eight tab routes; `npm run lint` is 0 violations across 40 files; 118 unit tests pass.

## Task Commits

Each task was committed atomically:

1. **Task 1: the (auth) and (patient) groups, PatientTopBar and the root 404** - `2475ab5` (feat)
2. **Task 2: the dev fixtures and the fixture-scope test** - `17551bd` (feat)

**Plan metadata:** the `docs(02-09): complete …` close-out commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified

- `src/components/shell/PatientTopBar.tsx` - patient chrome: menu + label + avatar/state dot + bell; no CTA, no sidebar
- `src/app/(auth)/layout.tsx` - bare `canvas` field with one centred column; no rail, no top bar, no nav
- `src/app/(auth)/login/page.tsx` - `/login` empty shell with the D-03 marker in full; no form, no action
- `src/app/(patient)/layout.tsx` - `canvas` + `PatientTopBar` + `MobileNav`; carries the D-03 server-side marker
- `src/app/(patient)/patient/page.tsx` - `/patient` "No record yet" (second person), no action
- `src/app/(patient)/patient/home/page.tsx` - `/patient/home` "No care activity yet", no action
- `src/app/not-found.tsx` - the root 404 built from the primitive set; what `/` resolves to
- `src/lib/dev/fixtures.ts` - stub `Patient` shape, seven empty clinical collections, `EMPTY_PATIENT_LIST`, `PLACEHOLDER_PATIENT`
- `tests/unit/dev-fixtures.test.ts` - empty-collection, clinical-vocabulary, scope and reachability assertions
- `vitest.config.ts` (modified) - the `node` project now also collects the top-level non-component `.test.ts`

## Decisions Made

- The `PatientTopBar` menu and bell glyphs are rendered to elements and passed to the client `Button` as children, because a Lucide component reference is a function and cannot cross the Server-to-Client boundary — the same fix plan 02-08 applied to `ProviderTopBar`.
- The `(patient)` group renders `MobileNav` with a single `Home` affordance. Per UI-SPEC §6.5 the patient surfaces have no primary tab set, so the strip is not a tab set and the top-bar menu control is the navigation affordance; the plan's action and artifacts table both name `MobileNav` as part of the layout, so it is rendered rather than omitted.
- The avatar state dot is `aria-hidden` and decorative; the "Patient" label carries the meaning textually, satisfying the §4.3 "status is never hue-only" rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's `tests/unit/dev-fixtures.test.ts` was not collected by any Vitest project**
- **Found during:** Task 2 (running the plan's own acceptance command `npx vitest run tests/unit/dev-fixtures.test.ts`)
- **Issue:** The plan places the fixture-scope test at `tests/unit/dev-fixtures.test.ts` and states it runs "in the Vitest `node` environment", but `vitest.config.ts` collected only `tests/unit/scripts/**` for the `node` project (and `primitives|overlays|motion` for `jsdom`). Running the explicit path returned `No test files found, exiting with code 1`, so the acceptance criterion could not pass and `npx vitest run tests/unit` would silently omit the test.
- **Fix:** Added `tests/unit/*.test.ts` to the `node` project's `include` array (the plan's `<read_first>` describes the node project as owning `tests/unit/**` non-component tests; a top-level `.test.ts` is exactly a non-component, filesystem-reading test).
- **Files modified:** `vitest.config.ts`
- **Verification:** `npx vitest run tests/unit/dev-fixtures.test.ts` now exits 0 (9 tests); `npx vitest run tests/unit` reports 14 files / 118 tests passing; `npm run lint` and `npm run build` stay green.
- **Committed in:** `17551bd` (Task 2 commit)

### Non-vacuity check (required by the plan, not a deviation)

- **Found during:** Task 2 (the plan requires proving the scope assertion is not a no-op)
- **Method:** Temporarily created `src/components/__tmp-patient-probe.ts` containing `export type Patient = { id: string };`, ran the scope test, and observed it fail (`AssertionError: expected [ Array(1) ] to deeply equal []`, naming the probe file). The temporary file was then removed and is not committed.
- **Result:** the scope assertion is proven to fail for a `Patient`-shaped declaration outside `src/lib/dev/`.

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking)
**Impact on plan:** The one deviation is a load-bearing test-infrastructure wiring change required for the plan's own acceptance criterion to be satisfiable; `vitest.config.ts` is outside the plan's `files_modified` set by necessity and is called out here. No production-code scope creep: the only files committed are the nine the plan names plus this one-line include change.

## Issues Encountered

- None beyond the Task 2 wiring deviation above. Next 16 rewrote `tsconfig.json` and created `next-env.d.ts` on each build; both were reverted after every build (`git checkout -- tsconfig.json`, `rm -f next-env.d.ts`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Every route in the locked D-01 map now renders: `/provider` + the eight tabs (02-08), `/login`, `/patient`, `/patient/home` (this plan), and `/` resolves to `src/app/not-found.tsx`.
- Plan 02-10 (the dev gallery) is the only intended consumer of `src/lib/dev/fixtures.ts`, behind the dev-route gate; `tests/unit/dev-fixtures.test.ts` will continue to fail if that import ever leaks outside `src/lib/dev/` + the gallery.
- Plan 02-11's visual baselines capture `/login`, `/patient` and `/patient/home` alongside the provider surfaces.
- Both new role layouts carry the Phase 003 server-side role-resolution marker; no client-side gate, no `middleware.ts`, no clinical content anywhere in `src/app` or `src/components`.

---

*Phase: 02-foundation-and-app-shell*
*Completed: 2026-10-06*

## Self-Check: PASSED

- All 9 created files exist on disk; `vitest.config.ts` is modified as documented.
- Both task commits exist: `2475ab5`, `17551bd`.
- Plan-level verification re-run against the committed tree: `npm run build` exit 0 (route listing names `/login`, `/patient`, `/patient/home`, `/provider` and the eight tab routes); `npm run lint` exit 0 (0 violations / 40 files); `npx vitest run tests/unit` → 14 files / 118 tests passed; `find src/app -name page.tsx | wc -l` = 13; `ls src/app/page.tsx` fails; `find src/app -name middleware.ts | wc -l` = 0; `grep -rn "lib/dev" src/app src/components | wc -l` = 0.
- Task-1 acceptance re-run: PASS (13 pages; group files exist; auth layout bare; no form on `/login`; both copy strings present; `server-side` marker on all three files; no middleware; patient copy present; no action; `Page not found`; 0 raw hex; 0 clinical terms).
- Task-2 acceptance re-run: PASS (`NO-CLINICAL-VALUES`; `COLLECTIONS-EMPTY-BY-CONSTRUCTION`; 0 product imports of `lib/dev`; scope test 9/9 pass; full suite 118 pass; lint 0).
- The scope assertion was proven non-vacuous by the temporary probe (then removed).
- Next's `tsconfig.json` rewrite and `next-env.d.ts` were reverted after every build.
