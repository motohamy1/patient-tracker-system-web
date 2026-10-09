// src/lib/messaging/actions.ts — the unified send/close actions (Phase 15,
// COMM-01..03; AUTH-05/07).
//
// ONE send action serves both sides of the conversation: the session decides
// the sender, and migration 0014's guard re-derives it again server-side — a
// payload can never claim to be the care team or the patient. Messages are
// append-only: nothing here edits, deletes, or marks anything read.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_MESSAGE, CAN_SUBMIT_OBSERVATION, runsCapability } from '@/lib/auth/capabilities';
import { closeConversationSchema, sendMessageSchema, startConversationSchema } from '@/lib/messaging/schemas';

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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: parsed.data.conversationId,
      body: parsed.data.body,
      ...(parsed.data.channel !== undefined ? { channel: parsed.data.channel } : {}),
    })
    .select('id, conversation_id, patient_id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateMessaging(data.patient_id as string);
  return { ok: true, messageId: data.id as string, conversationId: data.conversation_id as string };
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

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', parsed.data.patientId)
    .eq('org_id', resolution.orgId)
    .maybeSingle();
  if (patientError) return { ok: false, kind: 'error' };
  if (!patient) return { ok: false, kind: 'not-found' };

  // Find the open conversation, or create it (the guard opens it as `open`).
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('org_id', resolution.orgId)
    .eq('patient_id', parsed.data.patientId)
    .eq('status', 'open')
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;
  if (conversationId === undefined) {
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({ org_id: resolution.orgId, patient_id: parsed.data.patientId })
      .select('id')
      .single();
    if (createError || !created) return { ok: false, kind: 'error' };
    conversationId = created.id as string;
  }

  const { data: message, error: messageError } = await supabase
    .from('conversation_messages')
    .insert({ conversation_id: conversationId, body: parsed.data.body })
    .select('id')
    .single();
  if (messageError || !message) return { ok: false, kind: 'error' };

  revalidateMessaging(parsed.data.patientId);
  return { ok: true, messageId: message.id as string, conversationId };
}

/** Close a thread; the message log is kept (the history is the record). */
export async function closeConversationAction(input: unknown): Promise<MessagingActionResult> {
  const parsed = closeConversationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return { ok: false, kind: 'forbidden' };
  if (!runsCapability(resolution.role, CAN_MESSAGE)) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .update({ status: 'closed' })
    .eq('id', parsed.data.conversationId)
    .eq('org_id', resolution.orgId)
    .select('id, patient_id')
    .maybeSingle();
  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateMessaging(data.patient_id as string);
  return { ok: true, conversationId: data.id as string };
}
