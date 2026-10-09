# 15-01: Conversation substrate — one unified model, two writers

**What to build:** The unified conversation abstraction: one open conversation per patient per organization, and an append-only message log inside it. Staff write to it, the patient writes to it, and a later WhatsApp/Telegram adapter writes to the same table with a different `channel` — nothing about the UI changes when channels arrive.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] `conversations` table: org/patient FKs, `status` (`open` | `closed`), timestamps; a unique partial index enforcing **one open conversation per patient** (a closed one can be superseded by a new open conversation)
- [ ] `conversation_messages` table: conversation/org/patient FKs, `sender_kind` (`staff` | `patient` | `system`), `sender_user_id`, `channel` (`in_app` | `whatsapp` | `telegram` — the Phase-16 seam), `body`, timestamps; append-only (no update, no delete grant)
- [ ] Guards: the sender is ALWAYS re-derived from the session — a staff message requires `sender_user_id = auth.uid()`, a patient message requires the conversation's patient to belong to the authenticated user; the payload can never claim a different sender (COMM-03, §12); the message's org/patient must match its conversation's
- [ ] RLS: select for the org's staff and the conversation's own patient; insert as the guard describes; conversation close for `CAN_MESSAGE` staff only; no deletes anywhere
- [ ] `CAN_MESSAGE` added to the capability map (provider_doctor + nurse) as the UI mirror of the conversations write policy
- [ ] Audit triggers (0003 pattern) on both tables
- [ ] `database.types.ts` gains both tables + the capability (hand-maintained until CLI regeneration)

**Gate evidence at close:** COMM-01 (the unified abstraction + channel seam) · §12 · AUTH-07 · §15

## Notes

- COMM-02 is structural: the model has no clinical fields at all. A message is a body between a care team and a patient; there is nothing here that can hold a diagnosis, a dose or a result, so messaging cannot become a shadow medical record.
- Messages are never projected onto the clinical timeline — clinical truth stays in the clinical record (§8.2, §15).
