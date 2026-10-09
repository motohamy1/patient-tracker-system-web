# 07-01: Visits schema, provenance and RLS (the encounter table)

**What to build:** The relational encounter record the whole visit workflow stands on: a `visits` table for one patient in one organization, carrying the Pre/Dur/After stage, scheduling fields, clinical documentation fields and follow-up fields, with full provenance (creator, updater, created/updated, source), audit participation, and org-scoped RLS. Column-level grants keep `org_id`/`patient_id`/creator/updater immutable from the app; timestamps and authors are trigger-owned.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `public.visits` exists with `org_id`, `patient_id` (FK patients, cascade), `stage` closed vocabulary (`pre_visit`, `during_visit`, `after_visit`), scheduling (`scheduled_at`, `visit_type`, `location`), documentation (`reason`, `documentation`), follow-up (`follow_up`, `follow_up_at`), and provenance (`source`, `created_by`, `updated_by`, `created_at`, `updated_at`) — §13, §23
- [ ] The acting user's identity is trigger-owned from `auth.uid()`; the app never writes creator/updater/timestamps (0005 discipline)
- [ ] The visit is never a JSON blob: every queryable field is a real column (§13)
- [ ] RLS: staff-only select/insert/update, org-scoped through `private.user_org_role` (no second membership reader); no delete policy/grant
- [ ] `patients.last_activity_at` bumps when a visit is created or changed (activity follows the record, 0005 D-22 pattern)
- [ ] An audit trigger records insert/update with the before/after diff (0003 pattern), entity `visits`
- [ ] `database.types.ts` gains the `visits` table contract (hand-maintained until the CLI regenerates against cloud Supabase — noted in the file)
- [ ] Migration number continues the series (`0006_visits.sql`) and is idempotent-safe for the cloud apply

**Gate evidence at close:** §13/§23 provenance · AUTH-02/03/04 · 0005/0003 patterns reused · pgTAP/policy tests deferred (no DB this session)

## Notes

- No `session_replication_role` in app or migration — that bypass stays in `supabase/seed.sql`.
- Patient self-read of their own visits is deferred to the patient-experience phase (13); today's workflow is staff-only.
