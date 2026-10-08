# Phase 5: Patient Workspace / Overview — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `implement` + `code-review` skills (tickets
01–05 under `.planning/phases/05-patient-workspace-overview/issues/`), NOT the GSD plan wave —
recorded here so the GSD state and the ticket state tell the same story.
**Session constraint (owner-directed):** no Docker, no local Supabase, no Playwright matrix.
Verification is unit/type/lint/build-level; the screenshot-dependent rows and the visual
baselines are **deferred deliberately** (§6) and the phase is not accepted until they run.

---

## 1. Evidence (commands run, actual output)

| Gate | Command | Result |
|---|---|---|
| Unit (full) | `npx vitest run` | **36 files, 428/428 passed** (Phase-5 files: `workspace-overview` 31, `recent-records` 13, `patient-record-query` 5) |
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 107 files** (`no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required` — INV-01/03/13/14) |
| Build | `npm run build` | **exit 0** — compiled; `/provider/patients/[patientId]/overview` listed `ƒ` (dynamic) |
| DB / RLS (pgTAP) | `supabase db reset && supabase test db` | **DEFERRED — cloud Supabase later (owner constraint, this session)** |
| Visual baselines | `npm run test:visual -- --update-snapshots` | **DEFERRED — same constraint; see §6** |
| Cross-AI review | `code-review` skill, fixed point `bc0216e`, axes Standards ∥ Spec | Standards: 0 hard breaches, 6 judgement calls (5 fixed, 1 suppressed-by-repo-idiom — see §5); Spec: 3 findings addressed, 4 recorded for adjudication below |

**Code-review fixes applied before this artifact was written:** `SupabasePermissionError`
(SQLSTATE-carrying class; record reads now render denial copy, not the connection copy),
type-cycle broken (`PatientInviteRow` lives in `queries.ts`), shared grid constants
(`workspace/grids.ts`, skeleton cannot drift from the live layout), UTC string date parsing in
`RecentRecordsCard` (agrees with the `.slice(0,10)` FolderCard precedent by construction),
§7 next-step copy rewritten on the vitals/labs cards, `StateVariant` comment de-overpromised,
denial block deduplicated.

## 2. Visual QA gate (`visual-qa-rules.md` §1 — 12 rows)

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — §5 grammar: identity card left + context/vitals stat row, full-width timeline band, three-card bottom row; `WorkspaceTopBar` untouched from Phase 2; no reflow invented. |
| 2 | Color relationships | **PASS (screenshot leg deferred)** — cards separate by `shadow-raised` only, zero `border-*` in the changed source (grep); accent pixel-share is **0%** by construction (no `bg-accent`/`text-accent` anywhere — asserted). Pixel-share estimate re-runs with the visual matrix. |
| 3 | Spacing rhythm | **PASS** — grep: only `gap-xs/sm/md/lg/xl`, `p-lg`, `px-lg/md`, `py-sm`, `pb-lg` (+ `auto` margins for anchoring, `FolderCard` precedent); page section gap `gap-xl` = 24px ≤ 32px. |
| 4 | Compactness | **PASS (rendered-height leg deferred)** — every card ≥2 content lines asserted (identity, 3 context cards, band, 3 bottom cards); no tile denser than the folder card by construction (same `Surface p-lg` + `gap-md` rhythm). Rendered-height comparison happens with the screenshots. |
| 5 | Card proportions | **PASS (measurement leg deferred)** — one shared declaration `BOTTOM_ROW_GRID = grid md:grid-cols-[55fr_22.5fr_22.5fr]` used by both body and skeleton (test-asserted). Arithmetic: fr distributes the post-gutter content box → ≈53.6 / 22.2 / 22.2% at the 80rem container, inside ±3 either way the row is read. Rendered measurement runs with the screenshots. |
| 6 | Pill controls | **PASS** — tabs, pills, grabber, range chips all `radius.pill`; grep: radii are `rounded-pill` / `rounded-lg` / `rounded-md` only; nothing ≤4px. |
| 7 | Typography hierarchy | **PASS** — greps in tests: only `text-label/body/heading/display`, weights 400/600; `tabular-nums` asserted on every numeral (stat values, day numerals, MRN, dates). |
| 8 | Timeline proportions | **N/A → Phase 006** — band draws no axis/nodes (test: no `<svg>`, `<circle>`, `<path>` in the rendered body). |
| 9 | Node/branch behavior | **N/A → Phase 006** |
| 10 | Bottom scrubber | **N/A → Phase 006** — not drawn (test: no `scrubber` chrome). |
| 11 | Visual density | **PASS (owner read deferred)** — compact rhythm throughout; final dense/scannable judgement is the owner's at the visual gate. |
| 12 | Accent restraint | **PASS** — zero accent paint in the changed surface (asserted); status encoding closed to `success/info/warning/critical` (D-10 matrix asserted for all five statuses); the `critical`-family type pill is §5 grammar, not a new tint. |

## 3. Invariants (`ui-invariants.md` — INV-01…INV-17)

