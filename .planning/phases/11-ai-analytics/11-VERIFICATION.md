# Phase 11: AI Analytics / Patient Intelligence — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
11-01…11-04 under `.planning/phases/11-ai-analytics/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, **no new tests** (the
owner runs the test pass per step). Migration 0010 is written and reviewed but not executed
here; RLS behaviour is deferred to the cloud apply.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 160 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (see §5 for the deliberate assertion update) |
| Build | `npm run build` | **exit 0** — `/ai-analytics` and `/overview` listed dynamic (`ƒ`) |
| Migration | `supabase/migrations/0010_ai_insights.sql` | written (0003/0005/0009 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `ai_insights` + `supersede_pending_ai_insights` added by hand |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — AI Analytics keeps the workspace grammar (top bar + canvas + grouped sections); the Overview strip is a card in the existing flow. |
| 2 | Color relationships | **PASS (screenshot deferred)** — shadow separation; no borders; provenance neutral, review state is the only tonal use (warning→success→neutral). |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — one insight per card with body + evidence; no one-line cards (INV-12). |
| 5 | Card proportions | **PASS** — single column `max-w-[72rem]`; the timeline row and bottom row are untouched. |
| 6 | Pill controls | **PASS** — pills and buttons at `radius.pill`/`md`, 44px mobile targets, confirm overlay for the review decisions. |
| 7 | Typography hierarchy | **PASS** — `text-label/body/heading`, 400/600; window dates `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged; no projection in Phase-11 scope — see §6).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent; the closed Pill family only. |

## 3. Invariants

INV-01/03 (token lint 0, 160 files) · INV-02 (no chrome) · INV-04 (closed kind/review/provenance
vocabularies; status via Pill dot only) · INV-05 (no accent) · INV-06 (no gamified vocabulary) ·
INV-07/08/09 (radii) · INV-10 (spacing steps) · INV-11 (no decorative rules) · INV-12 (cards ≥2
lines) · INV-13/14 (shadow-raised/overlay only) · INV-15/16 (no card borders) · INV-17 (no
glass/scrim). **All PASS.**

## 4. Requirement traceability (AI-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **AI-01** change detection, summarization, attention, trends, documentation assistance | 11-02, 11-03 | `generate.ts` is a pure, deterministic generator over the rows the workspace already reads: `change` (recent 14-day window vs the prior one), `summary` (recent 90 days + the preceding 90), `attention` (record-flagged abnormal/low/high/critical labs, follow-ups past their date, active severe/anaphylaxis allergies), `trend` (same analyte ≥2× with numeric values → direction and the stored endpoints), `documentation-gap` (follow-up without documentation, medication without dosage/frequency/route). The AI Analytics tab groups all five with a per-group blurb. |
| **AI-02** provenance + human review on every clinically meaningful output | 11-01, 11-03 | `ai_insights` carries `provenance` (`system-derived`/`ai-generated`), defaults to `verification = 'ai-extracted'` (§23), and a `review_state` lifecycle. Every row stores ≥1 **structured evidence reference** to the real source rows (0010 check constraint). Review is an explicit Accept/Dismiss decision whose `reviewed_by`/`reviewed_at`/`verification` are taken from the session inside the guard trigger — the client cannot claim an identity; accepted flips verification to `clinician-verified`, dismissed does not. Content is immutable after insert; audit triggers log generation, review and supersede. The board shows a provenance pill, a review pill with the review date, and the evidence links. |
| **AI-03** no autonomous diagnosis or prescribing | 11-01, 11-02, 11-03 | The table has no column that could hold a diagnosis or a prescribing decision; the generator produces observations only and its copy states so ("This reports stored values only; it makes no assessment"); no copy uses directive language anywhere; no model call exists in this phase (§27). |

**Role matrix (0010 policies + `CAN_REVIEW_AI` / `CAN_AUTHOR_CLINICAL` mirrors):**

| Role | Read insights | Generate | Review |
|---|---|---|---|
| provider_doctor | ✅ (policy) | ✅ (policy + guard + capability) | ✅ (policy + guard + capability) |
| nurse | ✅ (policy) | ❌ | ✅ (policy + guard + capability) |
| receptionist | ✅ (policy) | ❌ | ❌ |
| admin_owner | ✅ (policy) | ❌ | ❌ |
| patient | ❌ | ❌ | ❌ |

*Enforcement:* RLS select/insert/update policies, `guard_ai_insight_insert` (content columns
normalized to pending/ai-extracted/system-derived on insert), `guard_ai_insight_review`
(review-columns-only, session attribution, one-way transition), the definer
`supersede_pending_ai_insights` RPC (deletes pending rows only), audit triggers, and the
capability mirrors.

## 5. Test assertion updated this session (reported, not hidden)

`tests/unit/auth-capabilities.test.ts` asserts the role→capability map is **exact**. Adding
`CAN_REVIEW_AI` (the AI-02 mirror of 0010's review policy) deliberately widened
`provider_doctor` and `nurse`, so the two expected sets and the import were updated with an
in-file comment (the CAN_VIEW_GENETICS/CAN_RETRIEVE_AUDIT precedent). This is the only test
change in Phase 11; no test files were added.

## 6. Out of scope (recorded as decisions, not omissions)

- **Timeline projection**: an insight is not a clinical event; the timeline stays a
  projection of stored clinical records (§8.2, §27). The Overview carries the attention
  bridge instead (WSP-02).
- **Model-backed generation**: the architecture is swappable (`provenance = 'ai-generated'`
  already enforceable), but no LLM ships in this phase — deterministic derivation is the
  honest first step and keeps every output reproducible from the record.
- **Patient-facing insights**: the table is staff-scoped by policy; patient-facing AI is a
  product decision, not an oversight.

## 7. Deferred (owner constraints)

- Migration 0010 apply + RLS/pgTAP execution (the role matrix is design evidence; the DB
  proof runs on cloud Supabase), including the review-immutability and no-delete proofs.
- `database.types.ts` regeneration via the CLI.
- No new tests — the owner's unit/acceptance pass (the pure generator is built for it:
  `generateInsights(input, now)` with an injected clock).
- Visual baselines + screenshot legs.
- Owner verdicts on §8.

## 8. Owner design-gate brief

1. **Deterministic generator, no LLM.** *Ask:* confirm this as the shipped AI-01 behavior,
   or schedule a model-backed generator behind the same substrate.
2. **Attention set** = record-flagged abnormal labs + overdue follow-ups + active severe
   allergies. *Ask:* add/remove any signal family.
3. **Review lifecycle** is one-way (pending → accepted/dismissed) and review is final.
   *Ask:* confirm, or ask for a "reopen" action.
4. **`CAN_REVIEW_AI` added to the D-09 capability map** (doctor + nurse) as the UI mirror of
   0010's review policy. *Ask:* confirm the mirror.
5. **Overview attention strip** shows only `attention`-kind insights and hides entirely when
   empty. *Ask:* confirm.

## 9. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
AI-01…03 traced with the role matrix). **Phase acceptance: PENDING** the §7 deferrals and
the §8 verdicts (§20.7).
