---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [css, tailwind-v4, design-tokens, i18n, rtl, intl, vitest]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Runnable Next.js 16 App Router project with Tailwind v4 CSS-first (`@import \"tailwindcss\"` in src/app/globals.css), jsdom Vitest harness with `@/` alias, and `IS_REACT_ACT_ENVIRONMENT` set for component tests"
provides:
  - "src/styles/tokens.css — the ONLY `@theme static` block in the repo; 38 tokens, each with a ref-A / derived / OWNER DECISION provenance comment"
  - "Structural enforcement of the single-accent rule via `--color-*: initial` (Tailwind's default palette removed)"
  - "src/styles/tokens.dark.css — reserved, deliberately empty dark-override file with the `:root`-in-media-query rule documented"
  - "src/i18n/routing.ts — locales ['en','ar'], defaultLocale 'en', isLocale, directionOf, inline-pair `t()`; no i18n dependency"
  - "src/lib/format.ts — Intl-based clinical formatting pinned to `numberingSystem: 'latn'`, Egypt units (kg, °C, mmHg, mg/dL)"
  - "tests/unit/tokens.test.ts — 9 executable guards: provenance, single accent, exact ref-A values, rejected hex, multiples-of-4 spacing, forbidden visual patterns, RTL physical-property guard, recursive src/ walk"
  - "tests/unit/i18n.test.tsx and tests/unit/format.test.ts — locale/direction/render coverage and Western-digit clinical coverage (16 tests)"
