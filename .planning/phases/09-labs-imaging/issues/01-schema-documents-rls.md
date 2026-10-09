# 09-01: Labs + imaging schema, documents/media, provenance and RLS

**What to build:** The relational substrate for labs and imaging: lab orders + results, imaging orders + results, and the documents table their media relationships point at, each with provenance, audit participation, org-scoped RLS, and DB-owned lifecycle consistency (a result marks its order resulted).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `lab_orders` (`name`, `ordered_at`, `status` ordered/resulted/cancelled, `notes`, `document_id`) and `lab_results` (structured `analyte`, `value` numeric, `unit`, `reference_range`, `flag` normal/low/high/critical, `resulted_at`, `document_id`) — §13/§23
- [ ] `imaging_orders` (`modality`, `body_site`, `ordered_at`, `status`, `notes`) and `imaging_results` (`impression`, `resulted_at`, `document_id`)
- [ ] `documents` (kind, `storage_path`, filename, mime, size, provenance) with a private Storage bucket and org-scoped object policies so media survives with its record (§19 Ph009 "document/media relationships")
- [ ] Inserting a result sets its order's `status = 'resulted'` in the same statement (DB trigger) — the lifecycle cannot drift
- [ ] Provenance on every row (`source`, creators, timestamps, verification-ready) and audit diffs (0003 pattern)
- [ ] RLS: staff-only, org-scoped through `private.user_org_role`; results are insert-only (clinical facts are not edited); no delete anywhere
- [ ] `patients.last_activity_at` bumps on record change
- [ ] `database.types.ts` gains all five tables (hand-maintained until CLI regeneration)

**Gate evidence at close:** LAB-01/LAB-02 foundation · §13/§23 · AUTH-02/03/04
