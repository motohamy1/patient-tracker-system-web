// src/lib/sync/schemas.ts — the client-side validation of a queued entry's
// shape (Phase 19). A malformed persisted draft is never re-sent.
import { z } from 'zod';
import { SYNC_STATES } from '@/lib/sync/states';

export const outboxEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  payload: z.unknown(),
  state: z.enum(SYNC_STATES),
  attempts: z.number().int().nonnegative(),
  lastError: z.string().nullable(),
  basedOnUpdatedAt: z.string().nullable(),
  serverUpdatedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const outboxSchema = z.array(outboxEntrySchema);

/** The outcome a sender reports back to the machine. */
export type SenderOutcome =
  | { ok: true }
  | { ok: false; reason: string }
  | { ok: 'conflict'; serverUpdatedAt: string };

export type Sender = (payload: unknown) => Promise<SenderOutcome>;
