// src/lib/messaging/queries.ts — the conversation read layer (Phase 15;
// 0014's self-or-staff SELECT policies).
import { createClient } from '@/lib/supabase/server';
import type {
  ConversationMessageRecord,
  ConversationRecord,
  MessageChannel,
  SenderKind,
} from '@/lib/messaging/status';
import { unreadForStaff } from '@/lib/messaging/unread';

const CONVERSATION_COLUMNS =
  'id, org_id, patient_id, status, updated_at, patients(first_name, last_name)';

type ConversationRow = {
  id: string;
  org_id: string;
  patient_id: string;
  status: 'open' | 'closed';
  updated_at: string;
  patients: { first_name: string; last_name: string } | null;
};

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    patientId: row.patient_id,
    patientName: row.patients !== null ? `${row.patients.first_name} ${row.patients.last_name}` : 'Patient',
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listConversations failed: ${error.message}`);
  return ((data ?? []) as ConversationRow[]).map(mapConversation);
}

/** One conversation, org-scoped; null when RLS hides it. */
export async function getConversation(
  orgId: string,
  conversationId: string,
): Promise<ConversationRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('org_id', orgId)
    .eq('id', conversationId)
    .maybeSingle();
  if (error) throw new Error(`getConversation failed: ${error.message}`);
  return data ? mapConversation(data as ConversationRow) : null;
}

/** The patient's own open conversation, or null (patient surface). */
export async function getOwnConversation(
  orgId: string,
  patientId: string,
): Promise<ConversationRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .eq('status', 'open')
    .maybeSingle();
  if (error) throw new Error(`getOwnConversation failed: ${error.message}`);
  return data ? mapConversation(data as ConversationRow) : null;
}

/** A conversation's messages, chronological. */
export async function listConversationMessages(
  orgId: string,
  conversationId: string,
): Promise<ConversationMessageRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('id, conversation_id, sender_kind, sender_user_id, channel, body, created_at')
    .eq('org_id', orgId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw new Error(`listConversationMessages failed: ${error.message}`);
  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

/** The unread counts for the staff thread list (derived, never stored). */
export async function unreadCountsForConversations(
  orgId: string,
  conversations: readonly ConversationRecord[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (conversations.length === 0) return counts;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('id, conversation_id, sender_kind, created_at')
    .eq('org_id', orgId)
    .in(
      'conversation_id',
      conversations.map((conversation) => conversation.id),
    )
    .order('created_at', { ascending: true });
  if (error) throw new Error(`unreadCountsForConversations failed: ${error.message}`);

  const grouped = new Map<string, Array<{ senderKind: SenderKind; createdAt: string }>>();
  for (const row of (data ?? []) as Array<{ conversation_id: string; sender_kind: SenderKind; created_at: string }>) {
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
