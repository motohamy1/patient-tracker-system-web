---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [react, next16-app-router, tailwind-v4, design-tokens, i18n, rtl, rtl-logical-properties, testing-library, vitest]

# Dependency graph
requires:
  - phase: 01-02
    provides: "src/styles/tokens.css token layer (the only @theme block), src/i18n/routing.ts (locales / directionOf / t), src/lib/format.ts, and the src/-wide RTL + prohibition guards in tests/unit/tokens.test.ts"
provides:
  - "src/components/ui/icons/index.tsx — 15 hand-authored single-stroke line icons + IconProps/IconComponent; no icon package installed"
  - "Ten primitives under src/components/ui/: AppFrame, NotchHeader, PrimaryPillTabs, SecondaryPillRow, CircularIconButton, Chip, ModuleSurface, StatusLabel, DarkScrubber, AccentNode"
  - "src/app/[locale]/layout.tsx — Server Component that server-resolves `<html lang dir>` via directionOf() and exports generateStaticParams"
  - "Locale-prefixed routing: `/` redirects to `/en`; `/en` and `/ar` are prerendered; the root layout is now a `<html>`-free `{children}` passthrough"
  - "tests/unit/ui.test.tsx — 13 render tests covering every primitive plus a mechanical no-hex-literal conformance guard over src/components/ui/"
  - "tests/unit/testing-library.ts — jest-dom matchers + automatic cleanup, wired explicitly through vitest.config.ts setupFiles"
affects: [01-04-motion-and-supabase, 01-05-design-gallery, phase 04 Patient Workspace, phase 05 D3 timeline, phase 06 Provider Home, every later UI phase]

# Tech tracking
tech-stack:
  added:
    - "@testing-library/react ^16.3.3 (dev) — component render tests need DOM query APIs; jsdom alone cannot query rendered output"
    - "@testing-library/jest-dom ^7.0.1 (dev) — jest-dom/vitest registers toBeInTheDocument / toHaveAttribute / toBeDisabled as vitest expect extensions"
  patterns:
    - "Direction is resolved once, on the server, by src/app/[locale]/layout.tsx; nothing downstream recomputes it"
    - "Primitives are token-only: a class name that does not resolve to a token cannot be written, because `--color-*: initial` removed Tailwind's default palette"
    - "Interactive primitives ship focus-visible and disabled states as part of the primitive, not as a caller responsibility"
    - "Client/Server boundary sits at the primitive that owns state, so the route stays a thin Server Component"
    - "Client page components read `params` with React `use()` rather than `await`; layout components `await` it"

key-files:
  created:
    - src/components/ui/icons/index.tsx
    - src/components/ui/AppFrame.tsx
    - src/components/ui/NotchHeader.tsx
    - src/components/ui/PrimaryPillTabs.tsx
    - src/components/ui/SecondaryPillRow.tsx
    - src/components/ui/CircularIconButton.tsx
    - src/components/ui/Chip.tsx
    - src/components/ui/ModuleSurface.tsx
    - src/components/ui/StatusLabel.tsx
    - src/components/ui/DarkScrubber.tsx
    - src/components/ui/AccentNode.tsx
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - tests/unit/ui.test.tsx
    - tests/unit/testing-library.ts
  modified:
    - src/app/layout.tsx (reduced to a `<html>`-free `{children}` passthrough)
    - src/app/page.tsx (now the redirect to `/${defaultLocale}`)
    - vitest.config.ts (setupFiles gains tests/unit/testing-library.ts)
    - package.json / package-lock.json (two devDependencies)
  deleted:
    - tests/visual/gallery-scaffold.spec.ts (harness self-test; superseded by the Plan 01-05 gallery spec)
    - tests/visual/__screenshots__/{desktop-ltr,desktop-rtl,mobile-ltr,mobile-rtl}/gallery-scaffold.spec.ts/harness-scaffold.png (all four)

