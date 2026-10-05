---
phase: 1-project-constitution-reference-ui-specification
plan: 01-02
subsystem: planning-governance
tags: [d-12, reference-registry, path-correction, planning-docs, diagnostic-asset]

requires:
  - phase: 01-project-constitution-reference-ui-specification
    provides: 01-RESEARCH.md §D-12 verified six-row executable correction table; 01-01 reference-manifest.json registering the diagnostic asset
provides:
  - All six stale `diagnostic-current-implementation.png` references in executable planning documents corrected to `patient-tracking-dashboard.jpg`
  - Repo-wide grep baseline proving the only remaining occurrences are decision records and plan instruction text
affects: [01-06 plan-close phase fence grep, phase 002 machine checks]

tech-stack:
  added: []
  patterns:
    - "Path corrections are applied row-by-row from the verified §D-12 table, never from D-12's prose list (which is over- and under-inclusive)"

key-files:
  created: []
  modified:
    - .planning/PROJECT.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
    - .planning/research/PITFALLS.md

key-decisions:
  - "ROADMAP.md target line had shifted from 44 to 47 since 01-RESEARCH.md was written; the token was corrected at its current location (line 47), not at the recorded line number"
  - "D-12's prose list was not followed literally: REQUIREMENTS.md and AGENTS.md were left untouched (no match exists), and STATE.md plus research/PITFALLS.md — missing from D-12's list — were corrected"
  - "docs/reference/patient-tracking-dashboard.jpg keeps its filename; no git mv, no rename, no deletion (D-12)"
  - "01-CONTEXT.md, 01-DISCUSSION-LOG.md and 01-UI-SPEC.md line 391 deliberately left quoting the stale string as decision record, transcript and carried open-item note"

patterns-established:
  - "Verified-table-over-prose: the executable row table in 01-RESEARCH.md §D-12 is the authority, not the decision's own file list"

requirements-completed: [GOV-02]

coverage:
  - id: D1
    description: "Six stale path references in four planning documents corrected to patient-tracking-dashboard.jpg (PROJECT.md:86,112; ROADMAP.md:47; STATE.md:67; PITFALLS.md:7,144)"
    requirement: GOV-02
    verification:
      - kind: other
        ref: "grep -rn \"diagnostic-current-implementation\\.png\" ."
        status: pass
      - kind: other
        ref: "git diff --cached --stat (4 files changed, 6 insertions(+), 6 deletions(-))"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every corrected path resolves to a real, registry-agreed asset: docs/reference/patient-tracking-dashboard.jpg with role: diagnostic"
    verification:
      - kind: other
        ref: "certutil -hashfile \"docs/reference/patient-tracking-dashboard.jpg\" SHA256 -> e1b0b74a5fc248750695ee95b1238d2c84932c5c9c4d5570b88dfa3b23c30c02"
        status: pass
      - kind: other
        ref: "node -e \"...reference-manifest.json...\" -> REGISTRY-AGREES"
        status: pass
    human_judgment: false
  - id: D3
    description: "Scope fence held: no reference asset renamed/moved, no product code, no docs/governance/ file created by this plan, decision records untouched"
    verification: []
    human_judgment: true
    rationale: "The literal acceptance criterion 'repo-wide grep returns matches in exactly three files' is unsatisfiable by construction: 01-02-PLAN.md and 01-06-PLAN.md quote the stale string as correction instructions inside their mandatory read_first/action text, and editing them is outside this plan's four-file scope fence. A human/verifier must confirm the residual matches are only (a) the three decision-record files and (b) plan instruction text — not a live reference defect."

duration: 4min
completed: 2026-10-05
status: complete
---

# Phase 1 Plan 01-02: D-12 Reference Path Corrections Summary

**Six stale `diagnostic-current-implementation.png` references across four executable planning documents corrected to the on-disk asset `patient-tracking-dashboard.jpg`, with the decision records deliberately preserved**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-05T22:50:55Z
- **Completed:** 2026-10-05T22:54:00Z
- **Tasks:** 2 (1 file-changing, 1 read-only verification)
- **Files modified:** 4

## Accomplishments

- All six verified rows of `01-RESEARCH.md` §D-12 corrected — `PROJECT.md` 86 and 112, `ROADMAP.md` 47 (recorded as 44; the line had shifted after 01-01 rewrote the roadmap), `STATE.md` 67, `research/PITFALLS.md` 7 and 144.
- Only the stale path token changed: 6 insertions / 6 deletions across 4 files, with the backticks, table cells, list numbering and surrounding prose byte-identical.
- The full-path rows (`PROJECT.md:86`, `PITFALLS.md:7`, `PITFALLS.md:144`) received `docs/reference/patient-tracking-dashboard.jpg`; the bare-token rows (`PROJECT.md:112`, `ROADMAP.md:47`, `STATE.md:67`) received `patient-tracking-dashboard.jpg`, so no `docs/reference/docs/reference/` duplication exists.
- Corrected paths verified against reality: `certutil -hashfile docs/reference/patient-tracking-dashboard.jpg SHA256` succeeds (64-hex digest `e1b0b74a5fc248750695ee95b1238d2c84932c5c9c4d5570b88dfa3b23c30c02`) and `docs/governance/reference-manifest.json` returns `REGISTRY-AGREES` for its `role: diagnostic` entry.
- `REQUIREMENTS.md` and `AGENTS.md` were left untouched as verified — neither contained the stale string, so D-12's prose list was not followed literally.

