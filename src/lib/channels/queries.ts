// src/lib/channels/queries.ts — the channel read layer (Phase 16, CHAN-03).
import { createClient } from '@/lib/supabase/server';
import type {
  ChannelName,
  NotificationDeliveryRecord,
  ChannelEndpointRecord,
  EndpointStatus,
  DeliveryStatus,
} from '@/lib/channels/status';

/** A patient's channel endpoints, newest first (staff-managed contact data). */
export async function listChannelEndpoints(
  orgId: string,
  patientId: string,
): Promise<ChannelEndpointRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('channel_endpoints')
    .select('id, patient_id, channel, handle, status')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw new Error(`listChannelEndpoints failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      patient_id: string;
      channel: ChannelName;
      handle: string;
      status: EndpointStatus;
    }>
  ).map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    channel: row.channel,
    handle: row.handle,
    status: row.status,
  }));
}

/** The delivery rows for a conversation's messages (the honest audit trail). */
export async function listDeliveryRecordsForConversation(
  orgId: string,
  conversationId: string,
): Promise<NotificationDeliveryRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notification_deliveries')
    .select('id, conversation_id, message_id, channel, handle, status, provider_reference, reason, created_at')
    .eq('org_id', orgId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(`listDeliveryRecordsForConversation failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      conversation_id: string;
      message_id: string;
      channel: ChannelName;
      handle: string;
      status: DeliveryStatus;
      provider_reference: string | null;
      reason: string | null;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    channel: row.channel,
    handle: row.handle,
    status: row.status,
    providerReference: row.provider_reference,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}
