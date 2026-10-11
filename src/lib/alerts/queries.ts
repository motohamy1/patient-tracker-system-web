// src/lib/alerts/queries.ts — the org's critical alerts (Phase 22's
// provider-home dashboard, D-28 reference comparison).
//
// Two honest sources, one panel: patients whose folder status is critical,
// and unreviewed attention insights — the AI output that has not yet had a
// clinician's judgment recorded on it (AI-02: an unreviewed insight is
// never presented as verified). RLS is inert on the single-owner Neon
// connection, so every SELECT carries its own `org_id` scope; no other
// predicate is added.
import { getSql } from '@/lib/db/neon';

export type CriticalAlertRow = {
  id: string;
  patientName: string;
  patientId: string;
  headline: string;
  source: 'folder' | 'insight';
};

type FolderRow = {
  id: string;
  first_name: string;
  last_name: string;
};

type InsightRow = {
  id: string;
  patient_id: string;
  title: string;
  first_name: string;
  last_name: string;
};

/** The org's critical patients and unreviewed attention insights. */
export async function listCriticalAlerts(orgId: string): Promise<CriticalAlertRow[]> {
  const sql = getSql();

  const patients = (await sql`
    select id, first_name, last_name
    from public.patients
    where org_id = ${orgId} and status = 'critical'
    order by last_activity_at desc, id desc
    limit 6
  `) as unknown as FolderRow[];

  // The original filtered review_state = 'unreviewed' verbatim (a display
  // word, not a stored state); carried over unchanged from the builder path.
  const insights = (await sql`
    select i.id, i.patient_id, i.title, p.first_name, p.last_name
    from public.ai_insights i
    join public.patients p on p.id = i.patient_id and p.org_id = i.org_id
    where i.org_id = ${orgId} and i.kind = 'attention' and i.review_state = 'unreviewed'
    order by i.created_at desc, i.id desc
    limit 6
  `) as unknown as InsightRow[];

  const rows: CriticalAlertRow[] = patients.map((row) => ({
    id: `folder-${row.id}`,
    patientId: row.id,
    patientName: `${row.first_name} ${row.last_name}`,
    headline: 'Marked critical in the folder',
    source: 'folder' as const,
  }));

  for (const row of insights) {
    rows.push({
      id: `insight-${row.id}`,
      patientId: row.patient_id,
      patientName: `${row.first_name} ${row.last_name}`,
      headline: row.title,
      source: 'insight' as const,
    });
  }

  return rows;
}
