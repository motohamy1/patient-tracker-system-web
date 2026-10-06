---
phase: 01-project-constitution-reference-ui-specification
reviewed: 2026-10-07
depth: standard
files_reviewed: 18
files_reviewed_list:
  - docs/governance/project-constitution.md
  - docs/governance/reference-ui-specification.md
  - docs/governance/ui-invariants.md
  - docs/governance/visual-qa-rules.md
  - docs/governance/responsive-rules.md
  - docs/governance/motion-rules.md
  - docs/governance/tokens.json
  - docs/governance/reference-manifest.json
  - .planning/PROJECT.md
  - .planning/ROADMAP.md
  - .planning/STATE.md
  - .planning/research/PITFALLS.md
  - .planning/phases/01-project-constitution-reference-ui-specification/01-01-SUMMARY.md
  - .planning/phases/01-project-constitution-reference-ui-specification/01-02-SUMMARY.md
  - .planning/phases/01-project-constitution-reference-ui-specification/01-03-SUMMARY.md
  - .planning/phases/01-project-constitution-reference-ui-specification/01-04-SUMMARY.md
  - .planning/phases/01-project-constitution-reference-ui-specification/01-05-SUMMARY.md
  - .planning/phases/01-project-constitution-reference-ui-specification/01-06-SUMMARY.md
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: clean
open_after_fixes: 0
fixes:
  applied: 4
  skipped: 0
  commits:
    WR-01: 849e657
    WR-02: 4d4d7c2
    WR-03: 9db85cc
    IN-01: b160631
  report: 01-REVIEW-FIX.md
---

# Phase 01: Code Review Report (specification corpus)

