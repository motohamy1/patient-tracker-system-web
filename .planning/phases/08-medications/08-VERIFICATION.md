# Phase 8: Medications — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
08-01…08-05 under `.planning/phases/08-medications/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, no Playwright matrix, **no
new tests** (the owner runs the test pass per step). Migration 0007 is written and reviewed but
not executed here; RLS/trigger behaviour is deferred to the cloud Supabase apply.

---

## 1. Evidence (commands run, actual output)

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 133 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (no test files added or changed) |
| Build | `npm run build` | **exit 0** — `/provider/patients/[patientId]/medications` and `…/medications/[medicationId]` listed dynamic (`ƒ`) |
| Migration | `supabase/migrations/0007_medications.sql` | written (0003/0005/0006 patterns); **apply + pgTAP deferred to cloud Supabase** |
| Types contract | `src/lib/supabase/database.types.ts` | `medications` + `medication_events` added by hand (CLI regeneration against cloud pending) |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — Medications tab keeps the workspace grammar (top bar + canvas + grouped card list); detail is a nested sub-route. |
| 2 | Color relationships | **PASS (screenshot leg deferred)** — cards separate by `shadow-raised`; status Pill carries a dot only. |
| 3 | Spacing rhythm | **PASS** — only `space.*` steps. |
| 4 | Compactness | **PASS** — one medication per compact card (name + facts + status); no one-line cards. |
| 5 | Card proportions | **PASS** — single-column list; timeline row untouched. |
| 6 | Pill controls | **PASS** — status pills, buttons, selects/fields (`radius.md` inset), 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading`, 400/600; dose/date `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged)** — medication events flow through the Phase-6 engine; no axis/scrubber code touched. |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent; status tints are the closed family (`success`/`warning`/`neutral`). |

## 3. Invariants

| ID | Verdict | Evidence |
|---|---|---|
| INV-01/03 | PASS | token lint 0 violations (133 files). |
| INV-02 | PASS | no chrome touched. |
| INV-04 | PASS | status tints success/warning/neutral only; no new tint. |
| INV-05 | PASS | no accent paint; lifecycle buttons are `secondary`. |
| INV-06 | PASS | no gamified vocabulary. |
| INV-07/08/09 | PASS | radii `pill`/`md`; compact controls pill; nothing ≤4px. |
| INV-10 | PASS | spacing grep; no gap > 32px. |
| INV-11 | PASS | no rules added. |
| INV-12 | PASS | every row ≥2 lines (name + structured facts). |
| INV-13/14 | PASS | `shadow-raised`/`shadow-overlay` (overlays) only; no local shadow literal. |
| INV-15/16 | PASS | no card borders. |
| INV-17 | PASS | no glass/scrim added. |

## 4. Requirement traceability (MED-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **MED-01** lifecycle start → active → change → pause/stop → historical with structured dose/frequency/route/duration | 08-01, 08-02, 08-03 | `medications` (structured `dose_amount` + `dose_unit`, closed `frequency`/`route`, `started_at`/`paused_at`/`stopped_at`, `status`); actions `start`/`change`/`pause`/`resume`/`stop` gated on `CAN_AUTHOR_CLINICAL`; `MEDICATION_STATUS_TRANSITIONS` is the ONE table the server and UI share, so illegal moves are rejected server-side and never rendered as dead controls; `MedicationList` groups active/paused/stopped and shows real facts; detail shows the rationale trail. |
| **MED-02** state changes project as distinct timeline events | 08-04, 08-01 | `medication_events` (the HISTORY) is the projection source, not the current row; the trigger writes one row per transition (`started`/`changed`/`paused`/`resumed`/`stopped`); the timeline maps them to `medication-started`/`medication-changed`/`medication-stopped` (paused/resumed carry their own precise label but stay `medication-changed`), so an edit can never rewrite history. |
| **MED-03** CDSS-ready, no decisions | 08-01 | Structured dose + unit, closed frequency/route vocabularies mirrored in TS, `rxnorm_code` reserved; **no** interaction/contraindication/dosing logic exists anywhere (grep: no such module, no rule tables). |

## 5. State ↔ history consistency (design evidence; execution deferred)

Every medication write goes through `medications` ONLY; migration 0007's
`record_medication_event` AFTER trigger writes the matching `medication_events` row **in the same
statement**, so the two can never drift (a provenance-only touch writes nothing). The
`guard_medication_content` trigger enforces org integrity + `provider_doctor`-only authoring.
`medication_events` has SELECT-only grants (the history is definer-written). This is proven by
reading; the pgTAP/RLS execution is deferred to the cloud apply.

## 6. Deferred (owner constraints)

- **Migration 0007 apply + RLS/trigger/pgTAP execution on cloud Supabase.**
- **`database.types.ts` regeneration** against the live schema.
- **No new tests** — the owner's unit/acceptance pass (lifecycle transitions, projection,
  detail rendering).
- **Visual baselines + screenshot legs** for the Medications tab and detail.
- **Owner verdicts** on §7.

## 7. Owner design-gate brief

1. **History is DB-owned (trigger), not action-owned.** The ticket allowed "one DB function or
   one transaction-shaped action"; the trigger route makes state and trail atomic by
   construction and keeps `medication_events` unwritable by clients (SELECT-only grant).
   *Ask:* confirm.
2. **`paused`/`resumed` map to `medication-changed`** (the vocabulary has only started/changed/
   stopped) while carrying their own labels. *Ask:* confirm, or add dedicated kinds.
3. **Stopped medications are read-only** (no resume after stop; `stopped` has no successor).
   *Ask:* confirm the terminal-state rule.
4. **Change edits the current row only**; the before/after snapshot lives in the event detail
   (audit-style). *Ask:* confirm.
5. **Medications detail is a nested sub-route** (`…/medications/[medicationId]`), sibling to the
   Visits detail route. *Ask:* confirm.

## 8. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
MED-01…03 traced).
**Phase acceptance: PENDING** the §6 deferrals and the §7 verdicts — a passing build is not
acceptance (§20.7, §27).
