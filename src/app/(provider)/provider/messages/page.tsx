// /provider/messages — the provider's communication surface (Phase 15, ticket
// 15-03; COMM-01/02/03, §15).
//
// A PROFILE-LEVEL surface (its own route, reached from the folder quick
// actions and the patient context) — never a ninth tab on the locked 8-tab
// workspace navigation (§6, COMM-03). The URL is the only state carrier:
// `?thread=<id>` selects the open conversation, and the list and thread both
// re-derive from it on every request.
//
// The selected thread's messages are read under RLS per request (the page
// never trusts the parameter beyond UUID validation and a bound query —
// ASVS V5); a thread the role may not read returns null and the page shows the
// no-leak empty state rather than guessing.
import { Lock } from 'lucide-react';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { StateVariant } from '@/components/state/StateVariant';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ThreadView } from '@/components/messaging/ThreadView';
import { CAN_MESSAGE, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { listConversationMessages, listConversations } from '@/lib/messaging/queries';
import { conversationIdSchema } from '@/lib/messaging/schemas';

export const dynamic = 'force-dynamic';

/** Narrow a searchParam to its first value (04-RESEARCH Pitfall 2). */
function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ProviderMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string | string[] }>;
}) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const params = await searchParams;
  const parsedThread = conversationIdSchema.safeParse(first(params.thread));

  let conversations: Awaited<ReturnType<typeof listConversations>> = [];
  let failed = false;
  try {
    conversations = await listConversations(resolution.orgId);
  } catch {
    failed = true;
  }

  const messagesByConversation = new Map<string, Awaited<ReturnType<typeof listConversationMessages>>>();
  for (const conversation of conversations) {
    try {
      messagesByConversation.set(conversation.id, await listConversationMessages(resolution.orgId, conversation.id));
    } catch {
      messagesByConversation.set(conversation.id, []);
    }
  }

  const selectedId = parsedThread.success ? parsedThread.data : null;
  const selected =
    selectedId !== null ? conversations.find((conversation) => conversation.id === selectedId) : undefined;
  const selectedMessages =
    selected !== undefined ? (messagesByConversation.get(selected.id) ?? []) : [];

  const canMessage = runsCapability(resolution.role, CAN_MESSAGE);

  return (
    <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-lg">
        <div className="flex flex-wrap items-center justify-between gap-md">
          <h1 className="text-heading font-semibold leading-heading text-text-primary">Messages</h1>
          {!canMessage ? (
            <span className="text-label leading-label text-text-secondary">Read-only for your role</span>
          ) : null}
        </div>

          {failed ? (
            <StateVariant surface="messages" retryHref="/provider/messages" />
          ) : conversations.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              body="Message a patient from their folder to start a conversation."
            />
          ) : (
            <div className="grid grid-cols-1 gap-lg lg:grid-cols-[22rem_minmax(0,1fr)]">
              <ConversationList
                conversations={conversations}
                messagesByConversation={messagesByConversation}
                selectedId={selectedId}
              />

              {selected !== undefined ? (
                <ThreadView
                  conversationId={selected.id}
                  messages={selectedMessages}
                  viewer="staff"
                />
              ) : parsedThread.success ? (
                <EmptyState
                  icon={Lock}
                  title="You don't have access to this conversation"
                  body="Ask your organization owner for access to patient records."
                />
              ) : (
                <Surface variant="surface" className="flex items-center justify-center p-lg">
                  <p className="text-body leading-body text-text-secondary">
                    Choose a conversation from the list.
                  </p>
                </Surface>
              )}
            </div>
          )}
        </div>
      </Surface>
  );
}
