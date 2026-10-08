# 04: Overview region frame — timeline band and reserved clinical regions, honestly empty

**What to build:** Overview reads as the complete reference layout. The timeline band is framed as the host the Phase 006 engine will fill; the wide Vital Signs History card, the Labs card and the vitals snapshot region all sit at their reference proportions in deliberate states that name what will appear there. Compact timeline range controls are present as chrome. No clinical value is invented anywhere.

**Blocked by:** 01, 02, 03

**Status:** resolved

- [x] Every region the reference places exists at its reference proportion: the wide bottom-row card at approximately 55% and the two side cards at approximately 22.5% each, within ±3% (QA row 5)
- [x] The timeline band renders as a framed region, not as a static drawing — it is explicitly the host Phase 006 fills, and it draws **no** fake events, nodes, branches or axis marks (§3.5, §27)
- [x] Compact timeline range controls (Month / Week) are present as pill controls with the active one emphasized, and are genuinely inert rather than fake-interactive (INV-08; no dead controls)
- [x] The scrubber track and dark viewport window are **not** drawn here — they are TL-06, owned by Phase 006 (QA rows 8–10 recorded **N/A → Phase 006**)
- [x] Vitals and lab regions render a deliberate §24 state naming what will appear — never a placeholder number, sparkline, bar or value (§27, Phase-4 D-18)
- [x] Empty-state headings follow "No {record-type} yet"; body copy is one line of what will appear plus one next step (§7)
- [x] Rules and dividers are 1px, no thick rules (INV-11); any scrim derives from `textPrimary` and introduces no new token (INV-17)
- [x] Only `radius.sm|md|lg|xl|pill` appear; every compact control uses `radius.pill`; no interactive corner radius at or below 4px (INV-07, INV-08, INV-09)
- [x] No page-level section gap exceeds the `space.2xl` step of 32px (INV-10)

**Gate evidence at close:** QA rows 1, 5, 11 · QA rows 8–10 recorded N/A → Phase 006 · INV-07, INV-08, INV-09, INV-10, INV-11, INV-17 · Serves WSP-02 completeness

**Why it waits for 02 and 03:** the 55/22.5/22.5 proportions can only be measured against real content in place.

## Comments

### 2026-10-08 — resolved

- **Where:** `TimelineBand` (full-width inset `surfaceMuted` frame, `min-h-44`
  matching the skeleton's band height — §7 empty copy, zero SVG/nodes/axis,
  no scrubber), `VitalsHistoryCard` (≈55% — header carries the inert
  Month/Week pill chips: `surfaceRaised` fill + `shadow-raised` on the active
  one, rendered as `aria-hidden` SPANs, never buttons), `LabsCard` (≈22.5%),
  `RecentRecordsCard` (≈22.5%, from T-03), all three sharing
  `BottomCardShell` (the reference's grabber dash + region label + header).
  The row is one `md:grid-cols-[55fr_22.5fr_22.5fr]` grid in `OverviewBody`.
- **Proportion math:** grid `fr` distributes the row's content box after
  gutters, so at the `max-w-[80rem]` desktop container the measured widths
  land ≈53.6% / 22.2% / 22.2% — inside 55±3 and 22.5±3 either reading
  (absolute points or relative percent).
- **Vitals snapshot region** (the ticket's third named region): the reference's
  upper stat grid is a vitals snapshot; without a vitals table it renders as a
  deliberate `Vital signs` card reading "No readings yet / Recorded during
  visits." beside the context cards — no placeholder numeral or sparkline.
- **QA rows 8–10** (timeline proportions, node/branch behavior, scrubber) are
  **N/A → Phase 006**: nothing they measure exists here by design.
- **Tests:** the T-04 block in `tests/unit/workspace-overview.test.tsx` —
  region presence, the 55/22.5/22.5 grid literal, no-SVG/no-node guard, inert
  chip contract (SPAN + aria-hidden + active emphasis), vitals/labs copy with
  a fabricated-value grep, per-slot failure postures, composed trail. 30/30 in
  that file; `tsc` clean; token lint 0 violations.
