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
import { SENDER_KIND_LABELS } from '@/lib/messaging/status';
import type { ConversationMessageRecord } from '@/lib/messaging/status';

export function ThreadView({
  conversationId,
  messages,
  viewer,
}: {
  conversationId: string;
  messages: readonly ConversationMessageRecord[];
  viewer: 'staff' | 'patient';
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
