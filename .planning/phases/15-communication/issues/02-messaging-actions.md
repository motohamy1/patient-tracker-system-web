# 15-02: Send, list and the unread derivation

**What to build:** One send action that works for both sides of the conversation (the session decides the sender), the conversation list with each thread's last message, and an unread count derived from the log itself — no mutable read flags to drift.

**Blocked by:** 15-01 (the substrate)

**Status:** resolved

- [ ] `sendMessageAction({ conversationId, body })`: parses the body (required, length-capped), resolves the actor from the verified session (staff with `CAN_MESSAGE`, or the conversation's own patient with `CAN_SUBMIT_OBSERVATION`), and inserts; the guard re-derives the sender server-side
- [ ] `startConversationAction({ patientId, body })`: staff-side find-or-create of the patient's open conversation (the unique index makes the race safe), then the first message — one atomic path from a folder card to a sent message
- [ ] `closeConversationAction({ conversationId })`: the staff path to close a thread; the message log is kept, the conversation leaves the active list
- [ ] Queries: `listConversations(orgId)` (patient identity, status, last message, unread count) and `listMessages(orgId, conversationId)` (chronological, both sides)
- [ ] Pure unread derivation: staff-unread = patient messages after the newest staff/system message; patient-unread = the mirror image — derived, never stored, so it can never disagree with the log
- [ ] The patient's own conversation is resolved from the session (the 0012 self-read pattern), never from a URL parameter

**Gate evidence at close:** COMM-01 (both sides write) · COMM-02 · §15 · AUTH-05/07

## Notes

- One `sendMessageAction` for both sides is the unified model's proof: the same table, the same guard, the same validation — only the session differs.
