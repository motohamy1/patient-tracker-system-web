# 08-01: Medications schema with a lifecycle history (CDSS-ready, no decisions)

**What to build:** A medications table holding the current state (structured dose/frequency/route/duration) plus a medication-events history table that records every lifecycle transition. The structure is ready for future interaction checking and vocabulary normalisation — without any decision-making logic.

**Blocked by:** None (can start immediately; sequenced after Phase 7 by the roadmap)

**Status:** resolved

- [ ] `public.medications`: `org_id`, `patient_id`, `name`, structured `dose_amount` (numeric) + `dose_unit`, `frequency`, `route`, `started_at`, `stopped_at`, `status` (`active`/`paused`/`stopped`), `rxnorm_code` (nullable, normalisation-ready), provenance (`source`, `created_by`, `updated_by`, `created_at`, `updated_at`) — §13/§23
- [ ] `public.medication_events`: `medication_id`, `org_id`, `patient_id`, `kind` (`started`/`changed`/`paused`/`resumed`/`stopped`), `at`, `detail` (structured before/after snapshot), actor + created_at — the history MED-02 projects and MED-03 keeps queryable
- [ ] Structured, not a blob: dose is numeric + unit; frequency and route are closed, documented vocabularies in one declaration mirrored in TypeScript
- [ ] RLS: staff-only, org-scoped through `private.user_org_role`; no delete; no second membership reader
- [ ] Both tables audit-recorded (before/after diff) and `patients.last_activity_at` bumps on change
- [ ] Timestamps, actors and the `status`/history consistency are server-owned (triggers), never trusted from the client
- [ ] CDSS-readiness recorded in-file: structured fields exist; NO interaction/contraindication decision logic anywhere (§27, MED-03)
- [ ] `database.types.ts` gains both tables (hand-maintained until CLI regeneration against cloud Supabase)

**Gate evidence at close:** MED-01 schema half · MED-03 · §13/§23 · AUTH-02/03/04
