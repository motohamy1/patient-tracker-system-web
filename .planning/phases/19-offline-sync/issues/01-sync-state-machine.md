# 19-01: The sync state machine (pure)

**What to build:** The closed vocabulary and the pure reducer every offline story runs on: six states, the legal moves between them, and the one rule — only `synchronized` may be described as saved in the record.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `states.ts`: the closed six-state vocabulary (`local_draft`/`queued`/`syncing`/`synchronized`/`failed`/`conflict`) with labels, sanctioned tints, and the persistence sentence quoted verbatim per state (§18's rule)
- [x] `outbox.ts`: the pure reducer — `enqueue`/`queue`/`start-sync`/`sync-succeeded`/`sync-failed`/`conflict-detected`/`retry`/`resolve-keep-local`/`resolve-keep-server`; an illegal move leaves the entry untouched (the machine never lies about where a change is)
- [x] `conflict.ts`: the pure conflict decision — a draft whose base version predates the record's current version is stale-local; the two resolutions and their honest copy
- [x] `schemas.ts`: the persisted-entry validation (a malformed stored draft is never re-sent) and the `SenderOutcome` contract
- [x] No I/O, no clock, no storage anywhere in the core — every function is a pure map over entries (the owner's unit target)

**Gate evidence at close:** OFF-01 (the six distinguishable states) · OFF-03 (conflict surfaces for resolution) · §18

## Notes

- The append-only inserts the product actually makes (a logged measurement, a sent message) cannot silently overwrite — that is the structural first line of OFF-03; the conflict path exists for the update-style mutations and future ones.
