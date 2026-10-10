'use client';

// SyncWiring — the client-side registration of the outbox senders and the
// panel that shows the queue (Phase 19, ticket 19-03; OFF-01..03).
//
// The registration runs once on mount: the 'observation' sender carries a
// queued quick-log entry back through the SAME server action the live form
// uses (so the re-send is authorized and validated exactly like the first
// attempt — the queue never becomes a second, weaker write path).
//
// The panel renders only when work exists; the connection strip beside it
// stays the Phase-3 indicator.
import { useEffect } from 'react';
import { SyncQueuePanel } from '@/components/sync/SyncQueuePanel';
import { registerSender } from '@/lib/sync/store';
import { logObservationAction } from '@/lib/patient/actions';

export function SyncWiring() {
  useEffect(() => {
    registerSender('observation', async (payload) => {
      const result = await logObservationAction(payload as Parameters<typeof logObservationAction>[0]);
      if (result.ok) return { ok: true };
      return { ok: false, reason: 'That couldn’t be logged. Check the values and try sending it again.' };
    });
  }, []);

  return <SyncQueuePanel />;
}