affects: [01-03-app-shell, 01-04-motion-and-supabase, 01-05-design-gallery, every later phase in 01, phase 04 Patient Workspace, phase 05 D3 timeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One `@theme static` block is the single token source of truth; `static` (not the default) guarantees every token is emitted as a CSS custom property even when unused, so later phases can read `getComputedStyle(el).getPropertyValue('--shadow-module')` without an empty string"
    - "`--color-*: initial` makes the ref-A single-accent rule structural rather than a review comment — a `bg-red-500` cannot resolve"
    - "Token provenance is machine-checkable: a test walks backward from each declaration to the nearest preceding comment and requires `ref-A`, `derived`, or `OWNER DECISION`"
    - "Named `--space-*` tokens are DESIGN DOCUMENTATION only (they generate no Tailwind utility); `--spacing` drives p/m/gap via calc(var(--spacing) * n)"
    - "Locale direction is server-resolved and passed down as a plain string, never computed in a client hook"
    - "Clinical numbers always pass `numberingSystem: 'latn'` explicitly rather than relying on the ICU default for a bare tag"

key-files:
  created:
    - src/styles/tokens.css
    - src/styles/tokens.dark.css
    - src/i18n/routing.ts
    - src/lib/format.ts
    - tests/unit/tokens.test.ts
    - tests/unit/i18n.test.tsx
    - tests/unit/format.test.ts
  modified:
    - src/app/globals.css (keeps `@import "tailwindcss";`, adds the two token imports and the `@layer base` rules)

key-decisions:
  - "`@theme static`, not the default `@theme` and not `@theme inline`. Research Pitfall 5: the default emits a custom property only for tokens actually used, so an unread-but-referenced token resolves to an empty string. `inline` is reserved for the future moment a token references another variable (a `next/font` variable)."
  - "tokens.css does NOT `@import \"tailwindcss\"`. A bare package specifier inside a nested @import resolves relative to src/styles/ and fails PostCSS resolution; a duplicate Tailwind entry also risks emitting the base/utilities layers twice. src/app/globals.css keeps the single entry."
  - "`--color-*: initial` clears Tailwind's whole default palette, including its spacing-derived scales' color half. Verified in the compiled output: `.bg-red-500` does not exist, and every `--*` token IS emitted (which is why `static` matters here)."
  - "No `next-intl`. Phase 1 needs a locale list, a default, and a direction map; message catalogs arrive with real strings in Phase 4, and locale negotiation belongs to `proxy.ts`, a Phase 2 decision point (Next 16 allows only one proxy). PROJECT.md forbids unapproved dependencies; this is the written reason for NOT adding one."
  - "`t(locale, en, ar)` is an inline label pair, not a message catalog, and is documented as such so Plan 01-05 does not invent its own lookup."
  - "The Arabic companion typeface and the whole type scale stay `OWNER DECISION`. ref-A is a 735×511 raster; glyph heights of 8–14 px cannot yield a trustworthy size, weight, or family, and fabricating one is exactly the invented image-derived token the pack forbids."

patterns-established:
  - "Every new token needs exactly one provenance marker directly above it (or inherited from its section header). tests/unit/tokens.test.ts fails with the token name, line number, and source excerpt otherwise."
  - "Prohibition and RTL guards strip comments before scanning, and the one exemption (src/styles/tokens.dark.css, which documents the rules it must not break) is a named constant `PROHIBITION_EXEMPT_PATHS`, not an inline conditional."
  - "Direction-class regexes are word-boundary or class-token anchored (`/\\bmargin-left\\b/`, `/(^|[\\s\"'\\`])rounded-tl-/`) so identifiers like `html-` cannot false-positive."
  - "Test guards are proven non-vacuous: each was re-run against an injected violation and confirmed to fail, then the file was restored."

requirements-completed: [FND-02, FND-06, FND-10]

coverage:
  - id: D1
    description: "src/styles/tokens.css is the single @theme static token layer; 38 tokens each carry a ref-A / derived / OWNER DECISION provenance comment"
    requirement: FND-10
    verification:
      - kind: unit
        ref: "tests/unit/tokens.test.ts#gives every token a ref-A, derived, or OWNER DECISION provenance comment — 9 passed (proved non-vacuous: renaming all three markers made it fail listing every token with line number)"
        status: pass
      - kind: other
        ref: "npm run build -> all 38 `--*` custom properties present in the emitted .next/static CSS, including unused ones (--shadow-node, --space-12, --font-arabic)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tokens resolve as both Tailwind utilities and CSS custom properties (FND-02)"
    requirement: FND-02
    verification:
      - kind: other
        ref: "@tailwindcss/cli probe over tokens.css: .bg-accent, .rounded-module, .shadow-module, .text-body, .bg-frame-olive, .ms-4, .rounded-s, .text-start, .p-4 all emitted"
        status: pass
      - kind: other
        ref: "compiled .next/static CSS contains `--color-accent:`, `--radius-module:`, `--shadow-module:`, `--text-body--line-height:`; `.bg-red-500` absent"
        status: pass
    human_judgment: false
  - id: D3
    description: "Single accent enforced structurally (--color-*: initial) and by test"
    requirement: FND-10
    verification:
      - kind: unit
        ref: "tests/unit/tokens.test.ts#keeps the accent list at exactly one entry — proved non-vacuous: injecting `--color-accent-alt` failed the assertion"
        status: pass
    human_judgment: false
  - id: D4
    description: "Rejected ref-B hex values (#ECFC4C, #FCCC00, #DEE4EA, #F0F0F6) never appear in src/"
    requirement: FND-10
    verification:
      - kind: unit
        ref: "tests/unit/tokens.test.ts#never contains a rejected B-image hex value; grep -rn over src/ -> 0 matches"
        status: pass
    human_judgment: false
  - id: D5
    description: "Spacing scale is a documented multiple of 4 at every step"
    requirement: FND-02
    verification:
      - kind: unit
        ref: "tests/unit/tokens.test.ts#keeps every spacing token a multiple of 4 pixels — parseFloat(value)*16 % 4 === 0 for --spacing and every --space-N"
        status: pass
    human_judgment: false
  - id: D6
    description: "No gradient, backdrop-blur/filter, confetti, or glassmorphism anywhere in src/ (01-UI-SPEC prohibitions)"
    requirement: FND-10
    verification:
      - kind: unit
        ref: "tests/unit/tokens.test.ts#finds no gradient, glassmorphism, backdrop-blur, or confetti in src/ — recursive walk, comments stripped, word-boundary regexes"
        status: pass
    human_judgment: false
  - id: D7
    description: "No physical CSS direction property in src/ — the mechanical form of locked decision D1"
    requirement: FND-06
    verification:
      - kind: unit
        ref: "tests/unit/tokens.test.ts#finds no physical CSS direction property in src/ — proved non-vacuous: injecting `margin-left: 4px` into globals.css failed with 'src/app/globals.css: margin-left'"
        status: pass
    human_judgment: false
  - id: D8
    description: "Locale foundation: locales ['en','ar'], defaultLocale 'en', directionOf('ar')==='rtl', isLocale narrows only the two locales, inline t() pairs"
    requirement: FND-06
    verification:
      - kind: unit
        ref: "tests/unit/i18n.test.tsx#supports exactly English and Arabic / defaults to English / maps Arabic to rtl and English to ltr / narrows only the two supported locales / selects the inline label pair by locale — 7 passed"
        status: pass
    human_judgment: false
  - id: D9
    description: "Arabic label and RTL direction travel together — FND-06 proven end to end, not only as a direction map"
    requirement: FND-06
    verification:
      - kind: unit
        ref: "tests/unit/i18n.test.tsx#renders the Arabic label and an rtl direction together (FND-06) — component receives locale 'ar', renders 'معرض التصميم' with dir=rtl lang=ar; the English case asserts dir=ltr"
        status: pass
    human_judgment: false
  - id: D10
    description: "Clinical values format with Western digits under BOTH locales, with explicit Egypt units"
    requirement: FND-06
    verification:
      - kind: unit
        ref: "tests/unit/format.test.ts — 9 tests; no Arabic-Indic digit asserted for 'en' AND 'ar'; formatBloodPressure(120,80) === '120/80 mmHg'; clinicalUnits pinned to kg/°C/mmHg/mg-dL"
        status: pass
    human_judgment: false
  - id: D11
    description: "The whole Phase 1 quality gate stays green with the token and locale layers in place"
    verification:
      - kind: other
        ref: "npm run lint (0 errors, 1 pre-existing postcss.config.mjs warning) && npm run typecheck && npm run test (5 files, 28 tests) && npm run build (routes / and /_not-found) — all exit 0"
        status: pass
    human_judgment: false
  - id: D12
    description: "Every token value is acceptable to the owner — shadows, type scale, typefaces, motion"
    verification: []
    human_judgment: true
    rationale: "35 of the 38 token values are OWNER DECISION and are explicitly not derivable from ref-A. They are correctly marked and guarded, but whether the chosen magnitudes and the `system-ui, sans-serif` fallback are visually right against ref-A can only be judged by the owner. This plan adds no visual approval and does not claim one."
  - id: D13
    description: "Dark-override file is reserved, not shipped"
    verification: []
    human_judgment: false
  - id: D14
    description: "docs/ and .planning/ left intact by this plan"
    verification:
      - kind: other
        ref: "git diff --stat 9452e85 HEAD -- docs -> 0 lines; no @theme block outside src/styles/tokens.css; no next-intl in package.json"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-10-05
status: complete
---

# Phase 01 Plan 02 Summary

**Single-source-of-truth `@theme static` token layer (38 ref-A-traceable tokens, one accent enforced structurally) plus the Arabic/English locale foundation with Western-digit clinical formatting, guarded by 25 executable tests that were each proved non-vacuous**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-05T04:26:00+03:00
- **Completed:** 2026-10-05T04:38:00+03:00
- **Tasks:** 3
- **Files modified:** 7 (4 created, 1 created-as-.tsx, 1 created test, 1 modified)

## Accomplishments

- `src/styles/tokens.css` is the only `@theme` block in the repo. All 38 tokens carry a provenance comment naming a ref-A coordinate, a derivation, or `OWNER DECISION`, and the shipped test proves it by walking backward from each declaration to its nearest comment.
- The single-accent rule is now structural, not advisory: `--color-*: initial` deletes Tailwind's default palette, and the compiled production CSS was confirmed to contain no `.bg-red-500` while still emitting every `--*` custom property (which is exactly what `static` buys over the default).
- Every hex value was copied from `docs/design/tokens.md` with its sampled coordinate; the four rejected ref-B values are absent from `src/` and are test-enforced.
- Locale foundation is dependency-free by design: `locales`, `defaultLocale`, `isLocale`, `directionOf`, and an inline-pair `t()`. No `next-intl`, and the reason is recorded in the file so it is not re-litigated.
- Arabic is proven end to end, not just as a direction map: a component handed `'ar'` renders `معرض التصميم` with `dir="rtl"` and `lang="ar"`.
- Clinical formatting pins `numberingSystem: 'latn'` explicitly, verified empirically rather than assumed (see Deviations 3).

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the single `@theme static` token layer** - `d52455f` (feat)
2. **Task 2: Add automated provenance and prohibition guards** - `5fe4e62` (feat)
3. **Task 3: Create the locale foundation with Western-digit clinical formatting** - `8e72d95` (feat)

## Files Created/Modified

- `src/styles/tokens.css` — the only `@theme static` block; structural/olive/canvas/surface/accent/ink/series colors, spacing, radii, shadows, type scale, typefaces, motion
- `src/styles/tokens.dark.css` — reserved and empty; documents that dark overrides go in `:root` inside a media query, never in a nested `@theme`
- `src/app/globals.css` — keeps `@import "tailwindcss";`, adds the two token imports plus the `@layer base` accent field, ink-strong body color, and `--clinical-numbering: latn`
- `src/i18n/routing.ts` — `locales`, `Locale`, `defaultLocale`, `isLocale`, `directionOf`, `t`
- `src/lib/format.ts` — `formatClinicalNumber`, `clinicalUnits`, `formatBloodPressure`
- `tests/unit/tokens.test.ts` — 9 guards over the token file and a recursive `src/` walk
- `tests/unit/i18n.test.tsx` — 7 locale/direction/render tests (`.tsx` because it renders JSX; Vitest's include covers both extensions)
- `tests/unit/format.test.ts` — 9 clinical-formatting tests

## Decisions Made

1. **`@theme static` over the default.** A token nothing uses yet — `--shadow-node`, `--space-12` — still emits its custom property in production CSS. Verified by grepping `.next/static`. Without `static`, a later phase reading `getComputedStyle(el).getPropertyValue('--shadow-node')` would get an empty string.
2. **`tokens.css` does not import Tailwind; `globals.css` keeps the single entry.** A bare package specifier inside a nested `@import` resolves relative to `src/styles/` and typically fails PostCSS resolution, and a duplicate Tailwind entry risks emitting the base/utilities layers twice. Both files were written this way and the build confirms it resolves.
3. **`--color-*: initial` and the loss of Tailwind's default palette.** This is the mechanism that makes "one accent from ref-A" true by construction. The cost is that no stock Tailwind color utility resolves; that is intended.
4. **The spacing comment was reworded.** The plan's literal text contained `p-*/m-*/gap-*`, whose `*/` closes a CSS comment early. See Deviations 1.
5. **`tests/unit/i18n.test.tsx`, not `.ts`.** The plan names `.ts` but also requires an Arabic-render assertion; JSX needs the `.tsx` extension Vitest's include already covers. Naming a `.ts` file for JSX would not compile.
6. **No `next-intl`, and the reason lives in the source file.** Phase 1 needs three exports; message catalogs arrive in Phase 4 and locale negotiation is a Phase 2 `proxy.ts` concern (Next 16 permits only one proxy).
7. **All type, shadow, and motion values stay `OWNER DECISION`.** ref-A is a 735×511 raster; glyph heights of 8–14 px cannot yield a trustworthy type scale, and inventing one is precisely what the pack forbids.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded the spacing comment: `p-*/m-*/gap-*` terminated the CSS comment early**
- **Found during:** Task 1 (`npm run build`)
- **Issue:** The plan's literal `@theme static` block contains the line `Tailwind v4's spacing namespace is --spacing, which drives p-*/m-*/gap-* via`. The `*/` in `p-*/` closes the enclosing `/* ... */` comment, so PostCSS/Tailwind then parsed the rest of the comment body as declarations. The build failed with ``CssSyntaxError: `@theme` blocks must only contain custom properties or `@keyframes` `` — and, worse, the reported error text was the *stale* pre-fix version until `.next` was cleared, which initially read as if the fix had not applied.
- **Fix:** Rewrote the same sentence without comment-terminating sequences: "drives the p-, m- and gap- utility families via calc(var(--spacing) * n)". No token value changed. Also retargeted the note's cross-reference from "Task 2" to `tests/unit/tokens.test.ts`, which is where the multiples-of-4 guard actually lives.
- **Files modified:** `src/styles/tokens.css`
- **Verification:** `rm -rf .next && npm run build` -> Compiled successfully, routes `/` and `/_not-found`; a `grep '\*/'` over the file confirms no stray terminator remains.
- **Committed in:** `d52455f`

**2. [Rule 3 - Blocking] Corrected the plan's `@import` guidance for `tokens.css` in the file header**
- **Found during:** Task 1 (authoring)
- **Issue:** Not a failure — a reconciliation. The research document's Pattern 1 example shows `@import "tailwindcss";` inside `tokens.css`, which would conflict with the plan's own instruction (and with the fact that `globals.css` must own the single entry). Following the research would have produced two Tailwind entries.
- **Fix:** Wrote the header comment to state the opposite, with the reason: a nested bare-specifier `@import` resolves relative to `src/styles/` and fails PostCSS resolution, and a duplicate entry risks emitting the base/utilities layers twice. Only `globals.css` has `@import "tailwindcss";`.
- **Files modified:** `src/styles/tokens.css`, `src/app/globals.css`
- **Verification:** `grep` for `@import` shows exactly one `"tailwindcss"` import in the repo, in `globals.css`; build succeeds.
- **Committed in:** `d52455f`

**3. [Rule 2 - Missing Critical] Established empirically that `numberingSystem: 'latn'` is load-bearing, and made the guard non-vacuous**
- **Found during:** Task 3 (proving the Western-digit assertions were not decorative)
- **Issue:** The plan flagged `numberingSystem` as MEDIUM confidence and instructed an empirical check. Running it produced a result the plan did not anticipate: on this Node (v22.22.3), **bare `'ar'` already resolves to `numberingSystem: 'latn'` and formats `1234.5` as `1,234.5`** — but `'ar-EG'` resolves to `'arab'` and formats as `١٬٢٣٤٫٥`. Deleting `numberingSystem: 'latn'` from `format.ts` left all format tests green, so the plan's specified `'ar'` assertions proved nothing about the option.
- **Fix:** Kept the option (it is what guarantees the behavior on any locale or ICU build that does default to `arab`) and added a test that asserts `ar-EG` does NOT resolve to `latn` and that `new Intl.NumberFormat('ar-EG', { numberingSystem: 'latn' })` produces exactly what `formatClinicalNumber` produces. That test fails if the option is ever dropped. Recorded the real behavior in the `formatClinicalNumber` doc comment.
- **Files modified:** `src/lib/format.ts`, `tests/unit/format.test.ts`
- **Verification:** with `numberingSystem` removed, `npm run test -- format` still passed the `'ar'`/`'en'` assertions but the new `ar-EG` case fails; with it restored, 9/9 pass.
- **Committed in:** `8e72d95`

**4. [Rule 6 - Scope] Ran `npm run build` and a Tailwind CLI probe beyond each task's stated `<verify>`**
- **Found during:** Task 1 (after the `@theme` build failure)
- **Issue:** Task 1's `<verify>` is `lint && typecheck && test -- tokens`. A CSS `@theme` block that PostCSS rejects is invisible to all three, and `test -- tokens` also cannot pass before Task 2 creates the file the plan names (see Issues Encountered). The build would have shipped broken.
- **Fix:** Added `npm run build` to Task 1's verification, plus a `@tailwindcss/cli` probe over `tokens.css` asserting the plan's `must_haves` ("a Tailwind utility exists for each token") — `bg-accent`, `rounded-module`, `shadow-module` all resolve, alongside logical `ms-4`/`rounded-s`/`text-start`. No production code was added for the probe; it lived in `.planning/tmp/` and was deleted.
- **Files modified:** none (verification only)
- **Verification:** probe reported PASS for all nine utilities; probe directory removed.
- **Committed in:** n/a (verification step)

---

**Total deviations:** 4 auto-fixed (2 blocking CSS/build correctness, 1 missing critical test-validity, 1 verification scope)
**Impact on plan:** All four were necessary for the deliverables to be genuinely correct rather than merely present. No scope creep and no value invented: every token value is exactly as the plan and `docs/design/tokens.md` specified, and the only textual change to plan-authored content was rewording a CSS comment that was syntactically invalid as written.

## Issues Encountered

- **`npm run test -- tokens` cannot pass during Task 1.** Task 1's `<verify>` names a filter that matches `tests/unit/tokens.test.ts`, a file Task 2 creates. Vitest exits 1 with "No test files found". This is an ordering flaw in the plan, not a code defect. It was satisfied in the correct order instead: Task 1 was verified with `npm run test` (3 passed), and `npm run test -- tokens` passes after Task 2 (9 passed). Both results are recorded above.
- **Stale build cache masked the CSS fix.** After correcting the comment, `npm run build` still printed the old error text. Turbopack was serving a cached PostCSS result; `rm -rf .next` cleared it and the build passed. Worth knowing before assuming a fix did not work.
- **Vite config-loader warning under Vitest 5** persists from Plan 01-01 and is informational only.

## User Setup Required

None - no external service configuration required, and no dependency was added.

## Next Phase Readiness

- Plan 01-03 (app shell) can build primitives directly: `bg-accent`, `rounded-module`, `shadow-module`, `text-body`, `ms-4`, `rounded-s`, `text-start` all resolve today, and `directionOf()` is ready to feed `<html lang dir>` in the `[locale]` layout. `t()` is available for the primitive labels so 01-03 and 01-05 do not invent their own lookup.
- **The RTL guard is now a hard constraint on new code.** Any 01-03+ file using `margin-left`, `ml-4`, `text-left`, or `rounded-tl-*` fails `npm run test`. Use logical forms.
- **Plan 01-03 must not add a second `@theme` block** and must not reintroduce a Tailwind default color. Both are guarded.
- **Open owner decisions carried forward, unchanged by this plan:** the Arabic companion typeface and Latin family (FND-06), the whole type scale, both shadows, and all motion values. Until the typeface is chosen the fallback is `system-ui, sans-serif`, and the Plan 01-01 visual baselines stay provisional — changing the typeface invalidates all of them.
- **Not claimed:** visual approval against ref-A. 35 of 38 token values are OWNER DECISION and remain so.

## Self-Check: PASSED

- All 3 tasks completed and committed atomically (`d52455f`, `5fe4e62`, `8e72d95`).
- Full Phase 1 gate re-run after the final commit: `npm run lint` (0 errors, 1 pre-existing `postcss.config.mjs` warning), `npm run typecheck`, `npm run test` (5 files, 28 tests), `npm run build` (routes `/`, `/_not-found`) — all exit 0.
- Every one of Task 1's 9, Task 2's 4, and Task 3's 8 acceptance criteria was checked with a real command and logged PASS.
- No token value lacks either a ref-A provenance note or an explicit OWNER DECISION marker — enforced by `tests/unit/tokens.test.ts` and proved non-vacuous.
- Every guard was exercised against an injected violation (second accent, rejected hex, unprovenanced token, `margin-left`, stripped markers) and confirmed to fail before the file was restored.
- `docs/` and `.planning/` untouched by this plan's commits (`git diff --stat 9452e85 HEAD -- docs` -> empty).
- No dependency added: `next-intl`, `d3`, `gsap`, `framer-motion`, and icon packages all remain absent.
- No Phase 2+ scope leaked in: no `proxy.ts`, no `middleware.ts`, no auth, no database, no clinical UI.

---
*Phase: 01-foundation*
*Completed: 2026-10-05*