// src/lib/genetics/actions.ts — record a genetic finding (ALG-02, AUTH-05).
// Clinical authoring (CAN_AUTHOR_CLINICAL); the DB guard restricts to
// provider_doctor and integrity-checks the report document to the same
// patient/org.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { recordGeneticFindingSchema } from '@/lib/genetics/schemas';

export type GeneticsActionResult =
  | { ok: true; findingId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return resolution;
}

function revalidateGeneticsSurfaces(patientId: string) {
  revalidatePath('/provider');
  revalidatePath(`/provider/patients/${patientId}/genetics`);
}

export async function recordGeneticFindingAction(input: unknown): Promise<GeneticsActionResult> {
  const parsed = recordGeneticFindingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireStaff(CAN_AUTHOR_CLINICAL);
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

  const { data, error } = await supabase
    .from('genetics')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      kind: parsed.data.kind,
      gene: parsed.data.gene,
      variant: parsed.data.variant,
      interpretation: parsed.data.interpretation,
      significance: parsed.data.significance,
      document_id: parsed.data.documentId,
      ...(parsed.data.reportedAt ? { reported_at: parsed.data.reportedAt } : {}),
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  revalidateGeneticsSurfaces(parsed.data.patientId);
  return { ok: true, findingId: data.id };
}
