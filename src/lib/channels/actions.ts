// src/lib/channels/actions.ts — the staff-managed channel endpoints
// (Phase 16, ticket 16-03; CHAN-03).
//
// Endpoints are contact data about the patient, managed by staff (doctor +
// nurse, mirroring 0015's write policy); no patient write path exists here.
// The capability check runs before any write; the guards re-derive the
// org/patient from the session.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_MESSAGE, runsCapability } from '@/lib/auth/capabilities';
import { CHANNEL_NAMES } from '@/lib/channels/status';
import { saveChannelEndpointSchema, setChannelEndpointStatusSchema } from '@/lib/channels/schemas';

export type ChannelActionResult =
  | { ok: true; endpointId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' };

async function requireCareTeam() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_MESSAGE)) return null;
  return resolution;
}

function revalidateChannelSurfaces(patientId: string) {
  revalidatePath('/provider/messages');
  revalidatePath(`/provider/patients/${patientId}/overview`);
}

/** Add or update the patient's endpoint for a channel (one endpoint per channel). */
export async function saveChannelEndpointAction(input: unknown): Promise<ChannelActionResult> {
  const parsed = saveChannelEndpointSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };
  if (!CHANNEL_NAMES.includes(parsed.data.channel)) return { ok: false, kind: 'invalid' };

  const actor = await requireCareTeam();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', parsed.data.patientId)
    .eq('org_id', actor.orgId)
    .maybeSingle();
  if (patientError) return { ok: false, kind: 'error' };
  if (!patient) return { ok: false, kind: 'not-found' };

  // One endpoint per channel per patient: a handle change replaces the row.
  const { data: existing } = await supabase
    .from('channel_endpoints')
    .select('id')
    .eq('org_id', actor.orgId)
    .eq('patient_id', parsed.data.patientId)
    .eq('channel', parsed.data.channel)
    .maybeSingle();

  if (existing !== null) {
    const { error } = await supabase
      .from('channel_endpoints')
      .update({ handle: parsed.data.handle, status: parsed.data.status ?? 'active' })
      .eq('id', existing.id)
      .eq('org_id', actor.orgId);
    if (error) return { ok: false, kind: 'error' };
    revalidateChannelSurfaces(parsed.data.patientId);
    return { ok: true, endpointId: existing.id as string };
  }

  const { data, error } = await supabase
    .from('channel_endpoints')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      channel: parsed.data.channel,
      handle: parsed.data.handle,
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, kind: 'error' };

  revalidateChannelSurfaces(parsed.data.patientId);
  return { ok: true, endpointId: data.id as string };
}

/** Activate or deactivate an endpoint (the delivery workflow reads ACTIVE only). */
export async function setChannelEndpointStatusAction(input: unknown): Promise<ChannelActionResult> {
  const parsed = setChannelEndpointStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireCareTeam();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('channel_endpoints')
    .update({ status: parsed.data.status })
      .eq('id', parsed.data.endpointId)
    .eq('org_id', actor.orgId)
    .select('id, patient_id')
    .maybeSingle();
  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateChannelSurfaces(data.patient_id as string);
  return { ok: true, endpointId: data.id as string };
}