key-decisions:
  - "No icon library. An icon package is an unapproved dependency under PROJECT.md and its stroke weight would not match ref-A. The 15 icons are hand-authored at strokeWidth 1.5, documented in-file as a FIRST PASS pending visual approval rather than an authoritative value."
  - "StatusLabel ships neutral-only. The `critical` tone is accepted in the type but deliberately unimplemented, with an OWNER DECISION comment in the file: ref-A contains no status color, and ref-B1's pastel alert block is explicitly forbidden."
  - "NotchHeader's title is a plain text slot. No specialty-lens affordance was built — that is unresolved owner decision D5 and building it would presume the answer."
  - "The active PrimaryPillTabs pill is a lighter/raised surface capsule, not an accent-filled pill: the single accent is reserved for the outer field, timeline nodes, and the active accent state per 01-UI-SPEC."
  - "Root layout was kept, not deleted. Next requires an ancestor layout chain for every route including the `/` redirect; deleting it while a root page remains fails the build with 'page doesn't have a root layout'."
  - "src/app/[locale]/page.tsx is a Client Component using React `use(params)`. PrimaryPillTabs and SecondaryPillRow take handlers, and a Server Component cannot pass a function or an icon component across that boundary. Direction is unaffected — it is still resolved on the server by the layout."
  - "Both tests/visual files were deleted in this task, as the plan directed. The scaffold asserted an `<h1>` at `/`, which now redirects to `/en`."

patterns-established:
  - "Every primitive accepts locale-resolved label strings; none hardcodes English. Callers pass `t(locale, en, ar)`."
  - "Icons are decorative (`aria-hidden`) unless the caller supplies `title`, in which case the SVG becomes `role=\"img\"` with an accessible name."
  - "Interactive primitives carry `label`-derived accessible names, never an icon alone."
  - "Conformance is enforced mechanically, not by review: a test walks every file under src/components/ui/ and fails on a hex literal."

requirements-completed: [FND-03, FND-04]

coverage:
  - id: D1
    description: "Icon set: 15 single-stroke line icons exported with the IconProps/IconComponent types, every SVG fill=none and stroke=currentColor, no external icon package"
    verification:
      - kind: unit
        ref: "node script over src/components/ui/icons/index.tsx: all 15 icon names + IconProps present as exports; svg carries fill=\"none\" and stroke=\"currentColor\"; only import is from 'react'"
        status: pass
      - kind: other
        ref: "package.json dependencies checked: no icon library present"
        status: pass
      - kind: other
        ref: "npm run lint (exit 0) && npm run typecheck (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Eleven primitives render from tokens with no hardcoded hex color and no physical-direction utility anywhere under src/components/ui/"
    verification:
      - kind: other
        ref: "node scan of all 11 files under src/components/ui/ with comments stripped: 0 hex literals, 0 physical-direction class tokens (ml-/mr-/pl-/pr-/left-/right-/text-left/text-right/rounded-tl-/rounded-br-), every file containing <button also contains focus-visible: and disabled: — ALL PASS"
        status: pass
      - kind: other
        ref: "npm run lint, npm run typecheck, npm run build all exit 0"
        status: pass
      - kind: unit
        ref: "tests/unit/ui.test.tsx — 13 render tests, one per primitive plus the token-conformance guard (13 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Locale-prefixed routing with server-resolved <html lang dir>; /en and /ar both build"
    verification:
      - kind: other
        ref: "node check: src/app/[locale]/layout.tsx has no \"use client\", calls generateStaticParams and directionOf, and emits <html lang={locale} dir={directionOf(locale)}>; src/app/layout.tsx contains no <html element; src/app/page.tsx redirects to /${defaultLocale}"
        status: pass
      - kind: other
        ref: "npm run build -> route table lists /, /_not-found, /[locale] with prerendered ● /en and ● /ar"
        status: pass
      - kind: other
        ref: "prerendered HTML inspected: .next/server/app/en.html opens `<html lang=\"en\" dir=\"ltr\">`, .next/server/app/ar.html opens `<html lang=\"ar\" dir=\"rtl\">`"
        status: pass
      - kind: other
        ref: "git ls-files | grep -E '(middleware|proxy)\\.ts' -> empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "PrimaryPillTabs renders every label, marks the active item with aria-selected, and fires onChange; the remaining primitives expose their documented accessible surface"
    verification:
      - kind: unit
        ref: "tests/unit/ui.test.tsx#renders every label and marks the active item / #fires onChange with the clicked id / #renders its items and reflects the filter toggle's pressed state / #takes its accessible name from label and honors disabled / #renders label and optional meta / #renders its title and children / #renders its text / #renders and applies the requested size — all passed"
        status: pass
    human_judgment: false
  - id: D5
    description: "No hex color literal exists anywhere under src/components/ui/"
    verification:
      - kind: unit
        ref: "tests/unit/ui.test.tsx#contains no hex color literal anywhere under src/components/ui/ — recursive walk of the directory, offender list asserted empty"
        status: pass
      - kind: other
        ref: "independent node scan of the same 11 files: 0 matches for /#[0-9a-fA-F]{3,6}/"
        status: pass
    human_judgment: false
  - id: D6
    description: "Wave 1 token guard tests still pass and the visual suite stays green after the scaffold spec deletion"
    verification:
      - kind: unit
        ref: "npm run test -> 6 files, 41 tests passed, including all of tests/unit/tokens.test.ts"
        status: pass
      - kind: other
        ref: "npm run test:visual (playwright test --pass-with-no-tests) -> exit 0 after tests/visual/gallery-scaffold.spec.ts and all four harness-scaffold.png baselines were deleted"
        status: pass
      - kind: other
        ref: "git diff --stat 120f7cd HEAD -- docs .planning -> empty; docs/ and .planning/ intact"
        status: pass
    human_judgment: false
  - id: D7
    description: "Every primitive's visual fidelity against ref-A — stroke weight, pill fill, notch geometry, shadow depth"
    verification: []
    human_judgment: true
    rationale: "ref-A is a 735x511 raster and 35 of 38 token values are OWNER DECISION. Icon strokeWidth 1.5, the active-pill treatment, the module shadow depth, and the type scale are first-pass values that only the owner can confirm against the theme authority. This plan adds no visual approval and claims none."

