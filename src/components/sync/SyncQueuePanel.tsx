'use client';

// SyncQueuePanel — the honest face of the outbox (Phase 19, ticket 19-03;
// OFF-01/02/03, §18, §24).
//
// Renders every queued change with the state vocabulary from states.ts —
// the persistence sentence is quoted verbatim, because the ONLY claim the
// interface may make is the one the state earns (§18). A conflict shows both
// versions' markers and the two decisions; nothing is overwritten, and a
// failed send is a failure with its reason, not a silent drop.
//
// The panel appears only when work exists — no permanent chrome.
import { Button } from '@/components/primitives/Button';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import {
  SYNC_STATE_PERSISTENCE,
  SYNC_STATE_TOKEN,
  SYNC_STATE_LABELS,
} from '@/lib/sync/states';
import { CONFLICT_RESOLUTION_COPY } from '@/lib/sync/conflict';
import {
  resolveKeepLocal,
  resolveKeepServer,
  retryEntry,
  useSyncQueue,
} from '@/lib/sync/store';
import type { OutboxEntry } from '@/lib/sync/outbox';

function entryTitle(entry: OutboxEntry): string {
  const payload = entry.payload as { label?: string } | null;
  if (payload !== null && typeof payload === 'object' && typeof payload.label === 'string') {
    return payload.label;
  }
  return 'A change on this device';
}

export function SyncQueuePanel() {
  const { entries, hasPending } = useSyncQueue();
  if (!hasPending) return null;

  return (
    <Surface variant="surface" className="flex flex-col gap-md" aria-label="Changes waiting to sync">
      <h2 className="text-label leading-label font-semibold text-text-primary">Changes waiting to sync</h2>

      <ul className="flex flex-col gap-md">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-sm">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <span className="text-body leading-body text-text-primary">{entryTitle(entry)}</span>
              <Pill tone={SYNC_STATE_TOKEN[entry.state]} label={SYNC_STATE_LABELS[entry.state]} />
            </div>

            {/* The claim the state earns — quoted verbatim, never softened. */}
            <p className="text-label leading-label text-text-secondary">{SYNC_STATE_PERSISTENCE[entry.state]}</p>

            {entry.state === 'failed' && entry.lastError !== null ? (
              <p className="text-label leading-label text-text-secondary">{entry.lastError}</p>
            ) : null}

            {entry.state === 'conflict' ? (
              <div className="flex flex-col gap-sm">
                <p className="text-label leading-label text-text-secondary">
                  {CONFLICT_RESOLUTION_COPY['keep-local'].split('.')[0]}. The record was last changed{' '}
                  <span className="tabular-nums">
                    {entry.serverUpdatedAt !== null ? entry.serverUpdatedAt.slice(0, 16).replace('T', ' ') : 'later'}
                  </span>
                  .
                </p>
                <div className="flex flex-wrap items-center gap-sm">
                  <Button variant="primary" onClick={() => resolveKeepLocal(entry.id)}>
                    Keep my version
                  </Button>
                  <Button variant="secondary" onClick={() => resolveKeepServer(entry.id)}>
                    Keep the record&apos;s version
                  </Button>
                </div>
                <p className="text-label leading-label text-text-secondary">
                  {CONFLICT_RESOLUTION_COPY['keep-server']}
                </p>
              </div>
            ) : null}

            {entry.state === 'failed' ? (
              <div className="flex items-center gap-sm">
                <Button variant="secondary" onClick={() => retryEntry(entry.id)}>
                  Try again
                </Button>
                <span className="text-label leading-label text-text-secondary tabular-nums">
                  {entry.attempts === 1 ? '1 attempt' : `${entry.attempts} attempts`}
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Surface>
  );
}
