'use client';

// ConversationList — the provider's thread list (Phase 15, ticket 15-03).
//
// URL-driven selection (the provider home's D-11 precedent): the list writes
// `?thread=<id>`, the page re-derives the thread from it. No client fetch, no
// component state beyond the pending flag on the open/close control.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { closeConversationAction } from '@/lib/messaging/actions';
import type { ConversationRecord, ConversationMessageRecord } from '@/lib/messaging/status';
import { unreadForStaff } from '@/lib/messaging/unread';

export function ConversationList({
  conversations,
  messagesByConversation,
  selectedId,
}: {
  conversations: readonly ConversationRecord[];
  messagesByConversation: ReadonlyMap<string, readonly ConversationMessageRecord[]>;
  selectedId: string | null;
}) {
  const router = useRouter();
  const [closing, setClosing] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-sm" aria-label="Conversations">
      {conversations.map((conversation) => {
        const messages = messagesByConversation.get(conversation.id) ?? [];
        const unread = unreadForStaff(messages);
        const last = messages.length > 0 ? messages[messages.length - 1] : undefined;
        const selected = conversation.id === selectedId;
        return (
          <li key={conversation.id}>
            <Surface
              variant="surface"
              className={selected ? 'flex flex-col gap-xs ring-1 ring-inset ring-[--color-accent]' : 'flex flex-col gap-xs'}
            >
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <a
                  href={`/provider/messages?thread=${conversation.id}`}
                  className="flex min-w-0 flex-col gap-xs"
                >
                  <span className="truncate text-body leading-body text-text-primary">
                    {conversation.patientName}
                  </span>
                  <span className="truncate text-label leading-label text-text-secondary">
                    {last !== undefined ? last.body : 'No messages yet'}
                  </span>
                  <span className="text-label leading-label text-text-secondary tabular-nums">
                    {last !== undefined ? last.createdAt.slice(0, 10) : ''}
                  </span>
                </a>
                <span className="flex items-center gap-sm">
                  {unread > 0 ? <Pill tone="critical" label={`${unread} new`} /> : null}
                  {conversation.status === 'closed' ? <Pill tone="neutral" label="Closed" /> : null}
                  {conversation.status === 'open' ? (
                    <Button
                      variant="ghost"
                      disabled={closing === conversation.id}
                      ariaBusy={closing === conversation.id}
                      onClick={async () => {
                        setClosing(conversation.id);
                        const result = await closeConversationAction({ conversationId: conversation.id });
                        setClosing(null);
                        if (result.ok) router.refresh();
                      }}
                    >
                      Close
                    </Button>
                  ) : null}
                </span>
              </div>
            </Surface>
          </li>
        );
      })}
    </ul>
  );
}
