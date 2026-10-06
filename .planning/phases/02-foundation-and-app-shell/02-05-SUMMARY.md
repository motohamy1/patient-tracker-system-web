---
phase: 2-foundation-and-app-shell
plan: 02-05
subsystem: ui
tags: [primitives, react, server-components, tailwind, design-tokens, motion, accessibility, reduced-motion, touch-target, invariant, foundation]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell/02-03 (token codegen + base stylesheet)
    provides: `src/styles/tokens.generated.css` and `src/styles/tokens.generated.ts` — the generated token utilities (`bg-surface-muted`, `shadow-raised`, `rounded-pill`, `p-lg`, `px-xl`) and the numeric `MOTION` constants (`MOTION.duration.slowSec`, `MOTION.duration.fastSec`, `MOTION.easing.standard`) these primitives consume, plus the single `globals.css` `:focus-visible` ring they must not duplicate
  - phase: 02-foundation-and-app-shell/02-04 (design-token gate)
    provides: `scripts/check-design-tokens.mjs` wired into `npm run lint` and `prebuild` — the `token-reference-required` / `no-raw-hex` / `no-generic-healthcare-blue` gate every class name in these files is measured against
  - phase: 01-project-constitution-reference-ui-specification
    provides: `docs/governance/ui-invariants.md` INV-05/INV-08/INV-13/INV-14/INV-15/INV-16, `docs/governance/motion-rules.md` §1/§3, `docs/governance/responsive-rules.md` §4 (44px minimum), and `02-UI-SPEC.md` §4.3/§5.1/§5.2/§5.7
provides:
  - "`Surface` — one Server Component with exactly four variants (`canvas`, `surface`, `surfaceMuted`, `surfaceRaised`), a `size` padding selector, an `as` element selector and a className merged last; no variant emits a perimeter edge utility, `surfaceMuted` takes no shadow (INV-13/INV-16)"
  - "`Icon` / `makeIcon` — the single Lucide wrapper with `strokeWidth` fixed at 1.5 after the rest spread and omitted from the public props type; sizes 16px (`sm`, paired with a label) and 24px (`lg`, standalone); decorative by default, labelled by `aria-label`"
  - "`Button` — a client component with exactly four variants (`primary`, `secondary`, `ghost`, `iconOnly`); `accentSoft` is the only primary fill (never `accent`), `textPrimary` is the only ink, `iconOnly` requires `ariaLabel` at the type level, a 44px-in-both-axes minimum below 768px, and a `useReducedMotion` branch that degrades to opacity-only at the fastest tokenized duration"
  - "`src/components/primitives/index.ts` — the barrel re-exporting `Surface`, `Icon`, `makeIcon`, `Button` and their types"
  - "Three unit test files (24 assertions) that render with `react-dom/server` + a parsed DOM and assert on real class strings, SVG attributes and accessible names — no `@testing-library/react` is added"
