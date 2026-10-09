# 14-02: Task authoring + the completion action

**What to build:** The two actions the workflow needs: a provider assigns a care task (and can archive one), and the patient marks a task done — recorded with their identity and the moment they say it happened. Adherence is derived from the completion log, never stored as a score.

**Blocked by:** 14-01 (the substrate)

**Status:** resolved

- [ ] `assignCareTaskAction`: validated input (title, detail, kind, due date), CAN_AUTHOR_CLINICAL, patient verified in the org; the task is stored `active` with clinician provenance
- [ ] `archiveCareTaskAction`: the provider's retirement path — the task leaves the active list without erasing its completion history (a completed task is evidence)
- [ ] `completeCareTaskAction`: the patient's write — requires the patient capability, resolves the patient from the verified session, requires the task to belong to them and be `active`; the guard re-derives the patient from `auth.uid()`; `completed_at` is the patient's stated moment, separate from `created_at`
- [ ] Derived adherence helpers (pure functions): completion count per task, most recent completion, and a "due" signal when `due_at` has passed with no completion since — no stored score, no streak
- [ ] Idempotence discipline: the same patient completing twice on the same day records two events (that is the honest history); the UI never double-submits (pending state)
- [ ] All actions re-check capabilities server-side and revalidate the patient Home and the provider Overview

**Gate evidence at close:** TASK-01 (completion tracking) · TASK-02 (activity) · AUTH-05/07 · §14

## Notes

- Adherence lives in the log, not in a column: "Logged 3 times · last on 12 Oct" is the honest sentence, and it is what both surfaces show.
