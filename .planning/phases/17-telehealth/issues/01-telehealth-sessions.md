# 17-01: Telehealth sessions — the consultation record under the visit

**What to build:** The telehealth session table bound to the existing visit: an appointment becomes a consultation, and the session carries its own status, the rejoin reference, and an honest transport state. The video transport is a record of intent, never a simulated connection.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `telehealth_sessions` table: org/patient/visit FKs (the visit is the appointment — one row per consultation), `status` (`scheduled` | `in_progress` | `completed` | `cancelled`), an opaque unique `join_token`, `transport` (`not_configured` | `connected`) + `transport_reference`, `cancellation_reason`, `started_at`/`ended_at`, trigger-owned provenance
- [x] One ACTIVE session per visit (unique partial index on `visit_id` where status in scheduled/in_progress) — a second consultation on the same appointment is refused, not queued
- [x] Guard: the visit must exist in the same org and belong to the same patient; only `provider_doctor` (CAN_AUTHOR_CLINICAL holders, mirroring 0006) may write; transitions follow the closed vocabulary (scheduled→in_progress sets started_at, in_progress→completed sets ended_at, either→cancelled requires a reason and sets ended_at) — a skip or a repeat is refused
- [x] RLS: select self-or-staff (`can_read_own_patient_row`, 0014's pattern — the patient must see their own consultation), insert/update doctor-only, no delete grant, audit trigger (0003 pattern)
- [x] `database.types.ts` gains `telehealth_sessions`

**Gate evidence at close:** TH-01 (start from an appointment) · TH-03 (documented into the same visit model — the FK IS the claim) · §12 · §15

## Notes

- The transport defaults to `not_configured` on purpose: no video provider credentials exist in this workspace, and §27 forbids simulating one. The surface states it plainly.