affects: [02-06 motion + Pill/TabBar/CompactControl, 02-07 EmptyState/Overlay, 02-08 provider shell + routes, 02-09 patient shell + auth, 02-10 dev gallery, 02-11 visual QA + baselines, every later phase composing UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Components for presentation-only primitives (Surface, Icon); `use client` only where a runtime hook is required (Button → `useReducedMotion`)"
    - "Variant-to-class maps declared as one Record per variant with fills/radius/padding/shadow split so `disabled` can drop a shadow without rewriting the group"
    - "`Omit<LucideProps, 'strokeWidth'>` + `strokeWidth={1.5}` written after the rest spread — a compile error, not a review comment, is the enforcement mechanism (D-21)"
    - "Discriminated-union props (`variant: 'iconOnly'` requires `ariaLabel`) so an unlabeled icon-only control cannot type-check"
    - "A `WeakMap` icon cache so a render never rebuilds the Lucide wrapper (which would remount the glyph)"
    - "Tests render Server Components with `react-dom/server` and assert on the parsed DOM; `motion/react` is mocked at the module boundary so Button assertions read the props the component actually passes"
    - "Gesture motion stays on `whileHover`/`whileTap` with a single `transition`; disabled clears the gesture objects entirely"

key-files:
  created:
    - src/components/primitives/Surface.tsx
    - src/components/primitives/Icon.tsx
    - src/components/primitives/Button.tsx
    - src/components/primitives/index.ts
    - tests/unit/primitives/Surface.test.tsx
    - tests/unit/primitives/Icon.test.tsx
    - tests/unit/primitives/Button.test.tsx
  modified: []

key-decisions:
  - "`surfaceMuted` takes no shadow and no variant emits a `border`/`ring` utility: recess is expressed by fill and card edges separate by the two frozen elevation levels alone, asserted positively in tests (INV-13, INV-16)."
  - "`primary` is filled with `accentSoft` and no shadow; `secondary`/`iconOnly` carry `shadow-raised`; the only shadow utilities in the primitive set are `shadow-raised` and the overlay-level elevation plan 02-07 owns (INV-05, INV-14, QA row 12)."
  - "Ink is `text-text-primary` in every Button variant and state; the disabled treatment is reduced opacity plus `cursor-not-allowed` on the same fill, never a status recolor."
  - "`iconOnly` is a discriminated union requiring `ariaLabel`, and the `ariaLabel` is spread onto the `<button>` so the accessible name lands on the control itself (T-02-29)."
  - "The icon `size` prop is enumerated (`sm` | `lg` → 16/24) rather than a free number, so an icon can never introduce an off-scale size; `strokeWidth` is omitted from the public props type so the single 1.5px setting cannot drift per call site."
  - "The touch-target contract uses the stock `md:` prefix (`min-h-11 md:min-h-8`) against the 64rem default breakpoint; `iconOnly` keeps `min-h-11 min-w-11` at every band, and the 768px mobile edge is not to be confused with the 1024px overlay-presentation edge."
  - "Unit tests use `react-dom/server` + `DOMParser`, never `@testing-library/react`, which is absent from every pinned set and from the package legitimacy audit (02-VALIDATION.md Wave 0); the pattern is set once here for plans 02-06 and 02-07."

patterns-established:
  - "Every later component composes `Surface`, `Icon`, `Button` from `@/components/primitives` rather than hand-rolling fills, radii, inks or elevations"
  - "A component's class vocabulary is measured against the derived token vocabulary by `npm run lint`; an off-vocabulary class fails the build"
  - "Accessibility requirements that can be enforced at the type level (the icon-only name, the fixed stroke width) are enforced there, and only the residual is asserted in tests"

requirements-completed:
  - FOUND-02
  - FOUND-04
  - UX-06

coverage:
  - id: D1
    description: "`Surface` is one component with exactly four variants over the frozen fills, with the specified radius/padding/shadow assignments, no perimeter edge utility on any variant and no shadow on `surfaceMuted`; it also honours `size`, `as` and a caller className merged last"
    requirement: FOUND-02
    verification:
      - kind: unit
        ref: "tests/unit/primitives/Surface.test.tsx#renders $variant as exactly \"$expected\" (four variants)"
        status: pass
      - kind: unit
        ref: "tests/unit/primitives/Surface.test.tsx#carries no shadow class on surfaceMuted (INV-13); carries no perimeter edge class on any variant (INV-16); uses only the frozen elevation utilities"
        status: pass
      - kind: unit
        ref: "tests/unit/primitives/Surface.test.tsx#renders the requested element tag through `as`; merges a caller className last; selects the sparse padding step with `size`"
        status: pass
    human_judgment: false
  - id: D2
    description: "`Icon`/`makeIcon` fixes `strokeWidth` at exactly 1.5 on the rendered SVG, wins even when a call site tries to force it, is decorative by default and opts out with `aria-label`, and renders only the 16px and 24px steps"
    requirement: FOUND-04
    verification:
      - kind: unit
        ref: "tests/unit/primitives/Icon.test.tsx#renders a stroke width of exactly 1.5 on the SVG node; keeps 1.5 even when a call site forces a different value"
        status: pass
      - kind: unit
        ref: "tests/unit/primitives/Icon.test.tsx#is decorative by default and opts out when a label supplies a name; defaults to the 16px step and renders the 24px step"
        status: pass
    human_judgment: false
  - id: D3
    description: "`Button` has exactly four variants with the specified fill/ink/radius/shadow groups; `primary` carries `bg-accent-soft` and never `bg-accent`; every variant paints `text-text-primary` and never a secondary or status tint; `iconOnly` is a raised square that always exposes a non-empty accessible name"
    requirement: FOUND-04
    verification:
      - kind: unit
        ref: "tests/unit/primitives/Button.test.tsx#paints primary with accentSoft and never with the raw accent token; paints secondary on surfaceRaised; paints ghost with no fill, no shadow and the tighter padding step; paints iconOnly as a raised square carrying an accessible name"
        status: pass
      - kind: unit
        ref: "tests/unit/primitives/Button.test.tsx#paints every variant with textPrimary and never a secondary or status tint as ink"
        status: pass
      - kind: unit
        ref: "tests/unit/primitives/Button.test.tsx#makes the accessible name mandatory on iconOnly and omits it elsewhere"
        status: pass
    human_judgment: false
  - id: D4
    description: "The Button touch-target and motion contract: a 44px minimum in both axes below 768px (text variants may drop to the 32px control height at `md:`, `iconOnly` stays 44px square), `disabled` sets the native attribute with reduced opacity and no shadow, and the reduced-motion branch is opacity-only at the fastest tokenized duration while the normal branch uses the slower duration with a tap transform"
    requirement: UX-06
    verification:
      - kind: unit
        ref: "tests/unit/primitives/Button.test.tsx#keeps a 44px target in both axes below 768px and shrinks only text buttons at md; disables with reduced opacity, no shadow and the native disabled attribute"
        status: pass
      - kind: unit
        ref: "tests/unit/primitives/Button.test.tsx#runs the normal branch at the slower tokenized duration with a tap transform; degrades to an opacity-only transition at the fastest duration under reduced motion"
        status: pass
      - kind: other
        ref: "command: npm run lint → exit 0, 0 violations across 8 file(s) (no-raw-hex, no-generic-healthcare-blue, token-reference-required)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The primitive set's rendered appearance matches `02-UI-SPEC.md` §5.1/§5.2/§5.7 against the frozen reference — fill, radius, elevation, spacing and typography as actually painted, not merely as class strings"
    verification: []
    human_judgment: true
    rationale: "jsdom proves the class vocabulary and the DOM attributes, not the rendered pixel result. Appearance fidelity is the design-gate judgement owned by plan 02-11's Playwright baselines plus the human visual review against the reference; it cannot be auto-passed from this plan's unit assertions."

# Metrics
duration: 11min
completed: 2026-10-06
status: complete
---

# Phase 2 Plan 02-05: `Surface`, `Icon` and `Button` — the primitive set's foundation — Summary

**Three primitives every later screen composes from: the four-variant shadow-disciplined `Surface`, the single 1.5px-stroke `Icon` wrapper whose prop is a compile error to override, and the four-variant `Button` whose primary fill is `accentSoft`, whose icon-only name is mandatory at the type level, and whose reduced-motion branch is opacity-only at the fastest token.**

## Performance

- **Duration:** ~11 min of implementation (the run was then interrupted — see Issues Encountered)
- **Started:** 2026-10-06T19:57:00Z
- **Completed:** 2026-10-06T20:19:00Z (orchestrator close-out)
- **Tasks:** 3 of 3
- **Files modified:** 7 (all created; 4 source + 3 tests, one file outside the plan's `files_modified` set was touched and reverted)

## Accomplishments

- `Surface` carries exactly the four specified variants with fills, radius, padding and shadow resolved from one variant map: `canvas` (`bg-canvas`, no radius/padding/shadow — a field is not a card), `surface` (`bg-surface rounded-lg p-lg shadow-raised`), `surfaceMuted` (`bg-surface-muted rounded-lg p-lg`, deliberately shadow-free), `surfaceRaised` (`bg-surface-raised rounded-xl p-xl shadow-raised`). No variant emits a `border`/`ring` utility, so card edges separate by the two frozen shadows alone (INV-13, INV-15, INV-16).
- `Icon` fixes the stroke width once: `TokenIconProps = Omit<LucideProps, 'strokeWidth'>` makes passing `strokeWidth` a compile error, and `strokeWidth={1.5}` is written **after** the rest spread so it wins even if the type is later widened. Only two sizes exist (16px `sm`, 24px `lg`), both bound to existing scale steps; the wrapper is decorative by default and opts out when `aria-label` supplies a name (D-21).
- `Button` has exactly the four variants with `accentSoft` as the only `primary` fill (`bg-accent-soft`, never `bg-accent` — INV-05, QA row 12), `textPrimary` as the only ink in every variant and state, `ring`/`outline`/`border` declared nowhere (the focus ring lives once in `globals.css`), and `iconOnly` typed as a discriminated union so an unlabeled icon control cannot compile (T-02-29).
- Touch target (UX-06): every text variant is `min-h-11` below the 768px band edge and may drop to `md:min-h-8` at and above it; `iconOnly` is `min-h-11 min-w-11` at every band.
- Motion (FOUND-05, motion-rules.md §3): `useReducedMotion` selects between two transitions built from the generated `MOTION` constants — the normal branch uses `MOTION.duration.slowSec` with a `scale` tap; the reduced branch is opacity-only at `MOTION.duration.fastSec` with no transform. No duration literal is typed; it is imported from `src/styles/tokens.generated.ts`.
- 24 unit tests render with `react-dom/server` and assert on the parsed DOM — class strings, the 1.5 SVG attribute, accessible names and the motion props. No `@testing-library/react` is added; the convention is set here for plans 02-06 and 02-07.
- Gates green: `npx vitest run tests/unit/primitives` → 24/24; `npm run lint` → 0 violations across 8 files; `npm run build` → exit 0 with TypeScript passing; `tsc --noEmit` → 0 errors; zero raw hex literals under `src/components/primitives/`.

## Task Commits

Each task was committed atomically:

1. **Task 1: write `Surface.tsx` and `Icon.tsx`** — `1ffdc2e` (feat)
2. **Task 2: write `Button.tsx` with the four variants, the motion branch and the touch-target contract** — `7559754` (feat)
3. **Task 3: write the primitive unit tests and run the check script against them** — `221ee6a` (test)

Task 3's files were written by the interrupted run but left untracked; the orchestrator verified all three tasks against the plan's acceptance criteria and committed them during close-out (see Issues Encountered).

## Files Created/Modified

- `src/components/primitives/Surface.tsx` — the four-variant card/field primitive; `SURFACE_VARIANTS` map, `SURFACE_SIZE_PADDING`, `as` element selector, className merged last
- `src/components/primitives/Icon.tsx` — `makeIcon(LucideIcon)` factory, `TokenIconProps` omitting `strokeWidth`, `ICON_SIZE_PX`, decorative-by-default `aria-hidden`
- `src/components/primitives/Button.tsx` — four variants with split fill/shadow/padding maps, `BUTTON_TEXT_SIZING`/`BUTTON_ICON_SIZING`, the `iconOnly` discriminated union, the `WeakMap` icon cache, the `useReducedMotion` transition branch
- `src/components/primitives/index.ts` — barrel re-exporting the three primitives and their types
- `tests/unit/primitives/Surface.test.tsx` — four exact class groups, `surfaceMuted` shadow-free, no perimeter edge on any variant, `as`, className merge, `size` padding
- `tests/unit/primitives/Icon.test.tsx` — stroke-width 1.5 read from the DOM node, the forced-override case, decorative/labelled, both sizes
- `tests/unit/primitives/Button.test.tsx` — four variant groups, no-`bg-accent` on `primary`, mandatory icon-only name, `disabled` semantics, normal vs reduced-motion transitions

## Decisions Made

- **Variant groups split so `disabled` is additive.** Fill/ink/radius live in one Record, shadow in a second and padding in a third, so `disabled` drops the shadow and appends `opacity-60 cursor-not-allowed` without rewriting the variant string. The header comments name the invariant each variant satisfies so a later editor sees why the split exists.
- **Icon size is an enum, not a number.** `IconSize = 'sm' | 'lg'` mapped to `{ sm: 16, lg: 24 }` keeps every icon on an existing scale step, and the two sizes are documented as the only allowed numeric values in the file.
- **The stroke-width ordering is the defence.** Writing `strokeWidth={1.5}` after `{...rest}` defends against a future type widening; the `Omit` defends against a call site today. Both are asserted by `Icon.test.tsx`.
- **`iconOnly` uses a discriminated union rather than a runtime throw.** The missing-name case is unreachable in TypeScript, and the test proves the rendered control always exposes a non-empty name.
- **Motion is gesture-driven, not per-state.** `whileHover`/`whileTap` plus a single `transition` keep one definition in the component; the reduced branch replaces both the duration and the tap shape (opacity only). Disabled clears the gesture objects so no transition runs on a dead control.

## Deviations from Plan

**1. The plan run was interrupted and completed by the orchestrator (recovery, documented).**
- **Found during:** the execute-phase safe-resume gate, before wave 4 dispatch.
- **Issue:** commits `1ffdc2e` (task 1) and `7559754` (task 2) existed but `02-05-SUMMARY.md` was missing and task 3's three test files were written and untracked — the run had stalled after writing the tests and before committing them or updating tracking.
- **Resolution:** rather than re-execute from scratch, the orchestrator verified every task against the plan's acceptance criteria (24/24 unit tests, `npm run lint` exit 0, `npm run build` exit 0, `tsc --noEmit` exit 0, zero raw hex), committed the test files as `221ee6a`, and authored this SUMMARY plus the STATE/ROADMAP updates. No production code was reverted or rewritten.
- **Files modified:** none beyond the plan's set.

**2. Next.js build side effects reverted, not adopted.**
- **Found during:** `npm run build`.
- **Issue:** Next 16.3.8 rewrote `tsconfig.json` (`jsx: "preserve"` → `"react-jsx"`, added `.next/dev/types/**/*.ts` to `include`) and created an untracked `next-env.d.ts` — the same side effect plan 02-04 recorded.
- **Resolution:** both were reverted (`git checkout -- tsconfig.json`, `rm next-env.d.ts`) because they are outside this plan's `files_modified` set. The build itself exits 0 and will re-apply them on any future run; they remain unowned and should be adopted deliberately.
- **Files modified:** none committed.

---

**Total deviations:** 1 documented recovery (no code change) and 1 build side effect reverted.
**Impact on plan:** No acceptance criterion was bypassed and no scope was added. The recovery produced the same tree the executor would have produced, verified against the plan's own gates.

## Issues Encountered

- **The 02-05 run stalled mid-task-3.** Tasks 1 and 2 committed cleanly, and the three test files were fully written and passing, but the run ended before committing them or writing the SUMMARY. `STATE.md` remained stale (still reading "next: 02-03"). The safe-resume gate caught this before any executor was dispatched; the recovery above closed it out. Any executor reading this SUMMARY should trust the commits, not the stale STATE text.
- `npx vitest` prints the benign Vite `configLoader: 'native'` warning ("ESM syntax in a file loaded as CommonJS") because `package.json` has no `"type": "module"`. Pre-existing (02-02/02-03), unrelated to this plan, left untouched.
- `npm run build` emits only `/404` because the tree still has no `page.tsx`; routing is plan 02-08's deliverable by design.
- The working tree carries unrelated changes not owned by this plan and left untouched: `.planning/config.json` modified (the execute-phase `_auto_chain_active` flag), `docs/reference/diagnostic-current-implementation.png` deleted and `docs/reference/patient-tracking-dashboard.jpg` untracked.

## User Setup Required

None — no external service configuration required. No dependency was added and nothing was installed.

## Verification

| Command | Result |
|---|---|
| `npx vitest run tests/unit/primitives` | exit 0 — 3 files, 24 tests passed |
| `npm run lint` | exit 0 — `0 violations across 8 file(s)`; 4 advisory contrast pairs enumerated for the reviewer |
| `npm run build` | exit 0 — `✓ Compiled successfully`, TypeScript passed, only `/404` emitted |
| `npx tsc --noEmit` | exit 0 — 0 type errors |
| `grep -o -E "#[0-9A-Fa-f]{6}" src/components/primitives/` (recursive) | no raw hex literals |
| `git status --short` after build | `tsconfig.json` reverted, `next-env.d.ts` removed; no other out-of-scope file |

## Next Phase Readiness

- Plans 02-06…02-10 can compose from `@/components/primitives` with no fill, radius, ink or elevation invented locally: `Surface`'s four variant names and `Button`'s four variant names are the contract those plans build on.
- Plan 02-06 (`Pill`, `TabBar`, `CompactControl`) and 02-07 (`EmptyState`, `Overlay`) inherit the Server-Component-by-default rule, the `react-dom/server` test harness, and the `motion/react` module-mock convention established here; `src/lib/motion.ts` will supply the reduced-motion branch that `Button` currently reads directly from the generated constants.
- Plan 02-06's `INSET_FILL` resolves to the plain `surfaceMuted` fill, never a raised-plus-shadow fallback — `Surface` makes that unambiguous.
- Plan 02-11's reviewer has the primitive contrast pairs from `npm run lint` and will own D5 (visual fidelity) via baselines plus human review.
- Orchestrator notes: (a) `.planning/STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` are updated centrally from this SUMMARY's coverage block; (b) the `tsconfig.json` / `next-env.d.ts` Next-16 build rewrite is still unowned and should be adopted deliberately.

---
*Phase: 2-foundation-and-app-shell*
*Completed: 2026-10-06*
