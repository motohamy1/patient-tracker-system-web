# 10-01: Allergies + genetics schema with role-based visibility (sensitive categories)

**What to build:** Two clinical tables with strong provenance and — the phase's core requirement — DATA-LAYER role visibility: allergies visible to all staff (safety-critical), genetics restricted to the roles authorized to see it. The restriction lives in RLS, mirrored by a capability so the UI can show a truthful denial instead of an empty list.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `allergies`: `allergen`, `reaction`, `severity` (closed vocabulary), `status` (active/resolved), `noted_at`, `notes`, provenance (`source`, `verification`, creators, timestamps) — §13/§23
- [ ] `genetics`: `kind` (variant / pharmacogenomic / hereditary-condition / other), `gene`, `variant`, `interpretation`, `significance` (closed ACMG-style vocabulary), `reported_at`, optional `document_id` (report), provenance
- [ ] `verification` is a real column (`clinician-verified` / `ai-extracted`) so AI-extracted data can never be indistinguishable from clinician-verified (§23) — reserved for Phase 12's OCR, default `clinician-verified` for manual entry
- [ ] **RLS visibility:** allergies select for all four staff roles; **genetics select for `provider_doctor` + `admin_owner` only**; writes gated on `CAN_AUTHOR_CLINICAL` via a definer guard; no delete
- [ ] `CAN_VIEW_GENETICS` added to the capability map (D-09) EXACTLY mirroring the genetics RLS policy, so the UI denial and the data layer can never disagree
- [ ] Org integrity on insert/update; `patients.last_activity_at` bumps; audit diffs (0003 pattern)
- [ ] `database.types.ts` gains both tables (hand-maintained until CLI regeneration)

**Gate evidence at close:** ALG-01/02/03 foundation · §12 (data-layer authz) · §23 · AUTH-02/03/04

## Notes

- The genetics role set is a **sensitive-category default** brought to the owner gate (10-VERIFICATION): nurse read access is the open question.
- Timeline projection is OUT of scope for Phase 10 (ALG-01..03 name record/view + visibility, not the timeline) — recorded so it is a decision, not an omission.
