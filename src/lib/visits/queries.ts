// src/lib/visits/queries.ts — the Phase-7 server-side visit retrieval layer.
//
// RLS (migration 0006) enforces org scoping regardless of what this module is
// handed; the explicit `.eq('org_id', …)` is defense in depth, not the
// authorization boundary (0005 discipline). Server Component / server action
// call sites only — never import from a client file.
//
// The projection (07-04) reads the SAME rows the Visits tab shows, so the
// timeline and the tab can never tell different stories about a visit.
import { createClient } from '@/lib/supabase/server';
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

const SELECT_COLUMNS =
  'id, patient_id, stage, scheduled_at, visit_type, location, reason, documentation, follow_up, follow_up_at, source, created_at, updated_at';

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

/** The patient's visits, newest first (bound predicates only, ASVS V5). */
export async function listVisits(orgId: string, patientId: string): Promise<VisitRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('visits')
    .select(SELECT_COLUMNS)
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('scheduled_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listVisits failed: ${error.message}`);
  return ((data ?? []) as VisitRow[]).map(mapRow);
}

/** One visit, org-scoped; null when RLS hides it (no-leak denial upstream). */
export async function getVisit(orgId: string, visitId: string): Promise<VisitRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('visits')
    .select(SELECT_COLUMNS)
    .eq('org_id', orgId)
    .eq('id', visitId)
    .maybeSingle();

  if (error) throw new Error(`getVisit failed: ${error.message}`);
  return data ? mapRow(data as VisitRow) : null;
}
