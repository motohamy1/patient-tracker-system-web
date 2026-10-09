# Phase 13: Patient Home — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
13-01…13-04 under `.planning/phases/13-patient-home/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, **no new tests** (the
owner runs the test pass per step). Migration 0012 is written and reviewed but not executed
here; RLS behaviour is deferred to the cloud apply.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 176 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (no test change needed this phase) |
| Build | `npm run build` | **exit 0** — `/patient/home` listed dynamic (`ƒ`) |
| Migration | `supabase/migrations/0012_patient_observations.sql` | written; **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `patient_observations` added by hand |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — the patient shell's own grammar (top bar + canvas + nine calm regions), not a shrunken provider workspace. |
| 2 | Color relationships | **PASS (screenshot deferred)** — shadow separation; no borders; no tonal noise: the only semantic use is the shell's existing status dot. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only; the measure is the reference's comfortable one (`max-w-[64rem]`). |
| 4 | Compactness | **PASS** — lower density by construction: fewer regions per row, one column at the base width. |
| 5 | Card proportions | **PASS** — two full-width care regions, then 2-up pairs, then the wide snapshot/log regions. |
| 6 | Pill controls | **PASS** — one primary action (Add a measurement), inset fields, 44px mobile targets, confirm-free logging with honest error copy. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading`; values and dates `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged; the timeline engine is provider-side and not in the §14 patient scope).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent anywhere on the surface. |

## 3. Invariants

INV-01/03 (token lint 0, 176 files) · INV-02 (no chrome) · INV-04 (closed observation
vocabularies) · INV-05 (no accent) · INV-06 (no gamified vocabulary — checked region by
region: no points, streaks, levels, celebration copy) · INV-07/08/09 (radii) · INV-10
(spacing steps) · INV-11 (no decorative rules) · INV-12 (cards ≥2 lines) · INV-13/14
(shadow-raised/overlay only) · INV-15/16 (no card borders) · INV-17 (no glass/scrim). **All
PASS.**

## 4. Requirement traceability (PTH-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **PTH-01** the nine regions at lower density in the same design language | 13-02 | Today's Care, Next Action, Medications, Appointments, Health Snapshot, Quick Log, Care Plan, Documents and Communication all render from the patient's own rows; every region degrades on its own; Communication is the honest-empty pattern until messaging exists; mobile stacks to one column (§26). |
| **PTH-02** only the explicitly allowed observation types; no provider-only authoring | 13-01, 13-03 | The closed kind vocabulary (`weight`, `blood_pressure`, `glucose`, `temperature`, `pulse`, `note`) is 0012's check constraint; INSERT is patient-self-only in policy AND guard (the row's patient is re-derived from `auth.uid()`); the action requires `CAN_SUBMIT_OBSERVATION` (the patient role's only capability); no clinical table grants a patient write; `patient_observations` has no UPDATE or DELETE grant. |
| **PTH-03** no gamification | 13-02, 13-03 | The Quick Log copy is plain ("Save to my record"); no points, levels, streaks, progress scores, fireworks or celebration language anywhere on the surface; logging failure is an honest error, not a scold. |

**Role matrix (0012):**

| Role | Log an observation | Read own clinical rows | Write clinical tables |
|---|---|---|---|
| patient | ✅ (policy + guard + capability) | ✅ (self-or-staff SELECT) | ❌ (no grant anywhere) |
| provider_doctor | ❌ | ✅ (staff) | ✅ (per-table) |
| nurse | ❌ | ✅ (staff) | ✅ (per-table) |
| receptionist | ❌ | ✅ (staff) | scheduling/registration only |
| admin_owner | ❌ | ✅ (staff) | ❌ clinical |

*Note: staff-logged observations are a documented non-goal of Phase 13 (the record shows
`source='patient'` only); the admission path, should the owner want it, is the same table
plus one guard branch — recorded so it is a decision, not an omission.*

## 5. Schema decisions reported

- **0012 adds patient self-read** on `medications`, `visits`, `lab_results` and `documents`
  through a `self-or-staff` SELECT policy (the 0005 `patients` precedent, joined through
  `private.can_read_own_patient_row(p_patient_id)` so the record's own `user_id` link is the
  authority). Write grants are untouched: a patient never gains INSERT or UPDATE on a
  clinical table — observations remain their only authoring surface.
- **`getPatientForCurrentUser()`** resolves the record from the verified session (RLS-bounded
  read, `.limit(2)` as a shape guard); no path, parameter or store ever names the patient.

## 6. Out of scope (recorded as decisions, not omissions)

- **Provider-side surfacing of patient observations** in the clinical workspace: rides
  Phase 14 (TASK-02) rather than being built twice; the staff SELECT path already exists.
- **A messaging implementation**: the Communication region is the shared honest-empty
  pattern; the surface arrives with the Communication phase.
- **Allergies/genetics/imaging on the patient Home**: outside §14's named regions; the
  patient sees the regions the spec lists.

## 7. Deferred (owner constraints)

- Migration 0012 apply + pgTAP execution (self-only insert, no update/delete, org isolation,
  the guard's re-derivation, the new self-or-staff SELECT policies).
- `database.types.ts` regeneration via the CLI.
- No new tests — the owner's unit/acceptance pass (a real patient account logging both a
  measurement and a note).
- Visual baselines + screenshot legs.

## 8. Owner design-gate brief

1. **The nine regions** and their order (§14 list, Today's Care first). *Ask:* confirm the
   order and the lower-density rhythm.
2. **The allowed observation set** (weight / blood pressure / glucose / temperature / pulse /
   note). *Ask:* add or remove a kind.
3. **Staff cannot log on a patient's behalf** in this phase. *Ask:* confirm, or ask for the
   staff-admission branch.
4. **Patient self-read scope**: medications, visits, results and documents. *Ask:* confirm
   (allergies/genetics/imaging deliberately not self-read).
5. **Communication region** is honestly empty until Phase 15. *Ask:* confirm.

## 9. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
PTH-01…03 traced with the role matrix). **Phase acceptance: PENDING** the §7 deferrals and
the §8 verdicts (§20.7).