**Reviewed:** 2026-10-06
**Depth:** standard
**Files Reviewed:** 18 (8 governance artifacts reviewed at depth; 10 `.planning/` tracking files verified against the phase diff `1f58825..2014e84`)
**Status:** clean — all four findings fixed on 2026-10-06 (see each finding's `Fixed:` line and `01-REVIEW-FIX.md`); no Critical or Warning finding remains open.

## Summary

Phase 01 is a governance/docs-only phase (no source code, no package.json, no tests — correctly enforced by the phase fence; the absence of those is not reported here). The eight `docs/governance/` artifacts were cross-checked against each other, against `tokens.json` → `color` / `radius` / `space` / `font` / `shadow` / `motion`, and against `reference-manifest.json`. All four reference-asset sha256 values in both the constitution §5 table and the manifest were recomputed against the files on disk and **match**. The 15-key color key set, the 15 token names, the 5-step radius scale, the 6-step space scale, the 2-key shadow set and the motion values all agree with `tokens.json`. Raw hex is confined to `tokens.json`. D-12 path corrections in the planning files verified on the current line locations. The 17 INV IDs and 12 QA rows are present with no duplicates.

Four findings survive that sweep: one post-D-08 contradiction in the accent reserved list (repeated in three documents), one vocabulary divergence between the constitution's machine-check contract and INV-03, one do-not-reuse list mismatch between the manifest and the two prose documents, and one non-resolving anchor-claim in the manifest. None blocks the D-08 gate outcome; WR-01 and WR-02 should be fixed before Phase 002 implements `no-generic-healthcare-blue` or styles a CTA, because both are the kind of contradiction that lets machine-checked code violate the documented intent.

## Critical Issues

None.

## Warning Issues

### WR-01 — Accent reserved list still reserves "the primary CTA" for `accent` after `accentSoft` was admitted

- **Files:** `docs/governance/reference-ui-specification.md` (line 132, accent reserved list; also `ui-invariants.md` line 61 / INV-05, `visual-qa-rules.md` line 34 / QA row 12), `docs/governance/ui-invariants.md` (61), `docs/governance/visual-qa-rules.md` (34)
- **Issue:** The D-08 gate admitted `accentSoft` as the provider-home primary-CTA gold (`reference-ui-specification.md` lines 113 and 122 say `accentSoft` "carries the primary CTA"; constitution §4.3 says the same). But every accent **reserved list** still enumerates "the primary CTA" as an approved use of `accent` (the timeline chartreuse). These are machine-checked sentences: a surface whose primary CTA is painted chartreuse `accent` **passes** INV-05 and QA row 12 as written while contradicting the token table and the D-02 split. Related: QA row 12 in the normative file omits "important-interaction highlights" from the reserved-list enumeration, while INV-05 and spec §2.1 (line 136) include it — the two gate documents no longer enumerate the same reserved list.
- **Impact:** An implementer in Phase 002+ can satisfy every machine check listed in the governance package and still violate the D-02 accent split that the gate just adjudicated. Also creates an INV-05 / QA-row-12 divergence inside the gate pair that is required to form "one gate."
- **Fix:** In all four reserved-list occurrences, replace "the primary CTA" with "the provider-home primary CTA (`accentSoft`)" — or move "primary CTA" out of the `accent` reserved list entirely — and add "important-interaction highlights" to visual-qa-rules row 12 so the normative list matches INV-05 and spec §2.1.
- **Fixed:** `849e657` — the primary CTA now belongs to the `accentSoft` reserved list in all three documents (spec §2.1, INV-05, QA row 12), QA row 12 gained `important-interaction highlights`, and each list enumerates the same accent set (nodes/count badges, milestone markers, active/selected emphasis markers, state indicator dots, important-interaction highlights) plus the same `accentSoft` set (provider-home primary CTA, key interaction buttons). Agreement check: `RESERVED-LIST-AGREEMENT-OK`.

### WR-02 — Constitution's `no-generic-healthcare-blue` check omits "violet" while INV-03 bans it

- **Files:** `docs/governance/project-constitution.md` (lines 269–272; same blue/indigo/purple vocabulary at lines 119 and 232), `docs/governance/ui-invariants.md` (lines 57, 59 — INV-01/INV-03 ban blue, indigo, violet **and purple**)
- **Issue:** `ui-invariants.md` states the machine-enforceable subset (`INV-01`, `INV-03`, `INV-13`, `INV-14`) is implemented in Phase 002 "by the three checks named in `docs/governance/project-constitution.md` §8", and the constitution §8 closes with "Phase 002 implements exactly what this phase wrote — no more, no fewer." But the check names a substitution ban over "blue/indigo/purple" while INV-03's objective check additionally greps `violet-`. As written, the Phase-002 machine check for `no-generic-healthcare-blue` would pass code that fails INV-03 (e.g. the Tailwind `violet-500` utility), because the check's own failure condition never names violet.
- **Impact:** The three-check contract and the invariant registry disagree on the exact banned vocabulary for the one check that is supposed to enforce INV-03 exactly.
- **Fix:** In `project-constitution.md` §8 (`no-generic-healthcare-blue` failure statement) and in §4.1/§7 where the ban is restated, change "blue/indigo/purple" to "blue/indigo/violet/purple" (or state explicitly that the check implements the INV-01/INV-03 grep vocabulary including `violet-`).
- **Fixed:** `4d4d7c2` — the `no-generic-healthcare-blue` failure condition and the §4.1/§7 restatements now name the `INV-01`/`INV-03` grep vocabulary (`blue-`, `indigo-`, `violet-`, `purple-`); INV-03 itself is unchanged. Assertion: `WORDING-ALIGNED-OK`.

### WR-03 — `reference-manifest.json` → `doNotReuse` is a strict subset of the prose lists while spec §9 claims the lists agree

- **Files:** `docs/governance/reference-manifest.json` (lines 57–71), `docs/governance/reference-ui-specification.md` (688–691), `docs/governance/project-constitution.md` (§6, lines ~227–243)
- **Issue:** `reference-ui-specification.md` §9 states "docs/governance/reference-manifest.json carries the same list under `doNotReuse`, and the two lists must agree." The prose lists (spec §9 and constitution §6) contain: 5 patient names (including `Dr. Smith`), numeric IDs and MRNs, 2 medications, the `Cardiology` label, the `Vital Signs`/`Communication` tabs, 4 vitals values (`72 bpm`, `118/75`, `98%`, `36.8°C`), 3 lab names (`CBC Panel`, `Lipid Profile`, `Glucose`), appointment/sample rows, and "Daily Stats" numbers. The manifest's `doNotReuse` carries only a 4-name list (no `Dr. Smith`), a 3-label list and a 2-medication list. The categories the manifest omits are precisely the numeric/sample-row-value categories that a machine consumer (Phase 002/003 lint or seed-data check reading the manifest) would fail to enforce.
- **Impact:** The manifest is the machine-readable registry that later phases re-verify and consume; anything not on its list can be seeded as literal product content while the prose phase record claims the lists were verified entry-for-entry (01-04-SUMMARY "consistent with the manifest, entry-for-entry" is not true of §9's full list).
- **Fix:** Either add the missing entries/categories to `reference-manifest.json` → `doNotReuse` (extensions array for ids/vitals-values/lab-names/appointment-rows/stats-numbers), or weaken the spec §9/constitution §5 claim to "the manifest carries the nominal labels (names, labels, medications); the value-level categories are enforced by prose review" — one or the other, not both claims as written.
- **Fixed:** `9db85cc` — extended (the manifest-extension branch): `doNotReuse` now carries `Dr. Smith`, `vitalsValues` (`72 bpm`, `118/75`, `98%`, `36.8°C`) and `labNames` (`CBC Panel`, `Lipid Profile`, `Glucose`) as enumerable arrays plus category-level `ids`, `appointmentRows` and `dailyStatsNumbers` entries; spec §9's claim now names those keys. Assertion: `MANIFEST-DONOTREUSE-OK`.

## Info Issues

### IN-01 — Manifest anchor citations do not resolve as written

- **Files:** `docs/governance/reference-manifest.json` (lines 16, 28, 39, 70), `docs/governance/reference-ui-specification.md` (§1 "resolve to §4, §5 and §6 respectively")
- **Issue:** The manifest records anchors such as `reference-ui-specification.md#provider-home-grammar`, but the spec's headings are numbered ("## 4. Provider Home grammar"), whose renderer-generated slug is `4-provider-home-grammar`; likewise rule string `#sample-content-do-not-reuse` vs "## 9. Sample content — do not reuse" (slug `9-sample-content--do-not-reuse`). The three surface anchors point at the right sections in intent, which is why this is Info, but none resolves as a literal fragment link in a slug-generating renderer.
- **Impact:** Cosmetic/lookup friction for phases citing the registry by anchor; no token or grammar drift.
- **Fix:** Repoint the manifest strings at the unambiguous numbered anchors (e.g. `#4-provider-home-grammar`) or cite "spec §4/§5/§6/§9" as section names instead of fragment URLs.
- **Fixed:** `b160631` — the four fragments now resolve against the spec's rendered numbered heading slugs: `#4-provider-home-grammar`, `#5-patient-workspace-and-d3-timeline-grammar`, `#6-patient-home-grammar` and `#9-sample-content--do-not-reuse` (sections §4/§5/§6/§9 preserved). Assertion: `MANIFEST-ANCHORS-RESOLVE-OK`.

## Verified (no finding)

- All four sha256 values (constitution §5 table and manifest) recomputed against the JPGs on disk — match, including the diagnostic asset.
- `tokens.json` valid JSON; `color` holds exactly the 15 enumerated keys in the documented order with `accentSoft` immediately after `accent`; `review.gateStatus: approved-with-changes`; `review.accentSplit.ownerConfirmed: true`; no governance `.md` or the manifest contains a `#RRGGBB` literal.
- Radius (`sm 8px / md 12px / lg 16px / xl 24px / pill 999px`), space (`4/8/12/16/24/32px`), the two `shadow.` keys and the four motion values quoted in `ui-invariants.md`, `responsive-rules.md`, `motion-rules.md`, spec §2.2–§2.5 all match `tokens.json` exactly.
- 17 INV IDs (INV-01…INV-17, no gaps/reuse) and 12 QA rows, row numbers and check names agreeing row-for-row between `visual-qa-rules.md` §1 and spec §8.1.
- D-12 corrections: the six rows now name `patient-tracking-dashboard.jpg` (PROJECT.md 86/112, ROADMAP 47, STATE 74, PITFALLS 7/144); residual `diagnostic-current-implementation.png` strings are confined to the three decision-record files, historical plan/summary records and an unrelated worktree checkout, matching the 01-02/01-06 summaries.
- Phase fence hangs: no `package.json`, `src/`, `tokens.css`, Tailwind config, `tests/`, lint rules or CI config exists, and the phase's own fence declares these Phase-002 scope — not reported as findings.

---

## Fix verification (2026-10-06)

All four findings were fixed via `/gsd-code-review 1 --fix`, one atomic commit per finding; each fix was asserted before its commit and every assertion was re-run after the last commit. Narrative: `01-REVIEW-FIX.md`.

| Finding | Commit | Assertion | Result |
|---|---|---|---|
| WR-01 | `849e657` | reserved-list agreement across spec §2.1 / INV-05 / QA row 12 — canonical accent item sets identical, no accent region assigns the primary CTA | `RESERVED-LIST-AGREEMENT-OK` |
| WR-02 | `4d4d7c2` | constitution names every `INV-01`/`INV-03` utility (`blue-`, `indigo-`, `violet-`, `purple-`) in the machine-check failure condition; INV-03 unchanged | `WORDING-ALIGNED-OK` |
| WR-03 | `9db85cc` | manifest JSON parses; `doNotReuse` covers every prose category (concrete value arrays plus category-level entries); the spec §9 claim names the keys it has; the 01-04 / 01-01 do-not-reuse assertions still pass | `MANIFEST-DONOTREUSE-OK` |
| IN-01 | `b160631` | every manifest fragment resolves to a rendered numbered heading slug; no stale fragment remains | `MANIFEST-ANCHORS-RESOLVE-OK` |

**Regression guard after all four fixes:** `REGRESSION-GUARD-OK` — the 15-key `tokens.json` key set with `accentSoft` immediately after `accent`, the 15 frozen hex values, the hex regex, the `shadow` ink derivation from `textPrimary`, the radius / space / font / motion key sets, `review.gateStatus: approved-with-changes` and `review.accentSplit.ownerConfirmed: true` all still hold; the raw-hex grep across `docs/governance/` matches only `tokens.json`; and `git diff --name-only 2014e84..HEAD` shows no STATE / ROADMAP / PROJECT / REQUIREMENTS / PLAN / SUMMARY file changed.

**Not changed by the fixes:** `tokens.json`, `responsive-rules.md`, `motion-rules.md`, `01-VERIFICATION.md`, and every `.planning/` tracking, plan and summary file.
