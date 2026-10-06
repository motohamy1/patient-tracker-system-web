---
phase: 02-foundation-and-app-shell
plan: 02-08
subsystem: ui
tags: [nextjs, app-router, route-groups, provider-shell, tabs, navigation, accessibility, tokens, empty-state, no-fake-clinical-data]

# Dependency graph
requires:
  - phase: 02-foundation-and-app-shell
    provides: "Surface/Button/Icon (02-05), useShellMotion + generated motion constants (02-06), EmptyState + Overlay (02-07), the generated token layer and the three machine checks (02-03/02-04)"
provides:
  - "The provider route group: the persistent left rail, the provider top bar, the mobile pill strip and the workspace top bar"
  - "tabs.ts — the single enumeration of the eight workspace slugs, labels, icons, DEFAULT_TAB_SLUG and tabHref(patientId)"
  - "Ten provider routes: /provider, /provider/patients/[patientId] (redirecting), and the eight workspace tabs as real nested routes"
affects: [02-09, 02-10, 02-11, 003, 004, 005, 007, 008, 009, 010, 011]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role chrome lives in a NESTED route-group layout beneath the single root layout, so a role switch is a client navigation (02-RESEARCH.md Pattern 3)"
    - "The eight workspace routes are one shared template whose only variation is the slug, the active tab and the owning-phase comment; the route data lives in one `tabs.ts`"
    - "Shell navigation items are anchors styled to the `Button` `iconOnly` geometry, never a dead `Button` with no destination"
    - "The mobile search is a native `<details>` disclosure, so it collapses to a 44px icon-only control that expands in place with no client JavaScript"
    - "A component reference is never passed from a Server Component into a Client Component; the glyph is rendered to an element and passed as a child"

key-files:
  created:
    - src/components/shell/ProviderRail.tsx
    - src/components/shell/ProviderTopBar.tsx
    - src/components/shell/MobileNav.tsx
    - src/components/shell/WorkspaceTopBar.tsx
    - src/app/(provider)/provider/patients/[patientId]/tabs.ts
    - src/app/(provider)/layout.tsx
    - src/app/(provider)/provider/page.tsx
    - src/app/(provider)/provider/patients/[patientId]/layout.tsx
    - src/app/(provider)/provider/patients/[patientId]/page.tsx
    - src/app/(provider)/provider/patients/[patientId]/{overview,ai-analytics,visits,medications,labs,imaging,allergies,genetics}/page.tsx
  modified: []

key-decisions:
  - "WorkspaceTopBar stays a Server Component and receives its activeSlug from each workspace route; the [patientId] layout hosts only the workspace frame, because an App Router layout cannot read its child segment and D-03 forbids middleware and client-side path/role reads"
  - "The CTA and bell glyphs are rendered as elements and passed to the client Button as children, because a Lucide component reference is a function and cannot cross the Server-to-Client boundary"
  - "Each of the eight workspace routes inlines the fixed 02-UI-SPEC.md §9.1 copy so `grep -rl 'No record yet'` matches exactly the eight tab pages; the shared route data (slugs, labels, icons, tabHref) lives in tabs.ts"
  - "The rail width and the top-bar height are composed from on-scale steps via `var(--spacing-2xl)` (a layout dimension), never written as an off-scale spacing literal"

