// src/lib/care-tasks/queries.ts — the Phase-14 read layer (org-scoped).
//
// Two reads, like the medications pair: the tasks themselves, and the
// append-only completion log both surfaces derive adherence from. The
// completions ride their task's title so a log row reads truthfully without a
// second query.
//
// The RLS policies are inert on the single-owner Neon connection, so every
// read carries an explicit `org_id` predicate — that predicate, not RLS, is
// the org-scoping enforcement.
import { getSql } from '@/lib/db/neon';
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

type CareTaskRow = {
  id: string;
  patient_id: string;
  title: string;
  detail: string | null;
  kind: CareTaskKind;
  due_at: string | null;
  status: CareTaskStatus;
  created_at: string;
};

function mapTaskRow(row: CareTaskRow): CareTaskRecord {
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

/** The patient's care tasks (default: active, due-soonest first). */
export async function listCareTasks(
  orgId: string,
  patientId: string,
  status: CareTaskStatus = 'active',
): Promise<CareTaskRecord[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, patient_id, title, detail, kind, due_at, status, created_at
    from public.care_tasks
    where org_id = ${orgId} and patient_id = ${patientId} and status = ${status}
    order by due_at asc nulls last, id desc
  `) as unknown as CareTaskRow[];

  return rows.map(mapTaskRow);
}

/** The patient's completion log, newest first (the adherence history). */
export async function listCareTaskCompletions(
  orgId: string,
  patientId: string,
): Promise<CareTaskCompletionRecord[]> {
  const sql = getSql();
  const rows = (await sql`
    select c.id, c.task_id, c.patient_id, c.note, c.completed_at, c.source,
           t.title as task_title
    from public.care_task_completions c
    left join public.care_tasks t on t.id = c.task_id and t.org_id = c.org_id
    where c.org_id = ${orgId} and c.patient_id = ${patientId}
    order by c.completed_at desc, c.id desc
  `) as unknown as Array<{
    id: string;
    task_id: string;
    patient_id: string;
    note: string | null;
    completed_at: string;
    source: CompletionSource;
    task_title: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    patientId: row.patient_id,
    note: row.note,
    completedAt: row.completed_at,
    source: row.source,
  }));
}

/** One task, org-scoped; null when no row is visible. */
export async function getCareTask(orgId: string, taskId: string): Promise<CareTaskRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, patient_id, title, detail, kind, due_at, status, created_at
    from public.care_tasks
    where org_id = ${orgId} and id = ${taskId}
    limit 1
  `) as unknown as CareTaskRow[];

  const row = rows[0];
  return row ? mapTaskRow(row) : null;
}
