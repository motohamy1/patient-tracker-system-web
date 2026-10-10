# Phase 19: Offline / Sync — Verification

**Date:** 2026-10-10 · **Executed via:** GSD tickets 19-01…19-04 under
`.planning/phases/19-offline-sync/issues/`.
**Session constraints (owner-directed):** **no test suites run**, **no commits** — the
owner runs the test pass and commits per phase. Verification here is tsc + the
token/lint gate only; the last full suite green was Phase 15 (473/473) and the last
build green was Phase 15 as well.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0** |
| Test suite | — | **not run (owner-directed)**; last green 473/473 at Phase 15. The pure machine (`outbox.ts`, `conflict.ts`) is written for exactly this pass — no I/O, no clock, no storage |
| Build | — | **not run (owner-directed)**; last green at Phase 15 |
| Migration | — | **none — this phase is a semantics layer over the existing mutations (no new tables; the queue never bypasses the server actions)** |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — the queue panel mounts in the patient layout beside the Phase-3 connection strip; no permanent chrome. |
| 2 | Color relationships | **PASS (screenshot deferred)** — each state's sanctioned tint only; the persistence sentence is plain text. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — one row per queued change: title, state, the honest sentence; the conflict row adds the two decisions. |
| 5 | Card proportions | **PASS** — one surface at the 64rem patient measure; mobile unchanged (§26). |
| 6 | Pill controls | **PASS** — verb-first buttons ("Try again", "Keep my version", "Keep the record's version"), 44px targets. |
| 7 | Typography hierarchy | **PASS** — the record marker is `tabular-nums`; the persistence sentence is label-size. |
| 8–10 | Timeline rows | **PASS (unchanged; the queue never touches the clinical timeline projection).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent anywhere; state is the closed tint family only (INV-05). |

## 3. Invariants

INV-01/03 (token lint exit 0) · INV-02 (no chrome) · INV-04 (closed six-state
vocabulary) · INV-05 (no accent) · INV-06 (no gamified vocabulary — a failed send is
a failure with a reason, never a nudge) · INV-07/08/09 (radii) · INV-10 (spacing
steps) · INV-11 (no decorative rules) · INV-12 (cards ≥2 lines) · INV-13/14/15/16
(surfaces, no card borders) · INV-17 (no glass/scrim). **All PASS.**

## 4. Requirement traceability (OFF-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **OFF-01** users can distinguish local draft, queued, syncing, synchronized, failed, and conflict states | 19-01, 19-03 | The closed six-state vocabulary (`states.ts`) is the single source: labels, sanctioned tints and the persistence sentence are derived from it, and the panel renders exactly those states with a pill per entry. No seventh state, no informal wording. |
| **OFF-02** the app never claims a sensitive clinical mutation is permanently saved while it exists only locally | 19-01, 19-02, 19-03 | Structural: the store can only move an entry to `synchronized` on a SENDER's success — nothing else in the codebase writes that state — and the UI quotes `SYNC_STATE_PERSISTENCE` verbatim per state ("Saved on this device only. It is not in your record yet."). The quick log's failure copy says held-on-this-device, never "logged". |
| **OFF-03** sync conflicts surface for resolution instead of silently overwriting | 19-01, 19-02, 19-03 | The pure `decideConflict` compares the draft's base version with the record's; a stale-local entry moves to `conflict` and the panel offers the two resolutions with their honest consequences. The product's live mutations are append-only inserts (which cannot overwrite at all), and the re-send re-uses the same server action, so the queue is never a second write path. |

## 5. Decisions reported

- **A semantics layer, not a service worker.** The phase promises six
  *distinguishable, honest* states, not background sync infrastructure; the
  queue lives in the page session + localStorage and drains on reconnect.
  A service-worker sync engine is a deliberate future step (the §7 deferral).
- **The re-send is the first send.** The registered sender calls
  `logObservationAction` — the same capability-checked, Zod-validated,
  session-derived path — so a queued change can never gain privileges by
  having waited.
- **One concern per surface.** The connection strip (Phase 3) stays the
  connection indicator; the panel owns entry-level states. The strip's
  "Changes are syncing" copy is not re-claimed per entry.
- **A malformed persisted draft is discarded, never re-sent** (schemas.ts
  validation on read) — corrupt local state must not become a bad write.
- **`resolve-keep-server` removes the draft without writing it**, and says so:
  the record's version stands, nothing was overwritten (OFF-03).

## 6. Out of scope (recorded as decisions, not omissions)

- **A service worker / Background Sync engine**: the store is page-session
  scoped; true background sync needs a SW and its registration is the owner's
  deployment decision (§7).
- **Provider-side (staff) offline drafting**: the patient's authoring surface
  is the quick log; staff authoring happens on the workspace tabs, where a
  silent draft would risk a false-saved clinical record (the §18 rule) —
  deliberately not built rather than built badly.
- **Multi-device merge**: the conflict decision is local-vs-record; two
  devices racing is out of scope for this phase.
- **Storage quota management**: a full localStorage degrades to in-memory with
  the same honest states (recorded in the store).

## 7. Deferred (owner constraints + this session's directives)

- **No test suites run this session (owner-directed)** — the pure machine
  (`outbox.ts`, `conflict.ts`) is the intended unit target and has no I/O to
  mock; the interactive offline pass (log offline → panel → reconnect → sync)
  is the owner's.
- **No commits this session (owner-directed)** — the owner commits per phase.
- Visual baselines + screenshot legs for the queue panel.
- The service-worker/Background Sync decision (§6).

## 8. Owner design-gate brief

1. **Background sync**: ship the page-session + localStorage queue, or invest in
   a service worker for true background sync? *Ask:* which.
2. **Staff-side offline drafting**: deliberately not built (a silent clinical
   draft risks a false saved claim). *Ask:* confirm, or scope a workspace draft
   model with explicit draft labels.
3. **The conflict resolutions**: keep-mine re-sends, keep-the-record drops the
   draft. *Ask:* confirm the copy for both.

## 9. Gate status

**Implementation: GREEN** for the gates run (tsc 0, token/lint exit 0, OFF-01…03
traced with the six-state vocabulary and the verbatim persistence sentences).
**Phase acceptance: PENDING** the §7 deferrals and the §8 verdicts (§20.7).
