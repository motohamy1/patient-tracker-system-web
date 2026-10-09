# 15-03: The two communication surfaces

**What to build:** The provider's communication surface — a profile-level threads list with unread counts and a composer, reachable from the patient folder's quick actions — and the patient's Home Communication region, which becomes their thread with the same composer. Communication is reachable as a profile/context control, never as a primary clinical tab (§6).

**Blocked by:** 15-02 (the actions)

**Status:** resolved

- [ ] Provider route `/provider/messages`: threads list (patient identity, last message, unread count) plus the open thread with its messages and the composer; empty/error/denied states per region
- [ ] Entry points: "Message patient" in the folder card's quick actions (find-or-create + the composer) and the patient's context — never a ninth tab on the workspace (COMM-03, §6)
- [ ] Patient Home Communication region: the patient's thread with the care team and the same composer, replacing the honestly-empty placeholder; the patient may only ever see their own thread
- [ ] The composer is honest about persistence: a failed send says so, a sent message appears in the thread; no optimistic phantom messages (§18's sibling discipline)
- [ ] Copy makes the boundary explicit where a clinician might be tempted to cross it: the surface states that clinical actions (results, medication changes, decisions) belong in the clinical record, not in a message (COMM-02)
- [ ] Both surfaces are responsive: the list and thread stack on mobile with the same controls (§26)

**Gate evidence at close:** COMM-01/02/03 · §6 · §15 · §26

## Notes

- The provider surface is deliberately profile-level (its own route, reachable from the folder quick actions and the patient context), matching §15's "provider/profile communication controls" and respecting the locked 8-tab navigation.
