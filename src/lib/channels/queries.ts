// src/lib/channels/queries.ts — the channel read layer (Phase 16, CHAN-03).
//
// RLS is inert on the single-owner Neon connection: each SELECT carries an
// explicit `org_id` scope (plus the patient/conversation pin the caller
// already supplies), which is the whole visibility boundary here.
import { getSql } from '@/lib/db/neon';
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
  const sql = getSql();
  const rows = (await sql`
    select id, patient_id, channel, handle, status
    from public.channel_endpoints
    where org_id = ${orgId} and patient_id = ${patientId}
    order by created_at desc, id desc
  `) as unknown as Array<{
    id: string;
    patient_id: string;
    channel: ChannelName;
    handle: string;
    status: EndpointStatus;
  }>;

  return rows.map((row) => ({
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
  const sql = getSql();
  const rows = (await sql`
    select id, conversation_id, message_id, channel, handle, status, provider_reference, reason, created_at
    from public.notification_deliveries
    where org_id = ${orgId} and conversation_id = ${conversationId}
    order by created_at asc, id asc
  `) as unknown as Array<{
    id: string;
    conversation_id: string;
    message_id: string;
    channel: ChannelName;
    handle: string;
    status: DeliveryStatus;
    provider_reference: string | null;
    reason: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
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