## Task Commits

1. **Task 1: apply the six verified path corrections** — `9febd6a` (docs)
2. **Task 2: cross-check corrected paths against the asset registry contract** — no commit (read-only verification, `<files>none</files>`; nothing to commit)

**Plan metadata:** `9febd6a` is the task commit; the metadata commit follows this SUMMARY.

## Files Created/Modified

- `.planning/PROJECT.md` — lines 86 and 112: reference-asset bullet and key-decision row now name `patient-tracking-dashboard.jpg`
- `.planning/ROADMAP.md` — line 47: Phase 1 Success Criterion 1 now cites `patient-tracking-dashboard.jpg`
- `.planning/STATE.md` — line 67: accumulated-context memory line now cites `patient-tracking-dashboard.jpg`
- `.planning/research/PITFALLS.md` — lines 7 and 144: intro and color-drift pitfall paragraphs now cite `docs/reference/patient-tracking-dashboard.jpg`

## Decisions Made

- **Corrected at the current location, not the recorded line number.** `ROADMAP.md` line 44 was actually line 47 after 01-01's roadmap rewrite; the token was corrected where it lives, matching the plan's explicit instruction to re-locate rather than trust the recorded number.
- **The verified table beats D-12's prose.** D-12 names `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `AGENTS.md`; grep proves two of those have no match while `STATE.md` and `research/PITFALLS.md` do. The six-row §D-12 executable table was treated as authoritative.
- **Decision records are not retroactively edited.** `01-CONTEXT.md` (49, 106), `01-DISCUSSION-LOG.md` (67, 71) and `01-UI-SPEC.md` (391) still quote the stale string by design — they record what was decided, what was discussed, and the open item now resolved.
- **No `git mv`.** The diagnostic asset keeps its filename; nothing under `docs/reference/` was renamed, moved or deleted by this plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Acceptance-criterion wording conflict (documented, not a defect in the work).** Task 1's criterion states the repo-wide grep must return matches "in exactly three files". That is unsatisfiable by construction: `.planning/phases/01-.../01-02-PLAN.md` quotes the stale token many times in its own correction table and action text, and `.planning/phases/01-.../01-06-PLAN.md` line 195 quotes it in a later plan's verification step. Both are outside this plan's four-file scope fence and must not be edited. Excluding plan instruction text, the residual matches are exactly the three named decision-record files:

| File | Lines | Status |
|---|---|---|
| `01-CONTEXT.md` | 49, 106 | untouched (decision record) |
| `01-DISCUSSION-LOG.md` | 67, 71 | untouched (historical transcript) |
| `01-UI-SPEC.md` | 391 | untouched (carried open-item note) |
| `01-02-PLAN.md` | 16, 33, 48–53, 55, 83, 87, 89, 91, 93, 95, 97 | plan instruction text quoting the token — not a reference |
| `01-06-PLAN.md` | 195 | later plan's verification instruction — not a reference |

No `*.md` other than those five contains the string; no source, config or governance file does.

**Pre-existing working-tree state left alone (per scope fence).** `.planning/config.json` is modified (orchestrator-owned) and `docs/reference/diagnostic-current-implementation.png` is deleted with `docs/reference/patient-tracking-dashboard.jpg` untracked (user's own asset migration). This plan neither staged nor reverted any of it. Consequently `git status --short docs/reference/` is not empty — the deletion/untracked pair is the user's migration, not this plan's action, and no `git mv` was run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The six executable D-12 rows are closed; 01-06's phase-fence grep will find the stale token only in the three decision records plus plan instruction text.
- `docs/governance/reference-manifest.json` (01-01) and the planning documents now agree on the diagnostic asset's path.
- Ready for plan 01-03 (`project-constitution.md`), whose §Reference registry human-readable table must mirror the manifest: three `binding` primaries plus one `diagnostic` entry.

## Self-Check: PASSED

- `.planning/phases/01-project-constitution-reference-ui-specification/01-02-SUMMARY.md` — FOUND
- Commit `9febd6a` — FOUND (`git log` confirms `docs(01-02): correct D-12 stale diagnostic reference paths`)
- All four target files contain `patient-tracking-dashboard.jpg` at the corrected lines — VERIFIED via grep
- No stale token remains in any non-plan, non-decision-record file — VERIFIED via repo-wide grep

---
*Phase: 01-project-constitution-reference-ui-specification*
*Completed: 2026-10-05*
