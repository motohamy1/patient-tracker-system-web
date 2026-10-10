// src/lib/telehealth/queries.ts — the telehealth read layer (Phase 17;
// TH-01/02).
import { createClient } from '@/lib/supabase/server';
import type {
  ConsultationListItem,
  TelehealthSessionRecord,
} from '@/lib/telehealth/status';

type SessionRow = {
  id: string;
  org_id: string;
  patient_id: string;
  visit_id: string;
  status: string;
  join_token: string;
  transport: string;
  transport_reference: string | null;
  cancellation_reason: string | null;
  started_at: string | null;
  ended_at: string | null;
};

function mapSession(row: SessionRow): TelehealthSessionRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    patientId: row.patient_id,
    visitId: row.visit_id,
    status: row.status as TelehealthSessionRecord['status'],
    joinToken: row.join_token,
    transport: row.transport as TelehealthSessionRecord['transport'],
    transportReference: row.transport_reference,
    cancellationReason: row.cancellation_reason,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

/** The ACTIVE session for a visit, or null (org-scoped; self-or-staff RLS). */
export async function getActiveSessionForVisit(
  orgId: string,
  visitId: string,
): Promise<TelehealthSessionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select('id, org_id, patient_id, visit_id, status, join_token, transport, transport_reference, cancellation_reason, started_at, ended_at')
    .eq('org_id', orgId)
    .eq('visit_id', visitId)
    .in('status', ['scheduled', 'in_progress'])
    .maybeSingle();
  if (error) throw new Error(`getActiveSessionForVisit failed: ${error.message}`);
  return data ? mapSession(data as SessionRow) : null;
}

/** The session record for a visit whatever its status (history reads). */
export async function getSessionForVisit(
  orgId: string,
  visitId: string,
): Promise<TelehealthSessionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select('id, org_id, patient_id, visit_id, status, join_token, transport, transport_reference, cancellation_reason, started_at, ended_at')
    .eq('org_id', orgId)
    .eq('visit_id', visitId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getSessionForVisit failed: ${error.message}`);
  return data ? mapSession(data as SessionRow) : null;
}

export type ConsultationContext = {
  visitId: string;
  patientId: string;
  patientName: string;
  reason: string | null;
  documentation: string | null;
};

/**
 * One consultation's context: the visit and the patient's name (the visit
 * read the workspace uses, plus the identity the room shows). Null when RLS
 * hides the visit.
 */
export async function getConsultationContext(
  orgId: string,
  visitId: string,
): Promise<ConsultationContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('visits')
    .select('id, patient_id, reason, documentation, patients(first_name, last_name)')
    .eq('org_id', orgId)
    .eq('id', visitId)
    .maybeSingle();
  if (error) throw new Error(`getConsultationContext failed: ${error.message}`);
  if (!data) return null;
  const row = data as {
    id: string;
    patient_id: string;
    reason: string | null;
    documentation: string | null;
    patients: { first_name: string; last_name: string } | null;
  };
  return {
    visitId: row.id,
    patientId: row.patient_id,
    patientName: row.patients !== null ? `${row.patients.first_name} ${row.patients.last_name}` : 'Patient',
    reason: row.reason,
    documentation: row.documentation,
  };
}

/**
 * The provider's consultation day list: every telehealth appointment of the
 * day with its session state, soonest first. The patient's name comes from
 * the visit join (the same folders the workspace reads).
 */
export async function listConsultations(
  orgId: string,
  day: string,
): Promise<ConsultationListItem[]> {
  const supabase = await createClient();
  const dayEnd = `${day}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from('visits')
    .select(
      'id, patient_id, scheduled_at, visit_type, telehealth_sessions(id, status, join_token, transport), patients(first_name, last_name)',
    )
    .eq('org_id', orgId)
    .eq('visit_type', 'telehealth')
    .gte('scheduled_at', `${day}T00:00:00.000Z`)
    .lte('scheduled_at', dayEnd)
    .order('scheduled_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(`listConsultations failed: ${error.message}`);

  type VisitRow = {
    id: string;
    patient_id: string;
    scheduled_at: string;
    visit_type: string | null;
    telehealth_sessions: Array<{ id: string; status: string; join_token: string; transport: string }> | null;
    patients: { first_name: string; last_name: string } | null;
  };

  return ((data ?? []) as VisitRow[]).map((row) => {
    const active = (row.telehealth_sessions ?? []).find((session) =>
      session.status === 'scheduled' || session.status === 'in_progress',
    );
    return {
      sessionId: active?.id ?? '',
      visitId: row.id,
      status: (active?.status ?? 'scheduled') as ConsultationListItem['status'],
      joinToken: active?.join_token ?? '',
      transport: (active?.transport ?? 'not_configured') as ConsultationListItem['transport'],
      patientId: row.patient_id,
      patientName: row.patients !== null ? `${row.patients.first_name} ${row.patients.last_name}` : 'Patient',
      scheduledAt: row.scheduled_at,
      visitType: row.visit_type,
    };
  });
}

/** The patient's own active consultation, or null (their join surface). */
export async function getOwnActiveConsultation(
  orgId: string,
  patientId: string,
): Promise<TelehealthSessionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select('id, org_id, patient_id, visit_id, status, join_token, transport, transport_reference, cancellation_reason, started_at, ended_at')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .in('status', ['scheduled', 'in_progress'])
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getOwnActiveConsultation failed: ${error.message}`);
  return data ? mapSession(data as SessionRow) : null;
}

/** The visit ids of the patient's active consultations (the Home's marker). */
export async function ownActiveConsultationVisitIds(
  orgId: string,
  patientId: string,
): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select('visit_id, status')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .in('status', ['scheduled', 'in_progress']);
  if (error) throw new Error(`ownActiveConsultationVisitIds failed: ${error.message}`);
  const ids = new Set<string>();
  for (const row of (data ?? []) as Array<{ visit_id: string; status: string }>) {
    if (row.status === 'in_progress') ids.add(row.visit_id);
  }
  return ids;
}