# Metrics
duration: 24min
completed: 2026-10-05
status: complete
---

# Phase 01 Plan 03 Summary

**Ref-A app shell on the token layer — eleven token-only primitives with focus-visible and disabled states, a 15-icon single-stroke set with no icon dependency, and locale-prefixed routing whose `<html lang dir>` is resolved on the server (`/en` → ltr, `/ar` → rtl), all guarded by 13 render tests**

## Performance

- **Duration:** 24 min
- **Started:** 2026-10-05T04:32:00+03:00
- **Completed:** 2026-10-05T04:56:00+03:00
- **Tasks:** 4
- **Files modified:** 15 created, 4 modified, 5 deleted

## Accomplishments

- Eleven primitives exist under `src/components/ui/` and every one of them renders from token utilities only: a scan of all eleven files, comments stripped, finds zero hex literals and zero physical-direction class tokens. `--color-*: initial` from Plan 01-02 makes that structural as well — a `bg-red-500` cannot resolve.
- Interactive primitives ship `focus-visible:` and `disabled:` states themselves. The scan asserts every file containing a `<button` contains both, so a new interactive primitive cannot be added without them.
- The 15 line icons are hand-authored at a single 1.5 stroke with `fill="none"` and `stroke="currentColor"`. No icon package was installed, and the file says in its header that 1.5 is a first pass awaiting visual approval rather than a measured value.
- Routing is locale-prefixed with direction resolved on the server. The prerendered HTML was inspected directly: `en.html` opens `<html lang="en" dir="ltr">`, `ar.html` opens `<html lang="ar" dir="rtl">`. First paint is correct in Arabic because `use()`/`useEffect` is never involved in direction.
- `npm run test:visual` stays green after the scaffold spec and its four baselines were deleted, as the plan required — otherwise every wave from here would have inherited a red visual suite.
- Thirteen render tests cover every primitive's accessible surface, plus a mechanical conformance test that fails if any hex literal appears under `src/components/ui/`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the theme-matched line icon set** - `18bb787` (feat)
2. **Task 2: Build the eleven primitives** - `656f111` (feat)
3. **Task 3: Move routing under [locale] with server-resolved direction** - `baf0be3` (feat)
4. **Task 4: Add render tests for every primitive** - `b674095` (feat)

## Files Created/Modified

