# Phase 10: Allergies + Genetics — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
10-01…10-05 under `.planning/phases/10-allergies-genetics/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, no Playwright matrix, **no
new tests** (the owner runs the test pass per step). Migration 0009 is written and reviewed but
not executed here; RLS behaviour is deferred to the cloud apply.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 153 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (see §5 for the one deliberate assertion update) |
| Build | `npm run build` | **exit 0** — `/allergies` and `/genetics` listed dynamic (`ƒ`) |
| Migration | `supabase/migrations/0009_allergies_genetics.sql` | written (0003/0005/0006/0008 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `allergies` + `genetics` added by hand incl. the genetics→documents FK |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — both tabs keep the workspace grammar (top bar + canvas + record cards). |
| 2 | Color relationships | **PASS (screenshot deferred)** — shadow separation; no borders; severity/significance/status are Pill dots only. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — one record per card with reaction + provenance; no one-line cards. |
| 5 | Card proportions | **PASS** — single column; timeline row untouched. |
| 6 | Pill controls | **PASS** — pills, buttons, fields (`radius.md` inset), 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading`, 400/600; dates `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged; projection not in Phase-10 scope — see §6).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent; closed family (`neutral`/`info`/`warning`/`success`/`critical`). |

## 3. Invariants

INV-01/03 (token lint 0, 153 files) · INV-02 (no chrome) · INV-04 (closed severity and
significance vocabularies, tint via Pill dot only) · INV-05 (no accent) · INV-06 (no gamified
vocabulary) · INV-07/08/09 (radii `pill`/`md`, nothing ≤4px) · INV-10 (spacing steps) · INV-11
(no rules added) · INV-12 (≥2 lines/card) · INV-13/14 (`shadow-raised`/overlay only) · INV-15/16
(no card borders) · INV-17 (no glass/scrim). **All PASS.**

## 4. Requirement traceability (ALG-01…03) — with the role-visibility matrix

| Req | Tickets | Evidence |
|---|---|---|
| **ALG-01** record + view allergies with strong provenance and appropriate permissions | 10-01, 10-02, 10-04 | `allergies` table + `recordAllergyAction` / `resolveAllergyAction` (`CAN_AUTHOR_CLINICAL`, Zod, typed results); severity/status closed vocabularies; the Allergies tab shows allergen, reaction, severity, status and **provenance** (source + verification + noting date); authors only may record/resolve. |
| **ALG-02** record + view genetics with strong provenance and appropriate permissions | 10-01, 10-03, 10-04 | `genetics` table + `recordGeneticFindingAction`; kind/significance closed vocabularies; optional report `document_id` integrity-checked to the same patient/org; the Genetics tab shows title, kind, significance, interpretation and provenance, with the report filename when present. |
| **ALG-03** role-based visibility enforced at the DATA LAYER | 10-01, 10-03 | **RLS policy** `select genetics as authorized clinicians` limits genetics rows to `provider_doctor` + `admin_owner`; allergies stay visible to all four staff roles (bedside fact). Writes on BOTH tables are `provider_doctor`-only in the policy AND the definer guard trigger. `CAN_VIEW_GENETICS` mirrors the genetics policy so the page denies BEFORE querying (no empty-list lie); RLS remains the enforcement (§12). |

**Role visibility matrix (the phase's core requirement):**

| Role | Allergies read | Genetics read | Allergies/Genetics write |
|---|---|---|---|
| provider_doctor | ✅ (policy) | ✅ (policy + capability) | ✅ (policy + guard) |
| nurse | ✅ (policy) | ❌ (policy denies; page denies) | ❌ (policy + guard) |
| receptionist | ✅ (policy) | ❌ (policy denies; page denies) | ❌ (policy + guard) |
| admin_owner | ✅ (policy) | ✅ (policy + capability) | ❌ (guard requires provider_doctor consent to author) |
| patient | ❌ | ❌ | ❌ |

*Enforcement points:* RLS `select/insert/update` policies (0009), the `guard_allergy_content` /
`guard_genetic_content` definer triggers, the `CAN_VIEW_GENETICS` capability mirror, and the
page-level pre-query denial. Four layers, one rule.

## 5. Test assertion updated this session (reported, not hidden)

`tests/unit/auth-capabilities.test.ts` asserts the role→capability map is **exact**. Adding
`CAN_VIEW_GENETICS` (the ALG-03 mirror) deliberately widened `provider_doctor` and `admin_owner`,
so the two expected sets and the import were updated, with an in-file comment explaining the
mirror (the CAN_RETRIEVE_AUDIT precedent). This is the only test change in Phase 10; no test
files were added.

## 6. Out of scope (recorded as decisions, not omissions)

- **Timeline projection** for allergies/genetics: ALG-01..03 ask for record/view + visibility,
  not the timeline. No mapper was added (§27 no scope creep). A later phase can add one through
  the existing `ClinicalSources` seam.
- **Genetics upload UI / media pipeline**: the report `document_id` and the 0008 Storage bucket
  exist; the upload pipeline remains deferred (as in Phase 9).

## 7. Deferred (owner constraints)

- Migration 0009 apply + RLS/pgTAP execution (the role matrix above is design evidence; the DB
  proof runs on cloud Supabase).
- `database.types.ts` regeneration via the CLI.
- No new tests — the owner's unit/acceptance pass.
- Visual baselines + screenshot legs.
- Owner verdicts on §8.

## 8. Owner design-gate brief

1. **Genetics role set = provider_doctor + admin_owner.** Nurse read access is the open question
   for a sensitive category. *Ask:* confirm the two-role set or add `nurse`.
2. **Allergies visible to all staff** (safety-critical); writes author-only. *Ask:* confirm.
3. **`CAN_VIEW_GENETICS` added to the D-09 capability map** as the UI mirror of the genetics RLS
   policy (a phase-3 gate module touched additively, with the exact-set test updated and
   documented in §5). *Ask:* confirm the mirror.
4. **No timeline projection** in Phase 10 (§6). *Ask:* confirm, or schedule it as a follow-up.

## 9. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
ALG-01…03 traced with the role matrix). **Phase acceptance: PENDING** the §7 deferrals and the
§8 verdicts (§20.7).
