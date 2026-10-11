// src/lib/messaging/actions.ts — the unified send/close actions (Phase 15,
// COMM-01..03; Phase 16 wires the channel workflow, CHAN-01/02).
//
// ONE send action serves both sides of the conversation: the session decides
// the sender, and the ported schema's guard re-derives it again server-side
// from `app.user_id` — a payload can never claim to be the care team or the
// patient. Messages are append-only: nothing here edits, deletes, or marks
// anything read. Writes run inside withAppUser so the guards see the actor.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_MESSAGE, CAN_SUBMIT_OBSERVATION, runsCapability } from '@/lib/auth/capabilities';
import { closeConversationSchema, sendMessageSchema, startConversationSchema } from '@/lib/messaging/schemas';
import { notifyForMessage } from '@/lib/channels/workflow';

export type MessagingActionResult =
  | { ok: true; messageId?: string; conversationId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' };

function revalidateMessaging(patientId?: string) {
  revalidatePath('/provider/messages');
  revalidatePath('/patient/home');
  if (patientId !== undefined) revalidatePath(`/provider/patients/${patientId}/overview`);
}

/**
 * Send a message in an open conversation. Works for the care team
 * (CAN_MESSAGE) and for the patient themself (their own conversation) — the
 * database decides which from the verified session.
 */
export async function sendMessageAction(input: unknown): Promise<MessagingActionResult> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const provider = await resolveWorkspaceRole('provider');
  const patientResolution = await resolveWorkspaceRole('patient');

  const isStaff = provider.kind === 'signed-in' && runsCapability(provider.role, CAN_MESSAGE);
  const isPatient =
    patientResolution.kind === 'signed-in' &&
    runsCapability(patientResolution.role, CAN_SUBMIT_OBSERVATION);
  if (!isStaff && !isPatient) return { ok: false, kind: 'forbidden' };

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'forbidden' };

  const channel = parsed.data.channel;
  let inserted: { id: string; conversation_id: string; patient_id: string } | null = null;
  try {
    inserted = await withAppUser(user.id, async (tx) => {
      const { rows } = await tx.query<{ id: string; conversation_id: string; patient_id: string }>(
        channel !== undefined
          ? `insert into public.conversation_messages (conversation_id, body, channel)
             values ($1, $2, $3)
             returning id, conversation_id, patient_id`
          : `insert into public.conversation_messages (conversation_id, body)
             values ($1, $2)
             returning id, conversation_id, patient_id`,
        channel !== undefined
          ? [parsed.data.conversationId, parsed.data.body, channel]
          : [parsed.data.conversationId, parsed.data.body],
      );
      return rows[0] ?? null;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (inserted === null) return { ok: false, kind: 'error' };

  // Phase 16 (CHAN-01/02): the thread's message notifies the patient's active
  // channels; the in-app message is recorded either way, and each delivery
  // attempt is logged with its honest status. Only the care team triggers
  // notifications — a patient's own message never notifies back at them.
  if (isStaff && provider.kind === 'signed-in') {
    await notifyForMessage(
      provider.orgId,
      inserted.conversation_id,
      inserted.id,
      inserted.patient_id,
      parsed.data.body,
    ).catch(() => undefined);
  }

  revalidateMessaging(inserted.patient_id);
  return { ok: true, messageId: inserted.id, conversationId: inserted.conversation_id };
}

/**
 * Staff-side find-or-create + first message (the folder card's "Message
 * patient" path). The unique partial index makes the race safe: two concurrent
 * opens cannot both win.
 */
export async function startConversationAction(input: unknown): Promise<MessagingActionResult> {
  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return { ok: false, kind: 'forbidden' };
  if (!runsCapability(resolution.role, CAN_MESSAGE)) return { ok: false, kind: 'forbidden' };

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'forbidden' };

  const sql = getSql();

  let patient: { id: string } | null = null;
  try {
    const rows = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${resolution.orgId}
    `) as unknown as { id: string }[];
    patient = rows[0] ?? null;
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (patient === null) return { ok: false, kind: 'not-found' };

  // Find the open conversation, or create it (the guard opens it as `open`).
  let existing: { id: string } | null = null;
  try {
    const rows = (await sql`
      select id from public.conversations
      where org_id = ${resolution.orgId}
        and patient_id = ${parsed.data.patientId}
        and status = 'open'
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
          [resolution.orgId, parsed.data.patientId],
        );
        return rows[0]?.id ?? null;
      });
    } catch {
      return { ok: false, kind: 'error' };
    }
    if (conversationId === null) return { ok: false, kind: 'error' };
  }
  const targetConversationId = conversationId;

  let message: { id: string } | null = null;
  try {
    message = await withAppUser(user.id, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.conversation_messages (conversation_id, body) values ($1, $2) returning id`,
        [targetConversationId, parsed.data.body],
      );
      return rows[0] ?? null;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (message === null) return { ok: false, kind: 'error' };

  await notifyForMessage(
    resolution.orgId,
    targetConversationId,
    message.id,
    parsed.data.patientId,
    parsed.data.body,
  ).catch(() => undefined);

  revalidateMessaging(parsed.data.patientId);
  return { ok: true, messageId: message.id, conversationId: targetConversationId };
}

/** Close a thread; the message log is kept (the history is the record). */
export async function closeConversationAction(input: unknown): Promise<MessagingActionResult> {
  const parsed = closeConversationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return { ok: false, kind: 'forbidden' };
  if (!runsCapability(resolution.role, CAN_MESSAGE)) return { ok: false, kind: 'forbidden' };

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'forbidden' };

  let updated: { id: string; patient_id: string } | null = null;
  try {
    updated = await withAppUser(user.id, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.conversations set status = 'closed'
         where id = $1 and org_id = $2
         returning id, patient_id`,
        [parsed.data.conversationId, resolution.orgId],
      );
      return rows[0] ?? null;
    });
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (updated === null) return { ok: false, kind: 'not-found' };

  revalidateMessaging(updated.patient_id);
  return { ok: true, conversationId: updated.id };
}
