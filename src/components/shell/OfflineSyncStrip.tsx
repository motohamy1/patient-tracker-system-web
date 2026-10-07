// src/components/shell/OfflineSyncStrip.tsx — the UX-03 offline/sync
// indicator (03-UI-SPEC.md §8.6).
//
// A slim full-width status strip rendered server-agnostic from both workspace
// layouts and hydrated client-side. It appears ONLY when the connection is
// down or queued work exists — no permanent chrome. It carries zero clinical
// queue logic: the Phase-19 offline machinery extends the state machine below.
//
// Status grammar: offline -> warning dot, syncing -> info dot, synced ->
// success dot; the label is always textPrimary at font.size.label. The strip is
// never focusable and announces message changes through role=status with
// aria-live=polite.
'use client';

import { useEffect, useState } from 'react';

export type OfflineSyncStatus = 'hidden' | 'offline' | 'syncing' | 'synced';

export const STRIP_COPY = {
  offline: "You're offline. Changes will sync when the connection returns.",
  syncing: 'Changes are syncing.',
  synced: 'All changes synced.',
} as const;

const STATUS_DOT: Record<Exclude<OfflineSyncStatus, 'hidden'>, string> = {
  offline: 'bg-warning',
  syncing: 'bg-info',
  synced: 'bg-success',
};

export function OfflineSyncStrip() {
  const [status, setStatus] = useState<OfflineSyncStatus>(() =>
    typeof navigator === 'undefined' || navigator.onLine ? 'hidden' : 'offline',
  );

  useEffect(() => {
    function handleOffline() {
      setStatus('offline');
    }
    function handleOnline() {
      // A reconnect means whatever was queued can drain. Phase 19 owns the
      // real queue; Phase 3 only guarantees the indicator exists and reads
      // calmly, so a reconnect surfaces the synced sentence.
      setStatus('synced');
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (status === 'hidden') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-sm bg-surface-muted px-lg py-sm text-label leading-label text-text-primary"
    >
      <span
        aria-hidden="true"
        className={`inline-block size-4 shrink-0 rounded-pill ${STATUS_DOT[status]}`}
      />
      {STRIP_COPY[status]}
    </div>
  );
}
