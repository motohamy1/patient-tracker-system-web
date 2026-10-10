// src/lib/sync/outbox.ts — the pure outbox state machine (Phase 19;
// OFF-01/02/03).
//
// No I/O, no clock, no storage: every function takes the entries and the
// timestamps and returns new entries, so the whole semantics unit-test
// without a browser, a network, or a fake (the owner's pass).
//
// THE LEGAL MOVES (a skip, a repeat or a backward move returns the entries
// unchanged — the state machine never lies about where a change is):
//
//   enqueue            → local_draft (born on the device)
//   queue              → local_draft → queued
//   start-sync         → queued → syncing
//   sync-succeeded     → syncing → synchronized (terminal for the entry)
//   sync-failed        → syncing → failed (reason recorded)
//   conflict-detected  → syncing → conflict (the record's version recorded)
//   retry              → failed | local_draft → queued
//   resolve-keep-local → conflict → queued (the local version wins the race)
//   resolve-keep-server→ conflict → resolved remotely (the entry leaves the
//                        outbox; the server's version stands — nothing was
//                        overwritten, OFF-03)
import type { SyncState } from '@/lib/sync/states';

export type OutboxEntry = {
  id: string;
  /** Which mutation this entry carries (the registered sender key). */
  kind: string;
  /** The mutation payload, exactly what the sender receives. */
  payload: unknown;
  state: SyncState;
  attempts: number;
  lastError: string | null;
  /** The record's updated_at the draft was based on (conflict detection). */
  basedOnUpdatedAt: string | null;
  /** When a conflict was detected, the record's own version marker. */
  serverUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncEvent =
  | { type: 'queue' }
  | { type: 'start-sync' }
  | { type: 'sync-succeeded' }
  | { type: 'sync-failed'; reason: string }
  | { type: 'conflict-detected'; serverUpdatedAt: string }
  | { type: 'retry' }
  | { type: 'resolve-keep-local' }
  | { type: 'resolve-keep-server' };

function touched(entry: OutboxEntry, patch: Partial<OutboxEntry>, now: string): OutboxEntry {
  return { ...entry, ...patch, updatedAt: now };
}

/** Apply one event to one entry. An illegal move leaves it untouched. */
export function reduceEntry(entry: OutboxEntry, event: SyncEvent, now: string): OutboxEntry {
  switch (event.type) {
    case 'queue':
      return entry.state === 'local_draft'
        ? touched(entry, { state: 'queued', lastError: null }, now)
        : entry;
    case 'start-sync':
      return entry.state === 'queued'
        ? touched(entry, { state: 'syncing' }, now)
        : entry;
    case 'sync-succeeded':
      return entry.state === 'syncing'
        ? touched(entry, { state: 'synchronized', lastError: null }, now)
        : entry;
    case 'sync-failed':
      return entry.state === 'syncing'
        ? touched(entry, { state: 'failed', lastError: event.reason, attempts: entry.attempts + 1 }, now)
        : entry;
    case 'conflict-detected':
      return entry.state === 'syncing'
        ? touched(entry, { state: 'conflict', serverUpdatedAt: event.serverUpdatedAt }, now)
        : entry;
    case 'retry':
      return entry.state === 'failed' || entry.state === 'local_draft'
        ? touched(entry, { state: 'queued', lastError: null }, now)
        : entry;
    case 'resolve-keep-local':
      return entry.state === 'conflict'
        ? touched(entry, { state: 'queued', serverUpdatedAt: null, lastError: null }, now)
        : entry;
    case 'resolve-keep-server':
      // The server's version stands; the draft leaves the queue without
      // ever having been written (OFF-03: surfaced, not silently dropped).
      return entry.state === 'conflict'
        ? touched(entry, { state: 'synchronized', serverUpdatedAt: entry.serverUpdatedAt }, now)
        : entry;
    default:
      return entry;
  }
}

/** Apply an event to the entry with this id; the list is never mutated. */
export function applyEvent(
  entries: readonly OutboxEntry[],
  id: string,
  event: SyncEvent,
  now: string,
): OutboxEntry[] {
  return entries.map((entry) => (entry.id === id ? reduceEntry(entry, event, now) : entry));
}

/** Drop the entries that reached a terminal state (the store prunes them). */
export function pruneSynchronized(entries: readonly OutboxEntry[]): OutboxEntry[] {
  return entries.filter((entry) => entry.state !== 'synchronized');
}

/** The entries a flush may send now, oldest first (a stable queue order). */
export function sendable(entries: readonly OutboxEntry[]): OutboxEntry[] {
  return entries
    .filter((entry) => entry.state === 'queued' || entry.state === 'local_draft')
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** True when any entry is not durably in the record yet. */
export function hasPendingWork(entries: readonly OutboxEntry[]): boolean {
  return entries.some((entry) => entry.state !== 'synchronized');
}