- `src/components/ui/icons/index.tsx` — 15 single-stroke icons + `IconProps` / `IconComponent`; decorative unless a `title` is supplied
- `src/components/ui/AppFrame.tsx` — accent outer field, `rounded-frame bg-frame-olive` inset
- `src/components/ui/NotchHeader.tsx` — canvas title tab breaking out of the olive bar, `CircularIconButton` at its inline start; plain text title only (D5 untouched)
- `src/components/ui/PrimaryPillTabs.tsx` — `role="tablist"`/`tab`, `aria-selected`, `aria-current`, `rounded-pill`, raised-surface active state
- `src/components/ui/SecondaryPillRow.tsx` — smaller pills plus an `aria-pressed` filter toggle placed with `ms-auto`
- `src/components/ui/CircularIconButton.tsx` — `rounded-full bg-surface`, accessible name from `label`, honors `disabled`
- `src/components/ui/Chip.tsx` — pill capsule with the glyph rule documented in-file
- `src/components/ui/ModuleSurface.tsx` — `rounded-module` card with `--shadow-module` and a `default`/`inset` tone
- `src/components/ui/StatusLabel.tsx` — neutral-only label; `critical` accepted but deliberately unimplemented behind an OWNER DECISION comment
- `src/components/ui/DarkScrubber.tsx` — near-black band with the visible window positioned by `insetInlineStart`
- `src/components/ui/AccentNode.tsx` — accent circle; explicitly NOT the Phase 5 "+" add node
- `src/app/[locale]/layout.tsx` — Server Component, `generateStaticParams`, `directionOf`, `<html lang dir>`
- `src/app/[locale]/page.tsx` — primitive composition demo with an `<h1>`, locale labels via `t()`
- `src/app/layout.tsx` — reduced to a `{children}` passthrough with no document element
- `src/app/page.tsx` — `redirect(\`/${defaultLocale}\`)`
- `tests/unit/ui.test.tsx` — 13 tests: one per primitive plus the hex-literal conformance guard
- `tests/unit/testing-library.ts` — jest-dom matchers + automatic `cleanup`
- `vitest.config.ts` — `setupFiles` now names the Testing Library setup explicitly
- `package.json` — `@testing-library/react`, `@testing-library/jest-dom` as devDependencies

## Decisions Made

1. **No icon library.** Unapproved under PROJECT.md, and its stroke weight would not match ref-A. See D1.
2. **`IconComponent` added alongside `IconProps`.** The plan's `icon?: IconProps` prop shape cannot be rendered — a props object is not a component. `IconComponent = (props: IconProps) => ReactElement` is what a caller actually passes, and it keeps the plan's exported `IconProps` intact.
3. **`StatusLabel` neutral-only.** The `critical` tone stays in the type union and is explicitly not implemented, with the reason in the file. ref-A has no status color and the B-image pastel alert block is forbidden.
4. **`NotchHeader` uses `rounded-t-module`, which is direction-neutral.** The asymmetric corner utilities (`rounded-tl-*`, `rounded-br-*`) are physical and banned; a corner that must differ per side uses `rounded-s-*`/`rounded-e-*`. The comment records this.
5. **`src/app/[locale]/page.tsx` is a Client Component using React `use(params)`.** PrimaryPillTabs and SecondaryPillRow take handlers, and a Server Component cannot pass a function or an icon component across that boundary. This is the one place where the plan's implied shape did not survive contact with the RSC boundary — see Deviations 1.
6. **The composition demo lives in the page file, not a separate `ShellDemo`.** An intermediate wrapper was tried and removed; a single file keeps the demo next to the routing it demonstrates.
7. **No `proxy.ts` and no `middleware.ts`.** Locale negotiation and Supabase session refresh both need the single proxy, which is a Phase 2 decision. `git ls-files` confirms neither file exists.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `src/app/[locale]/page.tsx` had to become a Client Component**
- **Found during:** Task 3 (`npm run build`)
- **Issue:** The plan specifies the page as a composition of `PrimaryPillTabs` / `SecondaryPillRow` with handlers. Those primitives are client components, and a Server Component cannot pass a function — or the icon component stored in each tab item — across that boundary. The build failed with `Error occurred prerendering page "/ar": Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"`.
- **Fix:** Made the page a Client Component and read the route param with React `use(params)` instead of `await`. The layout — the part that actually owns direction — stays a Server Component and still `await`s `params` per the plan, so the RSC boundary sits where it matters and first paint is still server-resolved.
- **Files modified:** `src/app/[locale]/page.tsx`
- **Verification:** `npm run build` prerenders both locales; `en.html` / `ar.html` inspected and each carries the correct `<html lang dir>`; lint and typecheck exit 0.
- **Committed in:** `baf0be3`

**2. [Rule 6 - Scope] `icon?: IconProps` retyped as `icon?: IconComponent`**
- **Found during:** Task 2 (authoring)
- **Issue:** The plan's prop type is not renderable — it is a props object, not a component. Writing it literally produces a type error the moment a caller passes e.g. `PulseIcon`.
- **Fix:** Added an exported `IconComponent` alias and typed every `icon` prop with it. `IconProps` is still exported exactly as the plan requires.
- **Files modified:** `src/components/ui/icons/index.tsx` and the four primitives that take an icon
- **Verification:** `npm run typecheck` exit 0; `tests/unit/ui.test.tsx` renders `Chip icon={SearchIcon}` and `CircularIconButton icon={CloseIcon}` successfully.
- **Committed in:** `656f111`

