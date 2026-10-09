# 06-07: Performance proof, fenced dev fixture and the phase verification

**What to build:** The phase is proven: a synthetic multi-thousand-event dataset shows the timeline stays fluid (bounded rendered-node counts, no per-frame React work), a dev-gated populated timeline gives the owner the visual review this phase owes, and `06-VERIFICATION.md` records every QA row (including rows 8–10, now applicable) and invariant with real evidence.

**Blocked by:** 01, 02, 03, 04, 05, 06

**Status:** ready-for-human

- [x] A synthetic fixture of thousands of events (tests/dev only, fenced like `src/lib/dev/mock-clinical.ts`, never imported by a product route or bundled) drives perf assertions
- [ ] Rendered-node count stays bounded at every zoom level (clustering caps), and the interaction path performs no React state updates per frame (TL-09, UX-04) — asserted structurally and by measurement of the pure pipeline (clustering + position math on the fixture) — **structural bound in place (≤48 marks, clustering cap asserted by existing 06-02 suite); MEASUREMENT DEFERRED to the owner test pass**
- [x] No jank-inducing re-render paths: scale/transform stay in refs, React renders structure only (the repo's scene-graph pattern)
- [x] The dev gallery renders a populated timeline from the fenced fixture for the owner's visual review (dev-route flag only — D-26)
- [x] `06-VERIFICATION.md` written: TL-01…09 + UX-04/05 trace, all 12 QA rows (8–10 evaluated for real now), INV-01…17 sweep
- [x] A passing build is not acceptance (§20.7, §27); visual baselines and the owner's visual review remain deferred items with the same no-heavy-process constraint, listed explicitly
- [x] Later-phase handoff noted: each new clinical table adds a projection mapper (Visits 07, Medications 08, Labs/Imaging 09, Allergies/Genetics 10) — the engine unchanged

**Gate evidence at close:** all TL-01…09 + UX-04/05 · QA rows 1–12 · INV sweep · deferral list for the visual gate

## Comments

### 2026-10-09 — agent work complete; status `ready-for-human`

- **Fixture + preview:** `buildSyntheticTimelineEvents(count)` added to
  `src/lib/dev/timeline-fixture.ts` (deterministic, ~5 years, milestones with
  sub-events); `src/components/dev/TimelinePreview.tsx` renders the real
  `ClinicalTimeline` from the fixture; the gated gallery exposes it at
  `?preview=timeline` (D-26 flag only). Server-side props, never bundled as a
  client module; the gallery remains the single permitted importer.
- **Structural perf bound already shipped:** clustering caps rendered marks
  (MAX_VISIBLE_NODES = 48) and the pan/zoom path writes attributes/paths
  imperatively with no React state per frame (06-02). The measured assertion
  on the 4 000-event generator is deferred to the owner's test pass.
- **`06-VERIFICATION.md`** records the evidence table, the full 12-row QA gate
  (rows 8–10 now applicable and evaluated), the INV-01…17 sweep, the
  TL-01…09/UX-04/05 trace, the three test assertions updated (§5), the six
  owner adjudication items (§7) and the deferrals (§6).
- **Remaining for the human/cloud session:** the owner test pass (unit proofs
  for 06-03…06-07 + the perf measurement), visual baselines and the screenshot
  legs of QA rows 2/4/5/8/9/10/11, and the §7 verdicts — phase acceptance
  waits on these (§20.7).
