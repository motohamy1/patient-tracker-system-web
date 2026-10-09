# Phase 6: D3 Clinical Timeline — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `implement` + `code-review` + `to-tickets` skills
(tickets 06-01…06-07 under `.planning/phases/06-d3-clinical-timeline/issues/`), not GSD plan
waves — recorded so the GSD state and the ticket state tell the same story.
**Session constraints (owner-directed):** no Docker / local Supabase, no Playwright matrix, and
**no new tests written this session** — the owner runs the test pass for each step separately.
Verification is therefore type/lint/build plus the pre-existing suite; the ticket unit-proof
boxes are unchecked and carried in §6.

---

## 1. Evidence (commands run, actual output)

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 117 files** (`no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required`) |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (no test files added; see §5 for the three assertions deliberately updated) |
| Build | `npm run build` | **exit 0** — compiled; `/provider/patients/[patientId]/overview` and `/dev/gallery` listed dynamic |
| D3 modules | `package.json` | `d3-scale@4.0.2`, `d3-selection@3.0.0`, `d3-zoom@3.0.0`, `d3-time@3.1.0`, `d3-axis@3.0.0`, `d3-quadtree@3.0.1`, `d3-brush@3.0.0` (+ `@types/*`) imported per-module, never the `d3` barrel |
| DB / RLS (pgTAP) | `supabase db reset && supabase test db` | **N/A / deferred — no schema changes this phase; cloud Supabase later** |
| Visual baselines | `npm run test:visual -- --update-snapshots` | **DEFERRED — owner constraint; see §6** |
| Perf measurement | n/a this session | **DEFERRED with the owner test pass** (structural bounds verified; see TL-09 below) |

