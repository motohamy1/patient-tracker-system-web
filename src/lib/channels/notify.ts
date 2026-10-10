// src/lib/channels/notify.ts — the notification workflow (Phase 16, ticket
// 16-02; CHAN-01/02/03).
//
// A notification is never free-floating: this step takes a REAL conversation
// message, renders a channel-safe text from it, and delivers it to the
// patient's ACTIVE endpoints for each channel — the workflow.ts caller writes
// one append-only delivery row per attempt with its honest status. If the
// message does not exist in the thread, nothing goes out.
import { getAdapter } from '@/lib/channels/adapters';
import type { ChannelName } from '@/lib/channels/status';

/** The channel-safe rendering of a message (short, from the thread's body). */
export function composeNotification(body: string, maxLength = 320): string {
  const collapsed = body.trim().replace(/\s+/g, ' ');
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength - 1).trimEnd()}…`;
}

export type NotifyTarget = {
  channel: ChannelName;
  handle: string;
};

export type NotifyOutcome = {
  channel: ChannelName;
  handle: string;
  delivered: boolean;
  providerReference?: string;
  reason?: string;
  /** When not delivered, WHY — so the delivery row can be honest. */
  failure?: 'not_configured' | 'failed';
};

/**
 * Deliver a message's notification to each target. Pure with respect to the
 * adapters (they resolve through the registry, so tests can register a stub):
 * returns one outcome per target, carrying the adapter's honest
 * classification — including `not_configured` when no credentials exist.
 */
export async function deliverNotifications(
  notification: string,
  targets: readonly NotifyTarget[],
): Promise<NotifyOutcome[]> {
  const results: NotifyOutcome[] = [];
  for (const target of targets) {
    const adapter = getAdapter(target.channel);
    const result = await adapter.deliver({ handle: target.handle, body: notification });
    results.push({
      channel: target.channel,
      handle: target.handle,
      delivered: result.delivered,
      ...(result.providerReference !== undefined ? { providerReference: result.providerReference } : {}),
      ...(result.reason !== undefined ? { reason: result.reason } : {}),
      ...(result.failure !== undefined ? { failure: result.failure } : {}),
    });
  }
  return results;
}
