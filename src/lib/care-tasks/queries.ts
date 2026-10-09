// src/lib/care-tasks/queries.ts — the Phase-14 read layer (RLS-scoped).
//
// Two reads, like the medications pair: the tasks themselves, and the
// append-only completion log both surfaces derive adherence from. The
// completions ride their task's title so a log row reads truthfully without a
// second query.
import { createClient } from '@/lib/supabase/server';
import type { CareTaskKind, CareTaskStatus, CompletionSource } from '@/lib/care-tasks/status';

export type CareTaskRecord = {
  id: string;
  patientId: string;
  title: string;
  detail: string | null;
  kind: CareTaskKind;
  dueAt: string | null;
  status: CareTaskStatus;
  createdAt: string;
};

export type CareTaskCompletionRecord = {
  id: string;
  taskId: string;
  taskTitle: string | null;
  patientId: string;
  note: string | null;
  completedAt: string;
  source: CompletionSource;
};

const TASK_COLUMNS =
  'id, patient_id, title, detail, kind, due_at, status, created_at';

const COMPLETION_COLUMNS =
  'id, task_id, patient_id, note, completed_at, source, care_tasks(title)';

/** The patient's care tasks (default: active, due-soonest first). */
export async function listCareTasks(
  orgId: string,
  patientId: string,
  status: CareTaskStatus = 'active',
): Promise<CareTaskRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('care_tasks')
    .select(TASK_COLUMNS)
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .eq('status', status)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listCareTasks failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      patient_id: string;
      title: string;
      detail: string | null;
      kind: CareTaskKind;
      due_at: string | null;
      status: CareTaskStatus;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    title: row.title,
    detail: row.detail,
    kind: row.kind,
    dueAt: row.due_at,
    status: row.status,
    createdAt: row.created_at,
  }));
}

/** The patient's completion log, newest first (the adherence history). */
export async function listCareTaskCompletions(
  orgId: string,
  patientId: string,
): Promise<CareTaskCompletionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('care_task_completions')
    .select(COMPLETION_COLUMNS)
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('completed_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listCareTaskCompletions failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      task_id: string;
      patient_id: string;
      note: string | null;
      completed_at: string;
      source: CompletionSource;
      care_tasks: { title: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.care_tasks?.title ?? null,
    patientId: row.patient_id,
    note: row.note,
    completedAt: row.completed_at,
    source: row.source,
  }));
}

/** One task, org-scoped; null when RLS hides it. */
export async function getCareTask(orgId: string, taskId: string): Promise<CareTaskRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('care_tasks')
    .select(TASK_COLUMNS)
    .eq('org_id', orgId)
    .eq('id', taskId)
    .maybeSingle();
  if (error) throw new Error(`getCareTask failed: ${error.message}`);
  if (!data) return null;
  const row = data as {
    id: string;
    patient_id: string;
    title: string;
    detail: string | null;
    kind: CareTaskKind;
    due_at: string | null;
    status: CareTaskStatus;
    created_at: string;
  };
  return {
    id: row.id,
    patientId: row.patient_id,
    title: row.title,
    detail: row.detail,
    kind: row.kind,
    dueAt: row.due_at,
    status: row.status,
    createdAt: row.created_at,
  };
}
