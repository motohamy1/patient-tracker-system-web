# Phase 7: Visits Workflow — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
07-01…07-06 under `.planning/phases/07-visits-workflow/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, no Playwright matrix, **no
new tests** (the owner runs the test pass per step). Verification is type/lint/build plus the
pre-existing suite; migration execution and RLS behaviour are deferred to the cloud Supabase
apply (the SQL is written and reviewed, not executed here).

---

## 1. Evidence (commands run, actual output)

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 125 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (no test files added or changed) |
| Build | `npm run build` | **exit 0** — `/provider/patients/[patientId]/visits` and `…/visits/[visitId]` listed dynamic (`ƒ`) |
| Migration | `supabase/migrations/0006_visits.sql` | written, mirrored from 0003/0005 patterns; **apply + pgTAP deferred to cloud Supabase** |
| Types contract | `src/lib/supabase/database.types.ts` | `visits` table added by hand (CLI regeneration against cloud Supabase pending — noted in-file) |

## 2. Visual QA gate (`visual-qa-rules.md` §1 — 12 rows)

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — the Visits tab keeps the workspace grammar (top bar + canvas surface + card list); no reflow invented. |
| 2 | Color relationships | **PASS (screenshot leg deferred)** — cards separate by `shadow-raised`; no border; the stage Pill carries a dot only. |
| 3 | Spacing rhythm | **PASS** — only `space.*` steps (`gap-md/lg/xs/sm`, `p-lg`, `px-lg`, `min-h-8`); page gap `gap-lg`. |
| 4 | Compactness | **PASS** — one visit per compact card row; no one-line cards (type + stamp + stage). |
| 5 | Card proportions | **PASS** — the timeline bottom row untouched; the visit list is a single column. |
| 6 | Pill controls | **PASS** — stage pills, stepper chips, buttons all `radius.pill`; fields `radius.md` (inset), ≥44px on mobile. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading`, weights 400/600; stamps `tabular-nums`. |
| 8–10 | Timeline proportions / nodes / scrubber | **PASS (unchanged from Phase 6)** — visits add events through the same engine; no axis/nodes/scrubber code touched. |
| 11 | Visual density | **PASS (owner read deferred)** — dense card rows matching the workspace rhythm. |
| 12 | Accent restraint | **PASS** — no accent units; stage tints are the closed D-04 set (info/warning/success). |

## 3. Invariants

| ID | Verdict | Evidence |
|---|---|---|
| INV-01/03 | PASS | token lint 0 violations (125 files). |
| INV-02 | PASS | no chrome region touched. |
| INV-04 | PASS | stage tints only info/warning/success (`VISIT_STAGE_TOKEN`); no new tint. |
| INV-05 | PASS | no accent paint anywhere in the phase; the New-visit CTA is `accentSoft` (the reserved primary). |
| INV-06 | PASS | no gamified vocabulary. |
| INV-07/08/09 | PASS | radii `pill`/`md`/`lg` only; compact controls pill; nothing ≤4px. |
| INV-10 | PASS | spacing grep; no gap > 32px. |
| INV-11 | PASS | no rules/dividers added. |
| INV-12 | PASS | every visit card ≥2 lines. |
| INV-13/14 | PASS | `shadow-raised` only; no local shadow literal (lint). |
| INV-15/16 | PASS | no border utilities on cards (lint + grep). |
| INV-17 | PASS | no glass/scrim added. |

## 4. Requirement traceability (VIS-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **VIS-01** Pre → During → After with documentation and follow-up | 07-01, 07-03, 07-05 | `visits` table carries the closed stage vocabulary + reason/documentation/follow-up fields; `advanceVisitStageAction` enforces exactly one forward step (skip/backward/repeat rejected server-side); `VisitWorkflow` renders the stepper and one form per current stage; saved content stays visible as the workflow advances. |
| **VIS-02** Visit activity projects into the timeline with correct permissions | 07-04 | `projectCareEvents(patient, invitations, visits)` maps each visit to a `visit` event and its follow-up to a `follow-up` **child** (first real producer of the Phase-6 branch layer). Only RLS-scoped rows are read; the event label uses SCHEDULING fields only (`visit_type`), never clinical prose, so a scheduler cannot read documentation through a timeline label. |
| **VIS-03** Receptionist can schedule/register without clinical authoring | 07-02 | Three layers: (1) `createVisitAction` requires `CAN_SCHEDULE` and inserts `reason` only for `CAN_AUTHOR_CLINICAL` holders (null otherwise); the clinical writes (`saveVisitDocumentationAction`, `advanceVisitStageAction`) require `CAN_AUTHOR_CLINICAL`. (2) Migration 0006's `guard_visit_content` trigger raises `visit_clinical_forbidden` for a non-author (insert or update), and `visit_patient_mismatch` for a cross-org patient. (3) The UI renders `reason`/documentation fields only for authors and the "New visit" control only for schedulers. |

## 5. Deferred (owner constraints)

- **Migration 0006 apply + RLS/pgTAP execution on cloud Supabase** (no DB this session): the
  trigger behaviour (`guard_visit_content`, `visit_patient_activity`, `audit_visits`,
  `touch_visit_provenance`) is proven by reading, not by execution.
- **`database.types.ts` regeneration** against the live schema (the `visits` block is added by
  hand and typed to match 0006 exactly).
- **No new tests** — the owner's unit/acceptance pass for the visit workflow, the stage-sequence
  guard, and the projection.
- **Visual baselines + screenshot legs** for the Visits tab and the visit workflow.
- **Owner verdicts** on the design choices below.

## 6. Owner design-gate brief

1. **Schedule-only card label.** A visit's timeline event label comes from `visit_type` (or the
   literal "Visit"), never from `reason`/documentation, so a scheduler reading the timeline never
   sees clinical prose. *Ask:* accept, or allow the reason for authors.
2. **Visit detail is a sub-route** (`…/visits/[visitId]`). *Ask:* confirm the nested route (it
   leaves the eight primary tabs untouched; the tab-order regression test scans only the eight
   direct folders).
3. **Follow-up as a branch child.** A visit with follow-up renders the follow-up as a child
   event (the branch layer's first real data). *Ask:* confirm the relationship model.
4. **No visit deletion.** Consistent with 0005 ("a clinical record is not a product delete
   action"); no delete policy or grant exists.

## 7. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
VIS-01…03 traced).
**Phase acceptance: PENDING** the §5 deferrals and the §6 verdicts — a passing build is not
acceptance (§20.7, §27).
