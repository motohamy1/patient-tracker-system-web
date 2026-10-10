// src/lib/channels/adapters.ts — the channel adapter interface and registry
// (Phase 16, CHAN-01/02; the 0014 `channel` seam's implementation half).
//
// An adapter is a transport: given a handle and a body, it delivers and
// reports what happened. The DEFAULT implementation is honest — with no
// credentials configured it returns delivered=false with the reason, never a
// simulated success (§27, the Phase-12 no-provider precedent). A real
// WhatsApp Business / Telegram Bot API call drops in behind the same
// interface; nothing else in the product changes.
export type DeliverRequest = {
  handle: string;
  body: string;
};

export type DeliverResult = {
  delivered: boolean;
  providerReference?: string;
  reason?: string;
  /** When not delivered, WHY — so the delivery row can be honest. */
  failure?: 'not_configured' | 'failed';
};

export interface ChannelAdapter {
  readonly id: ChannelName;
  deliver(request: DeliverRequest): Promise<DeliverResult>;
}

import type { ChannelName } from '@/lib/channels/status';

/** The no-credentials implementation shared by both channels. */
function unconfiguredAdapter(id: ChannelName, label: string): ChannelAdapter {
  return {
    id,
    async deliver() {
      return {
        delivered: false,
        failure: 'not_configured' as const,
        reason: `No ${label} delivery is configured for this workspace yet, so the message was not sent on that channel.`,
      };
    },
  };
}

const ADAPTERS: Map<ChannelName, ChannelAdapter> = new Map([
  ['whatsapp', unconfiguredAdapter('whatsapp', 'WhatsApp')],
  ['telegram', unconfiguredAdapter('telegram', 'Telegram')],
]);

export function getAdapter(channel: ChannelName): ChannelAdapter {
  const adapter = ADAPTERS.get(channel);
  if (adapter === undefined) throw new Error(`unknown channel: ${channel}`);
  return adapter;
}

/** Register a configured transport (a later integration point, CHAN-01/02). */
export function registerAdapter(adapter: ChannelAdapter): void {
  ADAPTERS.set(adapter.id, adapter);
}
