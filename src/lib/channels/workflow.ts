// src/lib/channels/workflow.ts — the server-side notification workflow
// (Phase 16, ticket 16-02; CHAN-01/02/03).
//
// Two entry points, one rule: a notification only exists because a message in
// the thread exists.
//   notifyForMessage         — deliver + record for a message that was just sent
//   postTaskMessageAndNotify — a care task is assigned, so the team's message
//                              goes into the thread first, then notifies
// Both resolve the patient's ACTIVE endpoints under the caller's explicit org
// scope, call the adapters, and write one append-only delivery row per attempt.
// These helpers take no actor argument, so the identity the ported guards
// re-derive is resolved from the session here (getSessionUser → withAppUser).
//
// NOT a 'use server' module: these helpers are invoked by other server actions
// (messaging, care tasks) and must not be exposed as client-callable
// endpoints. Every write still runs under the caller's session.
import { getSessionUser } from '@/lib/auth/session';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
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
  const sql = getSql();

  // The patient's ACTIVE endpoints for the out-of-band channels.
  let endpoints: Array<{ channel: string; handle: string }> = [];
  try {
    endpoints = (await sql`
      select channel, handle from public.channel_endpoints
      where org_id = ${orgId} and patient_id = ${patientId} and status = 'active'
    `) as unknown as Array<{ channel: string; handle: string }>;
  } catch {
    return;
  }

  const targets = endpoints.filter(
    (endpoint): endpoint is { channel: ChannelName; handle: string } =>
      endpoint.channel === 'whatsapp' || endpoint.channel === 'telegram',
  );
  if (targets.length === 0) return;

  const results = await deliverNotifications(composeNotification(body), targets);
  if (results.length === 0) return;

  const user = await getSessionUser();
  if (!user) return;

  for (const result of results) {
    // The adapter's own honest classification: a missing credential is
    // `not_configured`, a transport error is `failed` — never a fake success.
    const status: DeliveryStatus = result.delivered
      ? 'delivered'
      : result.failure === 'not_configured'
        ? 'not_configured'
        : 'failed';
    try {
      await withAppUser(user.id, async (tx) => {
        await tx.query(
          `insert into public.notification_deliveries
             (conversation_id, message_id, org_id, patient_id, channel, handle, status, provider_reference, reason)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            conversationId,
            messageId,
            orgId,
            patientId,
            result.channel,
            result.handle,
            status,
            result.providerReference ?? null,
            result.reason ?? null,
          ],
        );
      });
    } catch {
      // The delivery log is best-effort; the in-app thread remains the truth.
    }
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
  const user = await getSessionUser();
  if (!user) return null;

  const sql = getSql();

  let existing: { id: string } | null = null;
  try {
    const rows = (await sql`
      select id from public.conversations
      where org_id = ${orgId} and patient_id = ${patientId} and status = 'open'
    `) as unknown as { id: string }[];
    existing = rows[0] ?? null;
  } catch {
    existing = null;
  }

  let conversationId: string | null = existing !== null ? existing.id : null;
  if (conversationId === null) {
    try {
      conversationId = await withAppUser(user.id, async (tx) => {
        const { rows } = await tx.query<{ id: string }>(
          `insert into public.conversations (org_id, patient_id) values ($1, $2) returning id`,
          [orgId, patientId],
        );
        return rows[0]?.id ?? null;
      });
    } catch {
      return null;
    }
    if (conversationId === null) return null;
  }
  const targetConversationId = conversationId;

  const body = `Your care team added a task for you: ${taskTitle}.`;
  let messageId: string | null = null;
  try {
    messageId = await withAppUser(user.id, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.conversation_messages (conversation_id, body) values ($1, $2) returning id`,
        [targetConversationId, body],
      );
      return rows[0]?.id ?? null;
    });
  } catch {
    return null;
  }
  if (messageId === null) return null;

  await notifyForMessage(orgId, targetConversationId, messageId, patientId, body);
  return { conversationId: targetConversationId, messageId };
}
