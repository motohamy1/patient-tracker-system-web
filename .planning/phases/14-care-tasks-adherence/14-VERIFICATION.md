# Phase 14: Care Tasks / Adherence — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
14-01…14-04 under `.planning/phases/14-care-tasks-adherence/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, **no new tests** (the
owner runs the test pass per step). Migration 0013 is written and reviewed but not executed
here; RLS behaviour is deferred to the cloud apply.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 184 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (no test change needed this phase) |
| Build | `npm run build` | **exit 0** |
| Migration | `supabase/migrations/0013_care_tasks.sql` | written (0003/0005/0012 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `care_tasks` + `care_task_completions` added by hand |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — the region is the shared card grammar on both surfaces (patient Home and provider Overview). |
| 2 | Color relationships | **PASS (screenshot deferred)** — no borders; the only tonal use is the "Past due" warning dot and the "Done today" success dot on Pills (label carries the meaning). |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — one task per line with a kind and an adherence line; no oversized cards. |
| 5 | Card proportions | **PASS** — the region sits at full width on both surfaces, in the existing flow. |
| 6 | Pill controls | **PASS** — verb-first buttons ("Assign a task", "Mark done"), inset fields in the overlay, 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — `text-label/body`; dates and the adherence line `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged; tasks are not clinical events and do not project onto the timeline — §8.2 scope, see §6).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent; the closed Pill family only. |

## 3. Invariants

INV-01/03 (token lint 0, 184 files) · INV-02 (no chrome) · INV-04 (closed kind/status
vocabularies) · INV-05 (no accent) · INV-06 (**the phase's central invariant — checked line
by line: no points, levels, streaks, progress scores, fireworks, congratulatory or
manufactured-urgency copy anywhere**) · INV-07/08/09 (radii) · INV-10 (spacing steps) ·
INV-11 (no decorative rules) · INV-12 (cards ≥2 lines) · INV-13/14 (shadow-raised/overlay
only) · INV-15/16 (no card borders) · INV-17 (no glass/scrim). **All PASS.**

## 4. Requirement traceability (TASK-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **TASK-01** the patient tracks care tasks with subtle adherence feedback | 14-01, 14-02, 14-03 | `care_tasks` (assignable, provider-authored) + `care_task_completions` (append-only, patient-self-only). The patient Home's Care tasks region shows each task with its adherence line — "Logged 3 times · last on 12 Oct" — and a one-tap "Mark done". Adherence is DERIVED from the log (`adherence.ts`, pure, clock-injected); no score, streak or level is stored or displayed. |
| **TASK-02** providers see care-task activity in patient context | 14-02, 14-03 | The provider's patient Overview gains the same region reading the SAME rows through the same loader (`load.ts`), so the two surfaces cannot disagree: each active task with its count, last completion, past-due marker, and the assign/archive controls for authors. |
| **TASK-03** no gaming-heavy patterns | 14-01, 14-03 | The adherence display is a count and a date; the completion control is a verb; nothing animates, celebrates, or counts streaks; the "Done today" state is a calm Pill, not a reward. §27 checked row by row at the gate. |

**Role matrix (0013):**

| Role | Assign / archive tasks | Mark a task done | Read tasks + completions |
|---|---|---|---|
| provider_doctor | ✅ (policy + guard) | ❌ (completions are patient-self) | ✅ |
| nurse | ❌ | ❌ | ✅ (staff SELECT) |
| receptionist | ❌ | ❌ | ✅ (staff SELECT) |
| admin_owner | ❌ | ❌ | ✅ (staff SELECT) |
| patient | ❌ | ✅ (policy + guard + capability, self only) | ✅ (self-or-staff) |

## 5. Schema decisions reported

- **Append-only completions**: no UPDATE or DELETE grant exists on
  `care_task_completions` — a completion is a recorded event with an actor, not a mutable
  checkbox (§14's honesty requirement; the §18 "never claim saved while only local" sibling
  in spirit).
- **Staff-recorded completions are a documented non-goal** of Phase 14 (the completion
  `source` stays `patient`); if the owner wants "recorded with the patient during a visit",
  the guard gains one branch — recorded as a decision, not an omission.
- **No timeline projection**: a care task is not a clinical event; the timeline stays the
  §8.2 projection of stored clinical records.

## 6. Out of scope (recorded as decisions, not omissions)

- **Scheduling/recurrence on tasks**: a task has an optional due date, not a recurrence
  rule — inventing schedules would invent adherence.
- **Notifications/reminders**: outside the phase's scope.
- **Task templates or libraries**: the provider writes the task each time.

## 7. Deferred (owner constraints)

- Migration 0013 apply + pgTAP execution (doctor-only authoring, patient-self-only
  completion, integrity to the task's patient/org, append-only proofs, org isolation).
- `database.types.ts` regeneration via the CLI.
- No new tests — the owner's unit/acceptance pass (the adherence derivation is pure and
  built for it: `adherenceFor(tasks, completions, now)`).
- Visual baselines + screenshot legs on both surfaces.

## 8. Owner design-gate brief

1. **The adherence line** ("Logged 3 times · last on 12 Oct") and the near-absent feedback
   model. *Ask:* confirm, or ask for a bounded progress element that never reads as a score.
2. **Who may assign**: provider_doctor only. *Ask:* add the nurse?
3. **Past-due signal** is a warning-tinted Pill "Past due", shown when a due date passed
   with no completion since. *Ask:* confirm the wording.
4. **Staff-recorded completions** are not built (§5). *Ask:* confirm or request the branch.
5. **Both surfaces read the same rows** through one loader. *Ask:* confirm the dual-surface
   placement (patient Home after Quick Log; provider Overview after the attention strip).

## 9. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
TASK-01..03 traced with the role matrix and the §27 row-by-row check). **Phase acceptance:
PENDING** the §7 deferrals and the §8 verdicts (§20.7).
