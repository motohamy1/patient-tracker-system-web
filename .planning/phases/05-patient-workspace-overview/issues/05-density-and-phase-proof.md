# 05: Match the reference's compact density, then prove the phase

**What to build:** Overview is tightened until it carries the reference's compact clinical rhythm — no oversized section, no bulky tile, no card holding a single line — and then the phase is proven: every applicable QA row and invariant evaluated against the running surface, visual baselines regenerated for the touched workspace surfaces, and the phase's verification artifact written back into the planning state so Phase 006 starts from coherent evidence.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-human

- [x] **WSP-03** satisfied: no huge redundant cards; density follows the reference's compact clinical rhythm
- [x] No card's rendered height exceeds that of its closest reference counterpart; no dashboard tile exceeds the density of the reference folder card (INV-12, QA row 4) — *code-level evidence; rendered-height leg runs with the deferred screenshots*
- [x] Every gap and padding is one of `space.xs` … `space.2xl`; no page-level section gap exceeds 32px (INV-10, QA row 3) — *grep evidence in 05-VERIFICATION §2*
- [x] Only `font.size` values and weights 400/600 appear (QA row 7) — *test-asserted greps*
- [x] All 12 rows of `docs/governance/visual-qa-rules.md` §1 evaluated and recorded, with rows 8–10 explicitly N/A → Phase 006
- [x] INV-01 … INV-17 evaluated against their stated objective check and recorded; the machine-enforceable subset (INV-01, INV-03, INV-13, INV-14) reports zero violations
- [ ] Visual baselines regenerated for every touched workspace surface across the four viewports (1440x900, 1280x800, 768x1024, 390x844) and both motion states, recorded as a deliberate `--update-snapshots` act — **DEFERRED: owner constraint this session (no heavy process / cloud Supabase later)**; this run also produces the screenshot legs of QA rows 2, 4, 5
- [x] `05-VERIFICATION.md` written into `.planning/phases/05-patient-workspace-overview/` recording WSP-01..03 traceability, the QA and INV tables, and a design-gate brief for any row requiring owner adjudication
- [x] A passing build is **not** accepted as done on its own (§20.7, §27); the QA rows and invariants decide

**Gate evidence at close:** the full 12-row QA gate + INV-01…17 · Serves WSP-03, QA-03

## Comments

### 2026-10-09 — agent work complete; status `ready-for-human`

- **Density pass:** spacing/radius/font/shadow greps over `src/components/workspace` +
  the Overview route — `space.*` steps only (auto margins per the FolderCard precedent),
  radii `pill|lg|md`, weight 600 only, `shadow-raised` only, zero border classes,
  section gap 24px. Duplicate clinical state removed (identity = who; context row = state).
- **Proof written:** `.planning/phases/05-patient-workspace-overview/05-VERIFICATION.md`
  — evidence table (428/428 unit, tsc 0, lint 0, build exit 0), all 12 QA rows
  (8–10 N/A → Phase 006), INV-01…17, WSP-01..03 trace, the §5 owner brief
  (audit_log/T-02-52 reading/identity extras/inert chips), and §6 deferrals.
- **code-review applied before close:** Standards axis 0 hard breaches; fixed
  SupabasePermissionError classification, the type cycle, shared grid constants, UTC date
  agreement, §7 next-step copy, StateVariant wording, denial-block dedupe. Spec axis: record
  denial now branches on privilege failure; remaining findings recorded in §5 for adjudication.
- **What remains for the human/cloud session:** visual baselines (`--update-snapshots`),
  the screenshot legs of QA rows 2/4/5, pgTAP against cloud Supabase, and the §5 owner
  verdicts — phase acceptance waits on these (§20.7).
