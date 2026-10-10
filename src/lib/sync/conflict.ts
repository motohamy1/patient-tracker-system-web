// src/lib/sync/conflict.ts — the conflict decision (Phase 19; OFF-03).
//
// Pure: given the record version the draft was based on and the record's
// CURRENT version, decide whether the two disagree. Nothing here knows about
// HTTP, clocks or storage — the owner's unit target.
//
// The product's patient mutations are append-only inserts (a logged
// measurement, a sent message), which CANNOT silently overwrite a record —
// that is the first line of the OFF-03 defence, and it is structural. The
// state machine still carries the conflict path so an update-style mutation
// (or a future one) surfaces for a human decision instead of overwriting.

export type ConflictDecision =
  | { kind: 'none' }
  | { kind: 'stale-local'; serverUpdatedAt: string };

/**
 * A conflict exists when the record moved after the draft was based on it.
 * A missing base (an insert) can never conflict; a missing server version
 * means the record is unchanged as far as we can tell.
 */
export function decideConflict(
  basedOnUpdatedAt: string | null,
  serverUpdatedAt: string | null,
): ConflictDecision {
  if (basedOnUpdatedAt === null) return { kind: 'none' };
  if (serverUpdatedAt === null) return { kind: 'none' };
  if (serverUpdatedAt === basedOnUpdatedAt) return { kind: 'none' };
  return { kind: 'stale-local', serverUpdatedAt };
}

export type ConflictResolution = 'keep-local' | 'keep-server';

/** The resolution copy the surface shows once a decision is recorded. */
export const CONFLICT_RESOLUTION_COPY: Record<ConflictResolution, string> = {
  'keep-local': 'Your version was sent. The earlier record entry stays as history.',
  'keep-server': 'The record\u2019s version stands. Your draft was not written, and nothing was overwritten.',
};