patterns-established:
  - "A route-group layout owns role chrome; the child route owns its own active-segment state"
  - "No shell route renders an EmptyState action, because no destination is wired in this phase"
  - "Every icon-only rail/top-bar control ships an accessible name; the glyph stays decorative"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, UX-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "tabs.ts is the single enumeration of the eight workspace slugs/labels/icons with DEFAULT_TAB_SLUG and tabHref(patientId); the eight route folders exist and match by name"
    requirement: "FOUND-03"
    verification:
      - kind: other
        ref: "node -e \"...want=['overview','ai-analytics','visits','medications','labs','imaging','allergies','genetics']...\" -> EIGHT-ROUTES-EXACT"
        status: pass
      - kind: other
        ref: "find src/app/(provider) -name page.tsx | wc -l -> 10 (1 home + 1 redirect + 8 tabs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The four provider chrome components exist and are token-pure: the rail paints no accent and marks the active route, the top bar keeps every label in textPrimary and ships the CTA disabled, the mobile strip scrolls rather than collapses, the workspace top bar renders the tab group from the shared map"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "npm run lint (check-design-tokens: 0 violations across 33 files)"
        status: pass
      - kind: other
        ref: "grep -v comment ProviderRail.tsx | grep -c 'bg-accent|text-accent|ring-accent' -> 0"
        status: pass
      - kind: other
        ref: "grep -v comment ProviderTopBar.tsx | grep -c 'text-frame-foreground|frame-foreground' -> 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The provider layout nests beneath the single root layout, carries the Phase 003 server-side role-resolution comment, and no middleware.ts and no client boundary exist anywhere in the provider group"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "find src/app -name middleware.ts | wc -l -> 0; grep -rc 'use client' src/app/(provider)/ -> all 0"
        status: pass
      - kind: other
        ref: "grep -c 'server-side' src/app/(provider)/layout.tsx -> 1; the only localStorage reference is a comment line"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every provider route in the locked map renders with the correct frame and a typed EmptyState and no action, and no shell renders fake clinical content"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "npm run build -> exit 0; route listing names /provider, /provider/patients/[patientId] and the eight tab routes"
        status: pass
      - kind: other
        ref: "grep -rn 'Cardiology|Lisinopril|Metformin|MRN' src/app src/components -> 0; grep -o hex src/app/(provider)/ -> 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rendered appearance of the shell: the rail fill/shadow active treatment, the two-row top-bar layout, the mobile pill strip and its collapsed search, the band behaviour, the 44px touch targets, and label/background contrast"
    verification: []
    human_judgment: true
    rationale: "jsdom computes no layout and no color, so the band flip, the rail highlight, the 44px target geometry and contrast cannot be asserted by a unit test; 02-VALIDATION.md routes these to plan 02-11's visual baselines and a reviewer against docs/governance/visual-qa-rules.md §1."
  - id: D6
    description: "The active workspace tab is correct on first paint for every route, and the bare workspace URL redirects to the first tab"
    verification:
      - kind: other
        ref: "grep -c 'DEFAULT_TAB_SLUG' [patientId]/page.tsx -> 3; grep -c 'No record yet' [patientId]/page.tsx -> 0"
        status: pass
    human_judgment: true
    rationale: "The active tab is supplied per route and machine-checkable structurally, but the rendered aria-current on the correct item after a client navigation is a visual/UAT check owned by 02-11 and verify-work."

# Metrics
duration: 33min
completed: 2026-10-06
status: complete
---

# Phase 2 Plan 08: The provider route group Summary

