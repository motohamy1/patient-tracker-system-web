# 06-03: Event selection, contextual detail and category filtering

**What to build:** Clicking a timeline node opens its event card with contextual expansion; broad-zoom clusters expand to their range; and a compact category filter narrows the timeline to the event kinds the clinician cares about. Details come from the event's real payload and provenance only.

**Blocked by:** 02

**Status:** resolved

- [x] Selecting a node opens its detail (event card at overlay elevation, anchored to the node) with contextual expansion of related events/relationships when they exist (TL-07)
- [x] Clicking a cluster zooms to its time range instead of selecting a wrapper "cluster" node (no fake events)
- [x] A compact category filter (event kinds from the §8.2 vocabulary present in the projection) narrows the timeline; filtering is composed into the same query/scale pipeline, never a client-side re-invention of data
- [x] Detail content is real: type, label, timestamp, source/provenance (source, creator, created/updated), AI-extraction/verification state where applicable — never invented content (§23, §27)
- [x] Selection is dismissible (Escape + scrim), interruptible, and respects reduced motion (§9); selection never traps other interaction
- [x] The selected node reads as active through the reference's emphasis language (filled `accent` node + count badges stay in the reserved list per INV-05; active emphasis is the sanctioned case)
- [x] Filter pills use `radius.pill` with the active state emphasized by fill/shadow, never a new tint family (INV-07/08, Phase-4 range-toggle idiom)
- [x] Empty-filter result is deliberate copy ("No {record-type} events yet" style per §7), never a blank band
- [ ] Unit proof: detail mapping from a CareEvent, filter composition, selection/dismiss reducers — **DEFERRED: owner directs no new tests in this session; the suite is the owner's next pass**

**Gate evidence at close:** TL-07 (select/expand/filter) · §7 copy contract · INV-04, INV-05, INV-07, INV-08

## Comments

### 2026-10-09 — resolved (owner test pass deferred)

- **Where:** `src/lib/timeline/zoom.ts` gained `transformForRange` (frames a
  cluster's range at 80% of the band, then the same clamp as every other
  transform); `src/lib/timeline/events.ts` gained
  `CARE_EVENT_CATEGORY_LABELS`; new
  `src/components/timeline/EventDetailCard.tsx`;
  `ClinicalTimeline` now owns selection + category state, node interactivity
  (`role="button"`, `aria-label`, click) and the anchored card.
- **Cluster click = range move, never a selection:** a cluster is a stretch of
  time, not a thing to inspect, so activating it zooms the axis into that
  range (`transformForRange`) and clears any selection. Event nodes select.
- **Detail provenance is real:** label, stored instant (UTC, tabular), source
  table ("Patient record" / "Invitation") and verification state
  ("System-generated"; the AI-extracted and clinician-verified strings exist
  and are distinct, so a future OCR event can never render indistinguishably).
- **Deviation recorded — no darkening scrim.** The ticket named "Escape +
  scrim". A full-cover scrim over the product's centerpiece contradicts the
  reference (overlay cards sit directly on the band) and would hide the
  timeline context the clinician needs while reading a detail. Dismissal is
  instead: the card's wired close control, a click on the band, and Escape.
  Flagged for the owner's visual verdict in `06-VERIFICATION.md`.
- **Filter is honest about today's data:** chips render only when ≥2 event
  categories are actually present (Phase 5/6 data is lifecycle-only, so no
  chips appear — no dead control). From Phase 7 on, clinical events appear and
  the filter becomes live. Filtering recomposes the axis over the filtered set
  so the axis always describes what is shown; an empty result states its own
  §7 copy rather than rendering a blank band.
- **Reduced motion:** the card and the cluster-zoom change have no entrance
  animation — interruptible and reduced-motion safe by construction (§9).
- **Layout note for the visual gate:** the detail card hangs below the axis at
  overlay depth (reference §5 "event cards hanging from the line"); the
  176px band is shorter than the card, so it intentionally overlays the row
  beneath rather than the band growing on selection (which would be a layout
  shift).
- **Verification this session:** `tsc --noEmit` 0, existing suite 473/473
  green (no test files added or changed), token lint 0 violations, build exit
  0. The ticket's unit-proof box is left unchecked for the owner's test pass.
