# 19-03: The honest surfaces

**What to build:** The queue panel and the quick-log's failure copy — a queued change is shown with the state it actually earned, and a failed send is never described as saved.

**Blocked by:** 19-02 (the store)

**Status:** resolved

- [x] `SyncQueuePanel`: one row per queued entry with its state pill, the verbatim persistence sentence, the failure reason, the attempt count, and retry; a conflict shows the record's marker and the two decisions with their honest consequences
- [x] The patient layout mounts the wiring (sender registration + the panel) beside the Phase-3 connection strip; the panel appears only when work exists
- [x] The quick log's failure path enqueues the entry as a device draft and its copy states it is held on this device and NOT in the record — never "logged" (§18, OFF-02)
- [x] Every state uses the closed vocabulary's sanctioned tints; empty/error states per surface (§24); mobile keeps the same controls (§26)

**Gate evidence at close:** OFF-01 (distinguishable states in the UI) · OFF-02 (never a false saved claim) · §24/§26

## Notes

- The connection strip stays Phase-3's indicator (offline/syncing/synced); the entry-level states are the panel's job — one concern per surface.
