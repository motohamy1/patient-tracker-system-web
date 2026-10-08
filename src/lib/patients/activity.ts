// src/lib/patients/activity.ts — the Phase-5 recent-activity composer
// (WSP-02 "what changed"; ticket 03; PRODUCT-MASTER-SPEC.md §7 "recent
// records").
//
// Pure, synchronous and table-free: it merges the two REAL patient-scoped
// facts this phase can honestly read into one ordered trail —
//   1. the patient row itself (created_at / updated_at — the record's own
//      lifecycle), and
//   2. this patient's invitations (created_at / redeemed_at — invite sent,
//      invite redeemed), which RLS restricts to invite-managing roles; a
//      role without that access simply reads fewer events, never an error.
//
// Nothing is invented (§27, Phase-4 D-18): every `at` is a stored timestamp
// and every label is the calm sentence-case copy of the §7 contract. Clinical
// event kinds (visit, medication, lab) join this trail in the phases that
// create those tables; a Phase-5 card never fakes them.
import type { PatientRecord } from '@/lib/patients/queries';

export type PatientInviteRow = {
  id: string;
  createdAt: string;
  redeemedAt: string | null;
};

export type ActivityKind = 'created' | 'updated' | 'invite' | 'redeemed';

export type ActivityEvent = {
  /** Stable React key and identity — entity-scoped, never the route param. */
  key: string;
  kind: ActivityKind;
  /** Stored ISO timestamp (timestamptz) — also the sort key. */
  at: string;
  label: string;
};

/** How many events the compact card shows (reference density, INV-12). */
export const RECENT_ACTIVITY_LIMIT = 3;

/**
 * Merge record-lifecycle and invite events into one descending trail, capped
 * at RECENT_ACTIVITY_LIMIT. `updatedAt === createdAt` is the untouched-record
 * case: the created event already tells that story, so no duplicate "updated"
 * row appears.
 *
 * ISO-8601 UTC strings sort lexicographically, so the comparator is a plain
 * descending string compare — no Date parsing, no timezone drift.
 */
export function composeRecentEvents(
  patient: Pick<PatientRecord, 'id' | 'createdAt' | 'updatedAt'>,
  invites: readonly PatientInviteRow[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      key: `patient:${patient.id}:created`,
      kind: 'created',
      at: patient.createdAt,
      label: 'Record created',
    },
  ];

  if (patient.updatedAt !== patient.createdAt) {
    events.push({
      key: `patient:${patient.id}:updated`,
      kind: 'updated',
      at: patient.updatedAt,
      label: 'Record updated',
    });
  }

  for (const invite of invites) {
    if (invite.redeemedAt !== null) {
      events.push({
        key: `invite:${invite.id}:redeemed`,
        kind: 'redeemed',
        at: invite.redeemedAt,
        label: 'Invite redeemed',
      });
    } else {
      events.push({
        key: `invite:${invite.id}:sent`,
        kind: 'invite',
        at: invite.createdAt,
        label: 'Invite sent',
      });
    }
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, RECENT_ACTIVITY_LIMIT);
}
