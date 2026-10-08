---
phase: 04-provider-home-patient-folder-workspace
plan: 03
subsystem: provider-home-folder-grid
tags: [folder-grid, retrieval-controls, debounced-search, pill-critical-tone, states]
requires:
  - 04-01 (patients substrate + status vocabulary + capability map)
  - 04-02 (listPatients { rows, hasMore, total } + status.ts)
provides:
  - /provider RSC page (awaited searchParams -> listPatients -> grid; URL is the only state carrier)
  - FolderCard (RSC: tab silhouette, header, 2px D-10 status line, Pill, identity line, activity footer, contextual indicator, whole-card link to /provider/patients/[id])
  - FolderGrid (3/2/1 responsive columns, Load-more cumulative link, per-filter EmptyStates)
  - RetrievalControls (SegmentedControl tabs + "{n} of {total} patients" count) + ProviderSearchControl (300ms debounce -> router.replace)
  - loading.tsx / error.tsx (UX-01 baseline: folder skeletons + StateVariant retry)
  - Pill `critical` tone (D-10 recorded decision cited in the primitive comment)
affects:
  - 04-04 (fills FolderCard's quick-actions slot + FolderGrid's emptyAction + body CTA in page.tsx)
  - 04-05 (visual matrix: provider-home baselines regenerate; folder-identity mask target)
tech-stack:
  added: []
  patterns: ["RSC page + client islands only for debounce/tab state", "cumulative shown param (never an offset window)", "EmptyState/StateVariant/LoadingSkeleton reuse"]
key-files:
  created:
    - src/components/patients/FolderCard.tsx
    - src/components/patients/FolderGrid.tsx
    - src/components/patients/RetrievalControls.tsx
    - src/components/patients/ProviderSearchControl.tsx
    - src/app/(provider)/provider/loading.tsx
    - src/app/(provider)/provider/error.tsx
    - tests/unit/patient-folder-grid.test.tsx
    - tests/unit/provider-home-page.test.tsx
  modified:
    - src/app/(provider)/provider/page.tsx (empty shell -> folder workspace)
    - src/components/primitives/Pill.tsx (critical tone; D-10 is the recorded decision its contract demands)
decisions:
  - FolderCard/FolderGrid/page stay Server Components; exactly two client islands (RetrievalControls, ProviderSearchControl) carry URL state — no card is hydrated (checker-approved split).
  - The empty-state "Add new patient" action slot was deliberately left EMPTY here and wired by 04-04 (checker BLOCKER fix made the handoff explicit in both plans) — implemented as FolderGrid `emptyAction` + page.tsx.
  - data-testid="folder-identity" added at integration so the visual harness can mask the computed age fragment (04-05; 03-08 masking precedent).
  - Load-more href carries `shown + limit` so the server fetch is cumulative — appends, never replaces (checker BLOCKER fix).
verification:
  - npx vitest run (folder-grid + provider-home-page): 43 passed
  - npm run lint: exit 0; npx tsc --noEmit: 0 errors (project-wide, integration run)
  - npm run build: exit 0 (full production build with the grid live)
---

# 04-03 Summary — folder grid + retrieval surface

The hero interaction ships: /provider renders the 3-column folder grid with the
D-10 status grammar (line + Pill, nowhere else), retrieval tabs and debounced
search coexist above it via URL state, pagination appends cumulatively, and
every state variant (loading/error/per-filter empty) is deliberate. Unit-proof
43 green; tsc/build/lint clean at integration.
