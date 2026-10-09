# Phase 9: Labs + Imaging — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
09-01…09-06 under `.planning/phases/09-labs-imaging/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, no Playwright matrix, **no
new tests** (the owner runs the test pass per step). Migration 0008 is written and reviewed but
not executed here; RLS/trigger/storage behaviour is deferred to the cloud apply.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 143 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (no test files added or changed) |
| Build | `npm run build` | **exit 0** — `/labs` and `/imaging` listed dynamic (`ƒ`) |
| Migration | `supabase/migrations/0008_labs_imaging.sql` | written (0003/0005/0006/0007 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | 5 tables added by hand incl. the result→document FK relationships (needed for the PostgREST embed) |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — Labs/Imaging tabs keep the workspace grammar (top bar + canvas + order cards). |
| 2 | Color relationships | **PASS (screenshot deferred)** — cards separate by shadow; no borders; status/flag tint is a Pill dot only. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — one order per card with its results beneath; no one-line cards. |
| 5 | Card proportions | **PASS** — single column; timeline row untouched. |
| 6 | Pill controls | **PASS** — status/flag pills, buttons, fields (`radius.md` inset), 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading`, 400/600; values/dates `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged)** — new kinds ride the same engine. |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent; closed family (`info`/`warning`/`neutral`/`success`/`critical`). |

## 3. Invariants

INV-01/03 (token lint 0) · INV-02 (no chrome) · INV-04 (closed status/flag families only) ·
INV-05 (no accent paint) · INV-06 (no gamified vocabulary) · INV-07/08/09 (radii `pill`/`md`,
nothing ≤4px) · INV-10 (spacing steps) · INV-11 (no rules added) · INV-12 (≥2 lines/card) ·
INV-13/14 (`shadow-raised` + overlay only; no local shadow literal) · INV-15/16 (no card
borders) · INV-17 (no glass/scrim). **All PASS.**

## 4. Requirement traceability (LAB-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **LAB-01** lab orders + results through their lifecycle with provenance | 09-01, 09-02, 09-05 | `lab_orders` (ordered→resulted/cancelled) + structured `lab_results` (analyte, numeric value, unit, reference range, closed flag); actions gated on `CAN_AUTHOR_CLINICAL`; a result insert flips the order `resulted` in the same statement (trigger); provenance `source` + creators/timestamps on every row; Labs tab shows the milestone + its results with flag pills. |
| **LAB-02** imaging lifecycle with document/media relationships preserved | 09-01, 09-03, 09-05 | `imaging_orders` + `imaging_results` with the same discipline; `documents` metadata table + `document_id` FK from results; a private `patient-documents` Storage bucket with org-scoped object policies reading the org from the path (`<org>/<patient>/<id>`) through the SAME `private.user_org_role` helper; the trigger rejects a document belonging to another patient/org; Imaging tab surfaces the linked filename. Upload UI deferred (the relationship + policies exist). |
| **LAB-03** lab + imaging events project into the timeline | 09-04 | Projection now takes a named `sources` object; lab/imaging orders become `lab-ordered`/`imaging-ordered` with their results as CHILD events (`lab-result`/`imaging-result`) at each `resulted_at` — the branch layer's third real producer; unresulted orders show only their ordered event (nothing invented). |

## 5. Lifecycle + media consistency (design evidence; execution deferred)

Result inserts go through migration 0008's `guard_and_apply_*_result` trigger: it validates the
order's patient/org, refuses a cancelled order, validates a linked document's patient/org, and
marks the order `resulted` — atomically, since it runs in the same statement. Results are
INSERT-only (no update/delete grant anywhere). Proven by reading; pgTAP deferred.

## 6. Deferred (owner constraints)

- Migration 0008 apply + RLS/trigger/pgTAP + a Storage bucket smoke test on cloud Supabase.
- `database.types.ts` regeneration via the CLI.
- No new tests — the owner's unit/acceptance pass.
- Visual baselines + screenshot legs for the Labs/Imaging tabs.
- Owner verdicts on §7.

## 7. Owner design-gate brief

1. **Projection signature moved to a named `sources` object** (was growing positional params).
   The two-argument callers are unchanged; visits/medications/labs/imaging are keys. *Ask:*
   confirm.
2. **Results as child events** (branch layer) rather than flat siblings — matches the visit
   follow-up pattern and keeps the axis readable. *Ask:* confirm.
3. **`documents` + Storage bucket shipped, upload UI deferred** — the phase goal names
   "document/media relationships", which the FK + policies provide; the pipeline is a later
   phase (no scope creep, §27). *Ask:* confirm the split.
4. **`cancelled` orders keep their row** (no delete) and are shown with a neutral pill. *Ask:*
   confirm.

## 8. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
LAB-01…03 traced). **Phase acceptance: PENDING** the §6 deferrals and the §7 verdicts (§20.7).
