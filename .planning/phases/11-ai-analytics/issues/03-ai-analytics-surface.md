# 11-03: AI Analytics surface with review lifecycle

**What to build:** The AI Analytics tab a clinician actually works in: the real tab body replacing the Phase-2 shell placeholder. Insights grouped by kind, each showing its provenance and an explicit unreviewed/reviewed state, the evidence records it came from (links to the owning tab/record), and Accept / Dismiss review actions that record the reviewer's identity. Plus the generate/refresh control.

**Blocked by:** 11-02 (the generator)

**Status:** resolved

- [ ] Tab page renders from stored insights only — no client-side generation, no fabricated content when none exist (deliberate empty state)
- [ ] Grouped by kind (change / summary / attention / trend / documentation gap) with the tone of the design system (subtle semantic accents, no saturated rainbow)
- [ ] Every insight shows provenance and review state distinctly: `AI-generated`/`system-derived` badge + "Unreviewed" vs "Accepted by <name>" / "Dismissed by <name>" — an unreviewed insight can never read as clinician-verified (AI-02, §23)
- [ ] Evidence list per insight links to the real records (visit, medication, lab result…) via the workspace tab hrefs
- [ ] Accept / Dismiss server actions record `reviewed_by`/`reviewed_at` + `verification` transition, audit-logged; dismissed insights stay visible in a quiet dismissed state (never silently deleted)
- [ ] Generate / refresh action runs the server-side generator; loading state while generating; failure state with retry
- [ ] All four staff roles can read (org-scoped); the generate control is shown only where the role may generate (`provider_doctor`); a role without the tab gets the standard denial surface
- [ ] Window controls for time-scoped insight kinds where meaningful (recent vs last period)
- [ ] Overview integration: the attention insights surface a compact strip on the Overview command surface, linking to this tab
- [ ] Responsive: desktop dense grid; mobile single column with the same review actions (§26)

**Gate evidence at close:** AI-01 (surface) · AI-02 (visible provenance + review) · WSP-02 (Overview linkage) · §26 responsive

## Notes

- This tab is assistive: the copy and layout must read as observations awaiting judgment, not as a diagnostic verdict panel. No red "diagnosis" styling anywhere.
- The dismissed state is part of the audit story: a dismissal is a decision, and it is attributable.
