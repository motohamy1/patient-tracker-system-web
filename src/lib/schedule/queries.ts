// src/lib/schedule/queries.ts — the provider's day schedule (Phase 22's
// provider-home dashboard, D-28 reference comparison).
//
// Bound parameters only (ASVS V5): the day window is passed in, never
// derived from user input inside the query. The RLS policies are inert on the
// single-owner Neon connection, so the explicit `org_id` predicates on the
// read are the org-scoping enforcement (the 0005 discipline), not defense in
// depth.
import { getSql } from '@/lib/db/neon';
import type { VisitStage } from '@/lib/visits/status';

export type ScheduleRow = {
  visitId: string;
  patientId: string;
  patientName: string;
  scheduledAt: string;
  visitType: string | null;
  stage: VisitStage;
};

type Row = {
  id: string;
  patient_id: string;
  scheduled_at: string;
  visit_type: string | null;
  stage: VisitStage;
  first_name: string | null;
  last_name: string | null;
};

/** The org's appointments inside one UTC day window, soonest first. */
export async function listDaySchedule(orgId: string, day: string): Promise<ScheduleRow[]> {
  const sql = getSql();
  const rows = (await sql`
    select v.id, v.patient_id, v.scheduled_at, v.visit_type, v.stage,
           p.first_name, p.last_name
    from public.visits v
    left join public.patients p on p.id = v.patient_id and p.org_id = v.org_id
    where v.org_id = ${orgId}
      and v.scheduled_at >= ${`${day}T00:00:00.000Z`}
      and v.scheduled_at <= ${`${day}T23:59:59.999Z`}
    order by v.scheduled_at asc, v.id asc
  `) as unknown as Row[];

  return rows.map((row) => ({
    visitId: row.id,
    patientId: row.patient_id,
    patientName:
      row.first_name !== null && row.last_name !== null
        ? `${row.first_name} ${row.last_name}`
        : 'Patient',
    scheduledAt: row.scheduled_at,
    visitType: row.visit_type,
    stage: row.stage,
  }));
}
