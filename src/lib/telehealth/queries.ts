// src/lib/telehealth/queries.ts — the telehealth read layer (Phase 17;
// TH-01/02).
//
// RLS is inert on the single-owner Lakebase Postgres connection, so every read
// carries an explicit `org_id` predicate; the self-or-staff narrowing rides the
// `patient_id` filters the callers already pass.
import { getSql } from '@/lib/db/neon';
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

/** The ACTIVE session for a visit, or null (org-scoped; self-or-staff narrowing). */
export async function getActiveSessionForVisit(
  orgId: string,
  visitId: string,
): Promise<TelehealthSessionRecord | null> {
  let rows: SessionRow[];
  try {
    const sql = getSql();
    rows = (await sql`
      select id, org_id, patient_id, visit_id, status, join_token, transport,
             transport_reference, cancellation_reason, started_at, ended_at
      from public.telehealth_sessions
      where org_id = ${orgId} and visit_id = ${visitId}
        and status in ('scheduled', 'in_progress')
      limit 1
    `) as unknown as SessionRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`getActiveSessionForVisit failed: ${message}`);
  }
  return rows[0] ? mapSession(rows[0]) : null;
}

/** The session record for a visit whatever its status (history reads). */
export async function getSessionForVisit(
  orgId: string,
  visitId: string,
): Promise<TelehealthSessionRecord | null> {
  let rows: SessionRow[];
  try {
    const sql = getSql();
    rows = (await sql`
      select id, org_id, patient_id, visit_id, status, join_token, transport,
             transport_reference, cancellation_reason, started_at, ended_at
      from public.telehealth_sessions
      where org_id = ${orgId} and visit_id = ${visitId}
      order by created_at desc, id desc
      limit 1
    `) as unknown as SessionRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`getSessionForVisit failed: ${message}`);
  }
  return rows[0] ? mapSession(rows[0]) : null;
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
 * read the workspace uses, plus the identity the room shows). Null when the
 * org scope hides the visit.
 */
export async function getConsultationContext(
  orgId: string,
  visitId: string,
): Promise<ConsultationContext | null> {
  type Row = {
    id: string;
    patient_id: string;
    reason: string | null;
    documentation: string | null;
    patient_first_name: string | null;
    patient_last_name: string | null;
  };
  let rows: Row[];
  try {
    const sql = getSql();
    rows = (await sql`
      select v.id, v.patient_id, v.reason, v.documentation,
             p.first_name as patient_first_name, p.last_name as patient_last_name
      from public.visits v
      left join public.patients p on p.id = v.patient_id
      where v.org_id = ${orgId} and v.id = ${visitId}
      limit 1
    `) as unknown as Row[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`getConsultationContext failed: ${message}`);
  }
  const row = rows[0];
  if (!row) return null;
  return {
    visitId: row.id,
    patientId: row.patient_id,
    patientName:
      row.patient_first_name !== null
        ? `${row.patient_first_name} ${row.patient_last_name}`
        : 'Patient',
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
  const dayStart = `${day}T00:00:00.000Z`;
  const dayEnd = `${day}T23:59:59.999Z`;

  type VisitRow = {
    id: string;
    patient_id: string;
    scheduled_at: string;
    visit_type: string | null;
    patient_first_name: string | null;
    patient_last_name: string | null;
  };
  type SessionLite = { visit_id: string; id: string; status: string; join_token: string; transport: string };

  let visits: VisitRow[];
  let sessions: SessionLite[];
  try {
    const sql = getSql();
    visits = (await sql`
      select v.id, v.patient_id, v.scheduled_at, v.visit_type,
             p.first_name as patient_first_name, p.last_name as patient_last_name
      from public.visits v
      left join public.patients p on p.id = v.patient_id
      where v.org_id = ${orgId} and v.visit_type = 'telehealth'
        and v.scheduled_at >= ${dayStart} and v.scheduled_at <= ${dayEnd}
      order by v.scheduled_at asc, v.id asc
    `) as unknown as VisitRow[];

    sessions = (await sql`
      select ts.visit_id, ts.id, ts.status, ts.join_token, ts.transport
      from public.telehealth_sessions ts
      join public.visits v on v.id = ts.visit_id
      where ts.org_id = ${orgId} and v.org_id = ${orgId}
        and v.visit_type = 'telehealth'
        and v.scheduled_at >= ${dayStart} and v.scheduled_at <= ${dayEnd}
    `) as unknown as SessionLite[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`listConsultations failed: ${message}`);
  }

  const sessionsByVisit = new Map<string, SessionLite[]>();
  for (const session of sessions) {
    const list = sessionsByVisit.get(session.visit_id);
    if (list === undefined) sessionsByVisit.set(session.visit_id, [session]);
    else list.push(session);
  }

  return visits.map((row) => {
    const active = (sessionsByVisit.get(row.id) ?? []).find(
      (session) => session.status === 'scheduled' || session.status === 'in_progress',
    );
    return {
      sessionId: active?.id ?? '',
      visitId: row.id,
      status: (active?.status ?? 'scheduled') as ConsultationListItem['status'],
      joinToken: active?.join_token ?? '',
      transport: (active?.transport ?? 'not_configured') as ConsultationListItem['transport'],
      patientId: row.patient_id,
      patientName:
        row.patient_first_name !== null
          ? `${row.patient_first_name} ${row.patient_last_name}`
          : 'Patient',
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
  let rows: SessionRow[];
  try {
    const sql = getSql();
    rows = (await sql`
      select id, org_id, patient_id, visit_id, status, join_token, transport,
             transport_reference, cancellation_reason, started_at, ended_at
      from public.telehealth_sessions
      where org_id = ${orgId} and patient_id = ${patientId}
        and status in ('scheduled', 'in_progress')
      order by created_at desc, id desc
      limit 1
    `) as unknown as SessionRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`getOwnActiveConsultation failed: ${message}`);
  }
  return rows[0] ? mapSession(rows[0]) : null;
}

/** The visit ids of the patient's active consultations (the Home's marker). */
export async function ownActiveConsultationVisitIds(
  orgId: string,
  patientId: string,
): Promise<Set<string>> {
  let rows: Array<{ visit_id: string; status: string }>;
  try {
    const sql = getSql();
    rows = (await sql`
      select visit_id, status from public.telehealth_sessions
      where org_id = ${orgId} and patient_id = ${patientId}
        and status in ('scheduled', 'in_progress')
    `) as unknown as Array<{ visit_id: string; status: string }>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`ownActiveConsultationVisitIds failed: ${message}`);
  }
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.status === 'in_progress') ids.add(row.visit_id);
  }
  return ids;
}
