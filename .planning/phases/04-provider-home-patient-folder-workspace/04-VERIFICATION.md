# Phase 4: Provider Home + Patient Folder Workspace — Verification

**Verified:** 2026-10-08
**Status:** **COMPLETE — owner design gate APPROVED (R-1: A, R-2: A, 2026-10-08)**
**Mode:** mvp · Plans: 04-01 … 04-05 · Executed by: orchestrator (data layer, verification) + delegated UI builder (04-03/04-04) on flash

---

## 1. Evidence (commands run, actual output)

| Gate | Command | Result |
|---|---|---|
| Migrations | `supabase db reset` | exit 0 — 0001…0005 applied |
| DB acceptance | `supabase test db` | **Files=5, Tests=57, PASS** (suite 0005 contributes 18: RLS, MRN sequencing, trigger bumps, invite auto-link) |
| Types | `supabase gen types typescript --local` | exit 0 — `patients` present with `mrn: string` (NOT NULL) |
| Unit (full) | `npx vitest run tests/unit` | **33 files, 379/379 passed** |
| Lint / tokens | `npm run lint` | exit 0, 0 violations (96 files) |
| Types | `npx tsc --noEmit` | **0 errors** |
| Build | `npm run build` | **exit 0** (full production build; `/provider` routes listed dynamic) |
| Visual (scoped regen) | `playwright … -g "provider-home" --update-snapshots` | **18/18 passed** — provider-home 8 baselines regenerated (deliberate, recorded per 02/03 policy), provider-home-new-patient 8 baselines created |
| Visual (full matrix) | `npm run test:visual` | **120 passed, 2 failed** — the 2 are pre-existing Phase-3 `offline-strip @ 390x844` (both motion states), identical to 03-07's committed baselines; NOT a Phase-4 regression |
| Governance suite | `node scripts/validate-governance.mjs --json` | **14/16 pass**; the 2 failures PRE-DATE this phase and are structural: GOV-04e asserts "no product code exists" (frozen Phase-01 check, false since Phase 2 shipped `package.json`/`src`/`tests`), GOV-02c is a stale filename inside `02-05-SUMMARY.md`'s historical record. The R-1 governance edits pass GOV-04c (raw-hex confinement: 0 hits outside `tokens.json`). |

**Deliberate environment findings this phase** (each was root-caused, not papered over):
1. `NODE_ENV=production` leaked into the persistent shell from a verify run → every jsdom `node:*` import failed (`No such built-in module: node:`). Fix: run tooling with `env -u NODE_ENV` (vitest sets `test` itself; Next needs NODE_ENV unset to load `.env.local` — NODE_ENV=test skips it).
2. Docker's engine died mid-session → GoTrue unreachable (`000` health) → auth-setup sign-in failed. Fix: relaunch Docker Desktop, `supabase start`, re-verified password grant returns an access_token before re-running.
3. Generated-column immutability: `to_char` not immutable + `lower()` has no resolvable collation in a generated column → DOB segment composed from `extract()` parts, case folded by ILIKE (empirically probed against the live engine).

## 2. Visual QA gate (visual-qa-rules.md §1 — 12 rows)

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS with recorded deviation** — folder grid + retrieval row match §4 grammar; the reference's Today's-Schedule rail and Critical-Alerts/Daily-Stats panels are OUT OF PHASE-4 SCOPE (no appointments until Phase 7, no clinical events yet; rendering them would fabricate content per FOUND-01/§27). Deviation declared in 04-UI-SPEC §0. |
| 2 | Color relationships | PASS — cards separate by `shadow-raised` only (no borders); accent pixel-share ≤10% (only the CTA is accent-family) |
| 3 | Spacing rhythm | PASS — six-step space scale only; grid gap `space.lg`; no section >32px |
| 4 | Compactness | PASS — card rows dense (name/MRN, line, pill+identity, activity); no 1-line cards |
| 5 | Card proportions | PASS — `lg:grid-cols-3` at ≥1024px (asserted in tests), 2 at tablet, 1 at mobile |
| 6 | Pill controls | PASS — tabs/CTA/buttons all `radius.pill`; no corner ≤4px |
| 7 | Typography hierarchy | PASS — weights 400/600 only; `tabular-nums` on MRN, dates, counts, age |
| 8 | Timeline proportions | **N/A** — Phase 006 (02-11 precedent) |
| 9 | Node/branch behavior | **N/A** — Phase 006 |
| 10 | Bottom scrubber | **N/A** — Phase 006 |
| 11 | Visual density | PASS — provider home reads dense; identical language to shells |
| 12 | Accent restraint | PASS with **R-1 owner adjudication** — CTA is `accentSoft` (reserved list); status palette question escalated below |

