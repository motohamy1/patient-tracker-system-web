---
phase: 04-provider-home-patient-folder-workspace
plan: 01
subsystem: patients-data-substrate
tags: [patients, rls, mrn-trigger, trgm-search, redeem-invite, capabilities]
requires:
  - Phase 03 local Supabase stack + migrations 0001-0004 (definer helper, audit pattern, redeem_invite)
provides:
  - public.patients table (D-23 columns + trigger-owned mrn_seq/mrn + generated search_text)
  - private.assign_patient_mrn (advisory-locked per-org MRN-0001.. sequencing, D-07)
  - private.touch_patient_timestamps (updated_at/last_activity_at trigger-owned, D-22)
  - private.invitation_patient_link (org-integrity guard + invite-sent bump)
  - invitations.patient_id + redeem_invite auto-connect (patientLinked, D-03/D-04)
  - org-scoped RLS: staff-or-self select, staff insert (user_id null), staff update with check, no delete
  - pgTAP suite 0005 (18 assertions) + database.types.ts regeneration
  - src/lib/patients/status.ts (D-09/D-10 vocabulary mirror) + CAN_MANAGE_PATIENTS capability
affects:
  - 04-02 (listPatients + mutations typecheck against the regenerated types)
  - 04-03/04-04 (folder card status tokens + capability-gated UI)
  - 04-05 (seed's session_replication_role=replica contract)
tech-stack:
  added: ["pg_trgm extension (GIN trigram index)"]
  patterns: ["BEFORE-INSERT advisory-locked sequence", "generated search_text column (immutable expression only)", "column-level grants + RLS double layer", "create-or-replace definer extension"]
key-files:
  created:
    - supabase/migrations/0005_patients.sql
    - supabase/tests/0005_rls_patients.test.sql
    - src/lib/patients/status.ts
    - tests/unit/patient-schema.test.ts
  modified:
    - src/lib/auth/capabilities.ts (CAN_MANAGE_PATIENTS: 4 staff roles; patient set unchanged)
    - tests/unit/auth-capabilities.test.ts (expected map + drift rows)
    - src/lib/supabase/database.types.ts (regenerated, names patients)
decisions:
  - Generated-column expression empirically corrected against the live engine: to_char is not immutable and lower() cannot resolve a collation inside a generated column, so the DOB segment is composed from extract() parts and case folding is left to ILIKE at query time (04-RESEARCH Pitfall 4 amendment, recorded here).
  - mrn_seq carries DEFAULT 0 solely so NOT NULL passes before the BEFORE trigger overwrites it; the pgTAP overwrite proof (case d) and the unique (org_id, mrn_seq) backstop make a client-supplied value impossible to honor.
  - Column-level grants: user_id/org_id/mrn not insertable/updatable by app clients (user_id insert granted ONLY to prove the 42501 denial); the link is minted only by redeem_invite (definer).
  - invitations.patient_id carries an org-integrity guard in the AFTER trigger (invite can only link a patient of its own org) — defense beyond the FK.
  - pgTAP fixture isolation: suite 0005 uses its OWN org UUIDs (10000000/20000000-…), so the seeded 1f000000-… clinic rows never perturb the MRN-0001 assertions; verified green against the seeded DB.
verification:
  - supabase db reset (0001..0005) exit 0
  - supabase test db: Files=5, Tests=57, PASS (0005 contributes 18)
  - supabase gen types typescript --local exit 0; all five tables named
  - npx vitest run tests/unit/patient-schema.test.ts tests/unit/auth-capabilities.test.ts: 22 passed
  - npm run lint: exit 0
---

# 04-01 Summary — patients data substrate

Complete and verified: schema (D-01/D-21/D-23), trigger-owned MRN + timestamps
(D-07/D-22), indexed search projection (D-17/UX-07), org-scoped RLS with
patient-self read (AUTH-02/04, D-03), patient-linked invite auto-connect
(D-04), audit trigger (D-14 extension), capability + status vocabulary with
drift tests (D-09/D-10). Every claim above is backed by the commands in
`verification:`.
