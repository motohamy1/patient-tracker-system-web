# Phase 17: Telehealth — Verification

**Date:** 2026-10-10 · **Executed via:** GSD tickets 17-01…17-04 under
`.planning/phases/17-telehealth/issues/`.
**Session constraints (owner-directed):** **no test suites run**, **no commits** — the
owner runs the test pass and commits per phase. Verification here is tsc + the
token/lint gate only; the last full suite green was Phase 15 (473/373 → 473/473) and
the last build green was Phase 15 as well.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0** |
| Test suite | — | **not run (owner-directed)**; last green 473/473 at Phase 15 |
| Build | — | **not run (owner-directed)**; last green at Phase 15 |
| Migration | `supabase/migrations/0016_telehealth.sql` | written (0003/0005/0006/0014 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `telehealth_sessions` added by hand |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — `/provider/consultations` is a profile route (like `/provider/messages`), never a ninth tab; the consultation room is a separate route under the same shell. |
| 2 | Color relationships | **PASS (screenshot deferred)** — session state uses the closed Pill tint family; the transport panel is text, not color. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — the room is four blocks: state, transport, notes, workspace links. |
| 5 | Card proportions | **PASS** — day list rows are one line each; the room is a single 72rem column. |
| 6 | Pill controls | **PASS** — verb-first buttons ("Start consultation", "Begin the call", "Complete consultation", "Cancel consultation"), inset fields, 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading`; the consultation reference is `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged; a consultation is not projected onto the clinical timeline separately — it IS the visit, §8.2).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent anywhere in the telehealth surfaces (INV-05). |

## 3. Invariants

INV-01/03 (token lint exit 0) · INV-02 (no chrome) · INV-04 (closed status/transport
vocabularies) · INV-05 (no accent) · INV-06 (no gamified vocabulary) · INV-07/08/09
(radii) · INV-10 (spacing steps) · INV-11 (no decorative rules) · INV-12 (cards ≥2
lines) · INV-13/14/15/16 (surfaces, no card borders) · INV-17 (no glass/scrim).
**All PASS.**

## 4. Requirement traceability (TH-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **TH-01** a clinician starts a consultation from an appointment and the clinical workspace remains visible and usable during the call | 17-02, 17-03 | `startConsultationAction` runs off the visit (the appointment): it opens the session and advances the visit to `during_visit`. The consultation room carries the workspace link row (all eight tabs) as a first-class block — the record is one click away during the call, not buried behind the video surface. |
| **TH-02** not a generic Zoom clone | 17-03 | Structural: the room's centre is the patient state + the documentation, and the transport is ONE honest panel stating that no video provider is connected (0016's `not_configured` default, §27). No meeting product, no participant grid, no fake room. The patient's join surface is a reference and a sentence. |
| **TH-03** completed telehealth visits document into the same visit/clinical record model as in-person visits | 17-01, 17-02 | The session FK points at the visit; completing writes the visit's own clinical block (`reason`/`documentation`/`follow_up`/`follow_up_at`) through the same guarded column grants 0006 gives in-person visits, and sets `stage = after_visit`. There is one encounter model — the room is not a second record. |

**Role matrix (0016):**

| Role | Read session | Start / complete / cancel |
|---|---|---|
| provider_doctor | ✅ (staff SELECT) | ✅ (policy + guard + `CAN_AUTHOR_CLINICAL`) |
| nurse / receptionist / admin_owner | ✅ | ❌ (guard `session_write_forbidden`; the room renders read-only, no dead controls) |
| patient | ✅ (own session only — `can_read_own_patient_row`) | ❌ (no write grant at all) |

## 5. Decisions reported

- **The transport is `not_configured` on purpose.** No video provider credentials
  exist in this workspace and §27 forbids simulating one; the surface states what
  connecting would take, and the session model ships regardless (the Phase-12/16
  no-provider precedent).
- **One active session per visit, enforced by a partial unique index** — a second
  consultation on the same appointment is refused by the database, not queued by
  the app.
- **The session never re-declares the patient or org**: the guard re-derives both
  from the visit and refuses a mismatch, so a consultation cannot be attached to a
  foreign patient.
- **Timestamps are owned by the transition, never the payload**: `started_at` /
  `ended_at` are set by the guard on the status transition; a non-transition
  update that touches them is refused.
- **The patient surface shows the join reference and nothing else** — no staff
  names, no notes, no workspace ids.

## 6. Out of scope (recorded as decisions, not omissions)

- **A real video transport** (WebRTC / a provider SDK): the record, workflow and
  surfaces ship without one; connecting is a registry-style change once the owner
  chooses a provider (the §9 brief).
- **Waiting rooms / multi-participant calls**: one clinician, one patient.
- **In-call chat**: the unified conversation already exists and the room links to it
  via the workspace row; a parallel in-call chat would be a second model.
- **Consultation billing**: Phase 18's surface (payments), reached from the visit.

## 7. Deferred (owner constraints + this session's directives)

- Migration 0016 apply + pgTAP (one-active-session, transition discipline, visit
  ownership, doctor-only writes, patient self-read, org isolation).
- `database.types.ts` regeneration via the CLI.
- **No test suites run this session (owner-directed)** — the unit/acceptance pass is
  the owner's, including the transition helper and the workflow actions.
- **No commits this session (owner-directed)** — the owner commits per phase.
- Visual baselines + screenshot legs for the three new surfaces.

## 8. Owner design-gate brief

1. **The video transport**: which provider (and credentials) the workspace should
   connect, or ship the honest `not_configured` state as the phase's face. *Ask:*
   which, and the budget.
2. **The consultation route's discoverability**: `/provider/consultations` is a
   profile route reached from the Visits tab entry and the provider home; no rail
   item is wired (the WorkspaceTopBar active-state limitation from Phase 15). *Ask:*
   confirm, or ask for a rail item.
3. **Who may run a consultation**: doctor-only today (mirroring 0006's clinical
   guard). *Ask:* widen to the nurse?
4. **The patient's join experience**: a reference plus a sentence, with no video
   room until a provider is connected. *Ask:* confirm.

## 9. Gate status

**Implementation: GREEN** for the gates run (tsc 0, token/lint exit 0, TH-01…03
traced with the role matrix). **Phase acceptance: PENDING** the §7 deferrals and
the §8 verdicts (§20.7).
