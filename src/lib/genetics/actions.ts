// src/lib/genetics/actions.ts — record a genetic finding (ALG-02, AUTH-05).
// Clinical authoring (CAN_AUTHOR_CLINICAL); the DB guard restricts to
// provider_doctor and integrity-checks the report document to the same
// patient/org.
//
// The INSERT runs through withAppUser(), so `touch_genetics_provenance` reads
// public.app_uid() for created_by/updated_by and `guard_genetic_content`
// resolves the caller's role for the same org. The patient/document lookups
// carry an explicit `org_id` predicate because the ported RLS policies are
// inert on the single-owner Neon connection.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, runsCapability, type Capability } from '@/lib/auth/capabilities';
import { recordGeneticFindingSchema } from '@/lib/genetics/schemas';

export type GeneticsActionResult =
  | { ok: true; findingId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

async function requireStaff(capability: Capability) {
  const user = await getSessionUser();
  if (!user) return null;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, capability)) return null;
  return { orgId: resolution.orgId, userId: user.id };
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

  try {
    const sql = getSql();
    const patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    if (patients.length === 0) return { ok: false, kind: 'not-found' };

    // source/verification omitted → SQL defaults (clinician,
    // clinician-verified); reported_at defaults to now() when unstated.
    const created = await withAppUser(actor.userId, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.genetics
           (org_id, patient_id, kind, gene, variant, interpretation, significance, document_id, reported_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, now()))
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.kind,
          parsed.data.gene,
          parsed.data.variant,
          parsed.data.interpretation,
          parsed.data.significance,
          parsed.data.documentId,
          parsed.data.reportedAt ?? null,
        ],
      );
      return rows[0] ?? null;
    });

    if (!created) return { ok: false, kind: 'error' };

    revalidateGeneticsSurfaces(parsed.data.patientId);
    return { ok: true, findingId: created.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}