## 3. Invariants (ui-invariants.md)

INV-01 (token-only; grep of new files: zero raw hex) · INV-02 (light frame untouched) · INV-03 (no blue/indigo/violet) · INV-04 → **R-1** · INV-05 (accentSoft CTA only) · INV-06 (gamified-words grep: zero matches) · INV-07/08/09 (five radius steps, pill controls, no sharp corners — primitives only) · INV-10 (spacing scale; 44px targets kept) · INV-11 → **R-2** · INV-12 (density) · INV-13/14 (only `shadow.raised`/`shadow.overlay`; zero local shadows) · INV-15/16 (no card borders — cards are shadow-separated) · INV-17 (no new glass/scrims).

## 4. OWNER DESIGN GATE — decision brief (§20.4) · verdicts **APPROVED (R-1: A, R-2: A, 2026-10-08)**

**R-1 — `critical` folder status color vs INV-04's letter (blocking).**
- D-10 (locked this phase) maps status `critical` → the frozen `critical` token; INV-04's objective check limits status encoding to `success`/`info`/`warning`.
- Argument FOR accepting D-10: `critical` is one of the 15 frozen tokens (not a new tint family — what INV-04 actually forbids); a critical patient must not wear follow-up amber (clinical legibility); the reference itself uses a `critical`-family surface on Provider Home.
- **Option A (recommended):** accept D-10 and amend INV-04's wording to "subset of `success`/`info`/`warning`/`critical`" (governance edit recorded here, never silent).
- **Option B:** reject — remap `critical` → `warning` (re-cards the folder line + Pill + tests).
- **Verdict (recorded verbatim):** **approved** — option A accepted: INV-04 amended to admit the frozen `critical` family (amendment text now live in `ui-invariants.md`, `visual-qa-rules.md` row 12 and `reference-ui-specification.md` §4; no other governance text touched).

**R-2 — 2px status line vs INV-11's 1px letter (non-blocking).**
- §4 binds "thin progress lines"; the reference bar renders ≈2–4px; INV-11 caps *rules/dividers/axis lines* at 1px. This implementation classifies the status line as a **status indicator**, not a rule/divider, and renders it at 2px (`h-0.5`, rounded).
- **Option A (recommended):** accept the classification. **Option B:** require 1px.
- **Verdict (recorded verbatim):** **approved** — option A accepted: the 2px status line is a status indicator, not a rule/divider; INV-11 unchanged.

## 5. UX-07 (retrieval performance) evidence

One indexed query per request: `search_text` (generated projection of name+MRN+phone+DOB) served by a **pg_trgm GIN index**; user text enters only as an escaped `ilike` pattern (never `.or()` grammar); pagination is server-side cumulative `range(0, shown+limit)` + exact count — the browser never receives the full collection.

## 6. Visual matrix (scoped regen + full matrix)

