---
phase: 02-foundation-and-app-shell
plan: 02-06
subsystem: ui
tags: [motion, framer-motion, reduced-motion, primitives, pill, tabbar, compactcontrol, tokens, wcag]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell
    provides: "generated motion constants (tokens.generated.ts) and the Surface/Icon/Button primitives (plan 02-05)"
provides:
  - "src/lib/motion.ts — the single motion vocabulary (useShellMotion + generated duration/easing re-exports)"
  - "Pill — status chip with a textPrimary label and a decorative tone dot only"
  - "TabBar / SegmentedControl — the eight-tab workspace group and the range toggle"
  - "CompactControl — search / iconToggle / rangeToggle with a gate-selected INSET_FILL"
  - "unit tests proving the reduced-motion branch, the eight-tab set, same-ink active state and the no-border rule"
affects: [02-07, 02-08, 02-11, 02-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One module owns motion: every animation site calls useShellMotion(); durations/curves are re-exported generated constants, never literals"
    - "Gate-selected indirection: INSET_FILL is resolved at module load from review.gateStatus, shared by CompactControl and TabBar, so a D-27 re-open needs no per-call-site edit"
    - "Status is never hue-only: the tone paints a decorative dot; the label is always textPrimary"
    - "Active tab state is fill (bg-surface-raised) + shadow-raised with the same ink as inactive — never a color swap"
    - "Server-rendered primitive tests use react-dom/server + DOMParser (no @testing-library/react)"

key-files:
  created:
    - src/lib/motion.ts
    - src/components/primitives/Pill.tsx
    - src/components/primitives/TabBar.tsx
    - src/components/primitives/CompactControl.tsx
    - tests/unit/motion/reduced-motion.test.tsx
    - tests/unit/primitives/Pill.test.tsx
    - tests/unit/primitives/TabBar.test.tsx
    - tests/unit/primitives/CompactControl.test.tsx
  modified: []

key-decisions:
  - "useShellMotion() resolves reduced motion truthily (Boolean(useReducedMotion())) so a falsy first server render cannot flash full motion on hydration"
  - "TabBar imports INSET_FILL from CompactControl rather than inlining a fill class, so the search wrapper and the tab container share one gate-selected value"
  - "The CompactControl test derives its expected inset fill from review.gateStatus and asserts the exported INSET_FILL against it, so re-opening the D-27 gate cannot leave a stale expectation"

patterns-established:
  - "useShellMotion() is the only sanctioned way to name a duration or a curve; a component that animates without it fails the phase"
  - "INSET_FILL is a single exported constant whose value is selected from review.gateStatus at module load"

requirements-completed: [FOUND-02, FOUND-04, FOUND-05]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "src/lib/motion.ts — one module owns every duration and curve and exposes useShellMotion() with a reduced-motion-aware variant factory"
    requirement: "FOUND-05"
    verification:
      - kind: unit
        ref: "tests/unit/motion/reduced-motion.test.tsx#useShellMotion"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pill — status meaning carried by a textPrimary label with a decorative tone dot; the neutral form renders no dot, so meaning survives with every tint removed (WCAG 1.4.1, INV-04)"
    requirement: "FOUND-04"
    verification:
      - kind: unit
        ref: "tests/unit/primitives/Pill.test.tsx#a tone paints only the dot, never the label"
        status: pass
    human_judgment: false
  - id: D3
    description: "TabBar/SegmentedControl — exactly the eight canonical workspace tabs, same ink active and inactive, aria-current/role=tab, a horizontally scrolling strip with no collapse, no accent"
    requirement: "FOUND-02"
    verification:
      - kind: unit
        ref: "tests/unit/primitives/TabBar.test.tsx#the canonical eight-tab set"
        status: pass
    human_judgment: false
  - id: D4
    description: "CompactControl — search / iconToggle / rangeToggle with the exact fills, radii, shadows and band heights; type=search with a programmatic label; no border on any control; INSET_FILL shared with the TabBar container"
    requirement: "FOUND-02"
    verification:
      - kind: unit
        ref: "tests/unit/primitives/CompactControl.test.tsx#the gate-selected inset fill"
        status: pass
    human_judgment: false
  - id: D5
    description: "Rendered visual fidelity of the new primitives — label/tint contrast, computed pill radius, and the 44px touch target at the mobile band"
    verification: []
    human_judgment: true
    rationale: "jsdom computes no color and no layout, so contrast, computed radius and rendered touch-target size cannot be asserted here. 02-VALIDATION.md §Manual-Only Verifications routes these to a reviewer against docs/governance/visual-qa-rules.md §1 row 2 and responsive-rules.md §4; the machine-checkable half of the status rule is proven by Pill.test.tsx."

# Metrics
duration: 11min
completed: 2026-10-06
status: complete
---

# Phase 2 Plan 06: The motion foundation, Pill, TabBar and CompactControl Summary

**One motion module (`useShellMotion`) that no component can bypass, plus the status `Pill`, the eight-tab `TabBar`/`SegmentedControl` and the `CompactControl` search/toggle set, with a gate-selected `INSET_FILL` shared across call sites.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-06T20:29:38Z
- **Completed:** 2026-10-06T20:40:11Z
- **Tasks:** 3
- **Files modified:** 8 created, 0 modified

## Accomplishments

- `src/lib/motion.ts` centralizes motion: it re-exports the generated `duration.fastSec`/`slowSec` and `easing.standard`/`exit` constants (plus the two durations in milliseconds, derived from the same values) and exposes `useShellMotion()` returning `reduce`, `duration(key)`, `ease(exit?)`, `fade()`, `fadeAndLift()` and `stateChange()`. The reduced branch is opacity-only at the fastest tokenized duration; `reduce` is resolved truthily so a falsy first server render cannot flash full motion on hydration.
- `Pill` carries status in a `textPrimary` label preceded by a decorative tone dot; the neutral form renders no dot, so the meaning survives with every tint removed.
- `TabBar` exports `WORKSPACE_TABS` (exactly the eight canonical labels), keeps the same ink on active and inactive items, expresses active state as `bg-surface-raised` + `shadow-raised`, supports both `aria-current` (link) and `role="tab"`/`aria-selected` (panel) forms, and renders as a horizontally scrolling pill strip with no disclosure collapse. `SegmentedControl` is the same component in its label-only form.
- `CompactControl` implements `search`, `iconToggle` and `rangeToggle` with no border on any control, and resolves the single `INSET_FILL` constant from `review.gateStatus` at module load; `TabBar` imports that same constant for its container.

## Task Commits

Each task was committed atomically:

1. **Task 1: motion.ts + reduced-motion contract test** - `6f44677` (feat)
2. **Task 2: Pill.tsx, TabBar.tsx, CompactControl.tsx** - `848cb4e` (feat)
3. **Task 3: Pill/TabBar/CompactControl unit tests** - `2651f4e` (test)

**Plan metadata:** the `docs(02-06): complete …` close-out commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified

- `src/lib/motion.ts` - the single motion vocabulary; `useShellMotion()` and the generated constant re-exports
- `src/components/primitives/Pill.tsx` - status chip; `textPrimary` label + decorative tone dot only
- `src/components/primitives/TabBar.tsx` - `WORKSPACE_TABS`, `TabBar`, `SegmentedControl`; same-ink active state, scrolling strip
- `src/components/primitives/CompactControl.tsx` - `search`/`iconToggle`/`rangeToggle` and the exported `INSET_FILL`
- `tests/unit/motion/reduced-motion.test.tsx` - reduced branch is opacity-only at the fast duration; only two durations reachable
- `tests/unit/primitives/Pill.test.tsx` - tone on the dot only, `textPrimary` label, neutral renders no dot
- `tests/unit/primitives/TabBar.test.tsx` - exactly eight tabs, same ink, `aria-current`, no accent, scrolling strip
- `tests/unit/primitives/CompactControl.test.tsx` - per-variant class groups, `type="search"`, no border, gate-derived `INSET_FILL`

## Decisions Made

- `useShellMotion()` resolves `reduce` truthily (`Boolean(useReducedMotion())`) rather than comparing against `false`, per 02-RESEARCH.md Assumptions Log A1.
- `TabBar` imports `INSET_FILL` from `CompactControl` instead of inlining a fill class, so the `search` wrapper and the tab container cannot drift and a D-27 re-open is picked up at both call sites.
- The CompactControl test reads `review.gateStatus` and computes the expected inset fill from it, then asserts the exported `INSET_FILL` against that value — no branch is hardcoded.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The motion foundation and the three primitives are ready for plan 02-07 (`Overlay`), which consumes `useShellMotion()` rather than declaring its own variants.
- `TabBar`/`CompactControl` are ready for the gallery and shell-chrome plans; `SegmentedControl` is the single component reserved for the timeline's Month/Week range toggle (Phase 006).
- Reviewer-evaluated rows carried forward: the rendered contrast/touch-target/radius checks for the new primitives remain in `02-VALIDATION.md` §Manual-Only Verifications (D5 above).

---

*Phase: 02-foundation-and-app-shell*
*Completed: 2026-10-06*

## Self-Check: PASSED

- All 8 created files exist on disk (`src/lib/motion.ts`, the three primitives, and the four test files).
- All three task commits exist: `6f44677`, `848cb4e`, `2651f4e`.
- Plan-level verification: `npx vitest run tests/unit/motion tests/unit/primitives` → 55 passed; `npx vitest run tests/unit` → 91 passed; `npm run lint` → exit 0; `npm run build` → TypeScript exit 0 (Next's `tsconfig.json` rewrite and `next-env.d.ts` reverted afterwards); no raw hex under `src/lib` or `src/components/primitives`; no `gsap` import under `src/`.
