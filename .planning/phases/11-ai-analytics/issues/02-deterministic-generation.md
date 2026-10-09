# 11-02: Deterministic insight generation

**What to build:** A server-side generator that reads the patient's real clinical records (visits, medications, labs, imaging, allergies — everything the workspace already loads) and produces the §10 priority questions as stored insights: what changed, what matters, what is new, what needs attention, recent-history and last-period summaries, notable trends, and missing follow-up/documentation. Every insight names the exact records it came from. Nothing is guessed; where the record is thin, the insight says so instead of inventing.

**Blocked by:** 11-01 (the insights substrate)

**Status:** resolved

- [ ] Pure generator functions over already-loaded records (no extra I/O, deterministic): same input → same insights; the projection philosophy of `src/lib/timeline/events.ts` applies — an insight renders only what the stored record actually shows
- [ ] **Change detection**: new or changed activity in a recent window vs the prior window (new lab results, medication starts/changes/stops, resolved allergies, new visits), each citing its evidence rows
- [ ] **Summaries**: "recent history" and "last period" summaries as structured counts and lists (visits, active medications, resulted labs, new allergies) — descriptive, never diagnostic
- [ ] **Attention signals**: facts that need a human look — abnormal/critical lab flags, follow-up dates that have passed without a subsequent visit, severe active allergies, visits still open past their date — each with its evidence
- [ ] **Trend interpretation**: same analyte measured multiple times → direction and values (numeric, from stored values only; no extrapolation, no thresholds beyond the record's own flags)
- [ ] **Documentation gaps**: permitted-by-role observations about missing fields (e.g. a visit with a follow-up date but no documentation), phrased as observations with evidence
- [ ] Writes insight rows via the substrate (pending review, `system-derived`, `ai-extracted`); regeneration replaces the patient's still-pending insights so the tab never accumulates duplicates, while reviewed ones stay untouched
- [ ] No autonomous diagnosis or prescribing anywhere in the generator or its copy: every output is an observation about the record, phrased to require clinician judgment (AI-03, §27)

**Gate evidence at close:** AI-01 (the five capability families) · AI-02 (every output carries provenance + review state) · AI-03 · §10

## Notes

- Deterministic-by-design: no LLM call in this ticket. The architecture (stored insights with evidence) is what makes a later model-backed generator swappable without UI change — same table, `provenance = 'ai-generated'`.
- Copy contract: sentence case, calm, clinician-facing (§7). Titles are findings ("Three new lab results"), never directives ("You should…").
