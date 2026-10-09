# 13-02: Patient Home surface

**What to build:** The patient's Home — the same design language at lower density: Today's Care, Next Action, Medications, Appointments, Health Snapshot, Quick Log, Care Plan, Documents, and a Communication region that is honestly empty until messaging exists. Every region shows real data or an honest empty state; nothing is fabricated to fill space.

**Blocked by:** 13-01 (the substrate)

**Status:** resolved

- [ ] Home renders from the patient's own resolved record: today's visits, the next scheduled appointment, active medications (read-only), their recent observations and recent lab results, their documents (filenames + kinds), and the follow-up text their care team recorded on visits
- [ ] Region ordering and copy follow the reference's patient grammar: no dense tables, no clinical jargon a patient should not have to decode, no invented urgency
- [ ] Each region degrades on its own: a failed read empties that region with its own quiet state, never blanking the page (§24 region states)
- [ ] Communication region renders the shared honest-empty pattern (no messaging exists yet — it arrives with the Communication phase)
- [ ] Density is genuinely lower than the provider workspace (§14): fewer regions per row, larger touch targets, short copy — while every primitive, token and motion rule is the shared one (§26 mobile: single column)
- [ ] Zero gamification: no points, levels, streaks, progress bars masquerading as scores, celebration copy (§14/§27) — checked region by region

**Gate evidence at close:** PTH-01 (the nine regions) · PTH-03 · §14 · §24 · §26

## Notes

- The patient sees the same clinical facts the provider's workspace shows for them, at a lower density — one design language, two densities. A patient never sees provider-only regions (timeline engine, AI insights, intake tooling).
- Documents show filenames and kinds; the media pipeline and download affordances are the provider-side storage path, and the patient list is the honest read.
