---
phase: 01-project-constitution-reference-ui-specification
fixed_at: 2026-10-06
review_path: .planning/phases/01-project-constitution-reference-ui-specification/01-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-10-06
**Source review:** `.planning/phases/01-project-constitution-reference-ui-specification/01-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (3 Warning, 1 Info — the review had no Critical findings)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Accent reserved list still reserves "the primary CTA" for `accent` after `accentSoft` was admitted

**Files modified:** `docs/governance/reference-ui-specification.md`, `docs/governance/ui-invariants.md`, `docs/governance/visual-qa-rules.md`
**Commit:** `849e657`
**Applied fix:** Split the single accent reserved list into two explicit, mutually exclusive lists in all three documents. `accent` (timeline chartreuse) is reserved for timeline event nodes and their count badges, timeline milestone markers, active/selected emphasis markers, key state indicator dots and important-interaction highlights; `accentSoft` (CTA gold) carries the provider-home primary CTA and key interaction buttons. Spec §2.1's `accent` not-for list now names the primary CTA as `accentSoft`; INV-05 states that a primary CTA painted `accent` fails; QA row 12 gained the missing `important-interaction highlights` item so it enumerates the same set as INV-05 and §2.1. Assertion: `RESERVED-LIST-AGREEMENT-OK` (canonical accent item set identical across the three documents, no accent region assigns the CTA, no misattribution).

### WR-02: Constitution's `no-generic-healthcare-blue` check omits "violet" while INV-03 bans it

**Files modified:** `docs/governance/project-constitution.md`
**Commit:** `4d4d7c2`
**Applied fix:** Took the review's explicit alternative — the machine check now states that it implements the `INV-01`/`INV-03` grep vocabulary exactly (`blue-`, `indigo-`, `violet-`, `purple-`) in its failure condition, so a Tailwind `violet-` utility fails it. The §4.1 substitution ban and the §7 explicit-violations bullet name the same vocabulary. INV-03 is not weakened, and the `blue/indigo/purple` phrasing asserted by 01-03-PLAN.md's keyword check is preserved verbatim (4 occurrences). Assertion: `WORDING-ALIGNED-OK`.

### WR-03: `reference-manifest.json` → `doNotReuse` is a strict subset of the prose lists while spec §9 claims the lists agree

**Files modified:** `docs/governance/reference-manifest.json`, `docs/governance/reference-ui-specification.md`
**Commit:** `9db85cc`
**Applied fix:** Took the manifest-extension branch, keeping the existing `names`/`labels`/`medications`/`rule` keys and JSON shape. Added `Dr. Smith` to `names`; added `vitalsValues` (`72 bpm`, `118/75`, `98%`, `36.8°C`) and `labNames` (`CBC Panel`, `Lipid Profile`, `Glucose`) as enumerable arrays; added explicit category-level entries (`ids`, `appointmentRows`, `dailyStatsNumbers`, each an object with a `category` label) for the categories that name no single concrete value. Spec §9's claim now names the keys it asserts, so the agreement is checkable entry-for-entry. The 01-04 and 01-01 plan do-not-reuse assertions still pass. Assertion: `MANIFEST-DONOTREUSE-OK`.

### IN-01: Manifest anchor citations do not resolve as written

**Files modified:** `docs/governance/reference-manifest.json`
**Commit:** `b160631`
**Applied fix:** Repointed all four fragments at the spec's numbered heading slugs: `#4-provider-home-grammar`, `#5-patient-workspace-and-d3-timeline-grammar`, `#6-patient-home-grammar`, and `#9-sample-content--do-not-reuse` (the em dash renders as a double hyphen). Sections §4/§5/§6/§9 are unchanged. Assertion: `MANIFEST-ANCHORS-RESOLVE-OK` (each fragment resolves against the slugified headings; no stale fragment remains).

## Regression guard

Run after the last fix commit: `REGRESSION-GUARD-OK`

- `tokens.json` untouched: 15-key `color` set in documented order with `accentSoft` immediately after `accent`, all 15 frozen hex values unchanged, hex-regex pass, `shadow.raised`/`shadow.overlay` render ink derived from `textPrimary`, exact radius/space/font/motion key sets, `review.gateStatus: approved-with-changes`, `review.accentSplit.ownerConfirmed: true`, `weakEvidenceTokens` intact.
- Raw-hex grep across `docs/governance/`: matches confined to `tokens.json`; zero in the other seven files.
- `git diff --name-only 2014e84..HEAD` for the fix commits lists exactly `docs/governance/project-constitution.md`, `docs/governance/reference-manifest.json`, `docs/governance/reference-ui-specification.md`, `docs/governance/ui-invariants.md`, `docs/governance/visual-qa-rules.md` — plus this phase's `01-REVIEW.md` / `01-REVIEW-FIX.md`. No STATE, ROADMAP, PROJECT, REQUIREMENTS, PLAN or SUMMARY file changed; `01-VERIFICATION.md`, `tokens.json`, `responsive-rules.md` and `motion-rules.md` were not modified.

## Deviations from the agent contract

`docs/governance/*` were edited and committed in the primary working tree rather than an isolated `git worktree`: `01-REVIEW.md` is untracked in this repository (the review was just written), so a worktree branch that commits that path cannot fast-forward the checked-out `main` without destroying the untracked copy — the isolation step would have made the fix commits unreachable to the orchestrator. Commits were scoped with explicit paths, and the pre-existing dirty entries (`.planning/config.json`, `docs/reference/diagnostic-current-implementation.png` deletion, `docs/reference/patient-tracking-dashboard.jpg` untracked) were never staged.

---

_Fixed: 2026-10-06_
_Review: 01-REVIEW.md — all four findings fixed; status set to `clean`_
_Iteration: 1_
