// src/lib/sync/states.ts — the closed sync-state vocabulary (Phase 19;
// OFF-01/02, §18).
//
// Six states, no more: a change exists on this device (local_draft), it is
// waiting to send (queued), it is on the wire (syncing), it is in the record
// (synchronized), it could not be sent (failed), or the record moved under it
// and a human must choose (conflict).
//
// THE RULE THIS VOCABULARY EXISTS TO ENFORCE (§18, OFF-02): only
// `synchronized` may be described as saved in the patient's record. A local
// draft is a draft — the UI must say so, plainly, everywhere.
export type SyncState =
  | 'local_draft'
  | 'queued'
  | 'syncing'
  | 'synchronized'
  | 'failed'
  | 'conflict';

export const SYNC_STATES = [
  'local_draft',
  'queued',
  'syncing',
  'synchronized',
  'failed',
  'conflict',
] as const satisfies readonly SyncState[];

export const SYNC_STATE_LABELS: Record<SyncState, string> = {
  local_draft: 'Draft on this device',
  queued: 'Waiting to send',
  syncing: 'Sending',
  synchronized: 'In your record',
  failed: 'Couldn\u2019t send',
  conflict: 'Needs your decision',
};

/** The sanctioned status tint per state (INV-04 closed set). */
export const SYNC_STATE_TOKEN: Record<SyncState, 'info' | 'warning' | 'success' | 'critical' | 'neutral'> = {
  local_draft: 'neutral',
  queued: 'info',
  syncing: 'info',
  synchronized: 'success',
  failed: 'warning',
  conflict: 'critical',
};

/**
 * The ONE claim the interface may make per state (§18: a clinical mutation is
 * never shown as saved while it exists only locally). Used verbatim wherever
 * a queued change is shown.
 */
export const SYNC_STATE_PERSISTENCE: Record<SyncState, string> = {
  local_draft: 'Saved on this device only. It is not in your record yet.',
  queued: 'Waiting to send. It is not in your record yet.',
  syncing: 'Sending now. It is not in your record yet.',
  synchronized: 'In your record.',
  failed: 'The send failed, so this is still only on this device.',
  conflict:
    'This change and your record disagree. Nothing was overwritten — choose which version to keep.',
};

/** The only state in which a change is durably persisted. */
export function isPersisted(state: SyncState): boolean {
  return state === 'synchronized';
}

/** The states a user may retry from. */
export function isRetryable(state: SyncState): boolean {
  return state === 'failed' || state === 'local_draft' || state === 'queued';
}

/** The states that require a human decision before anything else. */
export function needsResolution(state: SyncState): boolean {
  return state === 'conflict';
}
