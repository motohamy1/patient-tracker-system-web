# 19-02: The outbox store and the flush

**What to build:** The client store the pure machine runs in: an observable outbox persisted across reloads, senders registered per entry kind, a flush that sends oldest-first and records the honest outcome per entry, and a drain on reconnect.

**Blocked by:** 19-01 (the machine)

**Status:** resolved

- [x] `store.ts`: in-memory state + localStorage persistence (`patient-sync-outbox-v1`), malformed persisted data discarded on read, storage failure degrading to in-memory with honest states
- [x] `registerSender(kind, sender)` / `enqueueDraft(kind, payload)` / `queueEntry` / `retryEntry` / `resolveKeepLocal` / `resolveKeepServer` / `flush()` — every mutation goes through the reducer's legal moves
- [x] Flush: per entry, start-sync → sender → success (`synchronized`), failure (`failed` with reason), or conflict (`conflict-detected` re-checked by the pure decision); synchronized entries are pruned; a sender exception is a recorded failure, never a crash
- [x] The `online` event drains the queue; nothing sends while a flush is already running
- [x] The observation sender re-uses the SAME server action the live form uses — the queue is never a second, weaker write path

**Gate evidence at close:** OFF-01/02/03 · §18 · §12 (the re-send is authorized and re-validated exactly like the first attempt)

## Notes

- The store never reports success on its own authority: only a sender's `ok` moves an entry to `synchronized`.