| ID | Verdict | Objective check evidence |
|---|---|---|
| INV-01 | **PASS** | `npm run lint` 0 violations (no raw hex, no default Tailwind color utility). |
| INV-02 | **PASS** | No frame/chrome region touched by this phase (top bar/rail unchanged since Phase 2). |
| INV-03 | **PASS** | Same lint pass (`no-generic-healthcare-blue`). |
| INV-04 | **PASS** | D-10 vocabulary→token matrix asserted for all five statuses; `bg-critical` type pill = frozen token; no new tint in `tokens.json`. |
| INV-05 | **PASS** | No `accent`/`accentSoft` class in the changed surface (asserted); chips and emphasis use `surfaceRaised` + `shadow-raised`. |
| INV-06 | **PASS** | Gamified-word sweep over rendered text (point/level/streak/reward/celebrat/confetti/trophy) = 0. |
| INV-07 | **PASS** | Radius grep: `rounded-pill`, `rounded-lg`, `rounded-md` (primitive) only. |
| INV-08 | **PASS** | Every compact control (tabs, status pill, range chips, grabber) is `radius.pill`; chips are inert SPANs, not dead buttons (asserted: zero `<button>` in the rendered body). |
| INV-09 | **PASS** | No interactive radius ≤4px (nothing below `radius.sm` appears). |
| INV-10 | **PASS** | Spacing grep above; all gaps/paddings on `space.*` steps; section gap 24px. |
| INV-11 | **PASS** | Zero `border-*`/`divide-*` classes; the grabber is a 4px rounded handle (reference motif), not a rule. |
| INV-12 | **PASS** | More-than-one-line assertion per card (identity + 3 context + band + 3 bottom); density cap `RECENT_ACTIVITY_LIMIT = 3` asserted. |
| INV-13 | **PASS** | Changed source references only `shadow-raised`; `tokens.json` shadow set untouched (lint). |
| INV-14 | **PASS** | No local box-shadow literal (lint `token-reference-required`). |
| INV-15 | **PASS** | No `borderSubtle` on any card edge (zero border classes). |
| INV-16 | **PASS** | No outlined card — `Surface` emits no perimeter edge; verified by grep. |
| INV-17 | **PASS** | No glass/backdrop-blur/inner-shadow/scrim added by this phase. |

## 4. Requirement traceability (WSP-01…WSP-03)

| Req | Ticket(s) | Evidence |
|---|---|---|
| **WSP-01** — primary nav is exactly the eight spec tabs in order | 01 | `workspace-overview.test.tsx`: slug array deep-equal, label array deep-equal, DOM order + single `aria-current`, and a **directory scan** of `[patientId]/` proving exactly the eight route folders exist (a new tab fails the test). |
| **WSP-02** — Overview answers who / matters now / changed / active / follow-up / recent at a glance | 01–04 | Identity (01), status + recency + record age (02), composed patient-scoped trail (03), timeline band + vitals/labs snapshot regions + inert Month/Week chrome (04). States: skeleton, empty, error+retry, denial (both record and activity reads). |
| **WSP-03** — no huge redundant cards; reference density | 05 | INV-10/INV-12 evidence above, type-scale greps, single-line-of-content assertions, `RECENT_ACTIVITY_LIMIT` cap, no duplicated clinical state between identity and context cards. |

## 5. Owner design-gate brief (§20.4) — items needing adjudication

1. **Recent-activity source (ticket 03).** `audit_log` SELECT is admin_owner-only by frozen
   decision (0003 D-15), so the trail is composed from `patients.created_at/updated_at` +
   `invitations` instead. Consequence: ticket 03's example event **"status changed"** renders
   only as the generic **"Record updated"** — the diff that would distinguish it is not
   readable by staff roles. *Ask:* accept for Phase 5, or authorize a narrow, redacted,
   org-staff RPC over `audit_log` (security change → owner decision, new migration).
2. **T-02-52 reading.** Ticket 01's checkbox says the route param is "never passed to a
   query", yet the identity fetch requires binding it. Checked under the documented reading:
   no interpolation into strings/paths/templates/logs — bound equality predicate after
   `patientIdSchema` (`.uuid()`), org-scoped, RLS underneath, same sanction as
   `changePatientStatusSchema`. *Ask:* confirm the reading or reword the ticket line.
3. **Identity-card extras.** A `Portal access` line and initials avatar sit beyond ticket
   01's named set ("name, MRN, date of birth, sex, status and last activity"), mirroring the
   `FolderCard` provenance affordance; status and last-activity themselves moved to the
   context row because ticket 02 places them "beside the identity area".
   *Ask:* keep or strip at the visual gate.
4. **Inert Month/Week chips** are `aria-hidden` spans (visual chrome until Phase 006 wires
   them). *Ask:* confirm this is the right no-dead-control posture for SR users.

## 6. Deliberately deferred (owner constraint: no heavy process this session)

- **Visual baselines:** `test:visual --update-snapshots` across 4 viewports × 2 motion states
  for every touched workspace surface, recorded as a deliberate regeneration act. This also
  produces the screenshot legs of QA rows 2 (pixel share), 4 (rendered heights) and 5
  (rendered widths).
- **pgTAP / RLS execution** against cloud Supabase (migrations 0001–0005 unchanged by this
  phase; `getPatient`/`listPatientInvitations` unit-prove the query contract, RLS is the
  database's job).
- **Owner visual review** of §5's four brief items and QA row 11's density read.

## 7. Gate status

**Implementation: GREEN** (428/428 unit, 0 tsc, 0 lint violations, build exit 0).
**Phase acceptance: PENDING** the deferred §6 items — a passing build is not acceptance
(§20.7, §27); QA rows and the owner's §5 verdicts decide.
