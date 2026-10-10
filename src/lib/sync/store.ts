// src/lib/sync/store.ts — the client-side outbox store (Phase 19;
// OFF-01/02/03).
//
// A small observable store with the pure machine (outbox.ts) at its core:
// state lives in memory, persists to localStorage for survival across
// reloads, and every write goes through the reducer's legal moves. Nothing
// here claims a change is saved: only a sender's success moves an entry to
// `synchronized`, and the panels render the vocabulary from states.ts
// verbatim (§18's rule).
//
// Client-only by construction (localStorage + events); never import from a
// Server Component.
'use client';

import { useEffect, useState } from 'react';
import {
  applyEvent,
  hasPendingWork,
  pruneSynchronized,
  sendable,
  type OutboxEntry,
  type SyncEvent,
} from '@/lib/sync/outbox';
import { decideConflict } from '@/lib/sync/conflict';
import { outboxSchema, type Sender } from '@/lib/sync/schemas';

const STORAGE_KEY = 'patient-sync-outbox-v1';

const senders = new Map<string, Sender>();
const listeners = new Set<() => void>();

let entries: OutboxEntry[] = [];
let hydrated = false;
let flushing = false;

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `entry-${random}`;
}

/** Read the persisted outbox once, tolerating anything malformed. */
function readPersisted(): OutboxEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = outboxSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // A full or unavailable storage degrades to in-memory only: the entry
    // states still read honestly, they simply do not survive a reload.
  }
}

function commit(next: OutboxEntry[]): void {
  entries = next;
  persist();
  for (const listener of listeners) listener();
}

function dispatch(id: string, event: SyncEvent): void {
  commit(applyEvent(entries, id, event, nowIso()));
}

/** Register the sender that carries one entry kind (client wiring). */
export function registerSender(kind: string, sender: Sender): void {
  senders.set(kind, sender);
}

/** Add a draft on this device. It is NOT in the record yet — states.ts says so. */
export function enqueueDraft(kind: string, payload: unknown): string {
  const timestamp = nowIso();
  const entry: OutboxEntry = {
    id: newId(),
    kind,
    payload,
    state: 'local_draft',
    attempts: 0,
    lastError: null,
    basedOnUpdatedAt: null,
    serverUpdatedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  commit([...entries, entry]);
  return entry.id;
}

/** Queue a draft (or re-queue a failed one) for the next flush. */
export function queueEntry(id: string): void {
  dispatch(id, { type: 'queue' });
  void flush();
}

export function retryEntry(id: string): void {
  dispatch(id, { type: 'retry' });
  void flush();
}

/** Keep the local version: it goes to the front of the queue and is re-sent. */
export function resolveKeepLocal(id: string): void {
  dispatch(id, { type: 'resolve-keep-local' });
  void flush();
}

/** Keep the record's version: the draft leaves the queue without being written. */
export function resolveKeepServer(id: string): void {
  dispatch(id, { type: 'resolve-keep-server' });
  commit(pruneSynchronized(entries));
}

/** Send everything sendable, oldest first. A failure is recorded, never hidden. */
export async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    for (const entry of sendable(entries)) {
      const sender = senders.get(entry.kind);
      if (sender === undefined) {
        dispatch(entry.id, { type: 'sync-failed', reason: 'This kind of change can\u2019t be sent from here yet.' });
        continue;
      }

      if (entry.state === 'local_draft') dispatch(entry.id, { type: 'queue' });
      dispatch(entry.id, { type: 'start-sync' });

      let outcome;
      try {
        outcome = await sender(entry.payload);
      } catch (error) {
        outcome = { ok: false as const, reason: error instanceof Error ? error.message : 'The send failed.' };
      }

      if (outcome.ok === true) {
        dispatch(entry.id, { type: 'sync-succeeded' });
      } else if (outcome.ok === 'conflict') {
        // The record moved under the draft: surface it, never overwrite.
        const decision = decideConflict(entry.basedOnUpdatedAt, outcome.serverUpdatedAt);
        if (decision.kind === 'stale-local') {
          dispatch(entry.id, { type: 'conflict-detected', serverUpdatedAt: outcome.serverUpdatedAt });
        } else {
          dispatch(entry.id, { type: 'sync-failed', reason: 'The record changed while sending. Try again.' });
        }
      } else {
        dispatch(entry.id, { type: 'sync-failed', reason: outcome.reason });
      }
    }
    commit(pruneSynchronized(entries));
  } finally {
    flushing = false;
  }
}

/** Drain when the connection returns — the queue is honest about work waiting. */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flush();
  });
}

/** Subscribe a React component to the store. */
export function useSyncQueue(): {
  entries: OutboxEntry[];
  hasPending: boolean;
  flush: () => Promise<void>;
} {
  const [snapshot, setSnapshot] = useState<OutboxEntry[]>(() => {
    if (!hydrated) {
      entries = readPersisted();
      hydrated = true;
    }
    return entries;
  });

  useEffect(() => {
    const listener = () => setSnapshot(entries);
    listeners.add(listener);
    if (!hydrated) {
      entries = readPersisted();
      hydrated = true;
      setSnapshot(entries);
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { entries: snapshot, hasPending: hasPendingWork(snapshot), flush: () => flush() };
}
