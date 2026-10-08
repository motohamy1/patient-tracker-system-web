// src/lib/patients/queries.ts — the Phase-4 server-side retrieval layer
// (PROV-02, D-17..D-20, UX-07). The ONLY place user text meets PostgREST.
//
// D-18: search is server-side — the client debounces a URL param and never
// filters rows itself. D-19: search composes WITH the active filter in ONE
// query (a single indexed `search_text ilike` over the trgm GIN index from
// migration 0005; never four OR'd column filters — 04-RESEARCH Pattern 2 /
// Pitfall 1). D-20: cumulative paging — `shown` grows the fetched window
// (range(0, shown+limit)) so "Load more" appends and never drops rows already
// on screen; a limit+1 probe row yields `hasMore`. `total` comes from a single
// `count: 'exact'` over the same predicate for the "{n} of {total} patients"
// count line (04-UI-SPEC §4.3).
//
// RLS (migration 0005) enforces org scoping regardless of what this function
// is handed; the explicit `.eq('org_id', orgId)` is defense in depth, not the
// authorization boundary. Server Component call sites only — never import from
// a client file.
import { createClient } from '@/lib/supabase/server';
import type { PatientStatus } from '@/lib/patients/status';

export type PatientFolderRow = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: 'M' | 'F';
  mrn: string;
  status: PatientStatus;
  userId: string | null;
  lastActivityAt: string;
  age: number;
};

export type ListPatientsQuery = {
  orgId: string;
  q?: string;
  filter?: 'all' | 'recent' | 'today' | 'attention' | 'critical';
  day?: string;
  shown?: number;
  limit?: number;
};

// Escapes ILIKE wildcards in user text — user input must never be able to
// widen the match (04-RESEARCH Pitfall 1).
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

const SELECT_COLUMNS =
  'id, first_name, last_name, dob, sex, mrn, status, user_id, last_activity_at';

function ageFrom(dob: string): number {
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

type PatientRowRecord = {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: 'M' | 'F';
  mrn: string;
  status: PatientStatus;
  user_id: string | null;
  last_activity_at: string;
};

function mapRow(row: PatientRowRecord): PatientFolderRow {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    sex: row.sex,
    mrn: row.mrn,
    status: row.status,
    userId: row.user_id,
    lastActivityAt: row.last_activity_at,
    age: ageFrom(row.dob),
  };
}

export type PatientRecord = PatientFolderRow & {
  createdAt: string;
  updatedAt: string;
};

const RECORD_COLUMNS = `${SELECT_COLUMNS}, created_at, updated_at`;

type PatientRecordRow = PatientRowRecord & {
  created_at: string;
  updated_at: string;
};

/**
 * One patient for the workspace Overview (WSP-02, Phase-5 T-01).
 *
 * The id arrives pre-validated as a UUID (patientIdSchema) and is bound as a
 * PostgREST equality predicate — never interpolated into a string, a path or
 * an interpreter (ASVS V5, T-02-52). The explicit `.eq('org_id', orgId)` is
 * defense in depth on top of migration 0005's RLS: a member of another
 * organization gets `null`, and the caller renders the no-leak denial state
 * rather than asking the database twice (AUTH-03).
 *
 * Server Component call sites only — never import from a client file.
 */
export async function getPatient(orgId: string, patientId: string): Promise<PatientRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select(RECORD_COLUMNS)
    .eq('org_id', orgId)
    .eq('id', patientId)
    .maybeSingle();

  if (error) throw new Error(`getPatient failed: ${error.message}`);
  if (!data) return null;

  const row = data as PatientRecordRow;
  return {
    ...mapRow(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPatients(
  query: ListPatientsQuery,
): Promise<{ rows: PatientFolderRow[]; hasMore: boolean; total: number }> {
  const { orgId, q, filter = 'all', day, shown = 0, limit = 24 } = query;
  const supabase = await createClient();
  const windowRows = shown + limit; // cumulative: rows 0..windowRows inclusive

  let builder = supabase
    .from('patients')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('org_id', orgId);

  const trimmed = q?.trim() ?? '';
  if (trimmed !== '') {
    builder = builder.ilike('search_text', `%${escapeLike(trimmed.toLowerCase())}%`);
  }

  if (filter === 'attention') {
    builder = builder.in('status', ['follow_up', 'needs_review']);
  } else if (filter === 'critical') {
    builder = builder.eq('status', 'critical');
  } else if (filter === 'today') {
    // D-14: created OR updated within the client's LOCAL calendar day. `day`
    // is regex-validated (schemas.ts) before it can reach this .or() string.
    const dayStart = new Date(`${day ?? new Date().toISOString().slice(0, 10)}T00:00:00`);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const start = dayStart.toISOString();
    const end = dayEnd.toISOString();
    builder = builder.or(
      `and(created_at.gte.${start},created_at.lt.${end}),and(updated_at.gte.${start},updated_at.lt.${end})`,
    );
  }

  const { data, error, count } = await builder
    .order('last_activity_at', { ascending: false })
    .order('id', { ascending: false }) // stable tiebreak (Pitfall 3)
    .range(0, windowRows); // inclusive → windowRows + 1 probe row

  if (error) throw new Error(`listPatients failed: ${error.message}`);

  const mapped = ((data ?? []) as PatientRowRecord[]).map(mapRow);
  return {
    rows: mapped.slice(0, windowRows),
    hasMore: mapped.length > windowRows,
    total: count ?? mapped.length,
  };
}
