// src/lib/channels/workflow.ts — the server-side notification workflow
// (Phase 16, ticket 16-02; CHAN-01/02/03).
//
// Two entry points, one rule: a notification only exists because a message in
// the thread exists.
//   notifyForMessage         — deliver + record for a message that was just sent
//   postTaskMessageAndNotify — a care task is assigned, so the team's message
//                              goes into the thread first, then notifies
// Both resolve the patient's ACTIVE endpoints under the caller's RLS scope,
// call the adapters, and write one append-only delivery row per attempt.
//
// NOT a 'use server' module: these helpers are invoked by other server actions
// (messaging, care tasks) and must not be exposed as client-callable
// endpoints. Every write still runs under the caller's session and RLS.
import { createClient } from '@/lib/supabase/server';
import { deliverNotifications, composeNotification } from '@/lib/channels/notify';
import type { ChannelName, DeliveryStatus } from '@/lib/channels/status';

/**
 * Deliver the channel-safe rendering of a message to the patient's active
 * endpoints and record every attempt. Delivery rows are written with the
 * honest status (`delivered` with the provider reference, or
 * `not_configured`/`failed` with the reason); a failure here NEVER removes the
 * in-app message — the thread remains the truth and the log explains the rest.
 */
export async function notifyForMessage(
  orgId: string,
  conversationId: string,
  messageId: string,
  patientId: string,
  body: string,
): Promise<void> {
  const supabase = await createClient();

  // The patient's ACTIVE endpoints for the out-of-band channels.
  const { data: endpoints, error: endpointsError } = await supabase
    .from('channel_endpoints')
    .select('channel, handle')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .eq('status', 'active');
  if (endpointsError !== null || endpoints === null) return;

  const targets = (endpoints as Array<{ channel: string; handle: string }>).filter(
    (endpoint): endpoint is { channel: ChannelName; handle: string } =>
      endpoint.channel === 'whatsapp' || endpoint.channel === 'telegram',
  );
  if (targets.length === 0) return;

  const results = await deliverNotifications(composeNotification(body), targets);

  for (const result of results) {
    // The adapter's own honest classification: a missing credential is
    // `not_configured`, a transport error is `failed` — never a fake success.
    const status: DeliveryStatus = result.delivered
      ? 'delivered'
      : result.failure === 'not_configured'
        ? 'not_configured'
        : 'failed';
    await supabase.from('notification_deliveries').insert({
      conversation_id: conversationId,
      message_id: messageId,
      org_id: orgId,
      patient_id: patientId,
      channel: result.channel,
      handle: result.handle,
      status,
      ...(result.providerReference !== undefined ? { provider_reference: result.providerReference } : {}),
      ...(result.reason !== undefined ? { reason: result.reason } : {}),
    });
  }
}

/**
 * A care task is assigned, so the team's note about it goes into the unified
 * conversation first (find-or-create, exactly like the folder card path) and
 * then notifies the channels. Returns the thread's ids, or null when no
 * conversation could be opened.
 */
export async function postTaskMessageAndNotify(
  orgId: string,
  patientId: string,
  taskTitle: string,
): Promise<{ conversationId: string; messageId: string } | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .eq('status', 'open')
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;
  if (conversationId === undefined) {
    const { data: created } = await supabase
      .from('conversations')
      .insert({ org_id: orgId, patient_id: patientId })
      .select('id')
      .single();
    conversationId = created?.id as string | undefined;
    if (conversationId === undefined) return null;
  }

  const body = `Your care team added a task for you: ${taskTitle}.`;
  const { data: message } = await supabase
    .from('conversation_messages')
    .insert({ conversation_id: conversationId, body })
    .select('id')
    .single();
  const messageId = message?.id as string | undefined;
  if (messageId === undefined) return null;

  await notifyForMessage(orgId, conversationId, messageId, patientId, body);
  return { conversationId, messageId };
}
