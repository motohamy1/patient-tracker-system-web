// src/lib/care-tasks/actions.ts — assignment, archive and the patient's
// completion (Phase 14, TASK-01/02; AUTH-05/07).
//
// Three actions, three actors: the DOCTOR assigns and archives; the PATIENT
// marks a task done. Adherence is never written as a score — it is derived
// from the append-only completion log, and both surfaces read it the same way.
//
// Every write runs through withAppUser(user.id, …): the ported provenance and
// guard triggers read `public.app_uid()` (created_by/updated_by, and the
// completion guard's patient re-derivation), so the identity must be on the
// session. Org scoping on the single-owner Neon connection is the explicit
// `org_id` predicate, not RLS.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_AUTHOR_CLINICAL, CAN_SUBMIT_OBSERVATION, runsCapability } from '@/lib/auth/capabilities';
import { getPatientForCurrentUser } from '@/lib/patient/queries';
import { postTaskMessageAndNotify } from '@/lib/channels/workflow';
import {
  assignCareTaskSchema,
  careTaskTransitionSchema,
  completeCareTaskSchema,
} from '@/lib/care-tasks/schemas';

export type CareTaskActionResult =
  | { ok: true; taskId?: string; completionId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'not-found' | 'error' };

async function requireDoctor() {
  const [resolution, user] = await Promise.all([
    resolveWorkspaceRole('provider'),
    getSessionUser(),
  ]);
  if (resolution.kind !== 'signed-in') return null;
  if (!user) return null;
  if (!runsCapability(resolution.role, CAN_AUTHOR_CLINICAL)) return null;
  return { ...resolution, uid: user.id };
}

function revalidateTaskSurfaces(patientId: string) {
  revalidatePath(`/provider/patients/${patientId}/overview`);
  revalidatePath('/patient/home');
}

/** A provider assigns a small, concrete care task. */
export async function assignCareTaskAction(input: unknown): Promise<CareTaskActionResult> {
  const parsed = assignCareTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const sql = getSql();
  let patient: { id: string } | undefined;
  try {
    const rows = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    patient = rows[0];
  } catch {
    return { ok: false, kind: 'error' };
  }
  if (!patient) return { ok: false, kind: 'not-found' };

  let task: { id: string; patient_id: string } | undefined;
  try {
    task = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `insert into public.care_tasks (org_id, patient_id, title, detail, kind, due_at)
         values ($1, $2, $3, $4, $5, $6)
         returning id, patient_id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.title,
          parsed.data.detail,
          parsed.data.kind,
          parsed.data.dueAt ?? null,
        ],
      );
      return rows[0];
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!task) return { ok: false, kind: 'error' };

  // Phase 16 (CHAN-01/02): the assignment tells the patient through the
  // unified conversation first, then their channels — one story, two
  // transports. A channel failure never fails the assignment.
  await postTaskMessageAndNotify(actor.orgId, task.patient_id, parsed.data.title).catch(
    () => undefined,
  );

  revalidateTaskSurfaces(task.patient_id);
  return { ok: true, taskId: task.id };
}

/** Archive a task: it leaves the active list without erasing its history. */
export async function archiveCareTaskAction(input: unknown): Promise<CareTaskActionResult> {
  const parsed = careTaskTransitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireDoctor();
  if (!actor) return { ok: false, kind: 'forbidden' };

  let task: { id: string; patient_id: string } | undefined;
  try {
    task = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.care_tasks set status = 'archived'
         where id = $1 and org_id = $2
         returning id, patient_id`,
        [parsed.data.taskId, actor.orgId],
      );
      return rows[0];
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!task) return { ok: false, kind: 'not-found' };

  revalidateTaskSurfaces(task.patient_id);
  return { ok: true, taskId: task.id };
}

/**
 * The patient marks a task done. Requires the patient capability and resolves
 * the patient from the verified session; migration 0013's guard re-derives the
 * row's patient from `app_uid()` and refuses a task that is not theirs or not
 * active. The stated `completed_at` is kept as the patient said it.
 */
export async function completeCareTaskAction(input: unknown): Promise<CareTaskActionResult> {
  const parsed = completeCareTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const resolution = await resolveWorkspaceRole('patient');
  if (resolution.kind !== 'signed-in') return { ok: false, kind: 'forbidden' };
  if (!runsCapability(resolution.role, CAN_SUBMIT_OBSERVATION)) return { ok: false, kind: 'forbidden' };

  const user = await getSessionUser();
  if (!user) return { ok: false, kind: 'forbidden' };

  const patient = await getPatientForCurrentUser();
  if (patient === null) return { ok: false, kind: 'not-found' };

  let completion: { id: string; patient_id: string } | undefined;
  try {
    completion = await withAppUser(user.id, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `insert into public.care_task_completions
           (org_id, patient_id, task_id, note, completed_at)
         values ($1, $2, $3, $4, coalesce($5::timestamptz, now()))
         returning id, patient_id`,
        [
          patient.orgId,
          patient.id,
          parsed.data.taskId,
          parsed.data.note,
          parsed.data.completedAt ?? null,
        ],
      );
      return rows[0];
    });
  } catch {
    return { ok: false, kind: 'error' };
  }

  if (!completion) return { ok: false, kind: 'error' };

  revalidateTaskSurfaces(completion.patient_id);
  return { ok: true, completionId: completion.id };
}
