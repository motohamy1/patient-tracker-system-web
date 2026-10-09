# 14-01: Care tasks + completions substrate

**What to build:** A provider can assign a small, concrete care task to a patient (a measurement to take, a medication to remember, a follow-up to keep), and a patient's completions of it are recorded as an append-only history — never an editable status someone can quietly rewrite.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `care_tasks` table: org/patient FKs, `title`, `detail` (optional), `kind` closed vocabulary (`measurement`, `medication`, `appointment`, `follow-up`, `other`), `due_at` (nullable), `status` (`active` | `archived`), provenance (creator, timestamps) — §13/§14
- [ ] `care_task_completions` table: org/patient/task FKs + the completing `user_id`, `note` (optional), `completed_at`, `source` (`patient` | `staff`) — append-only: NO update, NO delete grant, ever
- [ ] RLS: staff read both tables; `care_tasks` INSERT/UPDATE provider_doctor only (CAN_AUTHOR_CLINICAL); `care_task_completions` INSERT patient-self-only (the row's patient re-derived from `auth.uid()` by the guard, the 0012 pattern) — a patient completes their own task or nothing
- [ ] Task↔completion integrity: a completion must reference a task in the same patient/org (guard trigger)
- [ ] Audit triggers (0003 pattern) on both tables
- [ ] `database.types.ts` gains both tables (hand-maintained until CLI regeneration)

**Gate evidence at close:** TASK-01/02 foundation · §12 · §14 · AUTH-07

## Notes

- The pair (assignable task + append-only completion log) is the honest shape for adherence: a completion is a recorded event with an actor and a timestamp, not a mutable checkbox that can be flipped without a trace.
- Staff-recorded completions are a documented non-goal of this phase (the completion source stays `patient`); if the owner wants "recorded with the patient during a visit", the guard gains one branch — recorded as a decision, not an omission.