**The provider shell is built end to end — a persistent rail, a provider top bar with a disabled CTA, a below-768px scrolling pill strip, a workspace top bar, and the ten provider routes (the eight workspace tabs as real nested routes) — all rendered from the frozen tokens with no access control, no middleware and no clinical content.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-10-06T21:14:00Z
- **Completed:** 2026-10-06T21:47:20Z
- **Tasks:** 2
- **Files modified:** 17 created, 0 modified (1 created file adjusted within the plan's set)

## Accomplishments

- The provider route group is real: `/provider` renders the "No patients yet" empty shell, `/provider/patients/[patientId]` redirects to the first tab, and the eight workspace tabs (`overview`, `ai-analytics`, `visits`, `medications`, `labs`, `imaging`, `allergies`, `genetics`) exist as nested routes named from `PRODUCT-MASTER-SPEC.md` §6 — no ninth route, no `vital-signs`, no `communication`.
- `tabs.ts` is the single enumeration of the eight slugs, labels and icons, with `DEFAULT_TAB_SLUG` and a `tabHref(patientId)` builder; `WorkspaceTopBar` renders its tab group from that map, so the labels live in exactly one place.
- `ProviderRail` paints the `frame` field with five `iconOnly` anchors, marks the active item with `bg-surface-raised` + `shadow-raised` + `aria-current="page"`, and paints no accent marker (`INV-05`).
- `ProviderTopBar` keeps the provider name and role in `textPrimary` (never `frameForeground`) and ships the primary CTA `disabled`, because Phase 004 owns its destination.
- `MobileNav` is a horizontally scrolling pill strip (`scrollbar-width: none`, 44px items) with a native `<details>` search disclosure that collapses to a 44px icon-only control and expands in place — no client JavaScript, no dead control.
- No access control, no `middleware.ts`, no client boundary in the provider group, and no fake clinical content anywhere: the build lists every route, `npm run lint` is 0 violations, and 109 unit tests pass.

## Task Commits

Each task was committed atomically:

1. **Task 1: the provider chrome components and the workspace tab map** - `ec928de` (feat)
2. **Task 2: the provider layout and the ten provider routes** - `84a9835` (feat)

**Plan metadata:** the `docs(02-08): complete …` close-out commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified

- `src/app/(provider)/provider/patients/[patientId]/tabs.ts` - the single enumeration of the eight workspace slugs, labels and icons, `DEFAULT_TAB_SLUG` and `tabHref(patientId)`
- `src/components/shell/ProviderRail.tsx` - persistent `frame` rail, five `iconOnly` anchors, active `bg-surface-raised` + `shadow-raised` + `aria-current`, no accent
- `src/components/shell/ProviderTopBar.tsx` - `frame` bar, disabled primary CTA, iconOnly bell, `textPrimary` profile block
- `src/components/shell/MobileNav.tsx` - below-768px scrolling pill strip plus the collapsed search disclosure
- `src/components/shell/WorkspaceTopBar.tsx` - tab group from the shared route map plus the patient context block
- `src/app/(provider)/layout.tsx` - canvas field + rail + top bar + mobile strip; carries the D-03 Phase 003 server-side role-resolution comment
- `src/app/(provider)/provider/page.tsx` - the `/provider` empty shell ("No patients yet")
- `src/app/(provider)/provider/patients/[patientId]/layout.tsx` - the workspace frame
- `src/app/(provider)/provider/patients/[patientId]/page.tsx` - redirect to `DEFAULT_TAB_SLUG`
- `src/app/(provider)/provider/patients/[patientId]/{overview,ai-analytics,visits,medications,labs,imaging,allergies,genetics}/page.tsx` - the eight "No record yet" shells, each naming its owning phase

## Decisions Made

- `WorkspaceTopBar` stays a Server Component and takes its `activeSlug` from each workspace route; the `[patientId]` layout hosts only the frame. An App Router layout cannot read its child segment, and D-03 forbids middleware and client-side path/role reads, so per-route active state has to come from the route that knows its slug. This keeps the active tab correct on first paint for every tab.
- The CTA and bell glyphs are rendered as elements and passed to the client `Button` as children. A Lucide component reference is a function and cannot cross the Server-to-Client boundary (the build failed with "Functions cannot be passed directly to Client Components" until this was fixed).
- Each workspace route inlines the fixed §9.1 empty-state copy so `grep -rl "No record yet"` matches exactly the eight tab pages; the shared route data lives in `tabs.ts`, keeping the plan's 17-file `files_modified` set intact.
- The rail width and top-bar height are composed from on-scale steps through `var(--spacing-2xl)` — a layout dimension, not a spacing literal (`02-UI-SPEC.md` §5, exceptions).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A Lucide component reference cannot cross the Server-to-Client boundary**
- **Found during:** Task 2 (`npm run build` prerender of `/provider`)
- **Issue:** `ProviderTopBar` (a Server Component) passed `icon={ScanLine}` / `icon={Bell}` to the client `Button`. Next failed: "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'."
- **Fix:** Rendered the glyphs to elements with `makeIcon` and passed them as `Button` children, so only a rendered element crosses the boundary.
- **Files modified:** src/components/shell/ProviderTopBar.tsx
- **Verification:** `npm run build` exit 0; the route listing names all ten provider routes.
- **Committed in:** `84a9835` (Task 2 commit)

### Plan-contradiction resolutions (documented, no scope creep)

**2. [Rule 3 - Blocking] The workspace layout cannot host a per-route active tab**
- **Found during:** Task 2 (layout/routes design)
- **Issue:** The plan labelled `WorkspaceTopBar` a Server Component and said the `[patientId]` layout renders it. An App Router layout cannot read its child segment, and this phase forbids middleware and client-side path/role reads, so the layout could never supply the correct `activeSlug` — the active tab would be wrong on every tab except the default.
- **Fix:** Each workspace route renders `WorkspaceTopBar` with its own `activeSlug`; the `[patientId]` layout hosts the workspace frame only. `WorkspaceTopBar` stays a Server Component and renders `TabBar` as the plan specifies.
- **Files modified:** src/app/(provider)/provider/patients/[patientId]/layout.tsx and the eight tab pages
- **Verification:** `npm run build` lists all eight tab routes; the active item is correct per route by construction.
- **Committed in:** `84a9835` (Task 2 commit)

**3. [Rule 3 - Blocking] The plan's "shared body module" is outside its own `files_modified` set**
- **Found during:** Task 2
- **Issue:** The plan asked to keep the eight tab bodies in one shared module, but its `files_modified` set (17 files) excludes such a module and the success criterion forbids committing any file outside that set.
- **Fix:** The shared route data lives in `tabs.ts`; each tab page inlines the fixed §9.1 copy so the acceptance grep matches exactly the eight tab pages.
- **Files modified:** src/app/(provider)/provider/patients/[patientId]/*/page.tsx, tabs.ts
- **Verification:** `grep -rl "No record yet" .../[patientId]/` returns exactly 8 files; the plan's 17-file count holds.
- **Committed in:** `84a9835` (Task 2 commit)

---

**Total deviations:** 3 (1 Rule 1 bug, 2 Rule 3 blocking resolutions)
**Impact on plan:** No scope creep, no file outside the plan's `files_modified` set. The bug fix was required for the build; the two structural resolutions were forced by internal plan contradictions and preserve correctness and the acceptance criteria.

## Issues Encountered

- The workspace top bar and the provider top bar both render on a workspace route because the workspace layout nests inside the provider layout. This is the plan's literal composition (key_links: "the workspace layout nests `WorkspaceTopBar` beneath that same rail"). On mobile the provider strip (a single "Home" item) sits above the workspace tab strip; the redundant search field is hidden below 768px in both bars and replaced by the collapsed mobile search.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The provider shell is complete and every URL in the locked D-01 map now exists for the provider side. Plans 02-09 (the `(auth)`/`(patient)` groups and the root `not-found.tsx`) and 02-10 (the dev gallery) can build on it.
- Plan 02-11's visual baselines capture `/provider` and `/provider/patients/<placeholder>`; the placeholder segment is a literal in the spec, never a fixture value.
- The provider group carries no access control by decision D-03; the exact slot for Phase 003's server-side role resolution is commented in `src/app/(provider)/layout.tsx`.
- `WorkspaceTopBar` is the tab group's host; a later phase filling a tab body edits one route's `page.tsx` and does not touch the shell.

---

*Phase: 02-foundation-and-app-shell*
*Completed: 2026-10-06*

## Self-Check: PASSED

- All 17 files exist on disk (4 shell components, 2 layouts, 10 route pages, `tabs.ts`).
- Both task commits exist: `ec928de`, `84a9835`.
- Plan verification re-run: `npm run build` exit 0 and the route listing names `/provider`, `/provider/patients/[patientId]` and the eight tab routes; `npm run lint` exit 0 (0 violations); `find src/app -name middleware.ts | wc -l` = 0; `ls src/app/page.tsx` fails; no raw hex under `src/components/shell` or `src/app`; no `Cardiology|Lisinopril|Metformin|MRN` under `src/app`/`src/components`.
- All task-level acceptance criteria re-run against the committed files: PASS. `npx vitest run tests/unit` → 109 passed (13 files).
- Next's `tsconfig.json` rewrite and `next-env.d.ts` were reverted after the build.