**3. [Rule 4 - Correctness] Strengthened the primitive acceptance check to class-token boundaries**
- **Found during:** Task 2 (acceptance gate)
- **Issue:** The plan explicitly warned that a bare substring scan for `ml-`, `pl-`, `left-` and friends false-positives on innocent classes such as `html-`. The guard was therefore written with class-token anchors rather than substring matching, matching the approach Plan 01-02 already uses in `tests/unit/tokens.test.ts`.
- **Fix:** The scan anchors every physical-direction pattern on `(^|[\s"'`])` and strips comments first, so a comment documenting a prohibition cannot fail the rule it documents.
- **Files modified:** none (verification only)
- **Verification:** scan reported 0 offenders across all 11 files; the full suite still runs the repo-wide version of this guard.
- **Committed in:** n/a (verification step)

---

**Total deviations:** 3 auto-fixed (1 blocking build failure, 1 type correctness, 1 verification method)
**Impact on plan:** All three were necessary for the code to build and type-check as specified. No scope creep, no values invented, and no requirement dropped: the only structural change is that the locale page crossed the client boundary while the layout did not.

## Issues Encountered

- **Icon components cannot cross the RSC boundary.** Same root cause as Deviations 1; an intermediate `src/components/shell/ShellDemo.tsx` client wrapper was tried, then removed in favour of a single page file, since splitting it added a file without adding clarity.
- **`vitest.config.ts` initially carried a duplicate `setupFiles` key.** An edit inserted the new key without removing the old one; caught by re-reading the file before running the suite and fixed with a `CUT`. The final config has exactly one `setupFiles` entry listing both files, so the Testing Library setup is visible in the config rather than hidden inside `setup.ts`.
- **Vite config-loader warning under Vitest 5** persists from Plan 01-01 and is informational only.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 01-05 (design gallery) has everything it needs:** ten primitives, the icon set, and a working `/en` and `/ar` route to hang `/[locale]/design-gallery` off. The gallery contract (every primitive × every state × desktop/mobile × ltr/rtl) is unblocked.
- **Plan 01-04 (motion + Supabase) is unblocked:** the locale layout is the single place a root `MotionConfig reducedMotion="user"` provider must be inserted, and no `proxy.ts` exists for Phase 2 to have to unpick.
- **Two hard constraints now bind all later code:** a hex literal under `src/components/ui/` fails `npm run test`, and so does any physical direction property anywhere in `src/` (existing guard from Plan 01-02). Use `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`/`rounded-s`.
- **`AccentNode` is not the quick-add node.** Phase 5 must build the "+" affordance on `--color-ink`, per the note in the file.
- **Open owner decisions carried forward, unchanged:** the Arabic companion typeface and Latin family, the type scale, both shadows, motion durations/easing, the icon stroke weight, and D5's specialty lens. Until the typeface is chosen the fallback is `system-ui, sans-serif` and the Plan 01-01 visual baselines stay provisional.
- **Not claimed:** visual approval against ref-A. This plan produced no baseline and no screenshot comparison; ref-A fidelity is the owner's call.

## Self-Check: PASSED

- All 4 tasks completed and committed atomically (`18bb787`, `656f111`, `baf0be3`, `b674095`).
- Full gate re-run after the final commit: `npm run lint` (0 errors, 1 pre-existing `postcss.config.mjs` warning), `npm run typecheck`, `npm run test` (6 files, 41 tests), `npm run build` (routes `/`, `/_not-found`, `/en`, `/ar`) — all exit 0.
- `npm run test:visual` exits 0 after the scaffold spec and its four baselines were deleted.
- Wave 1 token guards still pass: `tests/unit/tokens.test.ts` runs unmodified inside the 6-file suite.
- Every acceptance criterion across all 4 tasks was checked with a real command and logged PASS, including the class-token-anchored hex/physical-direction scan (0 offenders across 11 files) and the direct inspection of `en.html` / `ar.html`.
- `docs/` and `.planning/` untouched by this plan's commits (`git diff --stat 120f7cd HEAD -- docs .planning` → empty).
- Dependencies added: `@testing-library/react` and `@testing-library/jest-dom`, both devDependencies, both with a written reason. No icon library, no i18n library, no `d3`, no `gsap`, no `motion` usage.
- No Phase 2+ scope leaked in: no `proxy.ts`, no `middleware.ts`, no auth, no database access, no clinical content.

---
*Phase: 01-foundation*
*Completed: 2026-10-05*