# 06-01: Care-event projection and the D3 tracer bullet

**What to build:** The Overview timeline band stops being a placeholder and renders the REAL clinical timeline: the unified Care-Event projection (§8.2 type union) is built from what genuinely exists in the database today (patient record lifecycle + this patient's invitations), a D3 time scale positions those events, and the band shows the reference's axis grammar — hairline axis, month dividers, month labels below, circular event nodes — with an honest empty state when a patient has no events yet.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The five D3 modules the phase needs are installed day one (scale, selection, zoom, time, axis, quadtree, brush) and imported per-module — never the whole `d3` barrel
- [x] A unified `CareEvent` model exists (§8.2 vocabulary) with provenance (source, creator, created/updated where applicable, AI-extraction state) — the timeline is a projection, never canonical storage (§8.2)
- [x] Events are projected server-side under org RLS from real records only (patient record + invitations) — no invented clinical history (§27, Phase-5 precedent)
- [x] The phase's own source docs the type-vocabulary gap honestly: clinical event kinds (visit, medication, lab…) arrive with their phases; lifecycle events render as themselves, never relabelled as clinical events
- [x] The timeline renders through React (data → SVG JSX) with D3 owning scale/positioning/tick math — no `static` drawing, no second charting library (TL-01, §8.1)
- [x] Axis renders the reference grammar: hairline axis line, month dividers, month labels, event nodes; inactive nodes light with soft shadows (§5)
- [x] Empty state is deliberate ("No timeline events yet", one line of what will appear, one next step) — no fabricated nodes, axis marks or dates
- [x] Band still owns its states: skeleton on suspension, error with retry, no blank panel (§24)
- [x] Deterministic pure helpers (`buildTimeScale`, `monthTicks`, event sort) are unit-tested with fixed fixtures; render proof asserts a node per projected event at the scaled position

**Gate evidence at close:** TL-01, TL-02 (architecture half) · QA rows 1, 8 (partial) · INV-01, INV-03, INV-13, INV-14

## Comments

### 2026-10-09 — resolved

- **Where:** `src/lib/timeline/events.ts` (CareEvent union = §8.2 clinical kinds + the four
  lifecycle kinds real today; `projectCareEvents` pure, adds no I/O),
  `src/lib/timeline/scale.ts` (`buildTimeScale`, `eventDomain`, `monthTicks`,
  `nodeX` — all pure, all UTC),
  `src/components/timeline/ClinicalTimeline.tsx` ('use client' island: measures
  width, renders scale-derived SVG: 1px `stroke-border-subtle` axis + month
  dividers, month labels (year in January's place), one node per projected
  event, `role="img"` + real summary), `TimelineBand` now wraps it (frame +
  heading only), `OverviewBody` projects `projectCareEvents(patient, invites)`
  server-side.
- **Extension seam documented in-file:** phases 007–010 each add a mapper
  pushing clinical kinds into the same union; engine/zoom/scrubber/branches
  are downstream of the model and never change.
- **Decision worth owner awareness:** until the diff-reading audit trail is
  authorized for staff roles (05-VERIFICATION §5 item 1), the projection
  carries patient-row lifecycle + invite events. Nothing clinical is invented
  to fill the axis (§27) — the timeline reads sparse for now, which is the
  truthful state.
- **Bug caught by the unit proof:** `timeMonth` (local-time interval) shifted
  the month lattice with the viewer's timezone (05-31T21:00Z instead of
  06-01T00:00Z at +03). Switched to `utcMonth` — instant-exact lattice, no
  SSR/client or geography-dependent axis.
- **Tests:** `timeline-events.test.ts` (projection contract, provenance,
  determinism, closed vocabulary), `timeline-scale.test.ts` (domain, scale
  range, 17-month lattice, determinism, geometry constants),
  `timeline-render.test.tsx` (node-per-event, lattice classes, aria summary,
  honest empty, frame) + the phase-5 band test updated for the real band.
  451/451 full suite; tsc 0; token lint 0; build exit 0.
