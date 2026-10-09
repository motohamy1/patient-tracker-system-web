# 06-03: Event selection, contextual detail and category filtering

**What to build:** Clicking a timeline node opens its event card with contextual expansion; broad-zoom clusters expand to their range; and a compact category filter narrows the timeline to the event kinds the clinician cares about. Details come from the event's real payload and provenance only.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Selecting a node opens its detail (event card at overlay elevation, anchored to the node) with contextual expansion of related events/relationships when they exist (TL-07)
- [ ] Clicking a cluster zooms to its time range instead of selecting a wrapper "cluster" node (no fake events)
- [ ] A compact category filter (event kinds from the §8.2 vocabulary present in the projection) narrows the timeline; filtering is composed into the same query/scale pipeline, never a client-side re-invention of data
- [ ] Detail content is real: type, label, timestamp, source/provenance (source, creator, created/updated), AI-extraction/verification state where applicable — never invented content (§23, §27)
- [ ] Selection is dismissible (Escape + scrim), interruptible, and respects reduced motion (§9); selection never traps other interaction
- [ ] The selected node reads as active through the reference's emphasis language (filled `accent` node + count badges stay in the reserved list per INV-05; active emphasis is the sanctioned case)
- [ ] Filter pills use `radius.pill` with the active state emphasized by fill/shadow, never a new tint family (INV-07/08, Phase-4 range-toggle idiom)
- [ ] Empty-filter result is deliberate copy ("No {record-type} events yet" style per §7), never a blank band
- [ ] Unit proof: detail mapping from a CareEvent, filter composition, selection/dismiss reducers

**Gate evidence at close:** TL-07 (select/expand/filter) · §7 copy contract · INV-04, INV-05, INV-07, INV-08