- Provider-home regeneration (deliberate, previous empty shell): 8 baselines regenerated (4 viewports × 2 motion states) — 18/18 scoped PASS.
- Provider-home-new-patient (new surface): 8 baselines created — 8/8 PASS.
- Full `npm run test:visual` (all surfaces): 120 passed, 2 FAILED — the 2 failures are pre-existing, NOT Phase-4-related (`offline-strip @ 390x844`, default + reduced-motion, identical to Phase-3 baseline — 03-07/03-08 notes).
- Design-gate verdict (2026-10-08): **R-1 APPROVED (option A)** — INV-04 + QA row 12 + ref §4 amended to admit the frozen `critical` family; **R-2 APPROVED (option A)** — 2px status line accepted as an indicator, INV-11 unchanged. Phase closed.

## 7. §27 / scope sweep (grep evidence)

- Gamified vocabulary in new surfaces: **0 matches** (INV-06).
- Specialty labels (cardiology/pediatrics/oncology/neurology) in phase files: **0 matches**.
- Raw hex in `src/components/patients/**` + `src/lib/patients/**`: **0 matches**.
- Client-side role toggles: **0 matches** (role resolved server-side in layout, unchanged).
- `getSession(` calls: **0** (only a comment stating "never getSession").
- Destructive SQL: **0** `drop`/`truncate` in 0005 (source-asserted at plan time).

## 8. Scope trace D-01…D-23 → shipped behavior

| D | Shipped as |
|---|---|
| D-01 record-only | createPatientAction inserts identity only; no account created |
| D-02 core identity | 5-field modal (name/DOB/sex/phone), MRN auto |
| D-03 optional user_id | nullable FK `on delete set null`; self-select RLS policy |
| D-04 invite auto-link | `invitations.patient_id` + `redeem_invite` sets `patients.user_id` (pgTAP 17/18) + org guard |
| D-05 modal | Overlay primitive, 04-04 |
| D-06 stay on home | `revalidatePath('/provider')` + refresh; no navigation (unit-asserted) |
| D-07 MRN | trigger + advisory lock; pgTAP 3–6 (MRN-0001/0002, injected 999 overwritten, per-org restart) |
| D-08 M/F | `check (sex in ('M','F'))` + `z.enum(['M','F'])` |
| D-09 enum | 5-string check + `status.ts` mirror (drift test) |
| D-10 colors | `PATIENT_STATUS_TOKEN` single mapping; Pill critical tone w/ D-10 record — **R-1 at gate** |
| D-11 filters | predicates in `listPatients` + SegmentedControl tabs (unit-asserted) |
| D-12 tabs replace grid | tabs rewrite URL → server re-render (page test) |
| D-13 default new | SQL default `'new'` + drift test |
| D-14 Today | client-local `d=YYYY-MM-DD` window, schema-regex gated (unit-asserted) |
| D-15 quick actions | kebab Overlay: status/invite/schedule (tests: row visibility rules) |
| D-16 CTA | accentSoft "Add new patient", enabled (Phase-2 comment fulfilled) |
| D-17 search fields | `search_text` projection of name+MRN+phone+DOB |
| D-18 server+300ms | `ProviderSearchControl` debounce constant asserted; no client filtering |
| D-19 search-in-filter | one composed query (unit-asserted) |
| D-20 pagination | cumulative 24/page + exact total (unit-asserted) |
| D-21 patients only | migration creates ONLY `patients` among clinical tables (test) |
| D-22 last_activity_at | trigger-owned; status-change + invite-sent bumps (pgTAP 15/16) |
| D-23 schema | exact column set + org-scoped RLS (pgTAP 1/2/8/9) |

## 9. Gate status

- [x] All five plans executed; summaries written (04-01…04-04; 04-05 = this doc)
- [x] Unit/lint/tsc/build/pgTAP green (§1)
- [x] **Owner sign-off: APPROVED** (R-1 option A, R-2 option A — recorded above; phase accepted)
- [x] Known pre-existing gaps recorded (not owned by this phase): `offline-strip @ 390x844` visual baseline ×2; GOV-04e/GOV-02c governance-suite failures
- [x] **PHASE 4: COMPLETE**