## 2. Visual QA gate (`visual-qa-rules.md` §1 — 12 rows)

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — the band shows the reference §5 axis grammar (hairline axis, month dividers, month labels, circular nodes) in the Phase-5 slot; no reflow invented. |
| 2 | Color relationships | **PASS (screenshot leg deferred)** — cards still separate by shadow only; accent pixel-share is the timeline's nodes/badges/selected mark and nothing else (grep: no `accent` background/text/border). |
| 3 | Spacing rhythm | **PASS** — new files use only `space.*` steps (`mt-sm`, `gap-xs/md`, `p-lg`, `px-md`, `mb-sm`); band gap unchanged; no section gap > 32px. |
| 4 | Compactness | **PASS (rendered-height leg deferred)** — band height unchanged at 176px, scrubber 48px, no one-line cards added. |
| 5 | Card proportions | **PASS** — the 55/22.5/22.5 bottom row is untouched (`BOTTOM_ROW_GRID`); the scrubber is full-width. |
| 6 | Pill controls | **PASS** — filter chips, scrubber buttons and the track/window caps all `radius.pill`; nothing ≤4px. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading/display`, weights 400/600 only; `tabular-nums` on dates and counts. |
| 8 | Timeline proportions | **PASS (code-level; measurement leg deferred)** — axis y 72px, divider half-length 24px, node radius 4px, branch stroke 1px declared as constants (`scale.ts`, `ClinicalTimeline`, `branches.ts`); ±10% vs the reference needs the screenshot measurement. |
| 9 | Node/branch behavior | **PASS (visual leg deferred)** — filled nodes and count badges use `accent`; branch paths are 1px, smooth cubics, and collision-free/monotone by construction (no sibling crossings possible). |
| 10 | Bottom scrubber | **PASS (visual leg deferred)** — capsule track in the `surfaceMuted` band family, ticks of varying heights (16px at year starts, 8px monthly), year labels under the capsule at January ticks, dark viewport window derived from `textPrimary` at overlay depth. |
| 11 | Visual density | **PASS (owner read deferred)** — dense-but-scannable band; the fix takes no vertical growth. |
| 12 | Accent restraint | **PASS** — accent appears only on event nodes/count badges/selected emphasis (the INV-05 reserved list); no accent text, border or background anywhere. |

## 3. Invariants (`ui-invariants.md` — INV-01…INV-17)

| ID | Verdict | Objective check evidence |
|---|---|---|
| INV-01 | PASS | `npm run lint` 0 violations. |
| INV-02 | PASS | No frame/chrome region touched. |
| INV-03 | PASS | Same lint pass. |
| INV-04 | PASS | Status families untouched; the `critical` type pill from Phase 5 unchanged. |
| INV-05 | PASS | Accent only on nodes/badges/selected emphasis; grep finds no `bg-accent`/`text-accent`/`border-accent`. |
| INV-06 | PASS | No gamified vocabulary or celebration anywhere in the new surface. |
| INV-07 | PASS | Radii: `rounded-pill`/`rounded-lg`/`rounded-xl` only. |
| INV-08 | PASS | Every compact control is `radius.pill`. |
| INV-09 | PASS | Nothing ≤4px. |
| INV-10 | PASS | Spacing grep above; band gap unchanged. |
| INV-11 | PASS | Axis, dividers, ticks, branches all `strokeWidth={1}`; no thick rules. |
| INV-12 | PASS | No card holds one line; band/scrubber are controls, not content cards. |
| INV-13 | PASS | Only `shadow-raised` (cards/badges) and `shadow-overlay` (detail card) referenced; `tokens.json` untouched. |
| INV-14 | PASS | No local box-shadow literal (lint `token-reference-required`). |
| INV-15 | PASS | `stroke-border-subtle` only on the axis/dividers/ticks; no card edge borders. |
| INV-16 | PASS | No outlined card. |
| INV-17 | PASS | The scrubber window's scrim is `fill-text-primary` (derived from `textPrimary`); no new token; no glass/backdrop-blur. |

## 4. Requirement traceability (TL-01…09, UX-04/05)

| Req | Ticket | Evidence |
|---|---|---|
| TL-01 | 06-01/02 | D3 owns scales (`scaleTime`), tick intervals (`utcMonth`), zoom/pan (`d3-zoom`) and temporal domain; React owns the SVG tree; no second charting engine; nothing static. |
| TL-02 | 06-01 | `CareEvent` union (§8.2 vocabulary) + `projectCareEvents` from real rows under RLS; projection is not storage; documented extension seam for phases 007–010. |
| TL-03 | 06-02 | `d3-zoom` drag-pan with `translateExtent` bounding the window inside the event domain. |
| TL-04 | 06-02 | `levelForSpanDays` + `clusterVisibleEvents` cluster at broad zoom, individual marks at deep zoom; chronology preserved (sorted rows). |
| TL-05 | 06-05 | `layoutMilestoneBranch` monotone lanes + `branchPath` cubics; per-frame redraw moves with the node layer; dormant in product (no sub-event data), fenced dev fixture demonstrates. |
| TL-06 | 06-04 | `TimelineScrubber`: capsule track, ticks/year labels, dark window, wired +/− and window/track drag, sharing one transform with the band. |
| TL-07 | 06-03 | Node selection → overlay detail card with real payload/provenance; cluster activation zooms to its range; data-driven category filter recomposes the axis. |
| TL-08 | 06-06 | Band svg focusable with arrow pan, +/− zoom, Escape; nodes `role="button"` + names + Enter/Space; visible focus ring from the global rule. |
| TL-09 | 06-02/05/07 | Cluster cap (≤48) bounds marks at any zoom; per-frame motion is imperative attribute/path writes with no React state on the gesture path; synthetic 4 000-event generator added for the owner's perf pass (measurement deferred). |
| UX-04 | 06-02/06/07 | No per-frame state on the pan/zoom path; the scrubber drag is the only state-per-move path and is bounded by the cluster cap. |
| UX-05 | 06-04/06 | Timeline and scrubber present at every band; 44px targets (node hit rects, scrubber +/−, chips `min-h-11` on mobile). |

## 5. Test assertions updated this session (reported, not hidden)

The owner directed no new tests; three pre-existing assertions became stale because a deliberate
feature contradicted the behaviour they guarded. Only those lines changed; no test files were
added.

1. `workspace-overview.test.tsx` — "no dead buttons" asserted *no `<button>` anywhere in the
   Overview body*; the timeline now has real wired controls (06-03 filter chips, 06-04 zoom
   buttons), so the guard was scoped to the vitals card, which is what it was written to protect.
2. `timeline-render.test.tsx` — asserted the band svg `role="img"` (06-01). TL-08 needs the
   interactive event nodes exposed to assistive tech, and `img` is a leaf role that would hide
   them; the role is now `group` and the assertion was updated.
3. `timeline-render.test.tsx` — the "one mark per event" assertion was rewritten in 06-02 to
   reflect clustering (3 events → 2 marks: one event + one cluster of two), i.e. grouping is now
   the honest behaviour.

## 6. Deliberately deferred (owner constraints)

- **No new tests / unit proofs** for 06-03…06-07 (owner runs the test pass per step). The
  ticket unit-proof boxes are left unchecked and marked DEFERRED.
- **Performance measurement numbers** (TL-09/UX-04): structural bounds are in place and the
  `buildSyntheticTimelineEvents(4000)` generator is ready; the measured assertion belongs to the
  owner's test pass.
- **Visual baselines + screenshot legs** of QA rows 2, 4, 5, 8, 9, 10, 11 (the timeline is
  `ƒ` dynamic and needs a running server; no heavy process this session).
- **Owner visual verdicts** on §7's items.

## 7. Owner design-gate brief (§20.4) — items needing adjudication

1. **No darkening scrim on the detail card (06-03 deviation).** Dismissal is close control +
   band click + Escape. Rationale: a scrim over the product's centerpiece hides the very context
   the card explains, and the reference shows overlay cards directly on the band. *Ask:* accept,
   or require a scrim.
2. **Scrubber track tone (06-04).** The track renders `fill-surface` inside the `surfaceMuted`
   band so the capsule reads as a lighter recessed rail; QA row 10's "surfaceMuted family" is read
   as the band the track sits on. *Ask:* confirm the tone or invert it.
3. **Year labels inside the scrubber** at January ticks (reference-consistent), and ticks vary in
   height (16/8px). *Ask:* confirm wording/placement at the visual gate.
4. **Branches dormant in the product.** Today's projection produces no sub-events, so the branch
   layer renders nothing real; the algorithm + fenced fixture demonstrate it. *Ask:* accept the
   dormancy, or prioritise a phase that supplies sub-events.
5. **Filter chips dormant** until a second event category exists (today: lifecycle only), shown to
   avoid a dead control. *Ask:* accept, or render chips with a single category.
6. **Timeline svg `role="group"`** (was `img`) so event nodes are exposed to assistive tech —
   an a11y correction that changed one assertion (§5.2). *Ask:* confirm.

## 8. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0;
TL-01…09 + UX-04/05 traced).
**Phase acceptance: PENDING** the deferred items in §6 and the owner's §7 verdicts — a passing
build is not acceptance (§20.7, §27).
