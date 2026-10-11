// src/lib/visits/queries.ts — the Phase-7 server-side visit retrieval layer.
//
// Neon + explicit org scoping: the RLS policies are inert on the single-owner
// connection (neon/README.md posture note), so the explicit
// `org_id = ${orgId}` predicate on every read IS the authorization boundary —
// not defense in depth (0005 discipline). Server Component / server action
// call sites only — never import from a client file.
//
// The projection (07-04) reads the SAME rows the Visits tab shows, so the
// timeline and the tab can never tell different stories about a visit.
import { getSql } from '@/lib/db/neon';
import type { VisitSource, VisitStage } from '@/lib/visits/status';

export type VisitRecord = {
  id: string;
  patientId: string;
  stage: VisitStage;
  scheduledAt: string;
  visitType: string | null;
  location: string | null;
  reason: string | null;
  documentation: string | null;
  followUp: string | null;
  followUpAt: string | null;
  source: VisitSource;
  createdAt: string;
  updatedAt: string;
};

type VisitRow = {
  id: string;
  patient_id: string;
  stage: VisitStage;
  scheduled_at: string;
  visit_type: string | null;
  location: string | null;
  reason: string | null;
  documentation: string | null;
  follow_up: string | null;
  follow_up_at: string | null;
  source: VisitSource;
  created_at: string;
  updated_at: string;
};

function mapRow(row: VisitRow): VisitRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    stage: row.stage,
    scheduledAt: row.scheduled_at,
    visitType: row.visit_type,
    location: row.location,
    reason: row.reason,
    documentation: row.documentation,
    followUp: row.follow_up,
    followUpAt: row.follow_up_at,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The patient's visits, newest first (bound parameters only, ASVS V5). */
export async function listVisits(orgId: string, patientId: string): Promise<VisitRecord[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, patient_id, stage, scheduled_at, visit_type, location, reason, documentation,
           follow_up, follow_up_at, source, created_at, updated_at
    from public.visits
    where org_id = ${orgId} and patient_id = ${patientId}
    order by scheduled_at desc, id desc
  `) as unknown as VisitRow[];

  return rows.map(mapRow);
}

/** One visit, org-scoped; null when no row is visible (no-leak denial upstream). */
export async function getVisit(orgId: string, visitId: string): Promise<VisitRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, patient_id, stage, scheduled_at, visit_type, location, reason, documentation,
           follow_up, follow_up_at, source, created_at, updated_at
    from public.visits
    where org_id = ${orgId} and id = ${visitId}
    limit 1
  `) as unknown as VisitRow[];

  const row = rows[0];
  return row ? mapRow(row) : null;
}
