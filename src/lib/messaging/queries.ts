// src/lib/messaging/queries.ts — the conversation read layer (Phase 15).
//
// RLS is inert on the single-owner Neon connection, so every SELECT carries
// an explicit `org_id` predicate — the boundary 0014's self-or-staff SELECT
// policies used to express. The patient surface is scoped further by the
// patient/conversation id its caller already resolved.
import { getSql } from '@/lib/db/neon';
import type {
  ConversationMessageRecord,
  ConversationRecord,
  MessageChannel,
  SenderKind,
} from '@/lib/messaging/status';
import { unreadForStaff } from '@/lib/messaging/unread';

type ConversationRow = {
  id: string;
  org_id: string;
  patient_id: string;
  status: 'open' | 'closed';
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
};

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    patientId: row.patient_id,
    patientName:
      row.first_name !== null && row.last_name !== null
        ? `${row.first_name} ${row.last_name}`
        : 'Patient',
    status: row.status,
    updatedAt: row.updated_at,
  };
}

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_kind: SenderKind;
  sender_user_id: string | null;
  channel: MessageChannel;
  body: string;
  created_at: string;
};

function mapMessage(row: MessageRow): ConversationMessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderKind: row.sender_kind,
    senderUserId: row.sender_user_id,
    channel: row.channel,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** The org's conversations (staff surface), most recently active first. */
export async function listConversations(orgId: string): Promise<ConversationRecord[]> {
  const sql = getSql();
  const rows = (await sql`
    select c.id, c.org_id, c.patient_id, c.status, c.updated_at, p.first_name, p.last_name
    from public.conversations c
    left join public.patients p on p.id = c.patient_id
    where c.org_id = ${orgId}
    order by c.updated_at desc, c.id desc
  `) as unknown as ConversationRow[];

  return rows.map(mapConversation);
}

/** One conversation, org-scoped; null when it does not exist in this org. */
export async function getConversation(
  orgId: string,
  conversationId: string,
): Promise<ConversationRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    select c.id, c.org_id, c.patient_id, c.status, c.updated_at, p.first_name, p.last_name
    from public.conversations c
    left join public.patients p on p.id = c.patient_id
    where c.org_id = ${orgId} and c.id = ${conversationId}
  `) as unknown as ConversationRow[];

  const row = rows[0] ?? null;
  return row !== null ? mapConversation(row) : null;
}

/** The patient's own open conversation, or null (patient surface). */
export async function getOwnConversation(
  orgId: string,
  patientId: string,
): Promise<ConversationRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    select c.id, c.org_id, c.patient_id, c.status, c.updated_at, p.first_name, p.last_name
    from public.conversations c
    left join public.patients p on p.id = c.patient_id
    where c.org_id = ${orgId} and c.patient_id = ${patientId} and c.status = 'open'
  `) as unknown as ConversationRow[];

  const row = rows[0] ?? null;
  return row !== null ? mapConversation(row) : null;
}

/** A conversation's messages, chronological. */
export async function listConversationMessages(
  orgId: string,
  conversationId: string,
): Promise<ConversationMessageRecord[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, conversation_id, sender_kind, sender_user_id, channel, body, created_at
    from public.conversation_messages
    where org_id = ${orgId} and conversation_id = ${conversationId}
    order by created_at asc, id asc
  `) as unknown as MessageRow[];

  return rows.map(mapMessage);
}

/** The unread counts for the staff thread list (derived, never stored). */
export async function unreadCountsForConversations(
  orgId: string,
  conversations: readonly ConversationRecord[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (conversations.length === 0) return counts;
  const sql = getSql();
  const rows = (await sql`
    select id, conversation_id, sender_kind, created_at
    from public.conversation_messages
    where org_id = ${orgId}
      and conversation_id = any(${conversations.map((conversation) => conversation.id)})
    order by created_at asc
  `) as unknown as Array<{ conversation_id: string; sender_kind: SenderKind; created_at: string }>;

  const grouped = new Map<string, Array<{ senderKind: SenderKind; createdAt: string }>>();
  for (const row of rows) {
    const list = grouped.get(row.conversation_id);
    if (list) list.push({ senderKind: row.sender_kind, createdAt: row.created_at });
    else grouped.set(row.conversation_id, [{ senderKind: row.sender_kind, createdAt: row.created_at }]);
  }
  for (const conversation of conversations) {
    const messages = grouped.get(conversation.id) ?? [];
    counts.set(conversation.id, unreadForStaff(messages.map((m) => ({ senderKind: m.senderKind }))));
  }
  return counts;
}
