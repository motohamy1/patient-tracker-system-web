// src/lib/messaging/unread.ts — the unread derivation (Phase 15, ticket 15-02;
// COMM-01).
//
// PURE and stored-nowhere: unread is DERIVED from the append-only log, so it
// can never disagree with the messages themselves. Staff-unread counts the
// patient's messages after the newest staff/system message; the patient's
// unread is the mirror image. No read flags exist to drift (§18's honesty
// discipline applied to a lightweight fact).
export type SenderLike = { senderKind: 'staff' | 'patient' | 'system' };

/** How many patient messages are newer than the care team's last message. */
export function unreadForStaff(messages: readonly SenderLike[]): number {
  let lastTeamIndex = -1;
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message !== undefined && (message.senderKind === 'staff' || message.senderKind === 'system')) {
      lastTeamIndex = index;
    }
  }
  if (lastTeamIndex === -1) return messages.length;
  return messages.length - 1 - lastTeamIndex;
}

/** How many care-team messages are newer than the patient's last message. */
export function unreadForPatient(messages: readonly SenderLike[]): number {
  let lastPatientIndex = -1;
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message !== undefined && message.senderKind === 'patient') {
      lastPatientIndex = index;
    }
  }
  if (lastPatientIndex === -1) return messages.length;
  return messages.length - 1 - lastPatientIndex;
}
