---
phase: 02-foundation-and-app-shell
plan: 02-07
subsystem: ui
tags: [empty-state, overlay, modal, sheet, focus-trap, scroll-lock, accessibility, inert, tokens, wcag]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell
    provides: "Surface/Button/Icon primitives (02-05) and useShellMotion + generated motion constants (02-06)"
provides:
  - "EmptyState — the one shared empty-state primitive (title + optional body + optional action)"
  - "Overlay — one primitive with two presentations (modal ≥1024px, bottom sheet <1024px), portalled, with the full hand-rolled a11y contract"
  - "useFocusTrap — capture-before-move restore, background inert, Tab/Shift+Tab wrap, Escape, isConnected restore guard"
  - "useScrollLock — overflow hidden + scrollbar-gutter stable, restored on cleanup"
affects: [02-08, 02-10, 02-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The overlay a11y contract is hand-rolled on `inert` + one keydown handler + two CSS declarations; no headless UI, ARIA or focus-trap dependency is added (D-22)"
    - "One overlay component expresses its modal→sheet flip with a stock `max-lg:` prefix at the 1024px edge; no `variant` prop and no second overlay form (D-23)"
    - "The scrim's colour is `textPrimary` through the generated utility's alpha modifier; no new scrim token (INV-17)"
    - "Focus restore is guarded by `isConnected`, so a trigger unmounted while the dialog is open cannot drop focus to the document body"
    - "Motion always routes through `useShellMotion()`; the overlay declares no local duration and no local reduced branch"

key-files:
  created:
    - src/components/primitives/EmptyState.tsx
    - src/components/overlays/Overlay.tsx
    - src/components/overlays/useFocusTrap.ts
    - src/components/overlays/useScrollLock.ts
    - tests/unit/primitives/EmptyState.test.tsx
    - tests/unit/overlays/focus-trap.test.tsx
    - tests/unit/overlays/scroll-lock.test.tsx
  modified: []

key-decisions:
  - "EmptyState's wrapper/body max-widths are written as explicit rem values (`max-w-[32rem]` / `max-w-[24rem]`) because the UI-SPEC's `max-w-lg`/`max-w-sm` collide with the `--spacing-lg`/`--spacing-sm` tokens and resolve to 16px/8px in this theme (02-RESEARCH.md Pattern 2)"
  - "The overlay hook `active` flag is gated on `open && mounted`, because the portal (and therefore the trap container) only exists after the client mount effect, and the effects would otherwise never attach once the ref populated"
  - "`useShellMotion().ease()` returns a number array; the cubic-bezier tuple assertion lives at the Overlay call site rather than in motion.ts, which is outside this plan's files_modified set"

patterns-established:
  - "The overlay's modality is `inert` on the background, not a manual tabbable enumeration; `aria-modal` ships alongside it"
  - "Focus-trap visibility is filtered by `getClientRects().length`, so hidden children are skipped without a display:none check"
  - "Client overlay tests mount with react-dom/client + React `act` and mock motion/react at the module boundary; `getClientRects` is stubbed because jsdom has no layout"

requirements-completed: [FOUND-02, FOUND-04, FOUND-05, UX-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "EmptyState — the one shared empty-state primitive: surfaceRaised wrapper, heading/body type steps, textPrimary ink, optional 24px icon, optional action; no loading affordance of any kind"
    requirement: "FOUND-02"
    verification:
      - kind: unit
        ref: "tests/unit/primitives/EmptyState.test.tsx#slot composition"
        status: pass
    human_judgment: false
  - id: D2
    description: "Overlay a11y contract — focus moves into the panel and cycles (Tab/Shift+Tab), Escape dismisses, focus restores to the trigger, background is inert while open and not after close, unmounted trigger does not throw"
    requirement: "FOUND-04"
    verification:
      - kind: unit
        ref: "tests/unit/overlays/focus-trap.test.tsx#focus moves into the panel and cycles"
        status: pass
      - kind: unit
        ref: "tests/unit/overlays/focus-trap.test.tsx#focus restore and the inert background"
        status: pass
    human_judgment: false
  - id: D3
    description: "useScrollLock — overflow hidden and scrollbar-gutter stable while open, both restored after close and after unmount (no layout shift)"
    requirement: "UX-06"
    verification:
      - kind: unit
        ref: "tests/unit/overlays/scroll-lock.test.tsx#the document scroll lock"
        status: pass
    human_judgment: false
  - id: D4
    description: "Overlay motion routes through useShellMotion(): fadeAndLift at the slow duration with the standard curve entering and the exit curve leaving, opacity-only at the fast duration under reduction"
    requirement: "FOUND-05"
    verification:
      - kind: unit
        ref: "tests/unit/motion/reduced-motion.test.tsx#the reduced branch is opacity-only at the fast duration"
        status: pass
    human_judgment: false
  - id: D5
    description: "Rendered appearance of the new surfaces — the modal-vs-sheet flip at the 1024px band edge, the textPrimary scrim, the inverted surface-coloured panel focus ring, and label/tint contrast"
    verification: []
    human_judgment: true
    rationale: "jsdom computes no layout and no color, so the rendered band flip, scrim contrast and ring colour cannot be asserted; 02-VALIDATION.md §Manual-Only Verifications routes these to the 02-11 visual baselines and a reviewer against docs/governance/visual-qa-rules.md §1."

# Metrics
duration: 14min
completed: 2026-10-06
status: complete
---

# Phase 2 Plan 07: EmptyState and the hand-rolled Overlay Summary

**One shared `EmptyState`, and one `Overlay` primitive that renders a centered modal ≥1024px and a bottom sheet below it, shipping the complete accessibility contract — captured-and-restored focus, `inert` background, Tab/Shift+Tab wrap, Escape, and a shift-free scroll lock — all hand-rolled with no headless-UI dependency.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-06T21:03:40Z
- **Completed:** 2026-10-06T21:17:59Z
- **Tasks:** 3
- **Files modified:** 7 created, 0 modified

## Accomplishments

- `EmptyState` is the one shared empty-state primitive every shell renders: a `surfaceRaised` wrapper, a heading-size semibold title, an optional body line and an optional action, all on `textPrimary` ink. The body and action slots omit their elements entirely when not supplied, and no spinner, skeleton or status-progress class exists anywhere in it.
- `Overlay` is one component with two presentations — a centered modal at and above the 1024px band edge and a bottom sheet below it — expressed with the stock `max-lg:` prefix on a single component (no `variant` prop, no second overlay form). It portals to `document.body`, carries `role="dialog"`, `aria-modal="true"` and `aria-labelledby`, derives its scrim from `textPrimary` at reduced opacity, and takes the overlay elevation only.
- `useFocusTrap` implements the ordered algorithm: capture the restore target before focus moves, mark the background `inert` (one attribute removes the whole page behind the dialog from the tab order and the accessibility tree), move focus in, wrap Tab/Shift+Tab with a `getClientRects` visibility filter, dismiss on Escape, and restore focus only when the captured trigger is still connected.
- `useScrollLock` pairs `overflow: hidden` with `scrollbar-gutter: stable` and restores both, so locking never shifts layout and leaves no residue.
- Every animation routes through `useShellMotion()`; the overlay declares no duration and no reduced branch of its own.

## Task Commits

Each task was committed atomically:

1. **Task 1: EmptyState.tsx and its slot tests** - `52ffa48` (feat)
2. **Task 2: useScrollLock.ts and useFocusTrap.ts** - `94701ab` (feat)
3. **Task 3: Overlay.tsx and its a11y tests** - `8e3c146` (feat)

**Plan metadata:** the `docs(02-07): complete …` close-out commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified

- `src/components/primitives/EmptyState.tsx` - the shared empty-state primitive; optional body/action slots, no loading affordance
- `src/components/overlays/useScrollLock.ts` - `overflow: hidden` + `scrollbar-gutter: stable`, restored on cleanup; no measurement arithmetic
- `src/components/overlays/useFocusTrap.ts` - capture/restore, `inert` background, Tab/Shift+Tab wrap, Escape, `isConnected` guard
- `src/components/overlays/Overlay.tsx` - portalled modal/sheet with `role="dialog"`/`aria-modal`/`aria-labelledby` and the `textPrimary` scrim
- `tests/unit/primitives/EmptyState.test.tsx` - 9 assertions over slot presence/absence, token classes and the 24px icon
- `tests/unit/overlays/focus-trap.test.tsx` - Tab wrap both ways, Escape, restore, `inert` present/absent, unmounted-trigger safety
- `tests/unit/overlays/scroll-lock.test.tsx` - overflow + gutter set while open, restored after close and after unmount

## Decisions Made

- The EmptyState wrapper/body max-widths are explicit rem values (`max-w-[32rem]` / `max-w-[24rem]`) rather than the spec's `max-w-lg`/`max-w-sm`, which resolve through the `--spacing-*` namespace to 16px/8px in this theme. See the deviation below.
- The overlay's `active` flag is gated on `open && mounted` so the accessibility effects attach after the portal — and its container ref — exist. See the deviation below.
- The cubic-bezier tuple assertion for `useShellMotion().ease()` lives at the Overlay call site; `src/lib/motion.ts` (plan 02-06) was left untouched as it is outside this plan's `files_modified` set.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `max-w-lg`/`max-w-sm` collide with the spacing tokens and resolve to 16px/8px**
- **Found during:** Task 1 (EmptyState), confirmed by a Tailwind compile probe before Task 3
- **Issue:** 02-UI-SPEC.md §5.5 names `max-w-lg` (wrapper) and `max-w-sm` (body). In this theme `--spacing-lg`/`--spacing-sm` exist, so Tailwind resolves `.max-w-lg` to `16px` and `.max-w-sm` to `8px` — an unusably narrow card (02-RESEARCH.md Pattern 2 documents this collision).
- **Fix:** Wrote the intended container sizes explicitly as `max-w-[32rem]` / `max-w-[24rem]` (the default `--container-lg`/`--container-sm` sizes), with a comment recording the collision. No raw hex, no off-scale spacing or radius value.
- **Files modified:** src/components/primitives/EmptyState.tsx, src/components/overlays/Overlay.tsx
- **Verification:** Tailwind compile probe showed `.max-w-[32rem] { max-width: 32rem }`; `npm run lint` exit 0; empty-state wrapper is a 32rem centered card.
- **Committed in:** 52ffa48 and 8e3c146 (task commits)

**2. [Rule 1 - Bug] Accessibility effects never attached when the overlay opened on first mount**
- **Found during:** Task 3 (overlay tests: Escape and inert cases failed)
- **Issue:** The portal (and therefore the trap's container ref) only exists after the `mounted` effect. Activating the hooks on `open` alone ran the effect once against a null ref and, because the deps did not change when the ref later populated, the keydown listener and `inert` were never applied.
- **Fix:** Gated the hook `active` flag on `open && mounted`, so the effects run on the commit where the portal DOM exists.
- **Files modified:** src/components/overlays/Overlay.tsx
- **Verification:** `npx vitest run tests/unit/overlays` — Escape and inert cases pass; full suite green.
- **Committed in:** 8e3c146 (Task 3 commit)

**3. [Rule 1 - Bug] `useShellMotion().ease()` type not assignable to motion's `Transition.ease`**
- **Found during:** Task 3 (production build type-check)
- **Issue:** `ease()` returns `number[]`; motion's transition type expects a cubic-bezier tuple, so `npm run build` failed TypeScript at three call sites.
- **Fix:** Narrowed the array to `[number, number, number, number]` at the Overlay call site (`easeIn`/`easeOut`). `src/lib/motion.ts` was not modified — it is outside this plan's files_modified set.
- **Files modified:** src/components/overlays/Overlay.tsx
- **Verification:** `npm run build` exit 0, TypeScript finished with no errors; Next's `tsconfig.json` rewrite and `next-env.d.ts` reverted afterwards.
- **Committed in:** 8e3c146 (Task 3 commit)

**4. [Rule 1 - Bug] Plan task-2 `<files>` tag named a non-existent `useFocusLock.ts`**
- **Found during:** Task 2
- **Issue:** The task-2 `<files>` element listed `src/components/overlays/useFocusLock.ts`, but the plan's task body, acceptance criteria, `must_haves.artifacts`, `files_modified` frontmatter and the Overlay consumer all name `useFocusTrap.ts`.
- **Fix:** Created `useFocusTrap.ts` per the plan body and every other reference; treated the `<files>` entry as a typo.
- **Files modified:** src/components/overlays/useFocusTrap.ts
- **Verification:** `grep -c "inert"` etc. acceptance greps pass; Overlay imports `useFocusTrap`.
- **Committed in:** 94701ab (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (4 Rule 1 bugs)
**Impact on plan:** No scope creep. Three are necessary correctness fixes (a spec class collision, an effect-activation bug and a type error); the fourth is a plan-tag typo resolution. `src/lib/motion.ts`, the primitives barrel and every file outside the plan's `files_modified` set were left untouched.

## Issues Encountered

- jsdom implements no layout, so `Element.getClientRects()` returns an empty list; the overlay tests stub it to a non-empty rect so the trap's real selector/filter/wrap code runs. The "hidden children are skipped" behaviour itself is not reproducible in jsdom and remains a reviewer row.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both primitives are ready for plan 02-08's five empty shells (each renders `EmptyState`) and plan 02-10's gallery (the `EmptyState` slot combinations and the overlay's two presentations).
- `Overlay` is the only overlay form in the codebase; a later phase that needs one must extend it rather than add a `Popover`/`Drawer`/`Tooltip` (D-23).
- `EmptyState` is not yet re-exported from `src/components/primitives/index.ts` — that file is outside this plan's `files_modified` set; 02-08 or the gallery may import it directly or extend the barrel in its own plan.

---

*Phase: 02-foundation-and-app-shell*
*Completed: 2026-10-06*

## Self-Check: PASSED

- All 7 created files exist on disk.
- All three task commits exist (`52ffa48`, `94701ab`, `8e3c146`).
- Plan verification: `npx vitest run tests/unit` → 109 passed (13 files); `npm run lint` → exit 0, 0 violations; `npm run build` → TypeScript exit 0 (tsconfig.json rewrite and `next-env.d.ts` reverted); no raw hex under `src/components`; no `radix|headlessui|react-aria|floating-ui` in `src/`; no `gsap` import under `src/`.
- All task-level acceptance greps re-run against the committed files: PASS.
