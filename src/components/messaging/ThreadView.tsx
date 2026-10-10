// ThreadView — one conversation's messages and composer (Phase 15, ticket
// 15-03; COMM-01/02/03).
//
// Server Component: the messages are read server-side (0014's self-or-staff
// policies decide visibility), and the only client boundary is the composer.
//
// COMM-02 is visible in the copy: the surface states where clinical actions
// belong. A message is a message — results, medication changes and decisions
// live in the clinical record, and the thread never implies otherwise.
import { EmptyState } from '@/components/primitives/EmptyState';
import { Surface } from '@/components/primitives';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { MessageComposer } from '@/components/messaging/MessageComposer';
import { SENDER_KIND_LABELS, MESSAGE_CHANNEL_LABELS, type ConversationMessageRecord } from '@/lib/messaging/status';
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TOKEN,
  type NotificationDeliveryRecord,
} from '@/lib/channels/status';
import { Pill } from '@/components/primitives/Pill';

export function ThreadView({
  conversationId,
  messages,
  viewer,
  deliveries = [],
}: {
  conversationId: string;
  messages: readonly ConversationMessageRecord[];
  viewer: 'staff' | 'patient';
  /** The conversation's delivery rows (staff viewers see the honest state). */
  deliveries?: readonly NotificationDeliveryRecord[];
}) {
  return (
    <Surface variant="surface" className="flex flex-col gap-md">
      {messages.length === 0 ? (
        <EmptyState
          title="No messages yet"
          body={
            viewer === 'staff'
              ? 'Send the first message to start this conversation.'
              : 'Send a message to your care team to start the conversation.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-md" aria-label="Messages">
          {messages.map((message) => {
            const mine =
              (viewer === 'staff' && message.senderKind === 'staff') ||
              (viewer === 'patient' && message.senderKind === 'patient');
            const messageDeliveries = deliveries.filter((d) => d.messageId === message.id);
            return (
              <li
                key={message.id}
                className={`flex flex-col gap-xs ${mine ? 'items-end text-end' : 'items-start'}`}
              >
                <span className="text-label leading-label text-text-secondary tabular-nums">
                  {SENDER_KIND_LABELS[message.senderKind]} · {message.createdAt.slice(0, 16).replace('T', ' ')}
                </span>
                <span
                  className={`max-w-[80%] whitespace-pre-wrap rounded-md px-lg py-sm text-body leading-body text-text-primary ${
                    mine ? 'bg-surface-muted' : 'bg-surface-raised'
                  }`}
                >
                  {message.body}
                </span>
                <span className="flex flex-wrap items-center gap-xs">
                  {message.channel !== 'in_app' ? (
                    <Pill tone="neutral" label={MESSAGE_CHANNEL_LABELS[message.channel]} />
                  ) : null}
                  {messageDeliveries.map((delivery) => (
                    <span key={delivery.id} className="flex flex-wrap items-center gap-xs">
                      <Pill
                        tone={DELIVERY_STATUS_TOKEN[delivery.status]}
                        label={`${MESSAGE_CHANNEL_LABELS[delivery.channel]}: ${DELIVERY_STATUS_LABELS[delivery.status]}`}
                      />
                      {delivery.reason !== null ? (
                        <span className="text-label leading-label text-text-secondary">{delivery.reason}</span>
                      ) : null}
                      {delivery.providerReference !== null ? (
                        <span className="text-label leading-label text-text-secondary tabular-nums">
                          ref {delivery.providerReference}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-sm">
        <MessageComposer conversationId={conversationId} insetFill={INSET_FILL} />
        <p className="text-label leading-label text-text-secondary">
          Results, medication changes and clinical decisions stay in the clinical record — messages are for
          everyday care.
        </p>
      </div>
    </Surface>
  );
}
